import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { createSale, generateInvoice } from '../../services/financeService';

const SalesEntryForm = ({ onComplete }) => {
    const [clientName, setClientName] = useState('');
    const [projectType, setProjectType] = useState('Web Development');
    const [items, setItems] = useState([{ description: '', quantity: 1, rate: 0 }]);
    const [loading, setLoading] = useState(false);
    const [generateInvoiceNow, setGenerateInvoiceNow] = useState(true);
    const [dueDate, setDueDate] = useState('');

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, rate: 0 }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const totalAmount = calculateTotal();
            const saleData = {
                clientName,
                projectType,
                items,
                amount: totalAmount,
                date: new Date().toISOString()
            };

            const saleId = await createSale(saleData);

            if (generateInvoiceNow) {
                await generateInvoice(saleId, {
                    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
                    gstRate: 18
                });
            }

            if (onComplete) onComplete();

            // Reset form
            setClientName('');
            setItems([{ description: '', quantity: 1, rate: 0 }]);
        } catch (error) {
            alert('Error creating sale: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                        placeholder="Enter client name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F47920] outline-none"
                    >
                        <option>Web Development</option>
                        <option>App Development</option>
                        <option>Digital Marketing</option>
                        <option>Consulting</option>
                        <option>Other</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Line Items</label>
                {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <input
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="flex-grow p-2 border rounded-lg"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            className="w-20 p-2 border rounded-lg"
                            min="1"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                            className="w-32 p-2 border rounded-lg"
                            min="0"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            disabled={items.length === 1}
                        >
                            <FiTrash2 />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-2 text-[#F47920] hover:text-[#d66010] text-sm font-medium"
                >
                    <FiPlus /> Add Item
                </button>
            </div>

            <div className="flex justify-end border-t pt-4">
                <div className="text-right">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-2xl font-bold text-gray-800">₹{calculateTotal().toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="generateInvoice"
                        checked={generateInvoiceNow}
                        onChange={(e) => setGenerateInvoiceNow(e.target.checked)}
                        className="w-4 h-4 text-[#F47920]"
                    />
                    <label htmlFor="generateInvoice" className="text-sm font-medium text-gray-700">
                        Generate Invoice Immediately
                    </label>
                </div>

                {generateInvoiceNow && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="p-2 border rounded-lg"
                            required={generateInvoiceNow}
                        />
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#F47920] text-white rounded-lg font-medium hover:bg-[#d66010] transition-colors flex items-center justify-center gap-2"
            >
                {loading ? 'Processing...' : (
                    <>
                        <FiSave /> Save Sale {generateInvoiceNow ? '& Generate Invoice' : ''}
                    </>
                )}
            </button>
        </form>
    );
};

export default SalesEntryForm;
