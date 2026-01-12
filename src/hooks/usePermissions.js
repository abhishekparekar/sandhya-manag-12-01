/**
 * usePermissions Hook
 * Provides permission checking for components
 */

import { useAuth } from '../context/AuthContext';
import { hasPermission, getModulePermissions, canAccessModule, ACTIONS } from '../config/permissions';

/**
 * Hook to check permissions for current user
 * @param {string} module - Module name
 * @returns {object} Permission check methods
 */
export const usePermissions = (module) => {
    const { userRole } = useAuth();

    // Check if user can perform specific action
    const can = (action) => {
        if (!userRole) return false;
        return hasPermission(userRole, module, action);
    };

    // Get all permissions for this module
    const permissions = userRole ? getModulePermissions(userRole, module) : [];

    // Convenience methods for common actions
    const canCreate = can(ACTIONS.CREATE);
    const canRead = can(ACTIONS.READ);
    const canUpdate = can(ACTIONS.UPDATE);
    const canDelete = can(ACTIONS.DELETE);
    const canExport = can(ACTIONS.EXPORT);
    const canManage = can(ACTIONS.MANAGE);
    const canAccess = userRole ? canAccessModule(userRole, module) : false;

    return {
        can,
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        canExport,
        canManage,
        canAccess,
        permissions,
        role: userRole
    };
};

export default usePermissions;
