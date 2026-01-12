import React, { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { recordPayment } from '../../services/financeService';

const PaymentModal = ({ invoice, onClose, onComplete }) => {
    const [amount, setAmount] = useState(invoice.balanceAmount);
    const [method, setMethod] = useState('Bank Transfer');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await recordPayment(invoice.id, {
                amount,
                method,
                date,
                reference
            });
            if (onComplete) onComplete();
            onClose();
        } catch (error) {
            alert('Error recording payment: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Record Payment</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                        <p>Invoice: <strong>{invoice.invoiceNumber}</strong></p>
                        <p>Total Due: <strong>₹{invoice.balanceAmount.toLocaleString()}</strong></p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full pl-8 p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                max={invoice.balanceAmount}
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                        >
                            <option>Bank Transfer</option>
                            <option>UPI</option>
                            <option>Cash</option>
                            <option>Cheque</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Transaction ID</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            placeholder="Optional"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <FiCheck /> Confirm Payment
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
