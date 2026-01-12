import React from 'react';
import { ACTIONS } from '../../config/permissions';

const PermissionMatrix = ({ permissions, onChange, disabled = false }) => {
    // List of all available modules (derived from permissions object or hardcoded list)
    // For this component, we'll use a predefined list of common modules to ensure order
    const modules = [
        'dashboard', 'projects', 'sales', 'telecalling', 'employees',
        'expenses', 'inventory', 'internship', 'certificates',
        'id-cards', 'documents', 'reports', 'tasks', 'progress', 'settings'
    ];

    const handleToggle = (module, action) => {
        if (disabled) return;

        const currentModulePerms = permissions[module] || [];
        let newModulePerms;

        if (currentModulePerms.includes(action)) {
            // Remove permission
            newModulePerms = currentModulePerms.filter(p => p !== action);
        } else {
            // Add permission
            newModulePerms = [...currentModulePerms, action];
        }

        onChange(module, newModulePerms);
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-600">Module</th>
                        <th className="py-3 px-4 text-center font-medium text-gray-600">Read</th>
                        <th className="py-3 px-4 text-center font-medium text-gray-600">Create</th>
                        <th className="py-3 px-4 text-center font-medium text-gray-600">Update</th>
                        <th className="py-3 px-4 text-center font-medium text-gray-600">Delete</th>
                        <th className="py-3 px-4 text-center font-medium text-gray-600">Export</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {modules.map(module => (
                        <tr key={module} className="hover:bg-gray-50 transition-colors">
                            <td className="py-2 px-4 font-medium text-gray-800 capitalize">
                                {module.replace('-', ' ')}
                            </td>
                            {[ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT].map(action => (
                                <td key={action} className="py-2 px-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={permissions[module]?.includes(action) || false}
                                        onChange={() => handleToggle(module, action)}
                                        disabled={disabled}
                                        className="w-4 h-4 text-[#F47920] rounded border-gray-300 focus:ring-[#F47920] cursor-pointer disabled:opacity-50"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PermissionMatrix;
