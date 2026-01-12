import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiX, FiTrendingDown, FiClock, FiAlertTriangle } from 'react-icons/fi';
import {
    getWarnings,
    acknowledgeWarning,
    dismissWarning,
    getWarningStatistics,
    WARNING_SEVERITY,
    WARNING_TYPES
} from '../../services/aiWarningService';
import { useAuth } from '../../context/AuthContext';

/**
 * AI Warnings Dashboard Component
 * Displays automated warnings for attendance, performance, and leave issues
 */
const AIWarnings = () => {
    const { currentUser, userRole } = useAuth();
    const [warnings, setWarnings] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, attendance, performance, leave
    const [severityFilter, setSeverityFilter] = useState('all');

    useEffect(() => {
        fetchWarnings();
        fetchStats();
    }, []);

    const fetchWarnings = async () => {
        try {
            setLoading(true);
            const data = await getWarnings({ status: 'Active' });
            setWarnings(data);
        } catch (error) {
            console.error('Error fetching warnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const statistics = await getWarningStatistics();
            setStats(statistics);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleAcknowledge = async (warningId) => {
        try {
            await acknowledgeWarning(warningId, currentUser.email, 'Acknowledged by user');
            fetchWarnings();
            fetchStats();
        } catch (error) {
            console.error('Error acknowledging warning:', error);
            alert('Error acknowledging warning');
        }
    };

    const handleDismiss = async (warningId) => {
        const reason = prompt('Enter reason for dismissing this warning:');
        if (!reason) return;

        try {
            await dismissWarning(warningId, currentUser.email, reason);
            fetchWarnings();
            fetchStats();
        } catch (error) {
            console.error('Error dismissing warning:', error);
            alert('Error dismissing warning');
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case WARNING_SEVERITY.CRITICAL:
                return <FiAlertCircle className="w-5 h-5 text-red-600" />;
            case WARNING_SEVERITY.HIGH:
                return <FiAlertTriangle className="w-5 h-5 text-orange-600" />;
            case WARNING_SEVERITY.MEDIUM:
                return <FiClock className="w-5 h-5 text-yellow-600" />;
            case WARNING_SEVERITY.LOW:
                return <FiTrendingDown className="w-5 h-5 text-blue-600" />;
            default:
                return <FiAlertCircle className="w-5 h-5 text-gray-600" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case WARNING_SEVERITY.CRITICAL:
                return 'bg-red-50 border-red-200 text-red-800';
            case WARNING_SEVERITY.HIGH:
                return 'bg-orange-50 border-orange-200 text-orange-800';
            case WARNING_SEVERITY.MEDIUM:
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case WARNING_SEVERITY.LOW:
                return 'bg-blue-50 border-blue-200 text-blue-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const filteredWarnings = warnings.filter(warning => {
        const matchesType = filter === 'all' || warning.type.toLowerCase().includes(filter.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || warning.severity === severityFilter;
        return matchesType && matchesSeverity;
    });

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FiAlertCircle className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">AI Warnings</h1>
                        <p className="text-gray-600 mt-1">Automated alerts for HR issues</p>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Active</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                            </div>
                            <FiAlertCircle className="w-8 h-8 text-gray-400" />
                        </div>
                    </div>
                    <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600">Critical</p>
                                <p className="text-2xl font-bold text-red-800">{stats.critical}</p>
                            </div>
                            <FiAlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-600">Unacknowledged</p>
                                <p className="text-2xl font-bold text-yellow-800">{stats.unacknowledged}</p>
                            </div>
                            <FiClock className="w-8 h-8 text-yellow-400" />
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600">By Type</p>
                                <p className="text-sm font-medium text-blue-800">
                                    {Object.keys(stats.byType).length} categories
                                </p>
                            </div>
                            <FiTrendingDown className="w-8 h-8 text-blue-400" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                        >
                            <option value="all">All Types</option>
                            <option value="attendance">Attendance</option>
                            <option value="performance">Performance</option>
                            <option value="leave">Leave Balance</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                        >
                            <option value="all">All Severities</option>
                            <option value={WARNING_SEVERITY.CRITICAL}>Critical</option>
                            <option value={WARNING_SEVERITY.HIGH}>High</option>
                            <option value={WARNING_SEVERITY.MEDIUM}>Medium</option>
                            <option value={WARNING_SEVERITY.LOW}>Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Warnings List */}
            <div className="space-y-4">
                {filteredWarnings.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                        <FiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-green-800">No Active Warnings</h3>
                        <p className="text-green-600 mt-1">All clear! No issues detected.</p>
                    </div>
                ) : (
                    filteredWarnings.map((warning) => (
                        <div
                            key={warning.id}
                            className={`rounded-lg border p-6 ${getSeverityColor(warning.severity)}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    {getSeverityIcon(warning.severity)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-bold text-lg">{warning.employeeName}</h3>
                                            <span className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium">
                                                {warning.type}
                                            </span>
                                            <span className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium">
                                                {warning.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm mb-3">{warning.message}</p>
                                        <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-3">
                                            <p className="text-sm font-medium mb-1">💡 Suggestion:</p>
                                            <p className="text-sm">{warning.suggestion}</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs opacity-75">
                                            <span>Department: {warning.department}</span>
                                            <span>•</span>
                                            <span>Employee ID: {warning.employeeId}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    {!warning.acknowledged && (
                                        <button
                                            onClick={() => handleAcknowledge(warning.id)}
                                            className="px-3 py-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg text-sm font-medium transition-colors"
                                            title="Acknowledge warning"
                                        >
                                            <FiCheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDismiss(warning.id)}
                                        className="px-3 py-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg text-sm font-medium transition-colors"
                                        title="Dismiss warning"
                                    >
                                        <FiX className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AIWarnings;
