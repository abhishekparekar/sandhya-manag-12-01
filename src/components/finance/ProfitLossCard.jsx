import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiAlertCircle } from 'react-icons/fi';

const ProfitLossCard = ({ metrics }) => {
    const { revenue, expenses, profit, outstanding } = metrics;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border-l-4 border-green-500 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm font-medium">Total Revenue</span>
                    <div className="p-2 bg-green-50 rounded-full">
                        <FiDollarSign className="text-green-600 w-4 h-4" />
                    </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">₹{revenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                    <FiTrendingUp className="mr-1" /> Income
                </p>
            </div>

            <div className="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm font-medium">Total Expenses</span>
                    <div className="p-2 bg-red-50 rounded-full">
                        <FiTrendingDown className="text-red-600 w-4 h-4" />
                    </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">₹{expenses.toLocaleString()}</p>
                <p className="text-xs text-red-600 mt-1 flex items-center">
                    <FiTrendingDown className="mr-1" /> Outgoing
                </p>
            </div>

            <div className="bg-white p-4 rounded-xl border-l-4 border-blue-500 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm font-medium">Net Profit</span>
                    <div className="p-2 bg-blue-50 rounded-full">
                        <FiTrendingUp className="text-blue-600 w-4 h-4" />
                    </div>
                </div>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-blue-800' : 'text-red-600'}`}>
                    ₹{profit.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                    Revenue - Expenses
                </p>
            </div>

            <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm font-medium">Outstanding</span>
                    <div className="p-2 bg-orange-50 rounded-full">
                        <FiAlertCircle className="text-orange-600 w-4 h-4" />
                    </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">₹{outstanding.toLocaleString()}</p>
                <p className="text-xs text-orange-600 mt-1">
                    Pending Payments
                </p>
            </div>
        </div>
    );
};

export default ProfitLossCard;
