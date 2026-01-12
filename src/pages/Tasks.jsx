import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiClock, FiAlertCircle,
    FiList, FiActivity, FiArrowUp, FiArrowDown, FiPieChart, FiBarChart2
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState({ status: [], priority: [], daily: [] });

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        assignedToType: 'Employee',
        deadline: '',
        status: 'Pending',
        priority: 'Medium'
    });

    const statuses = ['Pending', 'In Progress', 'Completed', 'On Hold'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksSnap, employeesSnap, internsSnap] = await Promise.all([
                getDocs(collection(db, 'tasks')),
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'interns'))
            ]);

            const tasksList = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const employeesList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const internsList = internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setTasks(tasksList);
            setEmployees(employeesList);
            setInterns(internsList);
            generateChartData(tasksList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (tasksList) => {
        // Status distribution
        const statusMap = {};
        tasksList.forEach(t => {
            const status = t.status || 'Pending';
            statusMap[status] = (statusMap[status] || 0) + 1;
        });
        const status = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        // Priority distribution
        const priorityMap = {};
        tasksList.forEach(t => {
            const priority = t.priority || 'Medium';
            priorityMap[priority] = (priorityMap[priority] || 0) + 1;
        });
        const priority = Object.entries(priorityMap).map(([name, value]) => ({ name, value }));

        // Daily task completion (last 7 days)
        const daily = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = tasksList.filter(t => t.deadline === dateStr);
            const completed = dayTasks.filter(t => t.status === 'Completed').length;
            return { date: dateStr.substring(5), completed };
        });

        setChartData({ status, priority, daily });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const taskData = { ...formData, createdAt: new Date().toISOString() };
            if (editingTask) {
                await updateDoc(doc(db, 'tasks', editingTask.id), taskData);
            } else {
                await addDoc(collection(db, 'tasks'), taskData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving task:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteDoc(doc(db, 'tasks', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setFormData(task);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTask(null);
        setFormData({
            title: '', description: '', assignedTo: '', assignedToType: 'Employee',
            deadline: '', status: 'Pending', priority: 'Medium'
        });
    };

    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(t => t.deadline < today && t.status !== 'Completed').length;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366F1]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
    
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-3 sm:px-4 py-2 bg-white text-[#6366F1] rounded-lg hover:bg-indigo-50 text-sm font-medium shadow-md"
                    >
                        <FiPlus className="mr-2 w-4 h-4" /> Create Task
                    </button>
         

            {/* Gradient Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-violet-100 rounded-xl p-4 border-2 border-indigo-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <FiList className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-indigo-600 text-xs font-medium">
                            <FiArrowUp className="w-3 h-3" /> 14%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Tasks</p>
                    <p className="text-xl font-bold text-indigo-700 mt-1">{totalTasks}</p>
                    <p className="text-[10px] text-gray-500 mt-1">All tasks</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Pending</p>
                    <p className="text-xl font-bold text-orange-700 mt-1">{pendingTasks}</p>
                    <p className="text-[10px] text-gray-500 mt-1">To start</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FiActivity className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">In Progress</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{inProgressTasks}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Active</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <FiCheckCircle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Completed</p>
                    <p className="text-xl font-bold text-green-700 mt-1">{completedTasks}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Done</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 border-2 border-red-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <FiAlertCircle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Overdue</p>
                    <p className="text-xl font-bold text-red-700 mt-1">{overdueTasks}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Late tasks</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'overview', label: 'Overview', icon: FiPieChart },
                    { key: 'tasks', label: 'All Tasks', icon: FiList }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                ? 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-lg'
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
                        {/* Task Status - Pie Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPieChart className="w-5 h-5 text-[#6366F1]" />
                                Task Status
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
                                        border: '2px solid #6366F1',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Priority Distribution - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBarChart2 className="w-5 h-5 text-[#6366F1]" />
                                Priority Levels
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.priority}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #6366F1',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Daily Completion - Line Chart */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiActivity className="w-5 h-5 text-[#6366F1]" />
                            Task Completion (Last 7 Days)
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={chartData.daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #6366F1',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }} />
                                <Line
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#6366F1"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#6366F1' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {tasks.map((task) => {
                        const isOverdue = task.deadline < today && task.status !== 'Completed';
                        return (
                            <div key={task.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">{task.title}</h3>
                                        <p className="text-sm text-gray-600">{task.description}</p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button onClick={() => handleEdit(task)} className="text-blue-600 hover:text-blue-800">
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:text-red-800">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Assigned to:</span>
                                        <span className="font-medium text-gray-800">{task.assignedTo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Deadline:</span>
                                        <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                                            {task.deadline || 'No deadline'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                            task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {task.priority}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                task.status === 'On Hold' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingTask ? 'Edit Task' : 'Create New Task'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea rows="3" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                    value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To Type</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                        value={formData.assignedToType} onChange={(e) => setFormData({ ...formData, assignedToType: e.target.value, assignedTo: '' })}>
                                        <option value="Employee">Employee</option>
                                        <option value="Intern">Intern</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                    <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                        value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}>
                                        <option value="">Select {formData.assignedToType}</option>
                                        {formData.assignedToType === 'Employee'
                                            ? employees.map((emp) => (<option key={emp.id} value={emp.name}>{emp.name}</option>))
                                            : interns.map((intern) => (<option key={intern.id} value={intern.name}>{intern.name}</option>))
                                        }
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                                    <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                        value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                        value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                                        {priorities.map(priority => (<option key={priority} value={priority}>{priority}</option>))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                    value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    {statuses.map(status => (<option key={status} value={status}>{status}</option>))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5]">
                                {editingTask ? 'Update' : 'Create'} Task
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Tasks;
