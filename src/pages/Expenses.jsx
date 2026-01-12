import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiCalendar,
    FiArrowUp, FiArrowDown, FiPieChart, FiBarChart2, FiActivity,
    FiCreditCard, FiTrendingDown, FiAlertCircle
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';
import Table from '../components/Table';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState({ categories: [], monthly: [], payment: [] });

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const [formData, setFormData] = useState({
        category: 'Others',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paidTo: '',
        paymentMethod: 'Cash'
    });

    const categories = [
        'Snacks', 'Rent', 'Salary Advance', 'Marketing', 'Office Supplies',
        'Utilities', 'Travel', 'Equipment', 'Software', 'Insurance', 'Others'
    ];

    const paymentMethods = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const expensesSnap = await getDocs(collection(db, 'expenses'));
            const expensesList = expensesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                amount: parseFloat(doc.data().amount) || 0
            }));
            setExpenses(expensesList);
            generateChartData(expensesList);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (expensesList) => {
        // Category distribution
        const categoryMap = {};
        expensesList.forEach(e => {
            const cat = e.category || 'Others';
            categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
        });
        const categories = Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        // Monthly expenses (last 6 months)
        const monthly = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const month = date.toISOString().slice(0, 7);
            const monthExpenses = expensesList.filter(e => e.date && e.date.startsWith(month));
            const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
            return { month: month.substring(5), total: total / 1000 };
        });

        // Payment method distribution
        const paymentMap = {};
        expensesList.forEach(e => {
            const method = e.paymentMethod || 'Cash';
            paymentMap[method] = (paymentMap[method] || 0) + e.amount;
        });
        const payment = Object.entries(paymentMap).map(([name, value]) => ({ name, value }));

        setChartData({ categories, monthly, payment });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount),
                createdAt: new Date().toISOString()
            };
            if (editingExpense) {
                await updateDoc(doc(db, 'expenses', editingExpense.id), expenseData);
            } else {
                await addDoc(collection(db, 'expenses'), expenseData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving expense:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await deleteDoc(doc(db, 'expenses', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting expense:", error);
            }
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData(expense);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingExpense(null);
        setFormData({
            category: 'Others',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            paidTo: '',
            paymentMethod: 'Cash'
        });
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const todayExpenses = expenses.filter(e => e.date === new Date().toISOString().split('T')[0])
        .reduce((sum, e) => sum + e.amount, 0);
    const thisMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(new Date().toISOString().slice(0, 7)))
        .reduce((sum, e) => sum + e.amount, 0);
    const pendingExpenses = expenses.filter(e => e.status === 'Pending').length;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EF4444]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
            
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-3 sm:px-4 py-2 bg-white text-[#EF4444] rounded-lg hover:bg-red-50 text-sm font-medium shadow-md"
                    >
                        <FiPlus className="mr-2 w-4 h-4" /> Add Expense
                    </button>
              

            {/* Gradient Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 border-2 border-red-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <FiDollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                            <FiArrowUp className="w-3 h-3" /> 12%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Expenses</p>
                    <p className="text-xl font-bold text-red-700 mt-1">₹{(totalExpenses / 1000).toFixed(1)}K</p>
                    <p className="text-[10px] text-gray-500 mt-1">{expenses.length} transactions</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <FiCalendar className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Today's Expenses</p>
                    <p className="text-xl font-bold text-orange-700 mt-1">₹{todayExpenses.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Current day</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <FiTrendingDown className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">This Month</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">₹{(thisMonthExpenses / 1000).toFixed(1)}K</p>
                    <p className="text-[10px] text-gray-500 mt-1">Monthly total</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FiPieChart className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Categories</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{new Set(expenses.map(e => e.category)).size}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Active categories</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'overview', label: 'Overview', icon: FiPieChart },
                    { key: 'expenses', label: 'Expenses', icon: FiDollarSign }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                ? 'bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="text-sm">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Overview Tab - Charts */}
            {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Category Distribution - Pie Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPieChart className="w-5 h-5 text-[#EF4444]" />
                                Expense by Category
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={chartData.categories}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {chartData.categories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #EF4444',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Payment Methods - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiCreditCard className="w-5 h-5 text-[#EF4444]" />
                                Payment Methods
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.payment}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #EF4444',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Bar dataKey="value" fill="#EF4444" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Trend - Line Chart */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiActivity className="w-5 h-5 text-[#EF4444]" />
                            Monthly Expense Trend (Last 6 Months)
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={chartData.monthly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #EF4444',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }} />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#EF4444"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#EF4444' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
                    <Table headers={['Date', 'Category', 'Description', 'Paid To', 'Amount', 'Payment', 'Actions']} dense>
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell className="text-gray-600">{expense.date}</Table.Cell>
                                <Table.Cell>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                        {expense.category}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="font-medium text-gray-900">{expense.description}</Table.Cell>
                                <Table.Cell className="text-gray-600">{expense.paidTo || '-'}</Table.Cell>
                                <Table.Cell className="font-bold text-red-600">₹{expense.amount.toLocaleString()}</Table.Cell>
                                <Table.Cell>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        {expense.paymentMethod}
                                    </span>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(expense)} className="text-blue-600 hover:text-blue-800">
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-800">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Table.Cell>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingExpense ? 'Edit Expense' : 'Add New Expense'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                                    value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                                    value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                                    value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                                    value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                    {paymentMethods.map((method) => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paid To</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                                    value={formData.paidTo} onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea rows="2" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                                    value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626]">
                                {editingExpense ? 'Update' : 'Add'} Expense
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Expenses;
