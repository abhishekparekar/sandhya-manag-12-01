import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
    FiTrendingUp, FiUsers, FiBriefcase, FiUserPlus, FiList,
    FiArrowUp, FiPieChart, FiBarChart2, FiActivity
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Progress = () => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [interns, setInterns] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState({ projects: [], employees: [], interns: [] });

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projectsSnap, employeesSnap, internsSnap, tasksSnap] = await Promise.all([
                getDocs(collection(db, 'projects')),
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'interns')),
                getDocs(collection(db, 'tasks'))
            ]);

            const projectsList = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const employeesList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const internsList = internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const tasksList = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setProjects(projectsList);
            setEmployees(employeesList);
            setInterns(internsList);
            setTasks(tasksList);
            generateChartData(projectsList, employeesList, internsList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (projectsList, employeesList, internsList) => {
        // Project progress
        const projects = projectsList.map(p => ({
            name: p.title?.substring(0, 15) || 'Project',
            progress: Number(p.progress || 0)
        })).sort((a, b) => b.progress - a.progress).slice(0, 5);

        // Top employees by task completion
        const employees = employeesList.map(e => {
            const empTasks = tasks.filter(t => t.assignedTo === e.name);
            const completed = empTasks.filter(t => t.status === 'Completed').length;
            const rate = empTasks.length > 0 ? (completed / empTasks.length) * 100 : 0;
            return { name: e.name, rate: Number(rate.toFixed(1)) };
        }).sort((a, b) => b.rate - a.rate).slice(0, 5);

        // Intern performance
        const interns = internsList.map(i => ({
            name: i.name,
            performance: Number(i.performance || 0)
        })).sort((a, b) => b.performance - a.performance).slice(0, 5);

        setChartData({ projects, employees, interns });
    };

    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const activeEmployees = employees.filter(e => e.status === 'Active').length;
    const activeInterns = interns.filter(i => i.status === 'Active').length;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
   

            {/* Gradient Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FiBriefcase className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                            <FiArrowUp className="w-3 h-3" /> 12%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Projects</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{totalProjects}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{completedProjects} completed</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <FiUsers className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Employees</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{employees.length}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{activeEmployees} active</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <FiUserPlus className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Interns</p>
                    <p className="text-xl font-bold text-green-700 mt-1">{interns.length}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{activeInterns} active</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <FiList className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Tasks</p>
                    <p className="text-xl font-bold text-orange-700 mt-1">{tasks.length}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{tasks.filter(t => t.status === 'Completed').length} done</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'overview', label: 'Overview', icon: FiPieChart },
                    { key: 'projects', label: 'Projects', icon: FiBriefcase },
                    { key: 'employees', label: 'Employees', icon: FiUsers },
                    { key: 'interns', label: 'Interns', icon: FiUserPlus }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg'
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Project Progress - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBarChart2 className="w-5 h-5 text-[#10B981]" />
                                Top Projects
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.projects}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #10B981',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Bar dataKey="progress" fill="#10B981" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Employee Performance - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBarChart2 className="w-5 h-5 text-[#10B981]" />
                                Top Employees
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.employees}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #10B981',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Bar dataKey="rate" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Intern Performance - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBarChart2 className="w-5 h-5 text-[#10B981]" />
                                Top Interns
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.interns}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #10B981',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Bar dataKey="performance" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div className="space-y-4">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-4 sm:p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{project.title}</h3>
                                    <p className="text-sm text-gray-600">{project.client}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-bold text-[#10B981]">{project.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-[#10B981] h-3 rounded-full transition-all"
                                    style={{ width: `${project.progress || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
                <div className="space-y-4">
                    {employees.map((employee) => {
                        const empTasks = tasks.filter(t => t.assignedTo === employee.name);
                        const completedTasks = empTasks.filter(t => t.status === 'Completed').length;
                        const progress = empTasks.length > 0 ? ((completedTasks / empTasks.length) * 100).toFixed(1) : 0;

                        return (
                            <div key={employee.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-4 sm:p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{employee.name}</h3>
                                        <p className="text-sm text-gray-600">{employee.department} - {employee.designation}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {employee.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center p-2 bg-blue-50 rounded">
                                        <p className="text-xs text-gray-600">Total Tasks</p>
                                        <p className="text-xl font-bold text-blue-600">{empTasks.length}</p>
                                    </div>
                                    <div className="text-center p-2 bg-green-50 rounded">
                                        <p className="text-xs text-gray-600">Completed</p>
                                        <p className="text-xl font-bold text-green-600">{completedTasks}</p>
                                    </div>
                                    <div className="text-center p-2 bg-orange-50 rounded">
                                        <p className="text-xs text-gray-600">Progress</p>
                                        <p className="text-xl font-bold text-orange-600">{progress}%</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-[#1B5E7E] to-[#10B981] h-3 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Interns Tab */}
            {activeTab === 'interns' && (
                <div className="space-y-4">
                    {interns.map((intern) => (
                        <div key={intern.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-4 sm:p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{intern.name}</h3>
                                    <p className="text-sm text-gray-600">{intern.course} - {intern.college}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${intern.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {intern.status}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Performance</span>
                                <span className="font-bold text-[#10B981]">{intern.performance || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-[#10B981] h-3 rounded-full transition-all"
                                    style={{ width: `${intern.performance || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Progress;
