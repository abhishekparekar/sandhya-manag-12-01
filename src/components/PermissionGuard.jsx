/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 */

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * PermissionGuard - Wrapper component for permission-based rendering
 * @param {object} props
 * @param {string} props.module - Module name
 * @param {string} props.action - Action to check (create, read, update, delete, export, manage)
 * @param {React.ReactNode} props.children - Content to render if permission granted
 * @param {React.ReactNode} props.fallback - Content to render if permission denied (optional)
 * @returns {React.ReactNode}
 */
const PermissionGuard = ({ module, action, children, fallback = null }) => {
    const { can } = usePermissions(module);

    if (!can(action)) {
        return fallback;
    }

    return <>{children}</>;
};

export default PermissionGuard;
