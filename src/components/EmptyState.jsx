import React from 'react';
import { FiInbox, FiAlertCircle, FiCheckCircle, FiSearch, FiFileText } from 'react-icons/fi';

/**
 * EmptyState Component
 * Beautiful empty states with illustrations and CTAs
 */

const EmptyState = ({
    type = 'no-data',
    title,
    description,
    icon: CustomIcon,
    primaryAction,
    secondaryAction,
    className = ''
}) => {
    // Default configurations for different types
    const configs = {
        'no-data': {
            icon: FiInbox,
            defaultTitle: 'No Data Available',
            defaultDescription: 'There are no items to display at the moment.',
            iconColor: 'text-gray-400',
            bgColor: 'bg-gray-50',
        },
        'no-results': {
            icon: FiSearch,
            defaultTitle: 'No Results Found',
            defaultDescription: 'Try adjusting your search or filters to find what you\'re looking for.',
            iconColor: 'text-blue-400',
            bgColor: 'bg-blue-50',
        },
        'error': {
            icon: FiAlertCircle,
            defaultTitle: 'Something Went Wrong',
            defaultDescription: 'We encountered an error while loading this content. Please try again.',
            iconColor: 'text-red-400',
            bgColor: 'bg-red-50',
        },
        'success': {
            icon: FiCheckCircle,
            defaultTitle: 'All Done!',
            defaultDescription: 'You\'ve completed everything. Great job!',
            iconColor: 'text-green-400',
            bgColor: 'bg-green-50',
        },
        'no-documents': {
            icon: FiFileText,
            defaultTitle: 'No Documents',
            defaultDescription: 'Upload or create your first document to get started.',
            iconColor: 'text-purple-400',
            bgColor: 'bg-purple-50',
        },
    };

    const config = configs[type] || configs['no-data'];
    const Icon = CustomIcon || config.icon;
    const displayTitle = title || config.defaultTitle;
    const displayDescription = description || config.defaultDescription;

    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
            {/* Icon with background */}
            <div className={`${config.bgColor} rounded-full p-6 mb-6 animate-scale-in`}>
                <Icon className={`w-16 h-16 ${config.iconColor}`} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                {displayTitle}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
                {displayDescription}
            </p>

            {/* Actions */}
            {(primaryAction || secondaryAction) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {primaryAction && (
                        <button
                            onClick={primaryAction.onClick}
                            className="px-6 py-2.5 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-all shadow-md hover:shadow-lg font-medium"
                        >
                            {primaryAction.label}
                        </button>
                    )}
                    {secondaryAction && (
                        <button
                            onClick={secondaryAction.onClick}
                            className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                        >
                            {secondaryAction.label}
                        </button>
                    )}
                </div>
            )}

            {/* Decorative elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-100 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
            </div>
        </div>
    );
};

export default EmptyState;
