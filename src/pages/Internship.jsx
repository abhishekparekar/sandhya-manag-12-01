import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiUsers, FiCalendar, FiCheckCircle,
    FiAward, FiTrendingUp, FiClock, FiFileText, FiUserPlus,
    FiArrowUp, FiPieChart, FiBarChart2, FiActivity
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';
import Table from '../components/Table';

const Internship = () => {
    const [interns, setInterns] = useState([]);
    const [internTasks, setInternTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingIntern, setEditingIntern] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState({ status: [], performance: [], tasks: [] });

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        college: '',
        course: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        mentor: '',
        performance: 0,
        status: 'Active'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [internsSnap, tasksSnap] = await Promise.all([
                getDocs(collection(db, 'interns')),
                getDocs(collection(db, 'internTasks'))
            ]);

            const internsList = internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const tasksList = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setInterns(internsList);
            setInternTasks(tasksList);
            generateChartData(internsList, tasksList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (internsList, tasksList) => {
        // Status distribution
        const statusMap = {};
        internsList.forEach(i => {
            const status = i.status || 'Active';
            statusMap[status] = (statusMap[status] || 0) + 1;
        });
        const status = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        // Performance distribution
        const performance = internsList.map(i => ({
            name: i.name,
            performance: Number(i.performance || 0)
        })).sort((a, b) => b.performance - a.performance).slice(0, 5);

        // Task completion trend (last 7 days)
        const tasks = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = tasksList.filter(t => t.date === dateStr);
            const completed = dayTasks.filter(t => t.status === 'Completed').length;
            return { date: dateStr.substring(5), completed };
        });

        setChartData({ status, performance, tasks });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const internData = { ...formData, createdAt: new Date().toISOString() };
            if (editingIntern) {
                await updateDoc(doc(db, 'interns', editingIntern.id), internData);
            } else {
                await addDoc(collection(db, 'interns'), internData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving intern:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this intern?')) {
            try {
                await deleteDoc(doc(db, 'interns', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting intern:", error);
            }
        }
    };

    const handleEdit = (intern) => {
        setEditingIntern(intern);
        setFormData(intern);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingIntern(null);
        setFormData({
            name: '', email: '', phone: '', college: '', course: '',
            startDate: new Date().toISOString().split('T')[0], endDate: '',
            mentor: '', performance: 0, status: 'Active'
        });
    };

    const totalInterns = interns.length;
    const activeInterns = interns.filter(i => i.status === 'Active').length;
    const completedInterns = interns.filter(i => i.status === 'Completed').length;
    const pendingTasks = internTasks.filter(t => t.status === 'Pending').length;
    const avgPerformance = interns.length > 0
        ? (interns.reduce((sum, i) => sum + Number(i.performance || 0), 0) / interns.length).toFixed(1)
        : 0;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
  
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-3 sm:px-4 py-2 bg-white text-[#8B5CF6] rounded-lg hover:bg-purple-50 text-sm font-medium shadow-md"
                    >
                        <FiPlus className="mr-2 w-4 h-4" /> Add Intern
                    </button>
            

            {/* Gradient Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <FiUserPlus className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-purple-600 text-xs font-medium">
                            <FiArrowUp className="w-3 h-3" /> 10%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Interns</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{totalInterns}</p>
                    <p className="text-[10px] text-gray-500 mt-1">All time</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <FiCheckCircle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Active</p>
                    <p className="text-xl font-bold text-green-700 mt-1">{activeInterns}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Currently working</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FiAward className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Completed</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{completedInterns}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Finished</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Pending Tasks</p>
                    <p className="text-xl font-bold text-orange-700 mt-1">{pendingTasks}</p>
                    <p className="text-[10px] text-gray-500 mt-1">To complete</p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl p-4 border-2 border-teal-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                            <FiTrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Avg Performance</p>
                    <p className="text-xl font-bold text-teal-700 mt-1">{avgPerformance}%</p>
                    <p className="text-[10px] text-gray-500 mt-1">Overall</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'overview', label: 'Overview', icon: FiPieChart },
                    { key: 'interns', label: 'Interns', icon: FiUsers }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg'
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
                        {/* Status Distribution - Pie Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPieChart className="w-5 h-5 text-[#8B5CF6]" />
                                Intern Status
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
                                        border: '2px solid #8B5CF6',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Performers - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBarChart2 className="w-5 h-5 text-[#8B5CF6]" />
                                Top Performers
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.performance}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #8B5CF6',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Bar dataKey="performance" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Task Completion Trend - Line Chart */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiActivity className="w-5 h-5 text-[#8B5CF6]" />
                            Task Completion (Last 7 Days)
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={chartData.tasks}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #8B5CF6',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }} />
                                <Line
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#8B5CF6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#8B5CF6' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Interns Tab */}
            {activeTab === 'interns' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {interns.map((intern) => (
                        <div key={intern.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{intern.name}</h3>
                                    <p className="text-sm text-gray-600">{intern.college}</p>
                                    <p className="text-sm text-gray-600">{intern.course}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${intern.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {intern.status}
                                </span>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Performance</span>
                                    <span className="font-bold text-[#8B5CF6]">{intern.performance}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-[#8B5CF6] h-2 rounded-full transition-all"
                                        style={{ width: `${intern.performance}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-medium text-gray-800">{intern.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-medium text-gray-800">{intern.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mentor:</span>
                                    <span className="font-medium text-gray-800">{intern.mentor || 'Not assigned'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(intern)}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                                >
                                    <FiEdit2 className="inline mr-1" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(intern.id)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingIntern ? 'Edit Intern' : 'Add New Intern'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.college} onChange={(e) => setFormData({ ...formData, college: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mentor</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.mentor} onChange={(e) => setFormData({ ...formData, mentor: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Performance (%)</label>
                                <input type="number" required min="0" max="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.performance} onChange={(e) => setFormData({ ...formData, performance: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Active">Active</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED]">
                                {editingIntern ? 'Update' : 'Add'} Intern
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Internship;
