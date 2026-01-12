/**
 * Session Warning Modal
 * Displays warning before session timeout
 */

import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiClock } from 'react-icons/fi';
import { formatRemainingTime } from '../utils/sessionManager';
import Modal from './Modal';

const SessionWarning = ({ showWarning, remainingTime, onExtend }) => {
    const [countdown, setCountdown] = useState(remainingTime);

    useEffect(() => {
        setCountdown(remainingTime);

        if (!showWarning) return;

        const interval = setInterval(() => {
            setCountdown(prev => {
                const newTime = prev - 1000;
                return newTime > 0 ? newTime : 0;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [showWarning, remainingTime]);

    if (!showWarning) return null;

    return (
        <Modal
            onClose={onExtend}
            title="Session Expiring Soon"
            hideCloseButton={false}
        >
            <div className="space-y-4">
                {/* Warning Icon */}
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-orange-100">
                        <FiAlertTriangle className="w-12 h-12 text-orange-600" />
                    </div>
                </div>

                {/* Message */}
                <div className="text-center">
                    <p className="text-gray-800 font-medium mb-2">
                        Your session will expire soon due to inactivity
                    </p>
                    <p className="text-gray-600 text-sm">
                        You will be automatically logged out to protect your account
                    </p>
                </div>

                {/* Countdown */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2">
                        <FiClock className="w-5 h-5 text-orange-600" />
                        <span className="text-orange-900 font-bold text-lg">
                            {formatRemainingTime(countdown)}
                        </span>
                    </div>
                    <p className="text-center text-orange-700 text-sm mt-1">
                        remaining
                    </p>
                </div>

                {/* Action Button */}
                <div className="flex gap-3">
                    <button
                        onClick={onExtend}
                        className="flex-1 px-6 py-3 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors font-medium shadow-md"
                    >
                        Continue Session
                    </button>
                </div>

                <p className="text-center text-gray-500 text-xs">
                    Click anywhere or interact with the page to stay logged in
                </p>
            </div>
        </Modal>
    );
};

export default SessionWarning;
