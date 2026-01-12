/**
 * AISuggestions Component
 * Displays AI-generated business insights and recommendations
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiAlertCircle, FiTrendingUp, FiX,
    FiZap, FiCheckCircle, FiInfo
} from 'react-icons/fi';
import { SUGGESTION_TYPES, PRIORITIES } from '../services/aiSuggestionsService';

const AISuggestions = ({ suggestions }) => {
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState([]);

    if (!suggestions || suggestions.length === 0) {
        return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border-2 border-green-200 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <FiZap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">AI Insights</h2>
                </div>
                <div className="text-center py-4 sm:py-8">
                    <FiCheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-2 sm:mb-3" />
                    <p className="text-sm sm:text-base text-gray-700 font-medium">Everything looks great!</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Your business is running smoothly 🎉</p>
                </div>
            </div>
        );
    }

    // Filter out dismissed and critical suggestions
    const activeSuggestions = suggestions.filter(s =>
        !dismissed.includes(s.id) && s.priority !== PRIORITIES.CRITICAL
    );

    // Get icon for suggestion type
    const getIcon = (type) => {
        switch (type) {
            case SUGGESTION_TYPES.WARNING:
                return FiAlertCircle;
            case SUGGESTION_TYPES.OPPORTUNITY:
                return FiTrendingUp;
            case SUGGESTION_TYPES.INSIGHT:
                return FiZap;
            default:
                return FiInfo;
        }
    };

    // Get colors for priority
    const getColors = (priority) => {
        switch (priority) {
            case PRIORITIES.HIGH:
                return {
                    bg: 'bg-orange-50',
                    border: 'border-orange-200',
                    icon: 'text-orange-600',
                    button: 'bg-orange-600 hover:bg-orange-700'
                };
            case PRIORITIES.MEDIUM:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    icon: 'text-blue-600',
                    button: 'bg-blue-600 hover:bg-blue-700'
                };
            case PRIORITIES.LOW:
                return {
                    bg: 'bg-purple-50',
                    border: 'border-purple-200',
                    icon: 'text-purple-600',
                    button: 'bg-purple-600 hover:bg-purple-700'
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    icon: 'text-gray-600',
                    button: 'bg-gray-600 hover:bg-gray-700'
                };
        }
    };

    const handleDismiss = (suggestionId) => {
        setDismissed([...dismissed, suggestionId]);
    };

    const handleAction = (suggestion) => {
        if (suggestion.actionPath) {
            navigate(suggestion.actionPath);
        }
    };

    if (activeSuggestions.length === 0) {
        return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border-2 border-green-200 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <FiZap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">AI Insights</h2>
                </div>
                <div className="text-center py-4 sm:py-8">
                    <FiCheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-2 sm:mb-3" />
                    <p className="text-sm sm:text-base text-gray-700 font-medium">All insights reviewed!</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Keep up the excellent work 🚀</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg sm:rounded-xl border-2 border-gray-200 p-4 sm:p-6">
            {/* Header - Mobile Optimized */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <FiZap className="w-5 h-5 sm:w-6 sm:h-6 text-[#F47920]" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">AI Business Insights</h2>
                <span className="ml-auto px-2 sm:px-3 py-1 rounded-full bg-[#F47920] text-white text-xs font-semibold">
                    {activeSuggestions.length}
                </span>
            </div>

            {/* Suggestions List - Mobile Optimized */}
            <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
                {activeSuggestions.map((suggestion) => {
                    const Icon = getIcon(suggestion.type);
                    const colors = getColors(suggestion.priority);

                    return (
                        <div
                            key={suggestion.id}
                            className={`${colors.bg} border-2 ${colors.border} rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md`}
                        >
                            {/* Header with icon and dismiss - Mobile Optimized */}
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className={`${colors.icon} mt-0.5 flex-shrink-0`}>
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                                        <h3 className="font-bold text-gray-800 text-xs sm:text-sm">
                                            {suggestion.title}
                                        </h3>
                                        <button
                                            onClick={() => handleDismiss(suggestion.id)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                                            title="Dismiss"
                                        >
                                            <FiX className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3">
                                        {suggestion.message}
                                    </p>

                                    {/* Action button - Mobile Optimized */}
                                    {suggestion.action && (
                                        <button
                                            onClick={() => handleAction(suggestion)}
                                            className={`px-3 sm:px-4 py-1.5 sm:py-2 ${colors.button} text-white text-xs sm:text-sm font-medium rounded-lg transition-colors w-full sm:w-auto`}
                                        >
                                            {suggestion.action}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AISuggestions;
