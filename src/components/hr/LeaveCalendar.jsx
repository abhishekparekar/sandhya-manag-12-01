import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiCheck, FiX, FiAlertCircle, FiPlus } from 'react-icons/fi';
import {
    getLeaveCalendar,
    createLeaveRequest,
    updateLeaveStatus,
    getPendingApprovals,
    getLeaveBalance,
    LEAVE_TYPES,
    LEAVE_STATUS
} from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';

/**
 * Leave Calendar Component
 * Visual calendar view of all leaves with approval workflow
 */
const LeaveCalendar = ({ employeeId = null, employeeName = null, department = null }) => {
    const { currentUser, userRole, checkPermission } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [leaves, setLeaves] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [leaveBalance, setLeaveBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const [requestForm, setRequestForm] = useState({
        leaveType: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const canManageLeaves = checkPermission('employees', 'update') || userRole === 'hr' || userRole === 'admin';

    useEffect(() => {
        fetchLeaveData();
    }, [currentMonth, currentYear, employeeId]);

    const fetchLeaveData = async () => {
        try {
            setLoading(true);
            const calendarData = await getLeaveCalendar(currentMonth, currentYear);
            setLeaves(calendarData);

            if (canManageLeaves) {
                const pending = await getPendingApprovals();
                setPendingApprovals(pending);
            }

            if (employeeId) {
                const balance = await getLeaveBalance(employeeId, currentYear);
                setLeaveBalance(balance);
            }
        } catch (error) {
            console.error('Error fetching leave data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestLeave = async (e) => {
        e.preventDefault();
        try {
            await createLeaveRequest({
                employeeId: employeeId || currentUser.uid,
                employeeName: employeeName || currentUser.displayName,
                department: department || 'General',
                ...requestForm
            });

            alert('Leave request submitted successfully!');
            setShowRequestModal(false);
            setRequestForm({
                leaveType: 'Casual Leave',
                startDate: '',
                endDate: '',
                reason: ''
            });
            fetchLeaveData();
        } catch (error) {
            console.error('Error requesting leave:', error);
            alert('Error submitting leave request');
        }
    };

    const handleApproveReject = async (leaveId, status) => {
        try {
            await updateLeaveStatus(leaveId, status, currentUser.email);
            alert(`Leave ${status.toLowerCase()} successfully!`);
            fetchLeaveData();
        } catch (error) {
            console.error('Error updating leave status:', error);
            alert('Error updating leave status');
        }
    };

    const getDaysInMonth = (month, year) => {
        return new Date(year, month, 0).getDate();
    };

    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month - 1, 1).getDay();
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2 border border-gray-100"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLeaves = leaves.filter(leave => {
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);
                const current = new Date(dateStr);
                return current >= start && current <= end;
            });

            const isToday = dateStr === new Date().toISOString().split('T')[0];

            days.push(
                <div
                    key={day}
                    className={`p-2 border border-gray-100 min-h-[80px] ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
                >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {day}
                    </div>
                    <div className="space-y-1">
                        {dayLeaves.map((leave, idx) => (
                            <div
                                key={idx}
                                className={`text-xs px-1 py-0.5 rounded truncate ${leave.status === LEAVE_STATUS.APPROVED
                                        ? 'bg-green-100 text-green-800'
                                        : leave.status === LEAVE_STATUS.PENDING
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                title={`${leave.employeeName} - ${leave.leaveType}`}
                            >
                                {leave.employeeName?.split(' ')[0]}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

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
                    <FiCalendar className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Leave Calendar</h2>
                        <p className="text-gray-600 mt-1">View and manage team leaves</p>
                    </div>
                </div>
                {employeeId && (
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors"
                    >
                        <FiPlus className="mr-2" />
                        Request Leave
                    </button>
                )}
            </div>

            {/* Leave Balance */}
            {leaveBalance && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(leaveBalance).map(([type, balance]) => (
                        balance.total > 0 && (
                            <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <p className="text-sm text-gray-600 capitalize">{type}</p>
                                <p className="text-2xl font-bold text-gray-800">{balance.remaining}</p>
                                <p className="text-xs text-gray-500">of {balance.total} remaining</p>
                            </div>
                        )
                    ))}
                </div>
            )}

            {/* Month Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (currentMonth === 1) {
                                setCurrentMonth(12);
                                setCurrentYear(currentYear - 1);
                            } else {
                                setCurrentMonth(currentMonth - 1);
                            }
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Previous
                    </button>
                    <h3 className="text-xl font-bold text-gray-800">
                        {monthNames[currentMonth - 1]} {currentYear}
                    </h3>
                    <button
                        onClick={() => {
                            if (currentMonth === 12) {
                                setCurrentMonth(1);
                                setCurrentYear(currentYear + 1);
                            } else {
                                setCurrentMonth(currentMonth + 1);
                            }
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-7 gap-0">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center font-bold text-gray-700 bg-gray-50 border border-gray-200">
                            {day}
                        </div>
                    ))}
                    {renderCalendar()}
                </div>
            </div>

            {/* Pending Approvals */}
            {canManageLeaves && pendingApprovals.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Pending Approvals</h3>
                    <div className="space-y-3">
                        {pendingApprovals.map((leave) => (
                            <div key={leave.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">{leave.employeeName}</p>
                                    <p className="text-sm text-gray-600">
                                        {leave.leaveType} • {leave.startDate} to {leave.endDate} ({leave.days} days)
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleApproveReject(leave.id, LEAVE_STATUS.APPROVED)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <FiCheck /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleApproveReject(leave.id, LEAVE_STATUS.REJECTED)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                    >
                                        <FiX /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Request Leave Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800">Request Leave</h3>
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleRequestLeave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={requestForm.leaveType}
                                    onChange={(e) => setRequestForm({ ...requestForm, leaveType: e.target.value })}
                                >
                                    {Object.values(LEAVE_TYPES).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={requestForm.startDate}
                                    onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={requestForm.endDate}
                                    onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={requestForm.reason}
                                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                                    placeholder="Enter reason for leave..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveCalendar;
