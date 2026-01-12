import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiEdit2, FiTrash2, FiShield, FiSave, FiX, FiSearch, FiLock, FiUnlock, FiKey, FiPhone, FiMail, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/permissions';

const UserManagement = () => {
    const { createUserAccount, getAllUsersList, updateUserStatus, resetUserPassword } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // New user form state
    const [newUser, setNewUser] = useState({
        mobileNumber: '',
        fullName: '',
        role: 'employee',
        department: '',
        password: '',
        confirmPassword: ''
    });

    // Password reset form state
    const [passwordReset, setPasswordReset] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const userList = await getAllUsersList();
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Create User with mobile number and password
    const handleCreateUser = async (e) => {
        e.preventDefault();
        
        // Validation
        if (newUser.password !== newUser.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (!/^\d{10}$/.test(newUser.mobileNumber)) {
            alert('Mobile number must be exactly 10 digits!');
            return;
        }

        if (newUser.password.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }

        try {
            // Check if mobile number already exists
            const existingUser = users.find(u => u.mobileNumber === newUser.mobileNumber);
            if (existingUser) {
                alert('User with this mobile number already exists!');
                return;
            }

            await createUserAccount(newUser);
            alert('User created successfully! Login credentials have been generated.');
            setShowAddModal(false);
            setNewUser({
                mobileNumber: '',
                fullName: '',
                role: 'employee',
                department: '',
                password: '',
                confirmPassword: ''
            });
            fetchUsers();
        } catch (error) {
            console.error("Error creating user:", error);
            alert('Failed to create user: ' + error.message);
        }
    };

    // Toggle user status (block/unblock)
    const handleToggleUserStatus = async (user) => {
        try {
            const newStatus = user.status === 'active' ? 'blocked' : 'active';
            await updateUserStatus(user.id, newStatus);
            alert(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully!`);
            fetchUsers();
        } catch (error) {
            console.error("Error updating user status:", error);
            alert('Failed to update user status: ' + error.message);
        }
    };

    // Reset user password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (passwordReset.newPassword !== passwordReset.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (passwordReset.newPassword.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }

        try {
            await resetUserPassword(selectedUser.id, passwordReset.newPassword);
            alert('Password reset successfully! New password: ' + passwordReset.newPassword);
            setShowPasswordResetModal(false);
            setPasswordReset({ newPassword: '', confirmPassword: '' });
            setSelectedUser(null);
        } catch (error) {
            console.error("Error resetting password:", error);
            alert('Failed to reset password: ' + error.message);
        }
    };

    const filteredUsers = users.filter(user =>
        user.mobileNumber?.includes(searchTerm) ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    <p className="text-gray-600">Create users, manage credentials and permissions</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#d66010] transition-colors flex items-center gap-2"
                >
                    <FiUserPlus /> Create User
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search users by mobile, name, email or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                />
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="py-3 px-4 font-medium text-gray-600">User Details</th>
                            <th className="py-3 px-4 font-medium text-gray-600">Login Credentials</th>
                            <th className="py-3 px-4 font-medium text-gray-600">Role</th>
                            <th className="py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="py-3 px-4 font-medium text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-8">Loading users...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-8 text-gray-500">No users found</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <FiUser className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{user.fullName || 'N/A'}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <FiPhone className="w-3 h-3" />
                                                    {user.mobileNumber}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-xs">
                                            <p className="text-gray-600 flex items-center gap-1">
                                                <FiMail className="w-3 h-3" />
                                                <span className="font-mono">{user.email}</span>
                                            </p>
                                            <p className="text-gray-500 mt-1">Password: Set by admin</p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                                            user.role === 'hr' ? 'bg-pink-100 text-pink-700' :
                                            user.role === 'intern' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {user.status || 'active'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowPasswordResetModal(true);
                                                }}
                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                title="Reset Password"
                                            >
                                                <FiKey />
                                            </button>
                                            <button
                                                onClick={() => handleToggleUserStatus(user)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    user.status === 'active' 
                                                        ? 'text-red-600 hover:bg-red-50' 
                                                        : 'text-green-600 hover:bg-green-50'
                                                }`}
                                                title={user.status === 'active' ? 'Block User' : 'Unblock User'}
                                            >
                                                {user.status === 'active' ? <FiLock /> : <FiUnlock />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Create New User</h3>
                                <p className="text-sm text-gray-600">Generate login credentials for new user</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUser.fullName}
                                        onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={newUser.mobileNumber}
                                        onChange={e => setNewUser({ ...newUser, mobileNumber: e.target.value.replace(/\D/g, '') })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                                        placeholder="9876543210"
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                                    >
                                        {Object.values(ROLES).map(role => (
                                            <option key={role} value={role}>{role.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <input
                                        type="text"
                                        value={newUser.department}
                                        onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                                        placeholder="Sales, HR, etc."
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newUser.confirmPassword}
                                        onChange={e => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                                        placeholder="Re-enter password"
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    <strong>Login Credentials:</strong><br/>
                                    Email: {newUser.mobileNumber ? `${newUser.mobileNumber}@sandhya.management` : '[mobile]@sandhya.management'}<br/>
                                    Password: [As set above]
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#d66010] transition-colors"
                            >
                                Create User & Generate Credentials
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordResetModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Reset Password</h3>
                                <p className="text-sm text-gray-600">User: {selectedUser.fullName || selectedUser.mobileNumber}</p>
                            </div>
                            <button onClick={() => setShowPasswordResetModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordReset.newPassword}
                                    onChange={e => setPasswordReset({ ...passwordReset, newPassword: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                                    placeholder="Min 6 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordReset.confirmPassword}
                                    onChange={e => setPasswordReset({ ...passwordReset, confirmPassword: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                                    placeholder="Re-enter password"
                                />
                            </div>
                            
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <p className="text-sm text-orange-800">
                                    <strong>Important:</strong> Share the new password securely with the user.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordResetModal(false)}
                                    className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#d66010] transition-colors"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
