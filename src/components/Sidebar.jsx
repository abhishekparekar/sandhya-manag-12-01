import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FiHome, FiUsers, FiBriefcase, FiDollarSign, FiPhone,
    FiBox, FiAward, FiLogOut, FiSettings,
    FiTrendingUp, FiCheckSquare, FiCreditCard, FiBarChart2,
    FiUserPlus, FiActivity, FiFolder, FiShield, FiX
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const { logout, checkAccess, userRole } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [logo, setLogo] = useState('/logo.jpg');

    // Fetch company logo
    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, 'settings', 'company'),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setLogo(data.logoBase64 || '/logo.jpg');
                }
            },
            (error) => {
                console.error("Error fetching logo:", error);
                setLogo('/logo.jpg');
            }
        );
        return () => unsubscribe();
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname, setIsSidebarOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    // Android-style menu items - Clean and minimal
    const menuItems = [
        { path: '/', label: 'Dashboard', icon: FiHome, module: 'dashboard' },
        { path: '/projects', label: 'Projects', icon: FiBriefcase, module: 'projects' },
        { path: '/sales', label: 'Sales', icon: FiDollarSign, module: 'sales' },
        { path: '/finance', label: 'Finance', icon: FiTrendingUp, module: 'finance' },
        { path: '/telecalling', label: 'Telecalling', icon: FiPhone, module: 'telecalling' },
        { path: '/expenses', label: 'Expenses', icon: FiCreditCard, module: 'expenses' },
        { path: '/inventory', label: 'Inventory', icon: FiBox, module: 'inventory' },
        { path: '/employees', label: 'Employees', icon: FiUsers, module: 'employees' },
        { path: '/internship', label: 'Internship', icon: FiUserPlus, module: 'internship' },
        { path: '/tasks', label: 'Tasks', icon: FiCheckSquare, module: 'tasks' },
        { path: '/progress', label: 'Progress', icon: FiActivity, module: 'progress' },
        { path: '/certificates', label: 'Certificates', icon: FiAward, module: 'certificates' },
        { path: '/id-cards', label: 'ID Cards', icon: FiCreditCard, module: 'id-cards' },
        { path: '/documents', label: 'Documents', icon: FiFolder, module: 'documents' },
        { path: '/reports', label: 'Reports', icon: FiBarChart2, module: 'reports' },
        { path: '/users', label: 'Users', icon: FiShield, module: 'user-management' },
    ];

    const isActive = (path) => location.pathname === path;

    // Filter accessible items
    const accessibleItems = menuItems.filter(item => !item.module || checkAccess(item.module));

    return (
        <>
            {/* Overlay - Android style */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Android Material Design Style */}
            <aside
                className={`
                    fixed md:relative top-0 left-0 h-full
                    bg-white
                    flex flex-col
                    z-50
                    transition-transform duration-300 ease-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    w-64 md:w-60
                    shadow-2xl md:shadow-none md:border-r md:border-gray-200
                `}
            >
                {/* Header - Compact Android Style */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-8 h-8 object-contain rounded"
                            onError={(e) => { e.target.src = '/logo.jpg'; }}
                        />
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">Sandhya</h2>
                            <p className="text-[10px] text-gray-500">Management</p>
                        </div>
                    </div>

                    {/* Close button - Mobile only */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FiX className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* User Info - Android Style Compact */}
                <div className="px-4 py-3 bg-gradient-to-r from-[#F47920] to-[#E06810]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                            {userRole?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate capitalize">
                                {userRole || 'User'}
                            </p>
                            <p className="text-xs text-white/80 truncate">Active Now</p>
                        </div>
                    </div>
                </div>

                {/* Navigation - Clean Android List Style */}
                <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    <ul className="space-y-0.5 px-2">
                        {accessibleItems.map((item) => {
                            const active = isActive(item.path);
                            const Icon = item.icon;

                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={handleLinkClick}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg
                                            transition-all duration-200
                                            group relative
                                            ${active
                                                ? 'bg-[#F47920]/10 text-[#F47920]'
                                                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                                            }
                                        `}
                                    >
                                        {/* Active indicator bar */}
                                        {active && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#F47920] rounded-r-full" />
                                        )}

                                        {/* Icon */}
                                        <Icon className={`
                                            w-5 h-5 flex-shrink-0
                                            ${active ? 'text-[#F47920]' : 'text-gray-600'}
                                        `} />

                                        {/* Label */}
                                        <span className={`
                                            text-sm font-medium truncate
                                            ${active ? 'font-semibold' : ''}
                                        `}>
                                            {item.label}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer - Settings & Logout */}
                <div className="border-t border-gray-200 p-2 bg-white space-y-0.5">
                    {/* Settings */}
                    <Link
                        to="/settings"
                        onClick={handleLinkClick}
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-all duration-200
                            ${isActive('/settings')
                                ? 'bg-[#F47920]/10 text-[#F47920]'
                                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                            }
                        `}
                    >
                        <FiSettings className={`
                            w-5 h-5
                            ${isActive('/settings') ? 'text-[#F47920]' : 'text-gray-600'}
                        `} />
                        <span className={`
                            text-sm font-medium
                            ${isActive('/settings') ? 'font-semibold' : ''}
                        `}>
                            Settings
                        </span>
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="
                            flex items-center gap-3 px-3 py-2.5 rounded-lg
                            w-full text-left
                            text-red-600 hover:bg-red-50 active:bg-red-100
                            transition-all duration-200
                        "
                    >
                        <FiLogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
