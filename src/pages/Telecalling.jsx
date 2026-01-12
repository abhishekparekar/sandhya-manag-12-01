import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiPhone, FiCheckCircle, FiX,
    FiClock, FiTrendingUp, FiUsers, FiPhoneOff, FiArrowUp,
    FiArrowDown, FiPieChart, FiBarChart2, FiActivity
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';
import Table from '../components/Table';

const Telecalling = () => {
    const [leads, setLeads] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState({ status: [], source: [], daily: [] });

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        company: '',
        source: '',
        status: 'Not Picked',
        followUpDate: '',
        notes: '',
        telecaller: '',
        lastCallDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leadsSnap, employeesSnap] = await Promise.all([
                getDocs(collection(db, 'leads')),
                getDocs(collection(db, 'employees'))
            ]);

            const leadsList = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const employeesList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setLeads(leadsList);
            setEmployees(employeesList);
            generateChartData(leadsList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (leadsList) => {
        // Status distribution
        const statusMap = {};
        leadsList.forEach(l => {
            const status = l.status || 'Unknown';
            statusMap[status] = (statusMap[status] || 0) + 1;
        });
        const status = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        // Source distribution
        const sourceMap = {};
        leadsList.forEach(l => {
            const source = l.source || 'Unknown';
            sourceMap[source] = (sourceMap[source] || 0) + 1;
        });
        const source = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

        // Daily call volume (last 7 days)
        const daily = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const dayCalls = leadsList.filter(l => l.lastCallDate === dateStr).length;
            return { date: dateStr.substring(5), calls: dayCalls };
        });

        setChartData({ status, source, daily });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const leadData = { ...formData, createdAt: new Date().toISOString() };
            if (editingLead) {
                await updateDoc(doc(db, 'leads', editingLead.id), leadData);
            } else {
                await addDoc(collection(db, 'leads'), leadData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving lead:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                await deleteDoc(doc(db, 'leads', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting lead:", error);
            }
        }
    };

    const handleEdit = (lead) => {
        setEditingLead(lead);
        setFormData(lead);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingLead(null);
        setFormData({
            name: '', phone: '', email: '', company: '', source: '',
            status: 'Not Picked', followUpDate: '', notes: '', telecaller: '',
            lastCallDate: new Date().toISOString().split('T')[0]
        });
    };

    const totalLeads = leads.length;
    const answeredCalls = leads.filter(l => l.status !== 'Not Picked').length;
    const interestedLeads = leads.filter(l => l.status === 'Interested').length;
    const followUpsDue = leads.filter(l => l.followUpDate && new Date(l.followUpDate) <= new Date()).length;
    const answerRate = totalLeads > 0 ? ((answeredCalls / totalLeads) * 100).toFixed(1) : 0;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F59E0B]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
           
         
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-3 sm:px-4 py-2 bg-white text-[#F59E0B] rounded-lg hover:bg-yellow-50 text-sm font-medium shadow-md"
                    >
                        <FiPlus className="mr-2 w-4 h-4" /> Add Lead
                    </button>
        

            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <FiPhone className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-orange-600 text-xs font-medium">
                            <FiArrowUp className="w-3 h-3" /> 18%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Leads</p>
                    <p className="text-xl font-bold text-orange-700 mt-1">{totalLeads}</p>
                    <p className="text-[10px] text-gray-500 mt-1">All contacts</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <FiCheckCircle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Answered</p>
                    <p className="text-xl font-bold text-green-700 mt-1">{answeredCalls}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{answerRate}% answer rate</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FiTrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Interested</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{interestedLeads}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Hot prospects</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 border-2 border-red-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Follow-ups Due</p>
                    <p className="text-xl font-bold text-red-700 mt-1">{followUpsDue}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Action required</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'overview', label: 'Overview', icon: FiPieChart },
                    { key: 'leads', label: 'Leads', icon: FiPhone }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-lg'
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
                        {/* Lead Status - Pie Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPieChart className="w-5 h-5 text-[#F59E0B]" />
                                Lead Status Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={chartData.status}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {chartData.status.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #F59E0B',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Lead Source - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBarChart2 className="w-5 h-5 text-[#F59E0B]" />
                                Lead Sources
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.source}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #F59E0B',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Bar dataKey="value" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Daily Call Volume - Line Chart */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiActivity className="w-5 h-5 text-[#F59E0B]" />
                            Call Volume (Last 7 Days)
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={chartData.daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #F59E0B',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }} />
                                <Line
                                    type="monotone"
                                    dataKey="calls"
                                    stroke="#F59E0B"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#F59E0B' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
                    <Table headers={['Name', 'Phone', 'Company', 'Source', 'Status', 'Follow-up', 'Actions']} dense>
                        {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell className="font-medium text-gray-900">{lead.name}</Table.Cell>
                                <Table.Cell className="text-gray-600">{lead.phone}</Table.Cell>
                                <Table.Cell className="text-gray-600">{lead.company || '-'}</Table.Cell>
                                <Table.Cell className="text-gray-600">{lead.source || '-'}</Table.Cell>
                                <Table.Cell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${lead.status === 'Interested' ? 'bg-green-100 text-green-700' :
                                            lead.status === 'Not Interested' ? 'bg-red-100 text-red-700' :
                                                lead.status === 'Not Picked' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {lead.status}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="text-gray-600">{lead.followUpDate || '-'}</Table.Cell>
                                <Table.Cell>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(lead)} className="text-blue-600 hover:text-blue-800">
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(lead.id)} className="text-red-600 hover:text-red-800">
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
                <Modal onClose={handleCloseModal} title={editingLead ? 'Edit Lead' : 'Add New Lead'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="Website, Referral, etc." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Not Picked">Not Picked</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Not Interested">Not Interested</option>
                                    <option value="Follow-up">Follow-up</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telecaller</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.telecaller} onChange={(e) => setFormData({ ...formData, telecaller: e.target.value })}>
                                    <option value="">Select Telecaller</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706]">
                                {editingLead ? 'Update' : 'Add'} Lead
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Telecalling;
