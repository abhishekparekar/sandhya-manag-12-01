import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { hasPermission, canAccessModule, getAccessibleModules, ROLES } from '../config/permissions';
import { logLogin, logLogout, logLoginFailed } from '../services/auditService';
import { clearSession, initializeSession } from '../utils/sessionManager';
import { createUser, updateUserStatus, getAllUsers, resetUserPassword } from '../services/userService';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userProfile, setUserProfile] = useState(null); // Full user profile data
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    let userData = null;
                    let needsProfileCreation = false;
                    
                    // Check if user profile exists in Firestore
                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        if (userDoc.exists()) {
                            userData = userDoc.data();
                            
                            // Check if user is blocked
                            if (userData.status === 'blocked') {
                                console.warn('Blocked user attempted to access:', user.email);
                                await signOut(auth);
                                setCurrentUser(null);
                                setUserRole(null);
                                setUserProfile(null);
                                setLoading(false);
                                return;
                            }
                        } else {
                            // No Firestore profile exists, create one
                            needsProfileCreation = true;
                        }
                    } catch (firestoreError) {
                        // Firestore error, but Firebase auth succeeded
                        console.warn('Firestore error during auth state change:', firestoreError);
                        needsProfileCreation = true;
                    }
                    
                    // If user doesn't exist in Firestore, create profile
                    if (needsProfileCreation) {
                        const isSystemGeneratedEmail = user.email.endsWith('@sandhya.management');
                        const newProfile = {
                            uid: user.uid,
                            email: user.email,
                            mobileNumber: isSystemGeneratedEmail ? user.email.split('@')[0] : '',
                            fullName: isSystemGeneratedEmail ? 'System User' : 'Firebase Administrator',
                            role: isSystemGeneratedEmail ? 'employee' : 'admin',
                            department: isSystemGeneratedEmail ? 'General' : 'System',
                            status: 'active',
                            customPermissions: null,
                            createdAt: serverTimestamp(),
                            lastLogin: serverTimestamp(),
                            createdBy: 'system'
                        };
                        
                        await setDoc(doc(db, 'users', user.uid), newProfile);
                        userData = newProfile;
                        console.log('Auto-created user profile for:', user.email);
                    }

                    // Set user data
                    setUserRole(userData.role || 'admin');
                    setUserProfile(userData);
                    setCurrentUser(user);

                    // Initialize session
                    initializeSession();

                    // Update last login time (don't await to avoid blocking)
                    updateDoc(doc(db, 'users', user.uid), {
                        lastLogin: serverTimestamp()
                    }).catch(err => console.error('Error updating last login:', err));

                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setCurrentUser(null);
                    setUserRole(null);
                    setUserProfile(null);
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
                setUserProfile(null);
                clearSession();
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    /**
     * Enhanced login with mobile number support
     */
    const login = async (loginId, password) => {
        try {
            // Check if loginId is email or mobile number
            let email = loginId;
            
            // If loginId looks like a mobile number, find the associated email
            if (/^\d{10}$/.test(loginId)) {
                const usersQuery = query(collection(db, 'users'), where('mobileNumber', '==', loginId));
                const querySnapshot = await getDocs(usersQuery);
                
                if (querySnapshot.empty) {
                    throw new Error('Mobile number not found. Please contact administrator.');
                }
                
                // Get the email from the user document
                const userDoc = querySnapshot.docs[0];
                email = userDoc.data().email;
            }

            // First, attempt Firebase authentication (this will work for any valid Firebase user)
            const result = await signInWithEmailAndPassword(auth, email, password);
            
            // After successful Firebase auth, check Firestore for additional user data
            let userData = null;
            let needsProfileCreation = false;
            
            try {
                const userDoc = await getDoc(doc(db, 'users', result.user.uid));
                if (userDoc.exists()) {
                    userData = userDoc.data();
                    
                    // Block if user is blocked
                    if (userData.status === 'blocked') {
                        await signOut(auth);
                        await logLoginFailed(email, 'User account is blocked');
                        throw new Error('Your account has been blocked. Please contact administrator.');
                    }
                } else {
                    // No Firestore profile exists, create one
                    needsProfileCreation = true;
                }
            } catch (firestoreError) {
                // Firestore error, but Firebase auth succeeded
                console.warn('Firestore error, but Firebase auth succeeded:', firestoreError);
                needsProfileCreation = true;
            }
            
            // If user doesn't exist in Firestore, create profile
            if (needsProfileCreation) {
                const isSystemGeneratedEmail = email.endsWith('@sandhya.management');
                const newProfile = {
                    uid: result.user.uid,
                    email: email,
                    mobileNumber: isSystemGeneratedEmail ? email.split('@')[0] : '', // Extract mobile from system email
                    fullName: isSystemGeneratedEmail ? 'System User' : 'Firebase Administrator',
                    role: isSystemGeneratedEmail ? 'employee' : 'admin', // Firebase direct users get admin
                    department: isSystemGeneratedEmail ? 'General' : 'System',
                    status: 'active',
                    customPermissions: null,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    createdBy: 'system'
                };
                
                await setDoc(doc(db, 'users', result.user.uid), newProfile);
                userData = newProfile;
                console.log('Created user profile for:', email);
            }

            // Log successful login
            await logLogin(result.user, userData.role || 'admin');
            
            return result;
        } catch (error) {
            // Log failed login
            await logLoginFailed(loginId, error.message);
            throw error;
        }
    };

    /**
     * Enhanced logout with audit logging
     */
    const logout = async () => {
        try {
            // Log logout before signing out
            if (currentUser && userRole) {
                await logLogout(currentUser, userRole);
            }

            // Clear session data
            clearSession();

            // Sign out
            return await signOut(auth);
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        }
    };

    /**
     * Check if user has permission for a specific action on a module
     */
    const checkPermission = (module, action) => {
        if (!userRole) return false;
        const customPermissions = userProfile?.customPermissions || null;
        return hasPermission(userRole, module, action, customPermissions);
    };

    /**
     * Check if user can access a module
     */
    const checkAccess = (module) => {
        if (!userRole) return false;
        return canAccessModule(userRole, module);
    };

    /**
     * Get all accessible modules for current user
     */
    const getAccessible = () => {
        if (!userRole) return [];
        return getAccessibleModules(userRole);
    };

    /**
     * Check if user is admin
     */
    const isAdmin = () => {
        return userRole === ROLES.ADMIN;
    };

    /**
     * Check if user is manager
     */
    const isManager = () => {
        return userRole === ROLES.MANAGER;
    };

    /**
     * Check if user status is active
     */
    const isActive = () => {
        return userProfile?.status === 'active';
    };

    /**
     * Create a new user (Admin only) - using userService
     */
    const createUserAccount = async (userData) => {
        try {
            const result = await createUser(userData);
            return result;
        } catch (error) {
            console.error('Error creating user account:', error);
            throw error;
        }
    };

    /**
     * Update user status (block/unblock) - using userService
     */
    const updateUserStatus = async (userId, status) => {
        try {
            const result = await updateUserStatus(userId, status);
            return result;
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    };

    /**
     * Get all users (Admin only) - using userService
     */
    const getAllUsersList = async () => {
        try {
            const users = await getAllUsers();
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    };

    /**
     * Reset user password (Admin only) - using userService
     */
    const resetUserPassword = async (userId, newPassword) => {
        try {
            const result = await resetUserPassword(userId, newPassword);
            return result;
        } catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    };

    const value = {
        // User state
        currentUser,
        userRole,
        userProfile,

        // Auth methods
        login,
        logout,
        createUserAccount,
        updateUserStatus,
        getAllUsersList,
        resetUserPassword,

        // Permission methods
        checkPermission,
        checkAccess,
        getAccessible,

        // Convenience methods
        isAdmin,
        isManager,
        isActive,

        // Loading state
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
