/**
 * Unauthorized Page
 * Shown when user tries to access a resource they don't have permission for
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiHome, FiArrowLeft } from 'react-icons/fi';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="p-6 rounded-full bg-red-100">
                        <FiAlertCircle className="w-16 h-16 text-red-600" />
                    </div>
                </div>

                {/* Message */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">
                        Access Denied
                    </h1>
                    <p className="text-gray-600 text-lg mb-2">
                        You don't have permission to access this resource
                    </p>
                    <p className="text-gray-500 text-sm">
                        If you believe this is an error, please contact your administrator
                    </p>
                </div>

                {/* Error Code */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8">
                    <p className="text-center text-red-800 font-mono text-sm">
                        Error: 403 - Forbidden
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors font-medium shadow-md"
                    >
                        <FiHome className="w-5 h-5" />
                        Go to Dashboard
                    </button>
                </div>

                {/* Help Text */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Need access to this feature?
                    </p>
                    <p className="text-gray-600 text-sm font-medium mt-1">
                        Contact your system administrator to request permissions
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
