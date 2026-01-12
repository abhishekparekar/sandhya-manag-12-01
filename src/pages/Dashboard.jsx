import React, { useState, useEffect } from 'react';
import {
    FiUsers, FiBriefcase, FiDollarSign, FiTrendingUp, FiActivity,
    FiPhone, FiBox, FiCreditCard, FiCheckCircle, FiClock, FiUserPlus,
    FiCalendar, FiPhoneOff, FiRefreshCw, FiArrowUp, FiArrowDown, FiPieChart
} from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMetrics } from '../hooks/useMetrics';
import { useAISuggestions } from '../hooks/useAISuggestions';
import MetricCard from '../components/MetricCard';
import AISuggestions from '../components/AISuggestions';
import SkeletonLoader from '../components/SkeletonLoader';
import PullToRefresh from '../components/PullToRefresh';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/ToastContainer';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

const Dashboard = () => {
    const { metrics, loading, error, refresh } = useMetrics('today', false, 5 * 60 * 1000);
    const { suggestions } = useAISuggestions(metrics);
    const [chartData, setChartData] = useState({ monthly: [], leadStatus: [], projectStatus: [] });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const toast = useToast();

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    useEffect(() => {
        fetchChartData();
    }, []);

    const fetchChartData = async () => {
        try {
            const [salesSnap, leadsSnap, projectsSnap] = await Promise.all([
                getDocs(collection(db, 'sales')),
                getDocs(collection(db, 'leads')),
                getDocs(collection(db, 'projects'))
            ]);

            // Monthly revenue data
            const monthlyMap = {};
            salesSnap.docs.forEach(doc => {
                const data = doc.data();
                const month = data.date ? data.date.substring(0, 7) : 'Unknown';
                monthlyMap[month] = (monthlyMap[month] || 0) + Number(data.amount || 0);
            });
            const monthly = Object.entries(monthlyMap)
                .map(([month, revenue]) => ({ month, revenue }))
                .sort((a, b) => a.month.localeCompare(b.month))
                .slice(-6);

            // Lead status distribution
            const statusMap = {};
            leadsSnap.docs.forEach(doc => {
                const status = doc.data().status || 'Unknown';
                statusMap[status] = (statusMap[status] || 0) + 1;
            });
            const leadStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

            // Project status
            const projectMap = {};
            projectsSnap.docs.forEach(doc => {
                const status = doc.data().status || 'Unknown';
                projectMap[status] = (projectMap[status] || 0) + 1;
            });
            const projectStatus = Object.entries(projectMap).map(([name, value]) => ({ name, value }));

            setChartData({ monthly, leadStatus, projectStatus });
        } catch (error) {
            console.error('Error fetching chart data:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refresh();
            await fetchChartData();
            toast.success('Dashboard refreshed successfully!');
        } catch (err) {
            toast.error('Failed to refresh dashboard');
        } finally {
            setIsRefreshing(false);
        }
    };

    if (loading && !metrics) {
        return (
            <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
                <SkeletonLoader variant="card" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <SkeletonLoader variant="metric-card" count={4} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <SkeletonLoader variant="chart" count={2} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <EmptyState
                type="error"
                title="Failed to Load Dashboard"
                description={error}
                primaryAction={{
                    label: 'Retry',
                    onClick: handleRefresh
                }}
            />
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">


            {/* Today's Highlights - Attractive Cards */}
            <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <FiActivity className="w-5 h-5 text-[#F47920]" />
                    Today's Highlights
                </h2>
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
                        <p className="text-xs text-gray-600 font-medium">Sales Revenue</p>
                        <p className="text-xl font-bold text-green-700 mt-1">₹{metrics?.sales?.amount?.toLocaleString() || 0}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{metrics?.sales?.count || 0} transactions</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 border-2 border-red-200 shadow-md hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                                <FiCreditCard className="w-5 h-5 text-white" />
                            </div>
                            <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                                <FiArrowDown className="w-3 h-3" /> 8%
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">Expenses</p>
                        <p className="text-xl font-bold text-red-700 mt-1">₹{metrics?.expenses?.today?.toLocaleString() || 0}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{metrics?.expenses?.count || 0} entries</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <FiUserPlus className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">New Leads</p>
                        <p className="text-xl font-bold text-blue-700 mt-1">{metrics?.leads?.new || 0}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{metrics?.leads?.conversionRate || '0%'} conversion</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                <FiPhone className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">Calls Made</p>
                        <p className="text-xl font-bold text-orange-700 mt-1">{metrics?.calls?.total || 0}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{metrics?.calls?.answerRate || '0%'} answered</p>
                    </div>
                </div>
            </div>



            {/* Charts Section - Beautiful Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Revenue Trend - Line Chart */}
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FiTrendingUp className="w-5 h-5 text-[#F47920]" />
                        Revenue Trend (Last 6 Months)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData.monthly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #F47920',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#F47920"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#F47920' }}
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
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.leadStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #F47920',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Telecalling Metrics */}
            <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <FiPhone className="w-5 h-5 text-[#F47920]" />
                    Telecalling Metrics
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                    <MetricCard
                        title="Total Leads"
                        value={metrics?.leads?.total || 0}
                        subtitle="All contacts"
                        icon={FiUsers}
                        color="teal"
                        loading={loading}
                    />
                    <MetricCard
                        title="Interested"
                        value={metrics?.leads?.interested || 0}
                        subtitle="Hot prospects"
                        icon={FiCheckCircle}
                        color="green"
                        loading={loading}
                    />
                    <MetricCard
                        title="Follow-ups Due"
                        value={metrics?.leads?.followUpsDue || 0}
                        subtitle="Pending"
                        icon={FiClock}
                        color="orange"
                        loading={loading}
                    />
                    <MetricCard
                        title="Not Picked"
                        value={metrics?.leads?.notPicked || 0}
                        subtitle="Unanswered"
                        icon={FiPhoneOff}
                        color="red"
                        loading={loading}
                    />
                </div>
            </div>

            {/* Projects & Team */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Projects with Bar Chart */}
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FiBriefcase className="w-5 h-5 text-[#F47920]" />
                        Projects Status
                    </h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData.projectStatus}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #F47920',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }}
                            />
                            <Bar dataKey="value" fill="#1B5E7E" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Team Performance */}
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <FiUsers className="w-5 h-5 text-[#F47920]" />
                        Team Performance
                    </h2>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <MetricCard
                            title="Tasks Done"
                            value={metrics?.team?.tasksCompleted || 0}
                            subtitle={`${metrics?.team?.productivity || '0%'} rate`}
                            icon={FiCheckCircle}
                            color="green"
                            loading={loading}
                        />
                        <MetricCard
                            title="Team Size"
                            value={metrics?.team?.totalEmployees || 0}
                            subtitle="Employees"
                            icon={FiUsers}
                            color="purple"
                            loading={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Top Performer */}
            {metrics?.calls?.topTelecaller && metrics.calls.topTelecaller !== 'None' && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <FiTrendingUp className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-bold text-gray-800">Top Performer Today</h2>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                            {metrics.calls.topTelecaller.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xl font-bold text-gray-800 mb-1">
                            {metrics.calls.topTelecaller}
                        </p>
                        <p className="text-sm text-gray-600">
                            Highest lead volume today
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs sm:text-sm text-gray-500 py-2">
                <p>
                    Updated: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : 'N/A'}
                    <span className="hidden sm:inline"> • Auto-refreshes every 5 min</span>
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
