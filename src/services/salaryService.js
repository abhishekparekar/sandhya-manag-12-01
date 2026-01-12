import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Salary Service
 * Handles salary slip generation, calculations, and PDF export
 */

// Salary structure template
export const defaultSalaryStructure = {
    basicPay: 0,
    hra: 0, // House Rent Allowance
    da: 0, // Dearness Allowance
    conveyance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    pf: 0, // Provident Fund
    professionalTax: 0,
    incomeTax: 0,
    otherDeductions: 0,
    bonus: 0,
    overtime: 0
};

// Calculate salary components
export const calculateSalaryComponents = (basicPay) => {
    const hra = basicPay * 0.4; // 40% of basic
    const da = basicPay * 0.2; // 20% of basic
    const conveyance = 1600;
    const medicalAllowance = 1250;
    const specialAllowance = basicPay * 0.1; // 10% of basic

    const grossSalary = basicPay + hra + da + conveyance + medicalAllowance + specialAllowance;

    const pf = basicPay * 0.12; // 12% of basic
    const professionalTax = 200;
    const incomeTax = grossSalary > 50000 ? grossSalary * 0.1 : 0; // 10% if gross > 50k

    const totalDeductions = pf + professionalTax + incomeTax;
    const netSalary = grossSalary - totalDeductions;

    return {
        basicPay,
        hra,
        da,
        conveyance,
        medicalAllowance,
        specialAllowance,
        grossSalary,
        pf,
        professionalTax,
        incomeTax,
        totalDeductions,
        netSalary
    };
};

// Generate salary slip
export const generateSalarySlip = async (salaryData) => {
    try {
        const salarySlip = {
            ...salaryData,
            generatedAt: serverTimestamp(),
            status: 'Generated'
        };

        const docRef = await addDoc(collection(db, 'salarySlips'), salarySlip);
        return { id: docRef.id, ...salarySlip };
    } catch (error) {
        console.error('Error generating salary slip:', error);
        throw error;
    }
};

// Get salary slips
export const getSalarySlips = async (filters = {}) => {
    try {
        let q = collection(db, 'salarySlips');

        if (filters.employeeId) {
            q = query(q, where('employeeId', '==', filters.employeeId));
        }

        if (filters.month && filters.year) {
            q = query(q,
                where('month', '==', filters.month),
                where('year', '==', filters.year)
            );
        }

        q = query(q, orderBy('generatedAt', 'desc'));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching salary slips:', error);
        throw error;
    }
};

// Generate salary slip PDF
export const generateSalarySlipPDF = (salaryData, companyInfo = {}) => {
    const doc = new jsPDF();

    // Company header
    doc.setFontSize(20);
    doc.setTextColor(27, 94, 126); // #1B5E7E
    doc.text(companyInfo.name || 'Sandhya Management', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(companyInfo.address || 'Company Address', 105, 28, { align: 'center' });

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('SALARY SLIP', 105, 40, { align: 'center' });

    // Employee details
    doc.setFontSize(11);
    const startY = 55;

    doc.text(`Employee Name: ${salaryData.employeeName}`, 20, startY);
    doc.text(`Employee ID: ${salaryData.employeeId}`, 20, startY + 7);
    doc.text(`Department: ${salaryData.department || 'N/A'}`, 20, startY + 14);
    doc.text(`Designation: ${salaryData.designation || 'N/A'}`, 20, startY + 21);

    doc.text(`Month: ${salaryData.month}/${salaryData.year}`, 140, startY);
    doc.text(`Pay Date: ${salaryData.payDate || new Date().toLocaleDateString()}`, 140, startY + 7);
    doc.text(`Days Worked: ${salaryData.daysWorked || 'N/A'}`, 140, startY + 14);

    // Salary breakdown table
    const tableStartY = startY + 35;

    // Earnings
    const earningsData = [
        ['Basic Pay', `₹${salaryData.basicPay?.toLocaleString() || 0}`],
        ['HRA', `₹${salaryData.hra?.toLocaleString() || 0}`],
        ['DA', `₹${salaryData.da?.toLocaleString() || 0}`],
        ['Conveyance', `₹${salaryData.conveyance?.toLocaleString() || 0}`],
        ['Medical Allowance', `₹${salaryData.medicalAllowance?.toLocaleString() || 0}`],
        ['Special Allowance', `₹${salaryData.specialAllowance?.toLocaleString() || 0}`],
        ['Bonus', `₹${salaryData.bonus?.toLocaleString() || 0}`],
        ['Overtime', `₹${salaryData.overtime?.toLocaleString() || 0}`]
    ];

    // Deductions
    const deductionsData = [
        ['PF', `₹${salaryData.pf?.toLocaleString() || 0}`],
        ['Professional Tax', `₹${salaryData.professionalTax?.toLocaleString() || 0}`],
        ['Income Tax', `₹${salaryData.incomeTax?.toLocaleString() || 0}`],
        ['Other Deductions', `₹${salaryData.otherDeductions?.toLocaleString() || 0}`]
    ];

    // Create two-column table
    doc.autoTable({
        startY: tableStartY,
        head: [['EARNINGS', 'AMOUNT']],
        body: earningsData,
        theme: 'grid',
        headStyles: { fillColor: [27, 94, 126], textColor: 255 },
        margin: { left: 20, right: 110 },
        tableWidth: 85
    });

    doc.autoTable({
        startY: tableStartY,
        head: [['DEDUCTIONS', 'AMOUNT']],
        body: deductionsData,
        theme: 'grid',
        headStyles: { fillColor: [244, 121, 32], textColor: 255 },
        margin: { left: 110, right: 20 },
        tableWidth: 85
    });

    // Calculate totals
    const grossSalary = salaryData.grossSalary || 0;
    const totalDeductions = salaryData.totalDeductions || 0;
    const netSalary = salaryData.netSalary || 0;

    // Summary
    const summaryY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');

    doc.text(`Gross Salary: ₹${grossSalary.toLocaleString()}`, 20, summaryY);
    doc.text(`Total Deductions: ₹${totalDeductions.toLocaleString()}`, 20, summaryY + 8);

    // Net salary highlight
    doc.setFontSize(14);
    doc.setTextColor(27, 94, 126);
    doc.text(`Net Salary: ₹${netSalary.toLocaleString()}`, 20, summaryY + 20);

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont(undefined, 'normal');
    doc.text('This is a computer-generated salary slip and does not require a signature.', 105, 280, { align: 'center' });

    return doc;
};

// Download salary slip PDF
export const downloadSalarySlipPDF = (salaryData, companyInfo = {}) => {
    const doc = generateSalarySlipPDF(salaryData, companyInfo);
    const fileName = `SalarySlip_${salaryData.employeeName}_${salaryData.month}_${salaryData.year}.pdf`;
    doc.save(fileName);
};

// Generate bulk salary slips
export const generateBulkSalarySlips = async (employees, month, year) => {
    try {
        const slips = [];

        for (const employee of employees) {
            const components = calculateSalaryComponents(employee.salary);

            const salaryData = {
                employeeId: employee.id,
                employeeName: employee.name,
                department: employee.department,
                designation: employee.designation,
                month,
                year,
                ...components,
                payDate: new Date().toISOString().split('T')[0]
            };

            const slip = await generateSalarySlip(salaryData);
            slips.push(slip);
        }

        return slips;
    } catch (error) {
        console.error('Error generating bulk salary slips:', error);
        throw error;
    }
};

// Get payroll summary
export const getPayrollSummary = async (month, year) => {
    try {
        const slips = await getSalarySlips({ month, year });

        const summary = {
            totalEmployees: slips.length,
            totalGrossSalary: slips.reduce((sum, s) => sum + (s.grossSalary || 0), 0),
            totalDeductions: slips.reduce((sum, s) => sum + (s.totalDeductions || 0), 0),
            totalNetSalary: slips.reduce((sum, s) => sum + (s.netSalary || 0), 0),
            departmentWise: {}
        };

        // Group by department
        slips.forEach(slip => {
            const dept = slip.department || 'Unknown';
            if (!summary.departmentWise[dept]) {
                summary.departmentWise[dept] = {
                    count: 0,
                    totalSalary: 0
                };
            }
            summary.departmentWise[dept].count++;
            summary.departmentWise[dept].totalSalary += slip.netSalary || 0;
        });

        return summary;
    } catch (error) {
        console.error('Error calculating payroll summary:', error);
        throw error;
    }
};
