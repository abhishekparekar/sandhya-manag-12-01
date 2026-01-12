/**
 * Finance Service
 * Handles sales, invoices, payments, and financial metrics
 */

import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Collection references
const COLLECTIONS = {
    SALES: 'sales',
    INVOICES: 'invoices',
    PAYMENTS: 'payments',
    EXPENSES: 'expenses'
};

/**
 * Create a new sale entry
 * @param {Object} saleData - Sale details
 * @returns {Promise<string>} Sale ID
 */
export const createSale = async (saleData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.SALES), {
            ...saleData,
            status: 'pending', // pending, invoiced, completed, cancelled
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating sale:', error);
        throw error;
    }
};

/**
 * Generate an invoice for a sale
 * @param {string} saleId - ID of the sale
 * @param {Object} invoiceData - Invoice details (dueDate, taxRate, etc.)
 * @returns {Promise<string>} Invoice ID
 */
export const generateInvoice = async (saleId, invoiceData) => {
    try {
        // Get sale details
        const saleRef = doc(db, COLLECTIONS.SALES, saleId);
        const saleSnap = await getDoc(saleRef);

        if (!saleSnap.exists()) {
            throw new Error('Sale not found');
        }

        const sale = saleSnap.data();

        // Calculate totals
        const subTotal = sale.amount || 0;
        const gstRate = invoiceData.gstRate || 18;
        const gstAmount = (subTotal * gstRate) / 100;
        const totalAmount = subTotal + gstAmount;

        // Create invoice
        const invoiceRef = await addDoc(collection(db, COLLECTIONS.INVOICES), {
            saleId,
            invoiceNumber: `INV-${Date.now()}`, // Simple ID generation
            clientName: sale.clientName,
            items: sale.items || [],
            subTotal,
            gstRate,
            gstAmount,
            totalAmount,
            paidAmount: 0,
            balanceAmount: totalAmount,
            status: 'unpaid', // unpaid, partial, paid, overdue
            dueDate: invoiceData.dueDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Update sale status
        await updateDoc(saleRef, {
            status: 'invoiced',
            invoiceId: invoiceRef.id,
            updatedAt: serverTimestamp()
        });

        return invoiceRef.id;
    } catch (error) {
        console.error('Error generating invoice:', error);
        throw error;
    }
};

/**
 * Record a payment
 * @param {string} invoiceId - ID of the invoice
 * @param {Object} paymentData - Payment details (amount, method, date)
 * @returns {Promise<string>} Payment ID
 */
export const recordPayment = async (invoiceId, paymentData) => {
    try {
        const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
            throw new Error('Invoice not found');
        }

        const invoice = invoiceSnap.data();
        const newPaidAmount = (invoice.paidAmount || 0) + Number(paymentData.amount);
        const newBalance = invoice.totalAmount - newPaidAmount;

        let newStatus = invoice.status;
        if (newBalance <= 0) {
            newStatus = 'paid';
        } else if (newPaidAmount > 0) {
            newStatus = 'partial';
        }

        // Create payment record
        const paymentRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
            invoiceId,
            amount: Number(paymentData.amount),
            date: paymentData.date,
            method: paymentData.method,
            reference: paymentData.reference || '',
            createdAt: serverTimestamp()
        });

        // Update invoice
        await updateDoc(invoiceRef, {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            status: newStatus,
            updatedAt: serverTimestamp()
        });

        return paymentRef.id;
    } catch (error) {
        console.error('Error recording payment:', error);
        throw error;
    }
};

/**
 * Get financial metrics for dashboard
 * @param {string} period - 'month', 'year', 'all'
 * @returns {Promise<Object>} Financial metrics
 */
export const getFinancialMetrics = async (period = 'month') => {
    try {
        // Fetch invoices and expenses
        // Note: For a real app, we'd use more specific queries based on date range
        // Here we fetch mostly everything and filter in memory for simplicity in this demo

        const invoicesSnap = await getDocs(query(collection(db, COLLECTIONS.INVOICES)));
        const expensesSnap = await getDocs(query(collection(db, COLLECTIONS.EXPENSES)));

        const invoices = invoicesSnap.docs.map(d => d.data());
        const expenses = expensesSnap.docs.map(d => d.data());

        let totalRevenue = 0;
        let totalExpenses = 0;
        let outstanding = 0;

        invoices.forEach(inv => {
            totalRevenue += (inv.paidAmount || 0);
            outstanding += (inv.balanceAmount || 0);
        });

        expenses.forEach(exp => {
            totalExpenses += Number(exp.amount || 0);
        });

        const netProfit = totalRevenue - totalExpenses;

        return {
            revenue: totalRevenue,
            expenses: totalExpenses,
            profit: netProfit,
            outstanding
        };
    } catch (error) {
        console.error('Error getting financial metrics:', error);
        return { revenue: 0, expenses: 0, profit: 0, outstanding: 0 };
    }
};

/**
 * Get recent invoices
 * @returns {Promise<Array>} List of invoices
 */
export const getInvoices = async () => {
    try {
        const q = query(
            collection(db, COLLECTIONS.INVOICES),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting invoices:', error);
        return [];
    }
};

export default {
    createSale,
    generateInvoice,
    recordPayment,
    getFinancialMetrics,
    getInvoices
};
