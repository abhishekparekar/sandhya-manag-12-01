import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiBriefcase,
    FiCalendar, FiUsers, FiArrowUp, FiArrowDown, FiPieChart,
    FiBarChart2, FiActivity, FiCheckCircle, FiClock, FiSmartphone, FiMonitor
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState({ status: [], types: [], timeline: [] });

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const [formData, setFormData] = useState({
        title: '',
        client: '',
        budget: '',
        type: 'Web',
        assignedTeam: [],
        progress: 0,
        deadline: '',
        status: 'In Progress',
        paymentStatus: 'Pending',
        paymentReceived: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projectsSnap, employeesSnap] = await Promise.all([
                getDocs(collection(db, 'projects')),
                getDocs(collection(db, 'employees'))
            ]);

            const projectsList = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const employeesList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setProjects(projectsList);
            setEmployees(employeesList);
            generateChartData(projectsList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (projectsList) => {
        // Status distribution
        const statusMap = {};
        projectsList.forEach(p => {
            const status = p.status || 'Unknown';
            statusMap[status] = (statusMap[status] || 0) + 1;
        });
        const status = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        // Project types
        const typeMap = {};
        projectsList.forEach(p => {
            const type = p.type || 'Unknown';
            typeMap[type] = (typeMap[type] || 0) + 1;
        });
        const types = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

        // Budget timeline (last 6 months)
        const monthlyBudget = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const month = date.toISOString().slice(0, 7);
            const monthProjects = projectsList.filter(p => {
                if (!p.createdAt) return false;
                // Handle both string and Firestore Timestamp
                const createdDate = typeof p.createdAt === 'string'
                    ? p.createdAt
                    : p.createdAt.toDate ? p.createdAt.toDate().toISOString() : '';
                return createdDate.startsWith(month);
            });
            const budget = monthProjects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
            return { month: month.substring(5), budget: budget / 1000 };
        });

        setChartData({ status, types, timeline: monthlyBudget });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const projectData = { ...formData, createdAt: new Date().toISOString() };
            if (editingProject) {
                await updateDoc(doc(db, 'projects', editingProject.id), projectData);
            } else {
                await addDoc(collection(db, 'projects'), projectData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving project:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await deleteDoc(doc(db, 'projects', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting project:", error);
            }
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData(project);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProject(null);
        setFormData({
            title: '', client: '', budget: '', type: 'Web', assignedTeam: [],
            progress: 0, deadline: '', status: 'In Progress', paymentStatus: 'Pending', paymentReceived: 0
        });
    };

    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
    const totalBudget = projects.reduce((acc, p) => acc + Number(p.budget || 0), 0);
    const totalReceived = projects.reduce((acc, p) => acc + Number(p.paymentReceived || 0), 0);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FiBriefcase className="w-6 h-6 text-[#3B82F6]" />
                        Projects Overview
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your Android & Web projects</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors font-medium shadow-md"
                >
                    <FiPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Project</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>


            {/* Gradient Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FiBriefcase className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                            <FiArrowUp className="w-3 h-3" /> 15%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Projects</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{totalProjects}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{completedProjects} completed</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <FiCheckCircle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">In Progress</p>
                    <p className="text-xl font-bold text-green-700 mt-1">{inProgressProjects}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Active projects</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <FiDollarSign className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Budget</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">₹{(totalBudget / 100000).toFixed(1)}L</p>
                    <p className="text-[10px] text-gray-500 mt-1">All projects</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <FiDollarSign className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Received</p>
                    <p className="text-xl font-bold text-orange-700 mt-1">₹{(totalReceived / 100000).toFixed(1)}L</p>
                    <p className="text-[10px] text-gray-500 mt-1">{((totalReceived / totalBudget) * 100).toFixed(0)}% of budget</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'overview', label: 'Overview', icon: FiPieChart },
                    { key: 'projects', label: 'Projects', icon: FiBriefcase }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                            ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-lg'
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
                        {/* Project Status - Pie Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPieChart className="w-5 h-5 text-[#3B82F6]" />
                                Project Status
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
                                        border: '2px solid #3B82F6',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Project Types - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBarChart2 className="w-5 h-5 text-[#3B82F6]" />
                                Project Types
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.types}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #3B82F6',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Budget Timeline - Line Chart */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiActivity className="w-5 h-5 text-[#3B82F6]" />
                            Budget Timeline (Last 6 Months)
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={chartData.timeline}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #3B82F6',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }} />
                                <Line
                                    type="monotone"
                                    dataKey="budget"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#3B82F6' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{project.title}</h3>
                                    <p className="text-sm text-gray-600">{project.client}</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.type === 'Android' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {project.type}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                        project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Progress</span>
                                    <span className="font-bold text-[#3B82F6]">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-[#3B82F6] h-2 rounded-full transition-all"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <FiDollarSign className="mr-2 text-[#3B82F6]" />
                                    <span>₹{Number(project.budget).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <FiCalendar className="mr-2 text-green-600" />
                                    <span>{project.deadline || 'No deadline'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(project)}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                                >
                                    <FiEdit2 className="inline mr-1" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(project.id)}
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
                <Modal onClose={handleCloseModal} title={editingProject ? 'Edit Project' : 'Create New Project'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                    value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹)</label>
                                <input type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                    value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                    value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="Web">Web</option>
                                    <option value="Android">Android</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                    value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                                <input type="number" min="0" max="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                    value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                    value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Planning">Planning</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Testing">Testing</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB]">
                                {editingProject ? 'Update' : 'Create'} Project
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Projects;
