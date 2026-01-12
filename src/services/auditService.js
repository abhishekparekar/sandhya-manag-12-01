/**
 * Audit Logging Service
 * Tracks all critical user actions for security and compliance
 */

import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Action types for audit logging
export const AUDIT_ACTIONS = {
    // Authentication
    LOGIN: 'login',
    LOGOUT: 'logout',
    LOGIN_FAILED: 'login_failed',
    SESSION_TIMEOUT: 'session_timeout',

    // CRUD Operations
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    EXPORT: 'export',

    // User Management
    USER_BLOCKED: 'user_blocked',
    USER_UNBLOCKED: 'user_unblocked',
    ROLE_CHANGED: 'role_changed',
    PASSWORD_RESET: 'password_reset',

    // Access Control
    ACCESS_DENIED: 'access_denied',
    PERMISSION_VIOLATION: 'permission_violation'
};

/**
 * Get device information from browser
 * @returns {object} Device info
 */
const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let deviceType = 'Desktop';

    // Detect browser
    if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Edge') > -1) browser = 'Edge';
    else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) browser = 'Internet Explorer';

    // Detect OS
    if (ua.indexOf('Windows') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'MacOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iOS') > -1) os = 'iOS';

    // Detect device type
    if (ua.indexOf('Mobile') > -1 || ua.indexOf('Android') > -1) deviceType = 'Mobile';
    else if (ua.indexOf('Tablet') > -1 || ua.indexOf('iPad') > -1) deviceType = 'Tablet';

    return { browser, os, deviceType, userAgent: ua };
};

/**
 * Get user's IP address (approximation using public API)
 * Note: This is a client-side approximation. For production, use server-side IP detection
 * @returns {Promise<string>} IP address
 */
const getIPAddress = async () => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'Unknown';
    } catch (error) {
        console.error('Error fetching IP:', error);
        return 'Unknown';
    }
};

/**
 * Log an audit event
 * @param {object} params - Audit log parameters
 * @param {string} params.userId - User ID
 * @param {string} params.userName - User name
 * @param {string} params.userRole - User role
 * @param {string} params.action - Action performed
 * @param {string} params.module - Module/feature name
 * @param {object} params.details - Additional details
 * @param {string} params.status - 'success' or 'failed'
 * @returns {Promise<void>}
 */
export const logAuditEvent = async ({
    userId = null,
    userName = 'Unknown',
    userRole = 'Unknown',
    action,
    module = 'system',
    details = {},
    status = 'success'
}) => {
    try {
        const deviceInfo = getDeviceInfo();
        const ipAddress = await getIPAddress();

        const auditLog = {
            userId,
            userName,
            userRole,
            action,
            module,
            details,
            ipAddress,
            deviceInfo,
            timestamp: serverTimestamp(),
            status
        };

        await addDoc(collection(db, 'auditLogs'), auditLog);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('📝 Audit Log:', auditLog);
        }
    } catch (error) {
        console.error('Error logging audit event:', error);
        // Don't throw - audit logging should not break main functionality
    }
};

/**
 * Log successful login
 * @param {object} user - User object
 * @param {string} user.uid - User ID
 * @param {string} user.email - User email
 * @param {string} role - User role
 */
export const logLogin = async (user, role) => {
    await logAuditEvent({
        userId: user.uid,
        userName: user.email,
        userRole: role,
        action: AUDIT_ACTIONS.LOGIN,
        module: 'authentication',
        details: { email: user.email },
        status: 'success'
    });
};

/**
 * Log failed login attempt
 * @param {string} email - Email attempted
 * @param {string} reason - Failure reason
 */
export const logLoginFailed = async (email, reason) => {
    await logAuditEvent({
        userId: null,
        userName: email,
        userRole: 'Unknown',
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        module: 'authentication',
        details: { email, reason },
        status: 'failed'
    });
};

/**
 * Log logout
 * @param {object} user - User object
 * @param {string} role - User role
 */
export const logLogout = async (user, role) => {
    await logAuditEvent({
        userId: user.uid,
        userName: user.email,
        userRole: role,
        action: AUDIT_ACTIONS.LOGOUT,
        module: 'authentication',
        details: { email: user.email },
        status: 'success'
    });
};

/**
 * Log session timeout
 * @param {object} user - User object
 * @param {string} role - User role
 */
export const logSessionTimeout = async (user, role) => {
    await logAuditEvent({
        userId: user.uid,
        userName: user.email,
        userRole: role,
        action: AUDIT_ACTIONS.SESSION_TIMEOUT,
        module: 'authentication',
        details: { email: user.email },
        status: 'success'
    });
};

/**
 * Log CRUD operations
 * @param {string} action - create, update, delete
 * @param {string} module - Module name
 * @param {object} user - User performing action
 * @param {string} role - User role
 * @param {object} details - Additional details
 */
export const logCRUDOperation = async (action, module, user, role, details = {}) => {
    await logAuditEvent({
        userId: user.uid,
        userName: user.email,
        userRole: role,
        action,
        module,
        details,
        status: 'success'
    });
};

/**
 * Log access denied events
 * @param {object} user - User who was denied
 * @param {string} role - User role
 * @param {string} module - Module attempted to access
 * @param {string} action - Action attempted
 */
export const logAccessDenied = async (user, role, module, action) => {
    await logAuditEvent({
        userId: user.uid,
        userName: user.email,
        userRole: role,
        action: AUDIT_ACTIONS.ACCESS_DENIED,
        module,
        details: { attemptedAction: action },
        status: 'failed'
    });
};

/**
 * Get audit logs for a specific user
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of logs to retrieve
 * @returns {Promise<array>} Array of audit logs
 */
export const getUserAuditLogs = async (userId, limitCount = 50) => {
    try {
        const q = query(
            collection(db, 'auditLogs'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching user audit logs:', error);
        return [];
    }
};

/**
 * Get all audit logs (Admin only)
 * @param {number} limitCount - Number of logs to retrieve
 * @returns {Promise<array>} Array of audit logs
 */
export const getAllAuditLogs = async (limitCount = 100) => {
    try {
        const q = query(
            collection(db, 'auditLogs'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
};

/**
 * Get audit logs by action type
 * @param {string} action - Action type
 * @param {number} limitCount - Number of logs to retrieve
 * @returns {Promise<array>} Array of audit logs
 */
export const getAuditLogsByAction = async (action, limitCount = 50) => {
    try {
        const q = query(
            collection(db, 'auditLogs'),
            where('action', '==', action),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching audit logs by action:', error);
        return [];
    }
};

export default {
    logAuditEvent,
    logLogin,
    logLoginFailed,
    logLogout,
    logSessionTimeout,
    logCRUDOperation,
    logAccessDenied,
    getUserAuditLogs,
    getAllAuditLogs,
    getAuditLogsByAction,
    AUDIT_ACTIONS
};
