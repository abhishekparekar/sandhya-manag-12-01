import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import {
    FiSave, FiUpload, FiSettings, FiBriefcase, FiUsers, FiShield, FiEye, FiTrash2, FiEdit, FiLock, FiCheckSquare, FiSquare
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { ACTIONS, ROLES, hasPermission } from '../config/permissions';
import PERMISSIONS from '../config/permissions';
import Toast from '../components/Toast';
import Table from '../components/Table';

const Settings = () => {
    const { userRole, checkPermission } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [activeTab, setActiveTab] = useState('company');
    const [users, setUsers] = useState([]);
    const [toast, setToast] = useState(null);
    
    // Permission Management State
    const [rolePermissions, setRolePermissions] = useState({});
    const [selectedRole, setSelectedRole] = useState(ROLES.MANAGER);
    const [customPermissions, setCustomPermissions] = useState({});

    const [settings, setSettings] = useState({
        companyName: 'Sandhya Softtech',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        logoBase64: '',
        primaryColor: '#F47920',
        secondaryColor: '#1B5E7E'
    });

    // Permission Management Functions
    const loadRolePermissions = () => {
        // Load default permissions from config
        const permissions = {};
        Object.keys(ROLES).forEach(roleKey => {
            if (roleKey !== 'ADMIN') { // Skip admin - they have all permissions
                const role = ROLES[roleKey];
                permissions[role] = {};
                Object.keys(PERMISSIONS).forEach(module => {
                    permissions[role][module] = PERMISSIONS[module][role] || [];
                });
            }
        });
        setRolePermissions(permissions);
    };

    const handlePermissionToggle = (role, module, action) => {
        const updatedPermissions = { ...customPermissions };
        if (!updatedPermissions[role]) {
            updatedPermissions[role] = {};
        }
        if (!updatedPermissions[role][module]) {
            updatedPermissions[role][module] = [];
        }

        const actionIndex = updatedPermissions[role][module].indexOf(action);
        if (actionIndex > -1) {
            // Remove permission
            updatedPermissions[role][module].splice(actionIndex, 1);
            if (updatedPermissions[role][module].length === 0) {
                delete updatedPermissions[role][module];
            }
        } else {
            // Add permission
            updatedPermissions[role][module].push(action);
        }

        setCustomPermissions(updatedPermissions);
    };

    const hasCustomPermission = (role, module, action) => {
        // First check if there are custom permissions for this role
        if (customPermissions[role] && customPermissions[role][module]) {
            return customPermissions[role][module].includes(action);
        }
        
        // Fall back to default permissions
        if (rolePermissions[role] && rolePermissions[role][module]) {
            return rolePermissions[role][module].includes(action);
        }
        
        return false;
    };

    const savePermissionSettings = async () => {
        try {
            setSaving(true);
            
            // Save custom permissions to Firestore
            const settingsDoc = doc(db, 'settings', 'permissions');
            await setDoc(settingsDoc, {
                customPermissions: customPermissions,
                lastUpdatedBy: userRole,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            showToast('Permission settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving permission settings:', error);
            showToast('Failed to save permission settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const loadPermissionSettings = async () => {
        try {
            const settingsDoc = doc(db, 'settings', 'permissions');
            const settingsSnap = await getDoc(settingsDoc);
            
            if (settingsSnap.exists()) {
                const data = settingsSnap.data();
                if (data.customPermissions) {
                    setCustomPermissions(data.customPermissions);
                }
            }
        } catch (error) {
            console.error('Error loading permission settings:', error);
        }
    };

    useEffect(() => {
        loadRolePermissions();
        loadPermissionSettings();
        fetchData();
        
        // Debug: Log available roles
        console.log('Available ROLES:', ROLES);
        console.log('Available PERMISSIONS:', Object.keys(PERMISSIONS));
    }, []);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = async () => {
        try {
            const [settingsSnap, usersSnap] = await Promise.all([
                getDocs(collection(db, 'settings')),
                getDocs(collection(db, 'users'))
            ]);

            if (!settingsSnap.empty) {
                const companyDoc = settingsSnap.docs.find(d => d.id === 'company');
                if (companyDoc) {
                    const settingsData = companyDoc.data();
                    setSettings(prev => ({ ...prev, ...settingsData }));
                }
            }

            const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersList);
        } catch (error) {
            console.error("Error fetching data:", error);
            showToast("Failed to load settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'company'), {
                ...settings,
                rolePermissions,
                updatedAt: new Date().toISOString()
            });
            showToast("✅ Settings saved successfully!", "success");
        } catch (error) {
            console.error("Error saving settings:", error);
            showToast("❌ Error saving settings. Please try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type.toLowerCase())) {
            showToast("❌ Invalid file type! Please upload JPG, PNG, GIF, or WebP images only.", "error");
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast("❌ File too large! Image size must be less than 2MB.", "error");
            return;
        }

        setUploadingLogo(true);
        showToast("📤 Processing and saving image...", "info");

        // Convert to Base64 (No Firebase Storage, No CORS!)
        const reader = new FileReader();

        reader.onloadend = async () => {
            try {
                const base64String = reader.result;

                // Update local state
                setSettings(prev => ({
                    ...prev,
                    logoBase64: base64String
                }));

                // Auto-save to Firestore immediately
                await setDoc(doc(db, 'settings', 'company'), {
                    ...settings,
                    logoBase64: base64String,
                    rolePermissions,
                    updatedAt: new Date().toISOString()
                });

                showToast("✅ Logo uploaded and saved successfully!", "success");
                setUploadingLogo(false);
            } catch (error) {
                console.error("Error saving logo:", error);
                showToast("❌ Failed to save logo. Please try again.", "error");
                setUploadingLogo(false);
            }
        };

        reader.onerror = () => {
            showToast("❌ Failed to read file. Please try again.", "error");
            setUploadingLogo(false);
        };

        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = async () => {
        if (!window.confirm('Are you sure you want to remove the company logo?')) {
            return;
        }

        try {
            setUploadingLogo(true);

            // Update local state
            setSettings(prev => ({
                ...prev,
                logoBase64: ''
            }));

            // Save to Firestore
            await setDoc(doc(db, 'settings', 'company'), {
                ...settings,
                logoBase64: '',
                rolePermissions,
                updatedAt: new Date().toISOString()
            });

            showToast("✅ Logo removed successfully!", "success");
        } catch (error) {
            console.error("Error removing logo:", error);
            showToast("❌ Failed to remove logo. Please try again.", "error");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleUserRoleChange = async (userId, newRole) => {
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showToast("✅ User role updated successfully!", "success");
        } catch (error) {
            console.error("Error updating user role:", error);
            showToast("❌ Error updating user role. Please try again.", "error");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

        

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                {[
                    { key: 'company', label: 'Company Profile', icon: <FiBriefcase /> },
                    { key: 'roles', label: 'User Roles', icon: <FiUsers /> },
                    { key: 'permissions', label: 'Permissions', icon: <FiShield /> },
                    { key: 'theme', label: 'Theme', icon: <FiSettings /> }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === tab.key
                            ? 'text-[#F47920] border-b-2 border-[#F47920]'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Company Profile Tab */}
            {activeTab === 'company' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Company Information</h2>

                    <div className="space-y-6">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-32 border border-gray-200 rounded-lg p-2 flex items-center justify-center bg-gray-50 overflow-hidden">
                                    {settings.logoBase64 ? (
                                        <img
                                            src={settings.logoBase64}
                                            alt="Company Logo"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-gray-400 text-sm">No Logo</span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {settings.logoBase64 ? (
                                        <>
                                            <label className={`flex items-center gap-2 px-4 py-2 bg-[#1B5E7E] text-white rounded-lg cursor-pointer hover:bg-[#164A5E] transition-colors ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <FiEdit />
                                                {uploadingLogo ? 'Processing...' : 'Change Logo'}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    disabled={uploadingLogo}
                                                />
                                            </label>
                                            <button
                                                onClick={handleRemoveLogo}
                                                disabled={uploadingLogo}
                                                className={`flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <FiTrash2 />
                                                Remove Logo
                                            </button>
                                        </>
                                    ) : (
                                        <label className={`flex items-center gap-2 px-4 py-2 bg-[#1B5E7E] text-white rounded-lg cursor-pointer hover:bg-[#164A5E] transition-colors ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <FiUpload />
                                            {uploadingLogo ? 'Processing...' : 'Upload Logo'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                disabled={uploadingLogo}
                                            />
                                        </label>
                                    )}
                                    <p className="text-xs text-gray-500">PNG or JPG, max 2MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={settings.companyName}
                                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={settings.companyEmail}
                                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={settings.companyPhone}
                                    onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                                <input
                                    type="url"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={settings.companyWebsite}
                                    onChange={(e) => setSettings({ ...settings, companyWebsite: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={settings.companyAddress}
                                    onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                                    placeholder="Company address..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Permission Management Tab - Admin Only */}
            {activeTab === 'permissions' && userRole === ROLES.ADMIN && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <FiLock className="text-[#F47920]" />
                            Permission Management
                        </h2>
                        <button
                            onClick={savePermissionSettings}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors disabled:opacity-50"
                        >
                            <FiSave />
                            {saving ? 'Saving...' : 'Save Permissions'}
                        </button>
                    </div>

                    {/* Role Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Role to Manage</label>
                        <div className="flex gap-2">
                            {Object.values(ROLES).filter(role => role !== ROLES.ADMIN).map(role => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        selectedRole === role
                                            ? 'bg-[#F47920] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {role.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Permission Matrix */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-700">Module Permissions for {selectedRole.toUpperCase()}</h3>
                        
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Module</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Create</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Read</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Update</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Delete</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Export</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Object.keys(PERMISSIONS).filter(module => module !== 'user-management').map(module => (
                                        <tr key={module} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                                                {module.replace('-', ' ')}
                                            </td>
                                            {[
                                                ACTIONS.CREATE,
                                                ACTIONS.READ,
                                                ACTIONS.UPDATE,
                                                ACTIONS.DELETE,
                                                ACTIONS.EXPORT
                                            ].map(action => (
                                                <td key={action} className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handlePermissionToggle(selectedRole, module, action)}
                                                        className={`p-2 rounded transition-colors ${
                                                            hasCustomPermission(selectedRole, module, action)
                                                                ? 'bg-[#F47920] text-white'
                                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {hasCustomPermission(selectedRole, module, action) ? (
                                                            <FiCheckSquare className="w-4 h-4" />
                                                        ) : (
                                                            <FiSquare className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Permission Summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">Permission Summary</h4>
                            <div className="text-sm text-blue-800">
                                <p><strong>Default:</strong> Roles have predefined permissions for basic functionality.</p>
                                <p><strong>Custom:</strong> Check/uncheck boxes to override default permissions.</p>
                                <p><strong>Admin:</strong> Always has full access regardless of settings.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Roles Tab - Enhanced Role Management */}
            {activeTab === 'roles' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <FiUsers className="text-[#F47920]" />
                            Role Access Management
                        </h2>
                        <button
                            onClick={savePermissionSettings}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors disabled:opacity-50"
                        >
                            <FiSave />
                            {saving ? 'Saving...' : 'Save Access Settings'}
                        </button>
                    </div>

                    {/* Role Overview Cards */}
                    <div className="mb-8">
                        <h3 className="font-medium text-gray-700 mb-4">System Roles & Access Levels</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.values(ROLES).map(role => {
                                console.log('Displaying role card:', role);
                                return (
                                    <div key={role} className={`p-4 border rounded-lg hover:shadow-md transition-all ${
                                        role === ROLES.ADMIN ? 'border-red-200 bg-red-50' :
                                        role === ROLES.MANAGER ? 'border-blue-200 bg-blue-50' :
                                        role === ROLES.HR ? 'border-green-200 bg-green-50' :
                                        role === ROLES.EMPLOYEE ? 'border-yellow-200 bg-yellow-50' :
                                        'border-purple-200 bg-purple-50'
                                    }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`p-2 rounded-lg ${
                                                role === ROLES.ADMIN ? 'bg-red-100 text-red-600' :
                                                role === ROLES.MANAGER ? 'bg-blue-100 text-blue-600' :
                                                role === ROLES.HR ? 'bg-green-100 text-green-600' :
                                                role === ROLES.EMPLOYEE ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-purple-100 text-purple-600'
                                            }`}>
                                                <FiUsers />
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                                                role === ROLES.ADMIN ? 'bg-red-100 text-red-700' :
                                                role === ROLES.MANAGER ? 'bg-blue-100 text-blue-700' :
                                                role === ROLES.HR ? 'bg-green-100 text-green-700' :
                                                role === ROLES.EMPLOYEE ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                                {role.toUpperCase()}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 mb-2">{role.charAt(0).toUpperCase() + role.slice(1)}</h4>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {role === ROLES.ADMIN && 'Full system access with user management'}
                                            {role === ROLES.MANAGER && 'Team management and project oversight'}
                                            {role === ROLES.HR && 'Employee management and HR functions'}
                                            {role === ROLES.EMPLOYEE && 'Assigned work and basic access'}
                                            {role === ROLES.INTERN && 'Read-only access and learning'}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {Object.keys(PERMISSIONS).slice(0, 3).map(module => (
                                                <span key={module} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                    {module.replace('-', ' ').charAt(0).toUpperCase() + module.replace('-', ' ').slice(1)}
                                                </span>
                                            ))}
                                            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">+{Object.keys(PERMISSIONS).length - 3} more</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Access Distribution Matrix */}
                    <div className="space-y-6">
                        <h3 className="font-medium text-gray-700">Module Access Distribution</h3>
                        
                        {Object.keys(PERMISSIONS).map(module => (
                            <div key={module} className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-3 capitalize flex items-center gap-2">
                                    <FiShield className="text-[#F47920]" />
                                    {module.replace('-', ' ')}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {Object.values(ROLES).filter(role => role !== ROLES.ADMIN).map(role => {
                                        console.log('Rendering role:', role);
                                        return (
                                            <div key={`${module}-${role}`} className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handlePermissionToggle(role, module, ACTIONS.READ)}
                                                    className={`w-4 h-4 rounded transition-colors ${
                                                        hasCustomPermission(role, module, ACTIONS.READ)
                                                            ? 'bg-[#F47920] border-[#F47920]'
                                                            : 'bg-gray-200 border-gray-300 hover:bg-gray-300'
                                                    } border`}
                                                >
                                                    {hasCustomPermission(role, module, ACTIONS.READ) && (
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <label className="text-sm text-gray-700 cursor-pointer">
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    Access granted to: {Object.values(ROLES).filter(role => 
                                        role !== ROLES.ADMIN && hasCustomPermission(role, module, ACTIONS.READ)
                                    ).map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ') || 'None'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Role Assignment Section */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Quick Role Assignment</h4>
                        <p className="text-sm text-blue-800 mb-4">
                            Assign roles to existing users and manage their access levels
                        </p>
                        <div className="space-y-3">
                            {users.slice(0, 5).map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                                            {user.fullName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{user.fullName || 'Unknown User'}</p>
                                            <p className="text-sm text-gray-600">{user.email}</p>
                                        </div>
                                    </div>
                                    <select
                                        value={user.role || ROLES.EMPLOYEE}
                                        onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    >
                                        {Object.values(ROLES).map(role => (
                                            <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                            {users.length > 5 && (
                                <p className="text-sm text-blue-600 text-center">
                                    ... and {users.length - 5} more users
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Permission Management</h2>
                    <p className="text-sm text-gray-600 mb-6">Configure module access for each role</p>

                    <div className="overflow-x-auto">
                        <Table
                            headers={['Module', 'Admin', 'HR', 'Employee']}
                            dense
                            className="min-w-[700px]"
                        >
                            {Object.keys(PERMISSIONS).map((module) => (
                                <tr key={module} className="hover:bg-gray-50 transition-colors">
                                    <Table.Cell className="font-medium text-gray-900 capitalize">
                                        {module.replace(/([A-Z])/g, ' $1').trim()}
                                    </Table.Cell>
                                    {Object.values(ROLES).map((role) => (
                                        <Table.Cell key={role} align="center">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-[#F47920] border-gray-300 rounded focus:ring-[#F47920]"
                                                    checked={hasCustomPermission(role, module, ACTIONS.READ)}
                                                    onChange={() =>
                                                        handlePermissionToggle(role, module, ACTIONS.READ)
                                                    }
                                                />
                                            </label>
                                        </Table.Cell>
                                    ))}
                                </tr>
                            ))}
                        </Table>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <FiEye className="text-blue-600 mt-1" />
                            <div>
                                <h4 className="font-medium text-blue-900 mb-1">Permission Guide</h4>
                                <p className="text-sm text-blue-700">
                                    Check the boxes to grant access to specific modules for each role.
                                    Admin should have full access, HR manages people-related modules,
                                    and Employees have limited operational access.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Theme Settings</h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color (Orange)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color (Teal)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                                        value={settings.secondaryColor}
                                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={settings.secondaryColor}
                                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 mb-3">Color Preview</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-lg text-white text-center font-medium shadow-sm transition-transform hover:scale-105" style={{ backgroundColor: settings.primaryColor }}>
                                    Primary Color
                                    <div className="text-sm mt-2 opacity-90">{settings.primaryColor}</div>
                                </div>
                                <div className="p-6 rounded-lg text-white text-center font-medium shadow-sm transition-transform hover:scale-105" style={{ backgroundColor: settings.secondaryColor }}>
                                    Secondary Color
                                    <div className="text-sm mt-2 opacity-90">{settings.secondaryColor}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> Theme changes will be applied after saving and refreshing the page.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end sticky bottom-6 z-10">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
                >
                    <FiSave />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default Settings;
