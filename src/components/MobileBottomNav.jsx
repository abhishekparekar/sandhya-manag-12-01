import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiBriefcase, FiDollarSign, FiCheckSquare, FiMenu } from 'react-icons/fi';

/**
 * MobileBottomNav Component
 * Fixed bottom navigation for mobile devices
 * Optimized for Android with 56px touch targets
 * Only visible on mobile and tablet screens
 */

const MobileBottomNav = ({ onMenuClick }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Home', icon: FiHome, color: '#F47920' },
        { path: '/projects', label: 'Projects', icon: FiBriefcase, color: '#1B5E7E' },
        { path: '/sales', label: 'Sales', icon: FiDollarSign, color: '#10B981' },
        { path: '/tasks', label: 'Tasks', icon: FiCheckSquare, color: '#8B5CF6' },
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl md:hidden z-40 safe-area-bottom">
            <div className="grid grid-cols-5 h-16 sm:h-18">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`touch-target-comfortable flex flex-col items-center justify-center gap-1 transition-all duration-300 relative group ${active
                                    ? 'text-[#F47920]'
                                    : 'text-gray-600 hover:text-gray-800 active:text-[#F47920]'
                                }`}
                        >
                            {/* Icon Container */}
                            <div className={`relative transition-all duration-300 ${active ? 'scale-110' : 'group-active:scale-95'
                                }`}>
                                {/* Background Circle for Active State */}
                                {active && (
                                    <div
                                        className="absolute inset-0 -m-2 rounded-full bg-gradient-to-br from-[#F47920]/10 to-[#E06810]/10 animate-pulse"
                                        style={{ transform: 'scale(1.5)' }}
                                    />
                                )}

                                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 relative z-10 transition-all duration-300 ${active ? 'drop-shadow-md' : ''
                                    }`} />

                                {/* Active Dot Indicator */}
                                {active && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#F47920] rounded-full shadow-lg animate-bounce-subtle" />
                                )}
                            </div>

                            {/* Label */}
                            <span className={`text-[10px] sm:text-xs font-medium transition-all duration-300 ${active ? 'font-bold scale-105' : ''
                                }`}>
                                {item.label}
                            </span>

                            {/* Ripple Effect */}
                            <span className="absolute inset-0 overflow-hidden rounded-lg">
                                <span className="ripple" />
                            </span>
                        </Link>
                    );
                })}

                {/* Menu button */}
                <button
                    onClick={onMenuClick}
                    className="touch-target-comfortable flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-gray-800 active:text-[#F47920] transition-all duration-300 relative group ripple"
                >
                    <div className="relative group-active:scale-95 transition-transform duration-300">
                        <FiMenu className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium">Menu</span>
                </button>
            </div>

            {/* Active indicator bar - Smooth sliding animation */}
            <div
                className="absolute top-0 h-1 bg-gradient-to-r from-[#F47920] to-[#E06810] transition-all duration-500 ease-out rounded-b-full shadow-lg"
                style={{
                    width: '20%',
                    left: `${navItems.findIndex(item => isActive(item.path)) * 20}%`,
                    opacity: navItems.some(item => isActive(item.path)) ? 1 : 0,
                }}
            />
        </nav>
    );
};

export default MobileBottomNav;
