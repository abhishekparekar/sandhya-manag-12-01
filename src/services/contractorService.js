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
 * Contractor Service
 * Handles contractor and freelancer management
 */

// Contractor types
export const CONTRACTOR_TYPES = {
    CONTRACTOR: 'Contractor',
    FREELANCER: 'Freelancer',
    CONSULTANT: 'Consultant',
    INTERN_CONTRACTOR: 'Intern (Contract)'
};

// Contract status
export const CONTRACT_STATUS = {
    ACTIVE: 'Active',
    EXPIRED: 'Expired',
    TERMINATED: 'Terminated',
    PENDING: 'Pending Renewal'
};

// Payment status
export const PAYMENT_STATUS = {
    PENDING: 'Pending',
    PARTIAL: 'Partial',
    PAID: 'Paid',
    OVERDUE: 'Overdue'
};

// Create contractor
export const createContractor = async (contractorData) => {
    try {
        const contractor = {
            ...contractorData,
            type: contractorData.type || CONTRACTOR_TYPES.CONTRACTOR,
            status: CONTRACT_STATUS.ACTIVE,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'contractors'), contractor);
        return { id: docRef.id, ...contractor };
    } catch (error) {
        console.error('Error creating contractor:', error);
        throw error;
    }
};

// Get contractors
export const getContractors = async (filters = {}) => {
    try {
        let q = collection(db, 'contractors');

        if (filters.type) {
            q = query(q, where('type', '==', filters.type));
        }

        if (filters.status) {
            q = query(q, where('status', '==', filters.status));
        }

        if (filters.projectId) {
            q = query(q, where('projectId', '==', filters.projectId));
        }

        q = query(q, orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching contractors:', error);
        throw error;
    }
};

// Update contractor
export const updateContractor = async (contractorId, updates) => {
    try {
        const contractorRef = doc(db, 'contractors', contractorId);
        await updateDoc(contractorRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { id: contractorId, ...updates };
    } catch (error) {
        console.error('Error updating contractor:', error);
        throw error;
    }
};

// Delete contractor
export const deleteContractor = async (contractorId) => {
    try {
        await deleteDoc(doc(db, 'contractors', contractorId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting contractor:', error);
        throw error;
    }
};

// Add payment milestone
export const addPaymentMilestone = async (contractorId, milestoneData) => {
    try {
        const milestone = {
            contractorId,
            ...milestoneData,
            status: PAYMENT_STATUS.PENDING,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'contractorPayments'), milestone);
        return { id: docRef.id, ...milestone };
    } catch (error) {
        console.error('Error adding payment milestone:', error);
        throw error;
    }
};

// Update payment status
export const updatePaymentStatus = async (paymentId, status, paidAmount = 0) => {
    try {
        const paymentRef = doc(db, 'contractorPayments', paymentId);
        await updateDoc(paymentRef, {
            status,
            paidAmount,
            paidAt: status === PAYMENT_STATUS.PAID ? serverTimestamp() : null,
            updatedAt: serverTimestamp()
        });

        return { id: paymentId, status, paidAmount };
    } catch (error) {
        console.error('Error updating payment status:', error);
        throw error;
    }
};

// Get contractor payments
export const getContractorPayments = async (contractorId) => {
    try {
        const q = query(
            collection(db, 'contractorPayments'),
            where('contractorId', '==', contractorId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching contractor payments:', error);
        throw error;
    }
};

// Check contract expiry
export const checkContractExpiry = (endDate, warningDays = 30) => {
    const today = new Date();
    const contractEnd = new Date(endDate);
    const daysRemaining = Math.ceil((contractEnd - today) / (1000 * 60 * 60 * 24));

    return {
        isExpired: daysRemaining < 0,
        isExpiringSoon: daysRemaining > 0 && daysRemaining <= warningDays,
        daysRemaining: Math.abs(daysRemaining),
        status: daysRemaining < 0 ? CONTRACT_STATUS.EXPIRED :
            daysRemaining <= warningDays ? CONTRACT_STATUS.PENDING :
                CONTRACT_STATUS.ACTIVE
    };
};

// Get expiring contracts
export const getExpiringContracts = async (warningDays = 30) => {
    try {
        const contractors = await getContractors({ status: CONTRACT_STATUS.ACTIVE });

        const expiringContracts = contractors.filter(contractor => {
            if (!contractor.contractEndDate) return false;
            const expiry = checkContractExpiry(contractor.contractEndDate, warningDays);
            return expiry.isExpiringSoon || expiry.isExpired;
        });

        return expiringContracts.map(contractor => ({
            ...contractor,
            expiryInfo: checkContractExpiry(contractor.contractEndDate, warningDays)
        }));
    } catch (error) {
        console.error('Error fetching expiring contracts:', error);
        throw error;
    }
};

// Get contractor statistics
export const getContractorStatistics = async () => {
    try {
        const contractors = await getContractors();

        const stats = {
            total: contractors.length,
            active: contractors.filter(c => c.status === CONTRACT_STATUS.ACTIVE).length,
            expired: contractors.filter(c => c.status === CONTRACT_STATUS.EXPIRED).length,
            byType: {},
            totalPayments: 0,
            pendingPayments: 0
        };

        // Group by type
        Object.values(CONTRACTOR_TYPES).forEach(type => {
            stats.byType[type] = contractors.filter(c => c.type === type).length;
        });

        // Calculate payment stats
        const allPayments = await getDocs(collection(db, 'contractorPayments'));
        const payments = allPayments.docs.map(doc => doc.data());

        stats.totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        stats.pendingPayments = payments
            .filter(p => p.status === PAYMENT_STATUS.PENDING)
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        return stats;
    } catch (error) {
        console.error('Error calculating contractor statistics:', error);
        throw error;
    }
};

// Renew contract
export const renewContract = async (contractorId, newEndDate, newTerms = {}) => {
    try {
        const updates = {
            contractEndDate: newEndDate,
            status: CONTRACT_STATUS.ACTIVE,
            ...newTerms,
            renewedAt: serverTimestamp()
        };

        return await updateContractor(contractorId, updates);
    } catch (error) {
        console.error('Error renewing contract:', error);
        throw error;
    }
};
