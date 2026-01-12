import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Leave Service
 * Handles leave management, balance tracking, and approval workflow
 */

// Leave types
export const LEAVE_TYPES = {
    CASUAL: 'Casual Leave',
    SICK: 'Sick Leave',
    EARNED: 'Earned Leave',
    MATERNITY: 'Maternity Leave',
    PATERNITY: 'Paternity Leave',
    UNPAID: 'Unpaid Leave',
    COMPENSATORY: 'Compensatory Off'
};

// Leave status
export const LEAVE_STATUS = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled'
};

// Default leave balance per year
export const DEFAULT_LEAVE_BALANCE = {
    casual: 12,
    sick: 12,
    earned: 15,
    maternity: 180,
    paternity: 15,
    unpaid: 0,
    compensatory: 0
};

// Create leave request
export const createLeaveRequest = async (leaveData) => {
    try {
        const days = calculateLeaveDays(leaveData.startDate, leaveData.endDate);

        const leave = {
            ...leaveData,
            days,
            status: LEAVE_STATUS.PENDING,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'leaves'), leave);
        return { id: docRef.id, ...leave };
    } catch (error) {
        console.error('Error creating leave request:', error);
        throw error;
    }
};

// Get leave requests
export const getLeaveRequests = async (filters = {}) => {
    try {
        let q = collection(db, 'leaves');

        if (filters.employeeId) {
            q = query(q, where('employeeId', '==', filters.employeeId));
        }

        if (filters.status) {
            q = query(q, where('status', '==', filters.status));
        }

        if (filters.leaveType) {
            q = query(q, where('leaveType', '==', filters.leaveType));
        }

        q = query(q, orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        throw error;
    }
};

// Update leave status
export const updateLeaveStatus = async (leaveId, status, approvedBy = null, remarks = '') => {
    try {
        const leaveRef = doc(db, 'leaves', leaveId);

        const updates = {
            status,
            remarks,
            updatedAt: serverTimestamp()
        };

        if (status === LEAVE_STATUS.APPROVED && approvedBy) {
            updates.approvedBy = approvedBy;
            updates.approvedAt = serverTimestamp();
        }

        await updateDoc(leaveRef, updates);
        return { id: leaveId, ...updates };
    } catch (error) {
        console.error('Error updating leave status:', error);
        throw error;
    }
};

// Delete leave request
export const deleteLeaveRequest = async (leaveId) => {
    try {
        await deleteDoc(doc(db, 'leaves', leaveId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting leave request:', error);
        throw error;
    }
};

// Calculate leave days
export const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

    return diffDays;
};

// Get leave balance
export const getLeaveBalance = async (employeeId, year = new Date().getFullYear()) => {
    try {
        // Get all approved leaves for the year
        const leaves = await getLeaveRequests({ employeeId });
        const approvedLeaves = leaves.filter(l =>
            l.status === LEAVE_STATUS.APPROVED &&
            new Date(l.startDate).getFullYear() === year
        );

        // Calculate used leaves by type
        const usedLeaves = {
            casual: 0,
            sick: 0,
            earned: 0,
            maternity: 0,
            paternity: 0,
            unpaid: 0,
            compensatory: 0
        };

        approvedLeaves.forEach(leave => {
            const type = leave.leaveType?.toLowerCase().split(' ')[0] || 'casual';
            if (usedLeaves.hasOwnProperty(type)) {
                usedLeaves[type] += leave.days || 0;
            }
        });

        // Calculate remaining balance
        const balance = {};
        Object.keys(DEFAULT_LEAVE_BALANCE).forEach(type => {
            balance[type] = {
                total: DEFAULT_LEAVE_BALANCE[type],
                used: usedLeaves[type],
                remaining: DEFAULT_LEAVE_BALANCE[type] - usedLeaves[type]
            };
        });

        return balance;
    } catch (error) {
        console.error('Error calculating leave balance:', error);
        throw error;
    }
};

// Get leave calendar data
export const getLeaveCalendar = async (month, year) => {
    try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        const allLeaves = await getDocs(collection(db, 'leaves'));
        const leaves = allLeaves.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(leave => {
                if (leave.status !== LEAVE_STATUS.APPROVED) return false;

                const leaveStart = new Date(leave.startDate);
                const leaveEnd = new Date(leave.endDate);
                const monthStart = new Date(startDate);
                const monthEnd = new Date(endDate);

                // Check if leave overlaps with the month
                return leaveStart <= monthEnd && leaveEnd >= monthStart;
            });

        return leaves;
    } catch (error) {
        console.error('Error fetching leave calendar:', error);
        throw error;
    }
};

// Check leave conflicts
export const checkLeaveConflicts = async (employeeId, startDate, endDate, department) => {
    try {
        const leaves = await getLeaveCalendar(
            new Date(startDate).getMonth() + 1,
            new Date(startDate).getFullYear()
        );

        // Check if employee already has leave in this period
        const employeeConflicts = leaves.filter(leave =>
            leave.employeeId === employeeId &&
            leave.status === LEAVE_STATUS.APPROVED
        );

        // Check team availability (optional - if too many people on leave)
        const departmentLeaves = leaves.filter(leave =>
            leave.department === department &&
            leave.status === LEAVE_STATUS.APPROVED
        );

        return {
            hasConflict: employeeConflicts.length > 0,
            employeeConflicts,
            departmentLeaves,
            departmentOnLeaveCount: departmentLeaves.length
        };
    } catch (error) {
        console.error('Error checking leave conflicts:', error);
        throw error;
    }
};

// Get leave statistics
export const getLeaveStatistics = async (filters = {}) => {
    try {
        const leaves = await getLeaveRequests(filters);

        const stats = {
            total: leaves.length,
            pending: leaves.filter(l => l.status === LEAVE_STATUS.PENDING).length,
            approved: leaves.filter(l => l.status === LEAVE_STATUS.APPROVED).length,
            rejected: leaves.filter(l => l.status === LEAVE_STATUS.REJECTED).length,
            byType: {},
            totalDays: 0
        };

        // Group by leave type
        Object.values(LEAVE_TYPES).forEach(type => {
            const typeLeaves = leaves.filter(l => l.leaveType === type && l.status === LEAVE_STATUS.APPROVED);
            stats.byType[type] = {
                count: typeLeaves.length,
                days: typeLeaves.reduce((sum, l) => sum + (l.days || 0), 0)
            };
            stats.totalDays += stats.byType[type].days;
        });

        return stats;
    } catch (error) {
        console.error('Error calculating leave statistics:', error);
        throw error;
    }
};

// Get pending approvals
export const getPendingApprovals = async (managerId = null) => {
    try {
        let q = query(
            collection(db, 'leaves'),
            where('status', '==', LEAVE_STATUS.PENDING),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        throw error;
    }
};

// Validate leave request
export const validateLeaveRequest = async (employeeId, leaveType, days) => {
    try {
        const balance = await getLeaveBalance(employeeId);
        const type = leaveType.toLowerCase().split(' ')[0];

        if (!balance[type]) {
            return {
                valid: false,
                message: 'Invalid leave type'
            };
        }

        if (balance[type].remaining < days) {
            return {
                valid: false,
                message: `Insufficient ${leaveType} balance. Available: ${balance[type].remaining} days`
            };
        }

        return {
            valid: true,
            message: 'Leave request is valid'
        };
    } catch (error) {
        console.error('Error validating leave request:', error);
        throw error;
    }
};
