import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { getAttendanceStats } from './attendanceService';
import { getEmployeePerformanceSummary } from './performanceService';
import { getLeaveBalance } from './leaveService';

/**
 * AI Warning Service
 * Automated warning system for attendance, performance, and leave issues
 */

// Warning types
export const WARNING_TYPES = {
    ATTENDANCE: 'Attendance',
    PERFORMANCE: 'Performance',
    LEAVE: 'Leave Balance',
    DEADLINE: 'Deadline',
    CONTRACT: 'Contract Expiry'
};

// Warning severity
export const WARNING_SEVERITY = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical'
};

// Warning rules configuration
export const WARNING_RULES = {
    attendance: {
        absences: { threshold: 3, severity: WARNING_SEVERITY.HIGH },
        lateArrivals: { threshold: 5, severity: WARNING_SEVERITY.MEDIUM },
        lowWorkHours: { threshold: 120, severity: WARNING_SEVERITY.MEDIUM } // hours per month
    },
    performance: {
        lowRating: { threshold: 3.0, severity: WARNING_SEVERITY.HIGH },
        decliningTrend: { severity: WARNING_SEVERITY.MEDIUM }
    },
    leave: {
        lowBalance: { threshold: 3, severity: WARNING_SEVERITY.LOW },
        noLeaves: { threshold: 6, severity: WARNING_SEVERITY.MEDIUM } // months without leave
    }
};

// Generate attendance warnings
export const generateAttendanceWarnings = async (employeeId, employeeName, month, year) => {
    try {
        const stats = await getAttendanceStats(employeeId, month, year);
        const warnings = [];

        // Check absences
        if (stats.absent >= WARNING_RULES.attendance.absences.threshold) {
            warnings.push({
                employeeId,
                employeeName,
                type: WARNING_TYPES.ATTENDANCE,
                severity: WARNING_RULES.attendance.absences.severity,
                message: `${stats.absent} absences in ${month}/${year}`,
                suggestion: 'Review attendance policy with employee. Consider counseling session.',
                data: { absences: stats.absent, month, year }
            });
        }

        // Check late arrivals
        if (stats.late >= WARNING_RULES.attendance.lateArrivals.threshold) {
            warnings.push({
                employeeId,
                employeeName,
                type: WARNING_TYPES.ATTENDANCE,
                severity: WARNING_RULES.attendance.lateArrivals.severity,
                message: `${stats.late} late arrivals in ${month}/${year}`,
                suggestion: 'Discuss punctuality expectations. Consider flexible timing if needed.',
                data: { lateArrivals: stats.late, month, year }
            });
        }

        // Check work hours
        if (stats.totalWorkHours < WARNING_RULES.attendance.lowWorkHours.threshold) {
            warnings.push({
                employeeId,
                employeeName,
                type: WARNING_TYPES.ATTENDANCE,
                severity: WARNING_RULES.attendance.lowWorkHours.severity,
                message: `Low work hours: ${stats.totalWorkHours.toFixed(1)} hours in ${month}/${year}`,
                suggestion: 'Review workload and productivity. Check for any personal issues.',
                data: { workHours: stats.totalWorkHours, month, year }
            });
        }

        return warnings;
    } catch (error) {
        console.error('Error generating attendance warnings:', error);
        return [];
    }
};

// Generate performance warnings
export const generatePerformanceWarnings = async (employeeId, employeeName) => {
    try {
        const summary = await getEmployeePerformanceSummary(employeeId);
        const warnings = [];

        // Check low rating
        if (summary.latestRating > 0 && summary.latestRating < WARNING_RULES.performance.lowRating.threshold) {
            warnings.push({
                employeeId,
                employeeName,
                type: WARNING_TYPES.PERFORMANCE,
                severity: WARNING_RULES.performance.lowRating.severity,
                message: `Low performance rating: ${summary.latestRating}/5.0`,
                suggestion: 'Schedule performance improvement plan (PIP). Provide additional training and support.',
                data: { rating: summary.latestRating, averageRating: summary.averageRating }
            });
        }

        // Check declining trend
        if (summary.trend === 'declining') {
            warnings.push({
                employeeId,
                employeeName,
                type: WARNING_TYPES.PERFORMANCE,
                severity: WARNING_RULES.performance.decliningTrend.severity,
                message: 'Performance trend is declining',
                suggestion: 'Conduct one-on-one meeting to understand challenges. Offer mentorship.',
                data: { trend: summary.trend, reviews: summary.totalReviews }
            });
        }

        return warnings;
    } catch (error) {
        console.error('Error generating performance warnings:', error);
        return [];
    }
};

// Generate leave balance warnings
export const generateLeaveWarnings = async (employeeId, employeeName) => {
    try {
        const balance = await getLeaveBalance(employeeId);
        const warnings = [];

        // Check low casual leave balance
        if (balance.casual && balance.casual.remaining <= WARNING_RULES.leave.lowBalance.threshold) {
            warnings.push({
                employeeId,
                employeeName,
                type: WARNING_TYPES.LEAVE,
                severity: WARNING_RULES.leave.lowBalance.severity,
                message: `Low casual leave balance: ${balance.casual.remaining} days remaining`,
                suggestion: 'Remind employee to plan leaves wisely. Consider leave without pay if needed.',
                data: { leaveType: 'casual', remaining: balance.casual.remaining }
            });
        }

        // Check low sick leave balance
        if (balance.sick && balance.sick.remaining <= WARNING_RULES.leave.lowBalance.threshold) {
            warnings.push({
                employeeId,
                employeeName,
                type: WARNING_TYPES.LEAVE,
                severity: WARNING_RULES.leave.lowBalance.severity,
                message: `Low sick leave balance: ${balance.sick.remaining} days remaining`,
                suggestion: 'Monitor employee health. Consider wellness programs.',
                data: { leaveType: 'sick', remaining: balance.sick.remaining }
            });
        }

        return warnings;
    } catch (error) {
        console.error('Error generating leave warnings:', error);
        return [];
    }
};

// Generate all warnings for an employee
export const generateEmployeeWarnings = async (employeeId, employeeName, department) => {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const attendanceWarnings = await generateAttendanceWarnings(employeeId, employeeName, currentMonth, currentYear);
        const performanceWarnings = await generatePerformanceWarnings(employeeId, employeeName);
        const leaveWarnings = await generateLeaveWarnings(employeeId, employeeName);

        const allWarnings = [
            ...attendanceWarnings,
            ...performanceWarnings,
            ...leaveWarnings
        ];

        // Save warnings to database
        for (const warning of allWarnings) {
            await addDoc(collection(db, 'warnings'), {
                ...warning,
                department,
                status: 'Active',
                acknowledged: false,
                createdAt: serverTimestamp()
            });
        }

        return allWarnings;
    } catch (error) {
        console.error('Error generating employee warnings:', error);
        throw error;
    }
};

// Get warnings
export const getWarnings = async (filters = {}) => {
    try {
        let q = collection(db, 'warnings');

        if (filters.employeeId) {
            q = query(q, where('employeeId', '==', filters.employeeId));
        }

        if (filters.type) {
            q = query(q, where('type', '==', filters.type));
        }

        if (filters.severity) {
            q = query(q, where('severity', '==', filters.severity));
        }

        if (filters.status) {
            q = query(q, where('status', '==', filters.status));
        } else {
            q = query(q, where('status', '==', 'Active'));
        }

        q = query(q, orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching warnings:', error);
        throw error;
    }
};

// Acknowledge warning
export const acknowledgeWarning = async (warningId, acknowledgedBy, remarks = '') => {
    try {
        const warningRef = doc(db, 'warnings', warningId);
        await updateDoc(warningRef, {
            acknowledged: true,
            acknowledgedBy,
            acknowledgedAt: serverTimestamp(),
            remarks,
            status: 'Acknowledged'
        });

        return { id: warningId, acknowledged: true };
    } catch (error) {
        console.error('Error acknowledging warning:', error);
        throw error;
    }
};

// Dismiss warning
export const dismissWarning = async (warningId, dismissedBy, reason = '') => {
    try {
        const warningRef = doc(db, 'warnings', warningId);
        await updateDoc(warningRef, {
            status: 'Dismissed',
            dismissedBy,
            dismissedAt: serverTimestamp(),
            dismissReason: reason
        });

        return { id: warningId, status: 'Dismissed' };
    } catch (error) {
        console.error('Error dismissing warning:', error);
        throw error;
    }
};

// Get warning statistics
export const getWarningStatistics = async () => {
    try {
        const warnings = await getWarnings({ status: 'Active' });

        const stats = {
            total: warnings.length,
            byType: {},
            bySeverity: {},
            byDepartment: {},
            critical: warnings.filter(w => w.severity === WARNING_SEVERITY.CRITICAL).length,
            unacknowledged: warnings.filter(w => !w.acknowledged).length
        };

        // Group by type
        Object.values(WARNING_TYPES).forEach(type => {
            stats.byType[type] = warnings.filter(w => w.type === type).length;
        });

        // Group by severity
        Object.values(WARNING_SEVERITY).forEach(severity => {
            stats.bySeverity[severity] = warnings.filter(w => w.severity === severity).length;
        });

        // Group by department
        warnings.forEach(warning => {
            const dept = warning.department || 'Unknown';
            stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
        });

        return stats;
    } catch (error) {
        console.error('Error calculating warning statistics:', error);
        throw error;
    }
};

// Bulk generate warnings for all employees
export const generateBulkWarnings = async (employees) => {
    try {
        const allWarnings = [];

        for (const employee of employees) {
            const warnings = await generateEmployeeWarnings(
                employee.id,
                employee.name,
                employee.department
            );
            allWarnings.push(...warnings);
        }

        return allWarnings;
    } catch (error) {
        console.error('Error generating bulk warnings:', error);
        throw error;
    }
};
