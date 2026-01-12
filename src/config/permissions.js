/**
 * Permission Matrix
 * Defines role-based access control for all modules
 * 
 * Role Hierarchy:
 * 1. admin - Full access to everything including user management
 * 2. manager - Can manage team, view reports, limited settings
 * 3. employee - Can view assigned work, limited create
 * 4. intern - Read-only access, can update own tasks
 * 5. hr - HR-specific permissions and employee management
 */

// Action types
export const ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    EXPORT: 'export',
    MANAGE: 'manage', // For user management, settings, etc.
    BLOCK: 'block',   // For blocking/unblocking users
    RESET_PASSWORD: 'reset_password' // For password reset
};

// Role types
export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
    INTERN: 'intern',
    HR: 'hr'
};

// Role hierarchy for access level checking
export const ROLE_HIERARCHY = {
    [ROLES.ADMIN]: 5,
    [ROLES.MANAGER]: 4,
    [ROLES.HR]: 3,
    [ROLES.EMPLOYEE]: 2,
    [ROLES.INTERN]: 1
};

// Module permission definitions
const PERMISSIONS = {
    // Dashboard
    dashboard: {
        admin: [ACTIONS.READ],
        manager: [ACTIONS.READ],
        employee: [ACTIONS.READ],
        intern: [ACTIONS.READ],
        hr: [ACTIONS.READ]
    },

    // Projects
    projects: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT],
        employee: [ACTIONS.READ],
        intern: [ACTIONS.READ],
        hr: [ACTIONS.READ]
    },

    // Sales
    sales: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT],
        employee: [ACTIONS.CREATE, ACTIONS.READ],
        intern: [ACTIONS.READ],
        hr: [ACTIONS.READ]
    },

    // Telecalling
    telecalling: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        employee: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE],
        intern: [ACTIONS.READ],
        hr: [ACTIONS.READ]
    },

    // Employees
    employees: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.READ, ACTIONS.EXPORT],
        employee: [],
        intern: [],
        hr: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT]
    },

    // Expenses
    expenses: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT],
        employee: [ACTIONS.CREATE, ACTIONS.READ],
        intern: [],
        hr: [ACTIONS.READ]
    },

    // Performance
    performance: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.READ, ACTIONS.EXPORT],
        employee: [ACTIONS.READ],
        intern: [],
        hr: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT]
    },

    // Contractors
    contractors: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.READ, ACTIONS.EXPORT],
        employee: [],
        intern: [],
        hr: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT]
    },

    // Skill Matrix
    skillMatrix: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.READ, ACTIONS.EXPORT],
        employee: [ACTIONS.READ],
        intern: [],
        hr: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT]
    },

    // Inventory
    inventory: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT],
        employee: [ACTIONS.READ],
        intern: [],
        hr: [ACTIONS.READ]
    },

    // Internship
    internship: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT],
        employee: [],
        intern: [ACTIONS.READ],
        hr: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT]
    },

    // Certificates
    certificates: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.EXPORT],
        employee: [],
        intern: [ACTIONS.READ],
        hr: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT]
    },

    // ID Cards
    'id-cards': {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.EXPORT],
        employee: [ACTIONS.READ],
        intern: [ACTIONS.READ],
        hr: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT]
    },

    // Documents
    documents: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE],
        manager: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
        employee: [ACTIONS.READ],
        intern: [ACTIONS.READ],
        hr: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE]
    },

    // Reports
    reports: {
        admin: [ACTIONS.READ, ACTIONS.EXPORT],
        manager: [ACTIONS.READ, ACTIONS.EXPORT],
        employee: [],
        intern: [],
        hr: [ACTIONS.READ, ACTIONS.EXPORT]
    },

    // Tasks
    tasks: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE],
        manager: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE],
        employee: [ACTIONS.READ, ACTIONS.UPDATE], // Can update assigned tasks
        intern: [ACTIONS.READ, ACTIONS.UPDATE], // Can update assigned tasks
        hr: [ACTIONS.READ]
    },

    // Progress
    progress: {
        admin: [ACTIONS.READ, ACTIONS.UPDATE],
        manager: [ACTIONS.READ, ACTIONS.UPDATE],
        employee: [ACTIONS.READ, ACTIONS.UPDATE], // Own progress only
        intern: [ACTIONS.READ, ACTIONS.UPDATE], // Own progress only
        hr: [ACTIONS.READ]
    },

    // Settings
    settings: {
        admin: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.MANAGE],
        manager: [ACTIONS.READ],
        employee: [],
        intern: [],
        hr: [ACTIONS.READ]
    },

    // User Management (Admin only)
    'user-management': {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.MANAGE, ACTIONS.BLOCK, ACTIONS.RESET_PASSWORD],
        manager: [],
        employee: [],
        intern: [],
        hr: []
    },

    // Audit Logs (Admin only)
    audit: {
        admin: [ACTIONS.READ, ACTIONS.EXPORT],
        manager: [],
        employee: [],
        intern: [],
        hr: [ACTIONS.READ]
    },

    // Finance (Admin, Manager only)
    finance: {
        admin: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT],
        manager: [ACTIONS.READ, ACTIONS.EXPORT],
        employee: [],
        intern: [],
        hr: [ACTIONS.READ]
    }
};

/**
 * Check if a role has permission for a specific action on a module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @param {string} action - Action type
 * @param {Object} customPermissions - Custom permissions override
 * @returns {boolean} Whether permission is granted
 */
export const hasPermission = (role, module, action, customPermissions = null) => {
    // Check custom permissions first (if they exist)
    if (customPermissions && customPermissions[module]) {
        return customPermissions[module].includes(action);
    }

    // Check default permissions
    const modulePermissions = PERMISSIONS[module];
    if (!modulePermissions) {
        console.warn(`Module '${module}' not found in permissions`);
        return false;
    }

    const rolePermissions = modulePermissions[role];
    if (!rolePermissions) {
        console.warn(`Role '${role}' not found for module '${module}'`);
        return false;
    }

    return rolePermissions.includes(action);
};

/**
 * Check if user can access a module (has any permission)
 * @param {string} role - User role
 * @param {string} module - Module name
 * @param {Object} customPermissions - Custom permissions override
 * @returns {boolean} Whether user can access the module
 */
export const canAccessModule = (role, module, customPermissions = null) => {
    // Check custom permissions first
    if (customPermissions && customPermissions[module]) {
        return customPermissions[module].length > 0;
    }

    // Check default permissions
    const modulePermissions = PERMISSIONS[module];
    if (!modulePermissions) return false;

    const rolePermissions = modulePermissions[role];
    return rolePermissions && rolePermissions.length > 0;
};

/**
 * Get all modules a role can access
 * @param {string} role - User role
 * @param {Object} customPermissions - Custom permissions override
 * @returns {Array} Array of accessible module names
 */
export const getAccessibleModules = (role, customPermissions = null) => {
    const accessibleModules = [];

    Object.keys(PERMISSIONS).forEach(module => {
        if (canAccessModule(role, module, customPermissions)) {
            accessibleModules.push(module);
        }
    });

    return accessibleModules;
};

/**
 * Check if role has higher or equal access level than target role
 * @param {string} role - Current user role
 * @param {string} targetRole - Target role to compare against
 * @returns {boolean} Whether current role has higher/equal level
 */
export const hasHigherOrEqualRole = (role, targetRole) => {
    const currentLevel = ROLE_HIERARCHY[role] || 0;
    const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
    return currentLevel >= targetLevel;
};

/**
 * Get all permissions for a role on a specific module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @param {Object} customPermissions - Custom permissions override
 * @returns {Array} Array of allowed actions
 */
export const getModulePermissions = (role, module, customPermissions = null) => {
    // Return custom permissions if they exist
    if (customPermissions && customPermissions[module]) {
        return customPermissions[module];
    }

    // Return default permissions
    return PERMISSIONS[module]?.[role] || [];
};

/**
 * Get role display name
 * @param {string} role - Role key
 * @returns {string} Formatted role name
 */
export const getRoleDisplayName = (role) => {
    const roleNames = {
        [ROLES.ADMIN]: 'Administrator',
        [ROLES.MANAGER]: 'Manager',
        [ROLES.EMPLOYEE]: 'Employee',
        [ROLES.INTERN]: 'Intern',
        [ROLES.HR]: 'HR Manager'
    };

    return roleNames[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Get action display name
 * @param {string} action - Action key
 * @returns {string} Formatted action name
 */
export const getActionDisplayName = (action) => {
    const actionNames = {
        [ACTIONS.CREATE]: 'Create',
        [ACTIONS.READ]: 'View',
        [ACTIONS.UPDATE]: 'Edit',
        [ACTIONS.DELETE]: 'Delete',
        [ACTIONS.EXPORT]: 'Export',
        [ACTIONS.MANAGE]: 'Manage',
        [ACTIONS.BLOCK]: 'Block/Unblock',
        [ACTIONS.RESET_PASSWORD]: 'Reset Password'
    };

    return actionNames[action] || action.charAt(0).toUpperCase() + action.slice(1);
};

/**
 * Get role level for hierarchy comparison
 * @param {string} role - Role key
 * @returns {number} Role level
 */
export const getRoleLevel = (role) => {
    return ROLE_HIERARCHY[role] || 0;
};

/**
 * Check if role has higher or equal access level than target role
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean} Whether role1 has higher/equal level
 */
export const isRoleHigherOrEqual = (role1, role2) => {
    return getRoleLevel(role1) >= getRoleLevel(role2);
};

export default PERMISSIONS;
