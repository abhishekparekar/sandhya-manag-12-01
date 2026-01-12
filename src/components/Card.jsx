import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const Card = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    subtitle,
    color = 'blue',
    onClick,
    className = ''
}) => {
    const colorClasses = {
        blue: {
            bg: 'from-blue-500 to-blue-600',
            light: 'bg-blue-50',
            text: 'text-blue-600',
            border: 'border-blue-200',
            hover: 'hover:border-blue-300'
        },
        green: {
            bg: 'from-green-500 to-green-600',
            light: 'bg-green-50',
            text: 'text-green-600',
            border: 'border-green-200',
            hover: 'hover:border-green-300'
        },
        orange: {
            bg: 'from-orange-500 to-orange-600',
            light: 'bg-orange-50',
            text: 'text-orange-600',
            border: 'border-orange-200',
            hover: 'hover:border-orange-300'
        },
        red: {
            bg: 'from-red-500 to-red-600',
            light: 'bg-red-50',
            text: 'text-red-600',
            border: 'border-red-200',
            hover: 'hover:border-red-300'
        },
        purple: {
            bg: 'from-purple-500 to-purple-600',
            light: 'bg-purple-50',
            text: 'text-purple-600',
            border: 'border-purple-200',
            hover: 'hover:border-purple-300'
        },
        teal: {
            bg: 'from-teal-500 to-teal-600',
            light: 'bg-teal-50',
            text: 'text-teal-600',
            border: 'border-teal-200',
            hover: 'hover:border-teal-300'
        },
        indigo: {
            bg: 'from-indigo-500 to-indigo-600',
            light: 'bg-indigo-50',
            text: 'text-indigo-600',
            border: 'border-indigo-200',
            hover: 'hover:border-indigo-300'
        },
        pink: {
            bg: 'from-pink-500 to-pink-600',
            light: 'bg-pink-50',
            text: 'text-pink-600',
            border: 'border-pink-200',
            hover: 'hover:border-pink-300'
        }
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl border-2 ${colors.border} ${colors.hover} p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''
                } ${className} animate-fade-in`}
        >
            {/* Header with Icon */}
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} shadow-lg`}>
                    {Icon && <Icon className="w-6 h-6 text-white" />}
                </div>

                {/* Trend Indicator */}
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${trend === 'up'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                        {trend === 'up' ? (
                            <FiTrendingUp className="w-3 h-3" />
                        ) : (
                            <FiTrendingDown className="w-3 h-3" />
                        )}
                        <span>{trendValue}%</span>
                    </div>
                )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-gray-600 mb-2">
                {title}
            </h3>

            {/* Value */}
            <div className="flex items-baseline gap-2 mb-2">
                <p className="text-3xl font-bold text-gray-900">
                    {value}
                </p>
            </div>

            {/* Subtitle */}
            {subtitle && (
                <p className="text-xs text-gray-500">
                    {subtitle}
                </p>
            )}

            {/* Bottom Border Accent */}
            <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${colors.bg} opacity-50`}></div>
        </div>
    );
};

export default Card;
