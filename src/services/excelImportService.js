/**
 * Excel Import Service
 * Handles bulk lead import from Excel files (XLSX)
 */

import * as XLSX from 'xlsx';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Parse Excel file and extract lead data
 * @param {File} file - Excel file
 * @returns {Promise<Array>} Array of lead objects
 */
export const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Transform to lead format
                const leads = jsonData.map((row, index) => ({
                    rowNumber: index + 2, // Excel row (1-indexed + header)
                    name: row.Name || row.name || '',
                    phone: row.Phone || row.phone || '',
                    email: row.Email || row.email || '',
                    company: row.Company || row.company || '',
                    source: row.Source || row.source || 'bulk-upload',
                    priority: row.Priority || row.priority || 'medium',
                    notes: row.Notes || row.notes || ''
                }));

                resolve(leads);
            } catch (error) {
                reject(new Error('Failed to parse Excel file: ' + error.message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * Validate lead data
 * @param {Array} leads - Array of lead objects
 * @returns {Object} { valid: [], errors: [] }
 */
export const validateLeads = (leads) => {
    const valid = [];
    const errors = [];

    leads.forEach(lead => {
        const leadErrors = [];

        // Check required fields
        if (!lead.name || lead.name.trim() === '') {
            leadErrors.push('Name is required');
        }

        if (!lead.phone || lead.phone.trim() === '') {
            leadErrors.push('Phone is required');
        } else {
            // Basic phone validation (10 digits)
            const phoneDigits = lead.phone.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                leadErrors.push('Phone must be at least 10 digits');
            }
        }

        // Email validation (if provided)
        if (lead.email && lead.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(lead.email)) {
                leadErrors.push('Invalid email format');
            }
        }

        // Priority validation
        const validPriorities = ['high', 'medium', 'low'];
        if (lead.priority && !validPriorities.includes(lead.priority.toLowerCase())) {
            leadErrors.push('Priority must be: high, medium, or low');
        }

        if (leadErrors.length > 0) {
            errors.push({
                ...lead,
                errors: leadErrors
            });
        } else {
            valid.push(lead);
        }
    });

    return { valid, errors };
};

/**
 * Detect duplicate leads by phone or email
 * @param {Array} leads - Array of lead objects
 * @returns {Promise<Object>} { duplicates: [], unique: [] }
 */
export const detectDuplicates = async (leads) => {
    try {
        // Get existing leads from Firestore
        const leadsSnapshot = await getDocs(collection(db, 'leads'));
        const existingLeads = leadsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const duplicates = [];
        const unique = [];

        leads.forEach(lead => {
            // Check if phone exists
            const phoneMatch = existingLeads.find(existing =>
                existing.phone && lead.phone &&
                existing.phone.replace(/\D/g, '') === lead.phone.replace(/\D/g, '')
            );

            // Check if email exists
            const emailMatch = lead.email && existingLeads.find(existing =>
                existing.email &&
                existing.email.toLowerCase() === lead.email.toLowerCase()
            );

            if (phoneMatch || emailMatch) {
                duplicates.push({
                    ...lead,
                    duplicateOf: phoneMatch?.id || emailMatch?.id,
                    duplicateReason: phoneMatch ? 'Phone exists' : 'Email exists'
                });
            } else {
                unique.push(lead);
            }
        });

        return { duplicates, unique };
    } catch (error) {
        console.error('Error detecting duplicates:', error);
        throw error;
    }
};

/**
 * Import leads to Firestore with optional auto-assignment
 * @param {Array} leads - Array of validated, unique leads
 * @param {boolean} autoAssign - Whether to auto-assign to telecallers
 * @param {string} createdBy - User who imported
 * @returns {Promise<Object>} { success: number, failed: number, errors: [] }
 */
export const importLeads = async (leads, autoAssign = true, createdBy = 'admin') => {
    let success = 0;
    let failed = 0;
    const errors = [];

    try {
        // Get telecallers for auto-assignment
        let telecallers = [];
        if (autoAssign) {
            telecallers = await getActiveTelecallers();
        }

        let assignmentIndex = 0;

        for (const lead of leads) {
            try {
                const leadData = {
                    name: lead.name.trim(),
                    phone: lead.phone.trim(),
                    email: lead.email?.trim() || '',
                    company: lead.company?.trim() || '',
                    source: lead.source || 'bulk-upload',
                    priority: (lead.priority || 'medium').toLowerCase(),
                    notes: lead.notes || '',

                    // Lifecycle
                    status: 'new',
                    stage: 'prospect',
                    lifecycle: [{
                        status: 'new',
                        timestamp: serverTimestamp(),
                        by: createdBy
                    }],

                    // Assignment
                    telecaller: autoAssign && telecallers.length > 0
                        ? telecallers[assignmentIndex % telecallers.length].email
                        : null,
                    assignedAt: autoAssign && telecallers.length > 0 ? serverTimestamp() : null,
                    assignedBy: autoAssign ? 'auto' : null,

                    // Call tracking
                    callCount: 0,
                    lastCallDate: null,
                    nextCallDate: null,
                    callHistory: [],

                    // AI predictions
                    aiScore: 50, // Default score
                    predictedResponse: 'medium',

                    // Metadata
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    createdBy: 'bulk-upload'
                };

                await addDoc(collection(db, 'leads'), leadData);
                success++;

                if (autoAssign && telecallers.length > 0) {
                    assignmentIndex++;
                }
            } catch (error) {
                failed++;
                errors.push({
                    lead: lead.name,
                    error: error.message
                });
            }
        }

        return { success, failed, errors };
    } catch (error) {
        console.error('Error importing leads:', error);
        throw error;
    }
};

/**
 * Get active telecallers
 * @returns {Promise<Array>} Array of telecaller users
 */
const getActiveTelecallers = async () => {
    try {
        const usersSnapshot = await getDocs(
            query(
                collection(db, 'users'),
                where('role', 'in', ['employee', 'manager']),
                where('status', '==', 'active')
            )
        );

        return usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting telecallers:', error);
        return [];
    }
};

/**
 * Download Excel template
 * @returns {void}
 */
export const downloadTemplate = () => {
    // Create sample data
    const template = [
        {
            Name: 'John Doe',
            Phone: '+1234567890',
            Email: 'john@company.com',
            Company: 'ABC Corp',
            Source: 'website',
            Priority: 'high',
            Notes: 'Interested in enterprise plan'
        }
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(template);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');

    // Download
    XLSX.writeFile(wb, 'lead_import_template.xlsx');
};

export default {
    parseExcelFile,
    validateLeads,
    detectDuplicates,
    importLeads,
    downloadTemplate
};
