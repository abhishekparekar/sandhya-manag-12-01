import { db } from './firebase';
import { getDocs, collection } from 'firebase/firestore';
import { getAttendanceStats } from './attendanceService';
import { getEmployeePerformanceSummary } from './performanceService';
import { getLeaveBalance } from './leaveService';

/**
 * HR Service
 * Centralized HR operations and statistics
 */

// Get comprehensive employee statistics
export const getEmployeeStats = async () => {
    try {
        const employeesSnap = await getDocs(collection(db, 'employees'));
        const employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const stats = {
            total: employees.length,
            active: employees.filter(e => e.status === 'Active').length,
            inactive: employees.filter(e => e.status === 'Inactive').length,
            byDepartment: {},
            byDesignation: {},
            byEmployeeType: {},
            averageSalary: 0,
            totalSalary: 0
        };

        // Group by department
        employees.forEach(emp => {
            const dept = emp.department || 'Unknown';
            stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;

            const designation = emp.designation || 'Unknown';
            stats.byDesignation[designation] = (stats.byDesignation[designation] || 0) + 1;

            const type = emp.employeeType || 'Employee';
            stats.byEmployeeType[type] = (stats.byEmployeeType[type] || 0) + 1;

            stats.totalSalary += Number(emp.salary || 0);
        });

        stats.averageSalary = stats.total > 0 ? stats.totalSalary / stats.total : 0;

        return stats;
    } catch (error) {
        console.error('Error getting employee stats:', error);
        throw error;
    }
};

// Get comprehensive HR dashboard data
export const getHRDashboardData = async () => {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Get all employees
        const employeesSnap = await getDocs(collection(db, 'employees'));
        const employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get attendance for current month
        const attendanceSnap = await getDocs(collection(db, 'attendance'));
        const attendance = attendanceSnap.docs.map(doc => doc.data());
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter(a => a.date === today);

        // Get pending leaves
        const leavesSnap = await getDocs(collection(db, 'leaves'));
        const leaves = leavesSnap.docs.map(doc => doc.data());
        const pendingLeaves = leaves.filter(l => l.status === 'Pending');

        // Get warnings
        const warningsSnap = await getDocs(collection(db, 'warnings'));
        const warnings = warningsSnap.docs.map(doc => doc.data());
        const activeWarnings = warnings.filter(w => w.status === 'Active');

        return {
            employees: {
                total: employees.length,
                active: employees.filter(e => e.status === 'Active').length,
                byDepartment: groupByDepartment(employees)
            },
            attendance: {
                today: {
                    present: todayAttendance.filter(a => a.status === 'Present').length,
                    absent: todayAttendance.filter(a => a.status === 'Absent').length,
                    leave: todayAttendance.filter(a => a.status === 'Leave').length
                }
            },
            leaves: {
                pending: pendingLeaves.length,
                total: leaves.length
            },
            warnings: {
                active: activeWarnings.length,
                critical: activeWarnings.filter(w => w.severity === 'Critical').length
            },
            payroll: {
                totalMonthlySalary: employees.reduce((sum, e) => sum + Number(e.salary || 0), 0)
            }
        };
    } catch (error) {
        console.error('Error getting HR dashboard data:', error);
        throw error;
    }
};

// Helper function to group by department
const groupByDepartment = (employees) => {
    const grouped = {};
    employees.forEach(emp => {
        const dept = emp.department || 'Unknown';
        if (!grouped[dept]) {
            grouped[dept] = {
                count: 0,
                active: 0,
                totalSalary: 0
            };
        }
        grouped[dept].count++;
        if (emp.status === 'Active') grouped[dept].active++;
        grouped[dept].totalSalary += Number(emp.salary || 0);
    });
    return grouped;
};

// Get employee complete profile
export const getEmployeeCompleteProfile = async (employeeId) => {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Get basic employee data
        const employeesSnap = await getDocs(collection(db, 'employees'));
        const employee = employeesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .find(e => e.id === employeeId);

        if (!employee) {
            throw new Error('Employee not found');
        }

        // Get attendance stats
        const attendanceStats = await getAttendanceStats(employeeId, currentMonth, currentYear);

        // Get performance summary
        const performanceSummary = await getEmployeePerformanceSummary(employeeId);

        // Get leave balance
        const leaveBalance = await getLeaveBalance(employeeId);

        // Get skills
        const skillsSnap = await getDocs(collection(db, 'skills'));
        const skills = skillsSnap.docs
            .map(doc => doc.data())
            .filter(s => s.employeeId === employeeId);

        return {
            ...employee,
            attendance: attendanceStats,
            performance: performanceSummary,
            leaveBalance,
            skills
        };
    } catch (error) {
        console.error('Error getting employee complete profile:', error);
        throw error;
    }
};

// Calculate work hours for a period
export const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;

    try {
        const [inHours, inMinutes] = checkIn.split(':').map(Number);
        const [outHours, outMinutes] = checkOut.split(':').map(Number);

        const inTime = inHours * 60 + inMinutes;
        const outTime = outHours * 60 + outMinutes;

        const diffMinutes = outTime - inTime;
        const hours = (diffMinutes / 60).toFixed(2);

        return parseFloat(hours);
    } catch (error) {
        console.error('Error calculating work hours:', error);
        return 0;
    }
};

// Get department performance comparison
export const getDepartmentPerformanceComparison = async () => {
    try {
        const employeesSnap = await getDocs(collection(db, 'employees'));
        const employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const performanceSnap = await getDocs(collection(db, 'performance'));
        const performances = performanceSnap.docs.map(doc => doc.data());

        const departmentPerformance = {};

        employees.forEach(emp => {
            const dept = emp.department || 'Unknown';
            if (!departmentPerformance[dept]) {
                departmentPerformance[dept] = {
                    department: dept,
                    employeeCount: 0,
                    totalRating: 0,
                    averageRating: 0,
                    reviewCount: 0
                };
            }

            departmentPerformance[dept].employeeCount++;

            const empPerformances = performances.filter(p => p.employeeId === emp.id);
            empPerformances.forEach(perf => {
                departmentPerformance[dept].totalRating += perf.overallRating || 0;
                departmentPerformance[dept].reviewCount++;
            });
        });

        // Calculate averages
        Object.keys(departmentPerformance).forEach(dept => {
            const data = departmentPerformance[dept];
            data.averageRating = data.reviewCount > 0
                ? (data.totalRating / data.reviewCount).toFixed(2)
                : 0;
        });

        return Object.values(departmentPerformance);
    } catch (error) {
        console.error('Error getting department performance comparison:', error);
        throw error;
    }
};

// Get attendance report
export const getAttendanceReport = async (startDate, endDate, department = null) => {
    try {
        const employeesSnap = await getDocs(collection(db, 'employees'));
        let employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (department) {
            employees = employees.filter(e => e.department === department);
        }

        const attendanceSnap = await getDocs(collection(db, 'attendance'));
        const allAttendance = attendanceSnap.docs.map(doc => doc.data());

        const report = employees.map(emp => {
            const empAttendance = allAttendance.filter(a =>
                a.employeeId === emp.id &&
                a.date >= startDate &&
                a.date <= endDate
            );

            return {
                employeeId: emp.id,
                employeeName: emp.name,
                department: emp.department,
                totalDays: empAttendance.length,
                present: empAttendance.filter(a => a.status === 'Present').length,
                absent: empAttendance.filter(a => a.status === 'Absent').length,
                leave: empAttendance.filter(a => a.status === 'Leave').length,
                late: empAttendance.filter(a => {
                    if (!a.checkIn) return false;
                    const [hours] = a.checkIn.split(':').map(Number);
                    return hours >= 10;
                }).length,
                totalWorkHours: empAttendance.reduce((sum, a) => sum + (a.workHours || 0), 0)
            };
        });

        return report;
    } catch (error) {
        console.error('Error generating attendance report:', error);
        throw error;
    }
};
