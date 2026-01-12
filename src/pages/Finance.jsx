import React, { useState, useEffect } from 'react';
import {
    FiPieChart, FiList, FiDollarSign, FiTrendingUp,
    FiTrendingDown, FiCreditCard, FiCalendar, FiDownload,
    FiArrowUp, FiArrowDown, FiActivity
} from 'react-icons/fi';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../components/Card';

const Finance = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [financialData, setFinancialData] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        outstanding: 0,
        salesCount: 0,
        expensesCount: 0
    });
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

    useEffect(() => {
        fetchFinancialData();
    }, []);

    const fetchFinancialData = async () => {
        setLoading(true);
        try {
            const [salesSnap, expensesSnap] = await Promise.all([
                getDocs(collection(db, 'sales')),
                getDocs(collection(db, 'expenses'))
            ]);

            const sales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
            const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
            const outstanding = sales.filter(s => s.paymentStatus === 'Pending').reduce((sum, s) => sum + Number(s.amount || 0), 0);

            setFinancialData({
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                outstanding,
                salesCount: sales.length,
                expensesCount: expenses.length
            });

            // Monthly trend data
            const monthlyMap = {};
            sales.forEach(sale => {
                const month = sale.date ? sale.date.substring(0, 7) : 'Unknown';
                if (!monthlyMap[month]) monthlyMap[month] = { month, revenue: 0, expenses: 0 };
                monthlyMap[month].revenue += Number(sale.amount || 0);
            });
            expenses.forEach(exp => {
                const month = exp.date ? exp.date.substring(0, 7) : 'Unknown';
                if (!monthlyMap[month]) monthlyMap[month] = { month, revenue: 0, expenses: 0 };
                monthlyMap[month].expenses += Number(exp.amount || 0);
            });
            const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
            setMonthlyData(monthly);

            // Category breakdown
            const categoryMap = {};
            expenses.forEach(exp => {
                const cat = exp.category || 'Others';
                categoryMap[cat] = (categoryMap[cat] || 0) + Number(exp.amount || 0);
            });
            const categories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
            setCategoryData(categories);

            // Recent transactions
            const combined = [
                ...sales.map(s => ({ ...s, type: 'sale', date: s.date })),
                ...expenses.map(e => ({ ...e, type: 'expense', date: e.date }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
            setRecentTransactions(combined);
        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const profitMargin = financialData.totalRevenue > 0
        ? ((financialData.netProfit / financialData.totalRevenue) * 100).toFixed(1)
        : 0;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
            {/* Header - Attractive Design */}
          
            
                
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-[#F47920] rounded-lg hover:bg-orange-50 text-xs sm:text-sm font-medium shadow-md">
                            <FiDownload className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                
        

            {/* Tab Navigation - Modern Design */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {[
                    { key: 'overview', label: 'Overview', icon: FiPieChart },
                    { key: 'analytics', label: 'Analytics', icon: FiActivity },
                    { key: 'transactions', label: 'Transactions', icon: FiList }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                ? 'bg-gradient-to-r from-[#F47920] to-[#E06810] text-white shadow-lg scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                    {/* Key Metrics - Attractive Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 sm:p-5 border-2 border-green-200 shadow-md hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                    <FiTrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-green-600 text-xs sm:text-sm font-medium">
                                    <FiArrowUp className="w-3 h-3 sm:w-4 sm:h-4" /> 12%
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Revenue</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-700 mt-1">₹{financialData.totalRevenue.toLocaleString()}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{financialData.salesCount} sales</p>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 sm:p-5 border-2 border-red-200 shadow-md hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-lg flex items-center justify-center">
                                    <FiTrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-red-600 text-xs sm:text-sm font-medium">
                                    <FiArrowDown className="w-3 h-3 sm:w-4 sm:h-4" /> 8%
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Expenses</p>
                            <p className="text-xl sm:text-2xl font-bold text-red-700 mt-1">₹{financialData.totalExpenses.toLocaleString()}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{financialData.expensesCount} entries</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 sm:p-5 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                    <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-purple-600">{profitMargin}%</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Net Profit</p>
                            <p className={`text-xl sm:text-2xl font-bold mt-1 ${financialData.netProfit >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                                ₹{financialData.netProfit.toLocaleString()}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Profit margin</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 sm:p-5 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                    <FiCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Outstanding</p>
                            <p className="text-xl sm:text-2xl font-bold text-orange-700 mt-1">₹{financialData.outstanding.toLocaleString()}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Pending payments</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Monthly Trend - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiActivity className="w-5 h-5 text-[#F47920]" />
                                Monthly Revenue vs Expenses
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '2px solid #F47920',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} name="Revenue" />
                                    <Bar dataKey="expenses" fill="#EF4444" radius={[8, 8, 0, 0]} name="Expenses" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Expense Categories - Pie Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPieChart className="w-5 h-5 text-[#F47920]" />
                                Expense Breakdown
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={90}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '2px solid #F47920',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Recent Transactions</h3>
                        <div className="space-y-2">
                            {recentTransactions.slice(0, 5).map((transaction, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:from-orange-50 hover:to-white transition-all border border-gray-100">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transaction.type === 'sale' ? 'bg-green-100' : 'bg-red-100'
                                            }`}>
                                            {transaction.type === 'sale' ? (
                                                <FiTrendingUp className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <FiTrendingDown className="w-5 h-5 text-red-600" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-gray-900 text-sm truncate">
                                                {transaction.type === 'sale' ? transaction.client : transaction.category}
                                            </p>
                                            <p className="text-xs text-gray-500">{transaction.date}</p>
                                        </div>
                                    </div>
                                    <p className={`font-bold text-sm ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {transaction.type === 'sale' ? '+' : '-'}₹{Number(transaction.amount).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="space-y-4 sm:space-y-6">
                    {/* Profit Trend Line Chart */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiTrendingUp className="w-5 h-5 text-[#F47920]" />
                            Profit Trend (Last 6 Months)
                        </h3>
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #F47920',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    dot={{ r: 5, fill: '#10B981' }}
                                    activeDot={{ r: 7 }}
                                    name="Revenue"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke="#EF4444"
                                    strokeWidth={3}
                                    dot={{ r: 5, fill: '#EF4444' }}
                                    activeDot={{ r: 7 }}
                                    name="Expenses"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Financial Ratios */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-5 border-2 border-blue-200 shadow-lg">
                            <h4 className="text-sm font-bold text-gray-700 mb-3">Average Sale Value</h4>
                            <p className="text-3xl font-bold text-blue-700">
                                ₹{financialData.salesCount > 0 ? Math.round(financialData.totalRevenue / financialData.salesCount).toLocaleString() : 0}
                            </p>
                            <p className="text-xs text-gray-600 mt-2">Per transaction</p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-5 border-2 border-indigo-200 shadow-lg">
                            <h4 className="text-sm font-bold text-gray-700 mb-3">Average Expense</h4>
                            <p className="text-3xl font-bold text-indigo-700">
                                ₹{financialData.expensesCount > 0 ? Math.round(financialData.totalExpenses / financialData.expensesCount).toLocaleString() : 0}
                            </p>
                            <p className="text-xs text-gray-600 mt-2">Per entry</p>
                        </div>
                        <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-5 border-2 border-pink-200 shadow-lg">
                            <h4 className="text-sm font-bold text-gray-700 mb-3">Profit Margin</h4>
                            <p className="text-3xl font-bold text-pink-700">{profitMargin}%</p>
                            <p className="text-xs text-gray-600 mt-2">Of total revenue</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">All Transactions</h3>
                    <div className="space-y-2">
                        {recentTransactions.map((transaction, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-orange-50 transition-all border border-gray-200">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${transaction.type === 'sale' ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                        {transaction.type === 'sale' ? (
                                            <FiTrendingUp className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <FiTrendingDown className="w-6 h-6 text-red-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {transaction.type === 'sale' ? transaction.client : transaction.category}
                                        </p>
                                        <p className="text-sm text-gray-500">{transaction.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-bold ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {transaction.type === 'sale' ? '+' : '-'}₹{Number(transaction.amount).toLocaleString()}
                                    </p>
                                    {transaction.paymentStatus && (
                                        <span className={`text-xs px-2 py-1 rounded-full ${transaction.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {transaction.paymentStatus}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
