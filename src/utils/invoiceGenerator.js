/**
 * Invoice Generator Utility
 * Generates PDF invoices using jsPDF
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download invoice PDF
 * @param {Object} invoice - Invoice data
 * @param {Object} companyDetails - Company information
 */
export const downloadInvoicePDF = (invoice, companyDetails = {}) => {
    const doc = new jsPDF();

    // Company Logo/Header
    doc.setFontSize(20);
    doc.setTextColor(244, 121, 32); // #F47920
    doc.text(companyDetails.name || 'Sandhya Management', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(companyDetails.address || '123 Business Street, Tech City', 14, 30);
    doc.text(`Phone: ${companyDetails.phone || '+91 98765 43210'}`, 14, 35);
    doc.text(`Email: ${companyDetails.email || 'contact@sandhyamanagement.com'}`, 14, 40);

    // Invoice Details
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('INVOICE', 140, 22);

    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 140, 30);
    doc.text(`Date: ${new Date(invoice.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}`, 140, 35);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 140, 40);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 45);

    // Bill To
    doc.text('Bill To:', 14, 55);
    doc.setFontSize(12);
    doc.text(invoice.clientName || 'Client Name', 14, 62);

    // Items Table
    const tableColumn = ["Description", "Quantity", "Rate", "Amount"];
    const tableRows = [];

    if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach(item => {
            const itemData = [
                item.description || 'Service',
                item.quantity || 1,
                `Rs. ${item.rate || 0}`,
                `Rs. ${(item.quantity || 1) * (item.rate || 0)}`
            ];
            tableRows.push(itemData);
        });
    } else {
        // Fallback if no items array
        tableRows.push(['Consulting Services', '1', `Rs. ${invoice.subTotal}`, `Rs. ${invoice.subTotal}`]);
    }

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'grid',
        headStyles: { fillColor: [244, 121, 32] },
        styles: { fontSize: 10 }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.text(`Sub Total:`, 140, finalY);
    doc.text(`Rs. ${invoice.subTotal.toFixed(2)}`, 170, finalY, { align: 'right' });

    doc.text(`GST (${invoice.gstRate}%):`, 140, finalY + 7);
    doc.text(`Rs. ${invoice.gstAmount.toFixed(2)}`, 170, finalY + 7, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total:`, 140, finalY + 15);
    doc.text(`Rs. ${invoice.totalAmount.toFixed(2)}`, 170, finalY + 15, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    // Save
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
};

export default {
    downloadInvoicePDF
};
