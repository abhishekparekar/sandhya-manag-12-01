import React from 'react';

/**
 * SkeletonLoader Component
 * Professional skeleton loading placeholders with shimmer animation
 * Replaces spinning loaders for better UX
 */

const SkeletonLoader = ({
    variant = 'card',
    count = 1,
    width = '100%',
    height = 'auto',
    className = ''
}) => {
    const skeletons = Array.from({ length: count }, (_, i) => i);

    const renderSkeleton = () => {
        switch (variant) {
            case 'card':
                return (
                    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="skeleton w-12 h-12 rounded-lg"></div>
                                <div className="space-y-2">
                                    <div className="skeleton h-4 w-32 rounded"></div>
                                    <div className="skeleton h-3 w-24 rounded"></div>
                                </div>
                            </div>
                            <div className="skeleton h-8 w-8 rounded-full"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="skeleton h-3 w-full rounded"></div>
                            <div className="skeleton h-3 w-4/5 rounded"></div>
                            <div className="skeleton h-3 w-3/5 rounded"></div>
                        </div>
                    </div>
                );

            case 'metric-card':
                return (
                    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200 ${className}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="skeleton w-10 h-10 rounded-lg"></div>
                            <div className="skeleton h-4 w-12 rounded"></div>
                        </div>
                        <div className="skeleton h-3 w-20 rounded mb-2"></div>
                        <div className="skeleton h-6 w-24 rounded mb-1"></div>
                        <div className="skeleton h-2 w-16 rounded"></div>
                    </div>
                );

            case 'table':
                return (
                    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
                        {/* Table Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex gap-4">
                                <div className="skeleton h-4 w-32 rounded"></div>
                                <div className="skeleton h-4 w-24 rounded"></div>
                                <div className="skeleton h-4 w-28 rounded"></div>
                                <div className="skeleton h-4 w-20 rounded"></div>
                            </div>
                        </div>
                        {/* Table Rows */}
                        {[1, 2, 3, 4, 5].map((row) => (
                            <div key={row} className="px-6 py-4 border-b border-gray-100">
                                <div className="flex gap-4 items-center">
                                    <div className="skeleton h-3 w-32 rounded"></div>
                                    <div className="skeleton h-3 w-24 rounded"></div>
                                    <div className="skeleton h-3 w-28 rounded"></div>
                                    <div className="skeleton h-6 w-20 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'list':
                return (
                    <div className={`space-y-3 ${className}`}>
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="skeleton w-10 h-10 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="skeleton h-4 w-3/4 rounded"></div>
                                        <div className="skeleton h-3 w-1/2 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'chart':
                return (
                    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
                        <div className="skeleton h-5 w-48 rounded mb-6"></div>
                        <div className="flex items-end justify-between gap-2 h-64">
                            {[60, 80, 45, 90, 70, 85, 50].map((height, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end">
                                    <div
                                        className="skeleton w-full rounded-t"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4">
                            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <div key={i} className="skeleton h-3 w-8 rounded"></div>
                            ))}
                        </div>
                    </div>
                );

            case 'text':
                return (
                    <div className={`space-y-2 ${className}`}>
                        <div className="skeleton h-4 rounded" style={{ width }}></div>
                    </div>
                );

            case 'circle':
                return (
                    <div className={`skeleton rounded-full ${className}`} style={{ width, height: height === 'auto' ? width : height }}></div>
                );

            case 'rectangle':
                return (
                    <div className={`skeleton rounded ${className}`} style={{ width, height }}></div>
                );

            default:
                return (
                    <div className={`skeleton rounded ${className}`} style={{ width, height }}></div>
                );
        }
    };

    return (
        <>
            {skeletons.map((_, index) => (
                <div key={index} className="animate-pulse">
                    {renderSkeleton()}
                </div>
            ))}
        </>
    );
};

export default SkeletonLoader;
