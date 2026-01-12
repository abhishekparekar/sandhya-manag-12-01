import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiUsers, FiCalendar, FiDollarSign,
    FiUserCheck, FiTrendingUp, FiAlertTriangle, FiBriefcase, FiTarget,
    FiArrowUp, FiArrowDown, FiPieChart, FiBarChart2, FiActivity, FiAward
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';
import Table from '../components/Table';
import AttendanceQR from '../components/hr/AttendanceQR';
import SalarySlipGenerator from '../components/hr/SalarySlipGenerator';
import AIWarnings from '../components/hr/AIWarnings';
import LeaveCalendar from '../components/hr/LeaveCalendar';
import SkillMatrix from './SkillMatrix';
import Contractors from './Contractors';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState({ departments: [], attendance: [], roles: [] });

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: 'Web',
        designation: '',
        joiningDate: new Date().toISOString().split('T')[0],
        salary: '',
        status: 'Active'
    });

    const departments = ['Android', 'Web', 'Sales', 'Telecalling', 'HR'];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FiPieChart },
        { id: 'employees', label: 'Employees', icon: FiUsers },
        { id: 'attendance', label: 'Attendance', icon: FiUserCheck },
        { id: 'salary', label: 'Salary Slips', icon: FiDollarSign },
        { id: 'performance', label: 'Performance', icon: FiTrendingUp },
        { id: 'leaves', label: 'Leaves', icon: FiCalendar },
        { id: 'warnings', label: 'AI Warnings', icon: FiAlertTriangle },
        { id: 'contractors', label: 'Contractors', icon: FiBriefcase },
        { id: 'skills', label: 'Skill Matrix', icon: FiTarget }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [employeesSnap, attendanceSnap, leavesSnap] = await Promise.all([
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'attendance')),
                getDocs(collection(db, 'leaves'))
            ]);

            const employeesList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const attendanceList = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const leavesList = leavesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setEmployees(employeesList);
            setAttendance(attendanceList);
            setLeaves(leavesList);

            generateChartData(employeesList, attendanceList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (employeesList, attendanceList) => {
        // Department distribution
        const deptMap = {};
        employeesList.forEach(emp => {
            const dept = emp.department || 'Unknown';
            deptMap[dept] = (deptMap[dept] || 0) + 1;
        });
        const departments = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

        // Attendance trend (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().split('T')[0];
        });

        const attendanceTrend = last7Days.map(date => {
            const dayAttendance = attendanceList.filter(a => a.date === date && a.status === 'Present').length;
            return { date: date.substring(5), present: dayAttendance };
        });

        // Role distribution
        const roleMap = {};
        employeesList.forEach(emp => {
            const role = emp.designation || 'Unknown';
            roleMap[role] = (roleMap[role] || 0) + 1;
        });
        const roles = Object.entries(roleMap).map(([name, value]) => ({ name, value })).slice(0, 5);

        setChartData({ departments, attendance: attendanceTrend, roles });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEmployee) {
                await updateDoc(doc(db, 'employees', editingEmployee.id), formData);
            } else {
                await addDoc(collection(db, 'employees'), { ...formData, createdAt: new Date().toISOString() });
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving employee:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await deleteDoc(doc(db, 'employees', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting employee:", error);
            }
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setFormData(employee);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        setFormData({
            name: '', email: '', phone: '', department: 'Web',
            designation: '', joiningDate: new Date().toISOString().split('T')[0],
            salary: '', status: 'Active'
        });
    };

    const activeEmployees = employees.filter(e => e.status === 'Active').length;
    const totalDepartments = new Set(employees.map(e => e.department)).size;
    const todayAttendance = attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Present').length;
    const attendanceRate = employees.length > 0 ? ((todayAttendance / employees.length) * 100).toFixed(1) : 0;
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
            
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-3 sm:px-4 py-2 bg-white text-[#8B5CF6] rounded-lg hover:bg-purple-50 text-sm font-medium shadow-md"
                    >
                        <FiPlus className="mr-2 w-4 h-4" /> Add Employee
                    </button>
           

            {/* Gradient Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <FiUsers className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-purple-600 text-xs font-medium">
                            <FiArrowUp className="w-3 h-3" /> 5%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Employees</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{employees.length}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{activeEmployees} active</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <FiUserCheck className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Today's Attendance</p>
                    <p className="text-xl font-bold text-green-700 mt-1">{todayAttendance}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{attendanceRate}% present</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FiBriefcase className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Departments</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{totalDepartments}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Active teams</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <FiCalendar className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Pending Leaves</p>
                    <p className="text-xl font-bold text-orange-700 mt-1">{pendingLeaves}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Awaiting approval</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
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
                        {/* Department Distribution - Pie Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPieChart className="w-5 h-5 text-[#8B5CF6]" />
                                Department Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={chartData.departments}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {chartData.departments.map((entry, index) => (
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

                        {/* Attendance Trend - Line Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiActivity className="w-5 h-5 text-[#8B5CF6]" />
                                Attendance Trend (Last 7 Days)
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData.attendance}>
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
                                        dataKey="present"
                                        stroke="#10B981"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#10B981' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Roles - Bar Chart */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiBarChart2 className="w-5 h-5 text-[#8B5CF6]" />
                            Top Roles
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData.roles}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #8B5CF6',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }} />
                                <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
                    <Table headers={['Name', 'Email', 'Department', 'Designation', 'Joining Date', 'Status', 'Actions']} dense>
                        {employees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell className="font-medium text-gray-900">{employee.name}</Table.Cell>
                                <Table.Cell className="text-gray-600">{employee.email}</Table.Cell>
                                <Table.Cell>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                        {employee.department}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="text-gray-600">{employee.designation}</Table.Cell>
                                <Table.Cell className="text-gray-600">{employee.joiningDate}</Table.Cell>
                                <Table.Cell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {employee.status}
                                    </span>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(employee)} className="text-blue-600 hover:text-blue-800">
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(employee.id)} className="text-red-600 hover:text-red-800">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Table.Cell>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* Other Tabs */}
            {activeTab === 'attendance' && <AttendanceQR />}
            {activeTab === 'salary' && <SalarySlipGenerator />}
            {activeTab === 'performance' && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Performance Metrics</h3>
                    <p className="text-gray-600">Performance tracking coming soon...</p>
                </div>
            )}
            {activeTab === 'leaves' && <LeaveCalendar />}
            {activeTab === 'warnings' && <AIWarnings />}
            {activeTab === 'contractors' && <Contractors />}
            {activeTab === 'skills' && <SkillMatrix />}

            {/* Add/Edit Employee Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                                    {departments.map((dept) => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                                <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                                <input type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED]">
                                {editingEmployee ? 'Update' : 'Add'} Employee
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Employees;
