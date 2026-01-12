import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { FiMenu, FiBell, FiUser, FiLogOut, FiX } from 'react-icons/fi';

const Navbar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const { currentUser, logout, userRole } = useAuth();
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);

    const getPageTitle = () => {
        const path = location.pathname;
        const titles = {
            '/': 'Dashboard',
            '/projects': 'Projects',
            '/sales': 'Sales',
            '/telecalling': 'Telecalling',
            '/employees': 'Employees',
            '/expenses': 'Expenses',
            '/inventory': 'Inventory',
            '/internship': 'Internship',
            '/certificates': 'Certificates',
            '/id-cards': 'ID Cards',
            '/documents': 'Documents',
            '/progress': 'Progress',
            '/tasks': 'Tasks',
            '/reports': 'Reports',
            '/settings': 'Settings',
            '/finance': 'Finance',
            '/users': 'User Management'
        };
        return titles[path] || 'Dashboard';
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm safe-area-top">
            <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 md:px-6 md:py-3">
                {/* Left Section */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="touch-target flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all text-gray-700 hover:text-[#F47920] ripple"
                        aria-label="Toggle Sidebar"
                    >
                        {isSidebarOpen ? <FiX className="w-5 h-5 sm:w-6 sm:h-6" /> : <FiMenu className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 truncate">
                            {getPageTitle()}
                        </h1>
                        <p className="text-xs text-gray-500 hidden sm:block">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="touch-target relative flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all text-gray-700 hover:text-[#F47920] ripple"
                            aria-label="Notifications"
                        >
                            <FiBell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        </button>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">
                                {currentUser?.email?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                                {userRole || 'User'}
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="avatar avatar-sm sm:w-10 sm:h-10 bg-gradient-to-br from-[#F47920] to-[#E06810] shadow-md ring-2 ring-white">
                                <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>

                            <button
                                onClick={handleLogout}
                                className="touch-target flex items-center justify-center p-2 rounded-xl hover:bg-red-50 active:bg-red-100 transition-all text-gray-700 hover:text-red-600 ripple"
                                aria-label="Logout"
                                title="Logout"
                            >
                                <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
