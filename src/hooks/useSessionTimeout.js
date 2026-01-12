/**
 * useSessionTimeout Hook
 * Manages session timeout and auto-logout functionality
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    isSessionExpired,
    updateActivity,
    getRemainingTime,
    shouldShowWarning,
    markWarningShown,
    clearSession,
    initializeSession
} from '../utils/sessionManager';
import { logSessionTimeout } from '../services/auditService';

const ACTIVITY_EVENTS = [
    'mousedown',
    'keydown',
    'scroll',
    'touchstart',
    'click'
];

/**
 * Hook to handle session timeout
 * @param {number} timeoutMinutes - Session timeout in minutes (default: 30)
 * @returns {object} Session state and methods
 */
export const useSessionTimeout = (timeoutMinutes = 30) => {
    const auth = useAuth();
    const { currentUser, userRole, logout } = auth || {};
    const [showWarning, setShowWarning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);

    // Handle user activity
    const handleActivity = () => {
        if (currentUser) {
            updateActivity();
            setShowWarning(false);
        }
    };

    // Check session status
    const checkSession = async () => {
        if (!currentUser) return;

        // Check if session expired
        if (isSessionExpired(timeoutMinutes)) {
            // Log session timeout
            await logSessionTimeout(currentUser, userRole);
            clearSession();
            await logout();
            return;
        }

        // Check if warning should be shown
        if (shouldShowWarning(timeoutMinutes)) {
            setShowWarning(true);
            markWarningShown();
        }

        // Update remaining time
        setRemainingTime(getRemainingTime(timeoutMinutes));
    };

    // Extend session
    const extendSession = () => {
        updateActivity();
        setShowWarning(false);
        setRemainingTime(getRemainingTime(timeoutMinutes));
    };

    useEffect(() => {
        if (!currentUser) {
            clearSession();
            return;
        }

        // Initialize session on mount
        initializeSession();

        // Add activity listeners
        ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Check session every 30 seconds
        const interval = setInterval(checkSession, 30000);

        // Initial check
        checkSession();

        // Cleanup
        return () => {
            ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            clearInterval(interval);
        };
    }, [currentUser, timeoutMinutes]);

    return {
        showWarning,
        remainingTime,
        extendSession
    };
};

export default useSessionTimeout;
