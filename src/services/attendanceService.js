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
import QRCode from 'qrcode';

/**
 * Attendance Service
 * Handles all attendance-related operations including QR code generation and validation
 */

// Generate QR code for employee
export const generateEmployeeQR = async (employeeId, employeeName) => {
    try {
        const qrData = {
            employeeId,
            employeeName,
            timestamp: Date.now(),
            type: 'attendance'
        };

        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 300,
            margin: 2,
            color: {
                dark: '#1B5E7E',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
};

// Mark attendance (manual or QR-based)
export const markAttendance = async (attendanceData) => {
    try {
        const attendance = {
            ...attendanceData,
            createdAt: serverTimestamp(),
            workHours: calculateWorkHours(attendanceData.checkIn, attendanceData.checkOut)
        };

        const docRef = await addDoc(collection(db, 'attendance'), attendance);
        return { id: docRef.id, ...attendance };
    } catch (error) {
        console.error('Error marking attendance:', error);
        throw error;
    }
};

// Get attendance records
export const getAttendanceRecords = async (filters = {}) => {
    try {
        let q = collection(db, 'attendance');

        if (filters.employeeId) {
            q = query(q, where('employeeId', '==', filters.employeeId));
        }

        if (filters.startDate && filters.endDate) {
            q = query(q,
                where('date', '>=', filters.startDate),
                where('date', '<=', filters.endDate)
            );
        }

        q = query(q, orderBy('date', 'desc'));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching attendance:', error);
        throw error;
    }
};

// Update attendance record
export const updateAttendance = async (attendanceId, updates) => {
    try {
        const attendanceRef = doc(db, 'attendance', attendanceId);

        if (updates.checkIn || updates.checkOut) {
            updates.workHours = calculateWorkHours(
                updates.checkIn || null,
                updates.checkOut || null
            );
        }

        await updateDoc(attendanceRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { id: attendanceId, ...updates };
    } catch (error) {
        console.error('Error updating attendance:', error);
        throw error;
    }
};

// Delete attendance record
export const deleteAttendance = async (attendanceId) => {
    try {
        await deleteDoc(doc(db, 'attendance', attendanceId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting attendance:', error);
        throw error;
    }
};

// Calculate work hours
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

// Get attendance statistics
export const getAttendanceStats = async (employeeId, month, year) => {
    try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        const records = await getAttendanceRecords({
            employeeId,
            startDate,
            endDate
        });

        const stats = {
            totalDays: records.length,
            present: records.filter(r => r.status === 'Present').length,
            absent: records.filter(r => r.status === 'Absent').length,
            leave: records.filter(r => r.status === 'Leave').length,
            late: records.filter(r => {
                if (!r.checkIn) return false;
                const [hours] = r.checkIn.split(':').map(Number);
                return hours >= 10; // Late if check-in after 10 AM
            }).length,
            totalWorkHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0)
        };

        return stats;
    } catch (error) {
        console.error('Error calculating attendance stats:', error);
        throw error;
    }
};

// Get monthly attendance report
export const getMonthlyAttendanceReport = async (month, year) => {
    try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        const records = await getAttendanceRecords({ startDate, endDate });

        // Group by employee
        const employeeAttendance = {};

        records.forEach(record => {
            if (!employeeAttendance[record.employeeId]) {
                employeeAttendance[record.employeeId] = {
                    employeeId: record.employeeId,
                    records: []
                };
            }
            employeeAttendance[record.employeeId].records.push(record);
        });

        return Object.values(employeeAttendance);
    } catch (error) {
        console.error('Error generating monthly report:', error);
        throw error;
    }
};

// Validate QR code data
export const validateQRCode = (qrData) => {
    try {
        const data = JSON.parse(qrData);

        if (!data.employeeId || !data.type || data.type !== 'attendance') {
            return { valid: false, error: 'Invalid QR code format' };
        }

        // Check if QR code is not too old (valid for 24 hours)
        const qrAge = Date.now() - data.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (qrAge > maxAge) {
            return { valid: false, error: 'QR code has expired' };
        }

        return { valid: true, data };
    } catch (error) {
        return { valid: false, error: 'Invalid QR code data' };
    }
};

// Mark attendance via QR code
export const markAttendanceViaQR = async (qrData, location = 'Office') => {
    try {
        const validation = validateQRCode(qrData);

        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const { employeeId, employeeName } = validation.data;
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

        // Check if already checked in today
        const todayRecords = await getAttendanceRecords({
            employeeId,
            startDate: today,
            endDate: today
        });

        if (todayRecords.length > 0) {
            const record = todayRecords[0];

            // If no check-out, mark check-out
            if (!record.checkOut) {
                return await updateAttendance(record.id, {
                    checkOut: currentTime,
                    location
                });
            } else {
                throw new Error('Attendance already marked for today');
            }
        } else {
            // Mark check-in
            return await markAttendance({
                employeeId,
                employeeName,
                date: today,
                status: 'Present',
                checkIn: currentTime,
                checkOut: '',
                method: 'QR',
                location
            });
        }
    } catch (error) {
        console.error('Error marking attendance via QR:', error);
        throw error;
    }
};
