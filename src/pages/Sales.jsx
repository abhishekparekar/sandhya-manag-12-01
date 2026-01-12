import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiTrendingUp, FiUsers,
    FiCalendar, FiCheckCircle, FiClock, FiUserCheck, FiArrowUp, FiArrowDown,
    FiPieChart, FiBarChart2, FiActivity
} from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';
import Table from '../components/Table';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [leads, setLeads] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [editingLead, setEditingLead] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState({ monthly: [], leadStatus: [], executivePerf: [] });

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const [saleFormData, setSaleFormData] = useState({
        clientName: '',
        project: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentStatus: 'Pending',
        executive: '',
        description: ''
    });

    const [leadFormData, setLeadFormData] = useState({
        name: '',
        email: '',
        phone: '',
        source: '',
        status: 'New',
        followUpDate: '',
        executive: '',
        notes: '',
        convertedToSale: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [salesSnap, leadsSnap, employeesSnap] = await Promise.all([
                getDocs(collection(db, 'sales')),
                getDocs(collection(db, 'leads')),
                getDocs(collection(db, 'employees'))
            ]);

            const salesList = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const leadsList = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const execList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setSales(salesList);
            setLeads(leadsList);
            setExecutives(execList);

            // Generate chart data
            generateChartData(salesList, leadsList, execList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (salesList, leadsList, execList) => {
        // Monthly sales trend
        const monthlyMap = {};
        salesList.forEach(sale => {
            const month = sale.date ? sale.date.substring(0, 7) : 'Unknown';
            monthlyMap[month] = (monthlyMap[month] || 0) + Number(sale.amount || 0);
        });
        const monthly = Object.entries(monthlyMap)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);

        // Lead status distribution
        const statusMap = {};
        leadsList.forEach(lead => {
            const status = lead.status || 'Unknown';
            statusMap[status] = (statusMap[status] || 0) + 1;
        });
        const leadStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        // Executive performance
        const executivePerf = execList.map(exec => {
            const execSales = salesList.filter(s => s.executive === exec.name);
            const totalAmount = execSales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
            return {
                name: exec.name,
                sales: totalAmount
            };
        }).filter(e => e.sales > 0).slice(0, 5);

        setChartData({ monthly, leadStatus, executivePerf });
    };

    const handleSaleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSale) {
                await updateDoc(doc(db, 'sales', editingSale.id), saleFormData);
            } else {
                await addDoc(collection(db, 'sales'), { ...saleFormData, createdAt: new Date().toISOString() });
            }
            fetchData();
            handleCloseSaleModal();
        } catch (error) {
            console.error("Error saving sale:", error);
        }
    };

    const handleLeadSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLead) {
                await updateDoc(doc(db, 'leads', editingLead.id), leadFormData);
            } else {
                await addDoc(collection(db, 'leads'), { ...leadFormData, createdAt: new Date().toISOString() });
            }
            fetchData();
            handleCloseLeadModal();
        } catch (error) {
            console.error("Error saving lead:", error);
        }
    };

    const handleDeleteSale = async (id) => {
        if (window.confirm('Are you sure you want to delete this sale?')) {
            try {
                await deleteDoc(doc(db, 'sales', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting sale:", error);
            }
        }
    };

    const handleDeleteLead = async (id) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                await deleteDoc(doc(db, 'leads', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting lead:", error);
            }
        }
    };

    const convertLeadToSale = async (lead) => {
        try {
            await updateDoc(doc(db, 'leads', lead.id), { convertedToSale: true, status: 'Converted' });
            await addDoc(collection(db, 'sales'), {
                clientName: lead.name,
                project: 'Converted from Lead',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                paymentStatus: 'Pending',
                executive: lead.executive,
                description: `Converted from lead: ${lead.notes}`,
                createdAt: new Date().toISOString()
            });
            fetchData();
        } catch (error) {
            console.error("Error converting lead:", error);
        }
    };

    const handleEditSale = (sale) => {
        setEditingSale(sale);
        setSaleFormData(sale);
        setShowModal(true);
    };

    const handleEditLead = (lead) => {
        setEditingLead(lead);
        setLeadFormData(lead);
        setShowLeadModal(true);
    };

    const handleCloseSaleModal = () => {
        setShowModal(false);
        setEditingSale(null);
        setSaleFormData({
            clientName: '', project: '', amount: '', date: new Date().toISOString().split('T')[0],
            paymentStatus: 'Pending', executive: '', description: ''
        });
    };

    const handleCloseLeadModal = () => {
        setShowLeadModal(false);
        setEditingLead(null);
        setLeadFormData({
            name: '', email: '', phone: '', source: '', status: 'New',
            followUpDate: '', executive: '', notes: '', convertedToSale: false
        });
    };

    const totalSales = sales.reduce((acc, sale) => acc + Number(sale.amount || 0), 0);
    const todaySales = sales.filter(s => s.date === new Date().toISOString().split('T')[0])
        .reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const convertedLeads = leads.filter(l => l.convertedToSale).length;
    const pendingFollowUps = leads.filter(l => l.followUpDate && !l.convertedToSale).length;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
            {/* Gradient Header */}
          
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
               
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowLeadModal(true)}
                            className="flex items-center px-3 sm:px-4 py-2 bg-white text-[#1B5E7E] rounded-lg hover:bg-orange-50 text-sm font-medium shadow-md"
                        >
                            <FiPlus className="mr-2 w-4 h-4" /> Add Lead
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center px-3 sm:px-4 py-2 bg-white text-[#F47920] rounded-lg hover:bg-orange-50 text-sm font-medium shadow-md"
                        >
                            <FiPlus className="mr-2 w-4 h-4" /> Add Sale
                        </button>
                    </div>
                </div>
            

            {/* Gradient Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <FiDollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                            <FiArrowUp className="w-3 h-3" /> 12%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Sales</p>
                    <p className="text-xl font-bold text-green-700 mt-1">₹{totalSales.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{sales.length} transactions</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FiTrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Today's Sales</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">₹{todaySales.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Today's revenue</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <FiUserCheck className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Converted Leads</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{convertedLeads}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{leads.length} total leads</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Pending Follow-ups</p>
                    <p className="text-xl font-bold text-orange-700 mt-1">{pendingFollowUps}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Action required</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'overview', label: 'Overview', icon: FiPieChart },
                    { key: 'sales', label: 'Sales', icon: FiDollarSign },
                    { key: 'leads', label: 'Leads', icon: FiUsers }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                ? 'bg-gradient-to-r from-[#F47920] to-[#E06810] text-white shadow-lg'
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
                        {/* Monthly Sales Trend - Line Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiActivity className="w-5 h-5 text-[#F47920]" />
                                Sales Trend (Last 6 Months)
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData.monthly}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #F47920',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#10B981"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#10B981' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Lead Status - Pie Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPieChart className="w-5 h-5 text-[#F47920]" />
                                Lead Status Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={chartData.leadStatus}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {chartData.leadStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #F47920',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Sales by Executive - Bar Chart */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiBarChart2 className="w-5 h-5 text-[#F47920]" />
                            Top Performing Executives
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData.executivePerf}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #F47920',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }} />
                                <Bar dataKey="sales" fill="#1B5E7E" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Sales Tab */}
            {activeTab === 'sales' && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
                    <Table headers={['Date', 'Client', 'Project', 'Amount', 'Status', 'Executive', 'Actions']} dense>
                        {sales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell>{sale.date}</Table.Cell>
                                <Table.Cell className="font-medium text-gray-900">{sale.clientName}</Table.Cell>
                                <Table.Cell className="text-gray-600">{sale.project}</Table.Cell>
                                <Table.Cell align="right" className="font-bold text-green-600">
                                    ₹{Number(sale.amount).toLocaleString()}
                                </Table.Cell>
                                <Table.Cell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                            sale.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {sale.paymentStatus}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="text-gray-600">{sale.executive || '-'}</Table.Cell>
                                <Table.Cell>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditSale(sale)} className="text-blue-600 hover:text-blue-800">
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteSale(sale.id)} className="text-red-600 hover:text-red-800">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Table.Cell>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {leads.map((lead) => (
                        <div key={lead.id} className={`bg-white rounded-xl shadow-sm border-2 p-4 sm:p-6 ${lead.convertedToSale ? 'border-green-300 bg-green-50' : 'border-gray-100'
                            }`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{lead.name}</h3>
                                    <p className="text-sm text-gray-600">{lead.email}</p>
                                    <p className="text-sm text-gray-600">{lead.phone}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${lead.status === 'Converted' ? 'bg-green-100 text-green-700' :
                                        lead.status === 'Interested' ? 'bg-blue-100 text-blue-700' :
                                            lead.status === 'Follow-up' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                    }`}>
                                    {lead.status}
                                </span>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <FiUsers className="mr-2" />
                                    <span>Executive: {lead.executive || 'Not assigned'}</span>
                                </div>
                                {lead.followUpDate && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FiCalendar className="mr-2" />
                                        <span>Follow-up: {lead.followUpDate}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {!lead.convertedToSale && (
                                    <button
                                        onClick={() => convertLeadToSale(lead)}
                                        className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium"
                                    >
                                        <FiCheckCircle className="inline mr-1" /> Convert
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEditLead(lead)}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                                >
                                    <FiEdit2 className="inline mr-1" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showModal && (
                <Modal onClose={handleCloseSaleModal} title={editingSale ? 'Edit Sale' : 'Add New Sale'}>
                    <form onSubmit={handleSaleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.clientName} onChange={(e) => setSaleFormData({ ...saleFormData, clientName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.project} onChange={(e) => setSaleFormData({ ...saleFormData, project: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.amount} onChange={(e) => setSaleFormData({ ...saleFormData, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.date} onChange={(e) => setSaleFormData({ ...saleFormData, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.paymentStatus} onChange={(e) => setSaleFormData({ ...saleFormData, paymentStatus: e.target.value })}>
                                    <option value="Pending">Pending</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Paid">Paid</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Executive</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.executive} onChange={(e) => setSaleFormData({ ...saleFormData, executive: e.target.value })}>
                                    <option value="">Select Executive</option>
                                    {executives.map((exec) => (
                                        <option key={exec.id} value={exec.name}>{exec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={saleFormData.description} onChange={(e) => setSaleFormData({ ...saleFormData, description: e.target.value })} />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={handleCloseSaleModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810]">
                                {editingSale ? 'Update' : 'Add'} Sale
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {showLeadModal && (
                <Modal onClose={handleCloseLeadModal} title={editingLead ? 'Edit Lead' : 'Add New Lead'}>
                    <form onSubmit={handleLeadSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.name} onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.email} onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.phone} onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.source} onChange={(e) => setLeadFormData({ ...leadFormData, source: e.target.value })} placeholder="e.g., Website, Referral" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.status} onChange={(e) => setLeadFormData({ ...leadFormData, status: e.target.value })}>
                                    <option value="New">New</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Not Interested">Not Interested</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.followUpDate} onChange={(e) => setLeadFormData({ ...leadFormData, followUpDate: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Executive</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.executive} onChange={(e) => setLeadFormData({ ...leadFormData, executive: e.target.value })}>
                                    <option value="">Select Executive</option>
                                    {executives.map((exec) => (
                                        <option key={exec.id} value={exec.name}>{exec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                value={leadFormData.notes} onChange={(e) => setLeadFormData({ ...leadFormData, notes: e.target.value })} />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={handleCloseLeadModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E]">
                                {editingLead ? 'Update' : 'Add'} Lead
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Sales;
