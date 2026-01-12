/**
 * Session Management Utility
 * Handles session timeout, activity tracking, and auto-logout
 */

const SESSION_KEYS = {
    LAST_ACTIVITY: 'lastActivityTime',
    SESSION_TIMEOUT: 'sessionTimeout',
    WARNING_SHOWN: 'sessionWarningShown'
};

/**
 * Get session timeout duration in milliseconds
 * @param {number} minutes - Timeout in minutes (default: 30)
 * @returns {number} Timeout in milliseconds
 */
export const getSessionTimeout = (minutes = 30) => {
    return minutes * 60 * 1000;
};

/**
 * Update last activity timestamp
 */
export const updateActivity = () => {
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
    localStorage.removeItem(SESSION_KEYS.WARNING_SHOWN);
};

/**
 * Get last activity timestamp
 * @returns {number} Timestamp of last activity
 */
export const getLastActivity = () => {
    const lastActivity = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
    return lastActivity ? parseInt(lastActivity, 10) : Date.now();
};

/**
 * Check if session is expired
 * @param {number} timeoutMinutes - Session timeout in minutes
 * @returns {boolean} True if session expired
 */
export const isSessionExpired = (timeoutMinutes = 30) => {
    const lastActivity = getLastActivity();
    const timeout = getSessionTimeout(timeoutMinutes);
    const elapsed = Date.now() - lastActivity;

    return elapsed > timeout;
};

/**
 * Get remaining session time in milliseconds
 * @param {number} timeoutMinutes - Session timeout in minutes
 * @returns {number} Remaining time in milliseconds
 */
export const getRemainingTime = (timeoutMinutes = 30) => {
    const lastActivity = getLastActivity();
    const timeout = getSessionTimeout(timeoutMinutes);
    const elapsed = Date.now() - lastActivity;
    const remaining = timeout - elapsed;

    return remaining > 0 ? remaining : 0;
};

/**
 * Check if warning should be shown (5 minutes before timeout)
 * @param {number} timeoutMinutes - Session timeout in minutes
 * @returns {boolean} True if warning should be shown
 */
export const shouldShowWarning = (timeoutMinutes = 30) => {
    const remaining = getRemainingTime(timeoutMinutes);
    const warningThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
    const warningShown = localStorage.getItem(SESSION_KEYS.WARNING_SHOWN);

    return remaining <= warningThreshold && remaining > 0 && !warningShown;
};

/**
 * Mark warning as shown
 */
export const markWarningShown = () => {
    localStorage.setItem(SESSION_KEYS.WARNING_SHOWN, 'true');
};

/**
 * Clear session data
 */
export const clearSession = () => {
    localStorage.removeItem(SESSION_KEYS.LAST_ACTIVITY);
    localStorage.removeItem(SESSION_KEYS.SESSION_TIMEOUT);
    localStorage.removeItem(SESSION_KEYS.WARNING_SHOWN);
};

/**
 * Initialize session
 */
export const initializeSession = () => {
    updateActivity();
};

/**
 * Format remaining time for display
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
export const formatRemainingTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);

    if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
};

export default {
    getSessionTimeout,
    updateActivity,
    getLastActivity,
    isSessionExpired,
    getRemainingTime,
    shouldShowWarning,
    markWarningShown,
    clearSession,
    initializeSession,
    formatRemainingTime
};
