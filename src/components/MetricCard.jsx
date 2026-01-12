/**
 * MetricCard Component
 * Live updating metric card with trend indicators and animations
 * Mobile-optimized responsive design
 */

import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

/**
 * MetricCard - Display a single metric with live updates
 * @param {object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Main metric value
 * @param {string} props.subtitle - Subtitle text
 * @param {React.Component} props.icon - Icon component
 * @param {string} props.color - Color theme (blue, green, red, purple, orange, teal)
 * @param {string} props.trend - Trend direction (up, down, neutral)
 * @param {string} props.trendValue - Trend value (e.g., '+12%')
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onClick - Click handler
 */
const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'blue',
    trend,
    trendValue,
    loading = false,
    onClick
}) => {
    // Color configurations
    const colorConfig = {
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'text-blue-600',
            iconBg: 'bg-blue-100',
            text: 'text-blue-900'
        },
        green: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            icon: 'text-green-600',
            iconBg: 'bg-green-100',
            text: 'text-green-900'
        },
        red: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: 'text-red-600',
            iconBg: 'bg-red-100',
            text: 'text-red-900'
        },
        purple: {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            icon: 'text-purple-600',
            iconBg: 'bg-purple-100',
            text: 'text-purple-900'
        },
        orange: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            icon: 'text-orange-600',
            iconBg: 'bg-orange-100',
            text: 'text-orange-900'
        },
        teal: {
            bg: 'bg-teal-50',
            border: 'border-teal-200',
            icon: 'text-teal-600',
            iconBg: 'bg-teal-100',
            text: 'text-teal-900'
        },
        indigo: {
            bg: 'bg-indigo-50',
            border: 'border-indigo-200',
            icon: 'text-indigo-600',
            iconBg: 'bg-indigo-100',
            text: 'text-indigo-900'
        },
        pink: {
            bg: 'bg-pink-50',
            border: 'border-pink-200',
            icon: 'text-pink-600',
            iconBg: 'bg-pink-100',
            text: 'text-pink-900'
        }
    };

    const colors = colorConfig[color] || colorConfig.blue;

    // Trend indicator
    const getTrendIcon = () => {
        if (trend === 'up') return <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />;
        if (trend === 'down') return <FiTrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />;
        return <FiMinus className="w-3 h-3 sm:w-4 sm:h-4" />;
    };

    const getTrendColor = () => {
        if (trend === 'up') return 'text-green-600';
        if (trend === 'down') return 'text-red-600';
        return 'text-gray-500';
    };

    return (
        <div
            className={`p-3 sm:p-4 rounded-lg border-2 ${colors.bg} ${colors.border} ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-all duration-200`}
            onClick={onClick}
        >
            {/* Header with Icon - Mobile Optimized */}
            <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 sm:p-2 rounded-lg ${colors.iconBg}`}>
                    {Icon && <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.icon}`} />}
                </div>
                {trend && trendValue && (
                    <div className={`flex items-center gap-0.5 sm:gap-1 ${getTrendColor()} text-xs sm:text-sm font-medium`}>
                        {getTrendIcon()}
                        <span className="hidden sm:inline">{trendValue}</span>
                    </div>
                )}
            </div>

            {/* Title - Mobile Optimized */}
            <p className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 truncate" title={title}>
                {title}
            </p>

            {/* Value with loading skeleton - Mobile Optimized */}
            {loading ? (
                <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse mb-1"></div>
            ) : (
                <p className={`text-lg sm:text-2xl font-bold ${colors.text} mb-0.5 sm:mb-1 truncate`}>
                    {value}
                </p>
            )}

            {/* Subtitle - Mobile Optimized */}
            {subtitle && (
                <p className="text-[10px] sm:text-xs text-gray-600 truncate" title={subtitle}>
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default MetricCard;
