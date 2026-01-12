import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const icons = {
        success: <FiCheckCircle className="text-green-500 text-xl" />,
        error: <FiAlertCircle className="text-red-500 text-xl" />,
        info: <FiAlertCircle className="text-blue-500 text-xl" />
    };

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${bgColors[type]} transition-all transform animate-slide-in`}>
            {icons[type]}
            <p className="font-medium text-sm">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-black hover:bg-opacity-5 rounded-full transition-colors">
                <FiX className="text-current opacity-60" />
            </button>
        </div>
    );
};

export default Toast;
