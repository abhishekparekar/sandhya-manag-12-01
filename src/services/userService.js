import { 
    createUserWithEmailAndPassword, 
    updatePassword,
    signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { logLogin } from './auditService';

/**
 * User Service Functions
 * Handles user creation, management, and authentication
 */

/**
 * Create a new user with mobile number and password
 * @param {Object} userData - User data including mobileNumber, fullName, role, etc.
 * @returns {Promise<Object>} Created user data
 */
export const createUser = async (userData) => {
    try {
        // Generate email based on mobile number
        const email = `${userData.mobileNumber}@sandhya.management`;
        
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
        const user = userCredential.user;

        // Create user profile in Firestore
        const userProfile = {
            uid: user.uid,
            email: email,
            mobileNumber: userData.mobileNumber,
            fullName: userData.fullName,
            role: userData.role,
            department: userData.department || '',
            status: 'active',
            createdAt: serverTimestamp(),
            lastLogin: null,
            customPermissions: userData.customPermissions || null,
            createdBy: auth.currentUser?.uid || 'system'
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);

        // Log user creation
        if (auth.currentUser) {
            await logLogin(user, userData.role, `User created by admin: ${auth.currentUser.email}`);
        }

        return { success: true, user: userProfile };
    } catch (error) {
        console.error('Error creating user:', error);
        throw new Error(`Failed to create user: ${error.message}`);
    }
};

/**
 * Update user status (block/unblock)
 * @param {string} userId - User ID
 * @param {string} status - New status ('active' or 'blocked')
 * @returns {Promise<Object>} Update result
 */
export const updateUserStatus = async (userId, status) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            status: status,
            statusUpdatedBy: auth.currentUser?.uid || 'system',
            statusUpdatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating user status:', error);
        throw new Error(`Failed to update user status: ${error.message}`);
    }
};

/**
 * Get all users from Firestore
 * @returns {Promise<Array>} Array of user objects
 */
export const getAllUsers = async () => {
    try {
        const usersQuery = query(collection(db, 'users'));
        const querySnapshot = await getDocs(usersQuery);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });

        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
    }
};

/**
 * Reset user password (Admin function)
 * Note: This requires Firebase Admin SDK for production
 * For now, we'll store the reset request in Firestore
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Reset result
 */
export const resetUserPassword = async (userId, newPassword) => {
    try {
        // Get user document
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        
        // In production, use Firebase Admin SDK to update password
        // For now, we'll store the reset request and notify admin
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            passwordResetRequested: true,
            passwordResetBy: auth.currentUser?.uid || 'system',
            passwordResetAt: serverTimestamp(),
            tempPassword: newPassword, // Store temporarily (not secure for production)
            passwordResetStatus: 'pending'
        });

        // Log the password reset
        if (auth.currentUser) {
            await logLogin(
                { uid: userId, email: userData.email }, 
                userData.role, 
                `Password reset by admin: ${auth.currentUser.email}`
            );
        }

        return { 
            success: true, 
            message: 'Password reset request stored. Please implement Firebase Admin SDK for actual password update.',
            tempPassword: newPassword
        };
    } catch (error) {
        console.error('Error resetting password:', error);
        throw new Error(`Failed to reset password: ${error.message}`);
    }
};

/**
 * Find user by mobile number
 * @param {string} mobileNumber - 10-digit mobile number
 * @returns {Promise<Object|null>} User data or null if not found
 */
export const findUserByMobile = async (mobileNumber) => {
    try {
        const usersQuery = query(collection(db, 'users'), where('mobileNumber', '==', mobileNumber));
        const querySnapshot = await getDocs(usersQuery);
        
        if (querySnapshot.empty) {
            return null;
        }
        
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
        console.error('Error finding user by mobile:', error);
        throw new Error(`Failed to find user: ${error.message}`);
    }
};

/**
 * Validate user credentials for login
 * @param {string} loginId - Mobile number or email
 * @param {string} password - User password
 * @returns {Promise<Object>} Authentication result
 */
export const validateUserCredentials = async (loginId, password) => {
    try {
        let email = loginId;
        
        // If loginId is mobile number, find associated email
        if (/^\d{10}$/.test(loginId)) {
            const user = await findUserByMobile(loginId);
            if (!user) {
                throw new Error('Mobile number not found. Please contact administrator.');
            }
            email = user.email;
        }

        // Attempt sign in
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Check user status
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (userData.status === 'blocked') {
                await auth.signOut();
                throw new Error('Your account has been blocked. Please contact administrator.');
            }
            
            return { 
                success: true, 
                user: result.user, 
                userData: userData 
            };
        }
        
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Error validating credentials:', error);
        throw error;
    }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Update result
 */
export const updateUserProfile = async (userId, updates) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser?.uid || 'system'
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw new Error(`Failed to update user profile: ${error.message}`);
    }
};

/**
 * Delete user (Soft delete - mark as inactive)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteUser = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            status: 'deleted',
            deletedAt: serverTimestamp(),
            deletedBy: auth.currentUser?.uid || 'system'
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw new Error(`Failed to delete user: ${error.message}`);
    }
};
