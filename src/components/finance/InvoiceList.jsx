import React from 'react';
import { FiDownload, FiCreditCard, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import { downloadInvoicePDF } from '../../utils/invoiceGenerator';

const InvoiceList = ({ invoices, onRecordPayment }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'partial': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid': return <FiCheckCircle />;
            case 'overdue': return <FiAlertCircle />;
            default: return <FiClock />;
        }
    };

    if (!invoices || invoices.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                No invoices found. Create a sale to generate one.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-200 text-gray-600 text-sm">
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Balance</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{invoice.invoiceNumber}</td>
                            <td className="py-3 px-4">{invoice.clientName}</td>
                            <td className="py-3 px-4">
                                {new Date(invoice.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-medium">₹{invoice.totalAmount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-600">₹{invoice.balanceAmount.toLocaleString()}</td>
                            <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                                    {getStatusIcon(invoice.status)}
                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                                <button
                                    onClick={() => downloadInvoicePDF(invoice)}
                                    className="p-2 text-gray-600 hover:text-[#F47920] hover:bg-orange-50 rounded transition-colors"
                                    title="Download PDF"
                                >
                                    <FiDownload />
                                </button>
                                {invoice.status !== 'paid' && (
                                    <button
                                        onClick={() => onRecordPayment(invoice)}
                                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                        title="Record Payment"
                                    >
                                        <FiCreditCard />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InvoiceList;
