import React, { useState, useEffect } from 'react';
import { FiWifiOff, FiWifi } from 'react-icons/fi';

/**
 * Offline Indicator Component
 * Shows a banner when the user loses internet connection
 */
const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            // Hide the "reconnected" message after 3 seconds
            setTimeout(() => setShowReconnected(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Don't show anything if online and not recently reconnected
    if (isOnline && !showReconnected) {
        return null;
    }

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-white text-center font-medium transition-all duration-300 ${isOnline
                    ? 'bg-green-600'
                    : 'bg-yellow-600'
                }`}
        >
            <div className="flex items-center justify-center gap-2">
                {isOnline ? (
                    <>
                        <FiWifi className="w-5 h-5" />
                        <span>✓ Connection restored. Your changes are being synced.</span>
                    </>
                ) : (
                    <>
                        <FiWifiOff className="w-5 h-5 animate-pulse" />
                        <span>⚠️ You're offline. Changes will sync when connection is restored.</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default OfflineIndicator;
