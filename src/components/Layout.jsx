import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import { ToastProvider } from './ToastContainer';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile

    const handleMenuClick = () => {
        setIsSidebarOpen(true);
    };

    return (
        <ToastProvider>
            <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
                <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                <div className="flex-1 flex flex-col overflow-hidden w-full">
                    <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-3 sm:p-4 md:p-6 mobile-bottom-nav-spacing safe-area-bottom custom-scrollbar">
                        <div className="max-w-7xl mx-auto w-full">
                            <Outlet />
                        </div>
                    </main>
                </div>

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav onMenuClick={handleMenuClick} />
            </div>
        </ToastProvider>
    );
};

export default Layout;
