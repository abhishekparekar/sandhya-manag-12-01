import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { FiDownload, FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiBriefcase, FiCalendar, FiPieChart, FiBarChart2, FiPhone, FiBox } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import Card from '../components/Card';
import Table from '../components/Table';

const Reports = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalExpenses: 0,
        profit: 0,
        totalProjects: 0,
        completedProjects: 0,
        totalEmployees: 0,
        totalInterns: 0,
        totalTasks: 0,
        totalLeads: 0,
        totalInventory: 0
    });

    const [companySettings, setCompanySettings] = useState({
        companyName: 'Sandhya Softtech',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        logoUrl: ''
    });

    const [salesData, setSalesData] = useState([]);
    const [expensesData, setExpensesData] = useState([]);
    const [projectsData, setProjectsData] = useState([]);
    const [employeesData, setEmployeesData] = useState([]);
    const [internsData, setInternsData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [leadsData, setLeadsData] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch Company Settings
            const settingsDoc = await getDoc(doc(db, 'settings', 'company'));
            if (settingsDoc.exists()) {
                setCompanySettings(settingsDoc.data());
            }

            const [salesSnap, expensesSnap, projectsSnap, employeesSnap, internsSnap, attendanceSnap, tasksSnap, leadsSnap, inventorySnap] = await Promise.all([
                getDocs(collection(db, 'sales')),
                getDocs(collection(db, 'expenses')),
                getDocs(collection(db, 'projects')),
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'interns')),
                getDocs(collection(db, 'attendance')),
                getDocs(collection(db, 'tasks')),
                getDocs(collection(db, 'leads')),
                getDocs(collection(db, 'inventory'))
            ]);

            const sales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const interns = internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const attendance = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const inventory = inventorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setSalesData(sales);
            setExpensesData(expenses);
            setProjectsData(projects);
            setEmployeesData(employees);
            setInternsData(interns);
            setAttendanceData(attendance);
            setLeadsData(leads);
            setInventoryData(inventory);

            const totalSales = sales.reduce((acc, doc) => acc + Number(doc.amount || 0), 0);
            const totalExpenses = expenses.reduce((acc, doc) => acc + Number(doc.amount || 0), 0);

            setStats({
                totalSales,
                totalExpenses,
                profit: totalSales - totalExpenses,
                totalProjects: projects.length,
                completedProjects: projects.filter(p => p.status === 'Completed').length,
                totalEmployees: employees.length,
                totalInterns: interns.length,
                totalTasks: tasksSnap.size,
                totalLeads: leads.length,
                totalInventory: inventory.length
            });
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to load image from URL for PDF
    const getDataUri = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";

            const timeout = setTimeout(() => {
                console.warn("Logo load timed out (likely CORS issue)");
                resolve(null);
            }, 3000);

            img.onload = function () {
                clearTimeout(timeout);
                const canvas = document.createElement('canvas');
                canvas.width = this.naturalWidth;
                canvas.height = this.naturalHeight;
                try {
                    canvas.getContext('2d').drawImage(this, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    console.warn("Canvas tainted (CORS issue):", e);
                    resolve(null);
                }
            };

            img.onerror = (error) => {
                clearTimeout(timeout);
                console.warn("Could not load logo for PDF:", error);
                resolve(null);
            };

            img.src = url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        });
    };

    const exportToPDF = async (title, data, columns) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // Professional Header Section
            let logoData = null;
            if (companySettings.logoBase64) {
                logoData = companySettings.logoBase64;
            } else if (companySettings.logoUrl) {
                logoData = await getDataUri(companySettings.logoUrl);
            }

            let logoHeight = 0;
            if (logoData) {
                try {
                    const logoWidth = 40;
                    const logoMaxHeight = 20;

                    doc.setFillColor(255, 255, 255);
                    doc.roundedRect(12, 8, logoWidth + 4, logoMaxHeight + 4, 2, 2, 'F');

                    doc.setDrawColor(230, 230, 230);
                    doc.setLineWidth(0.5);
                    doc.roundedRect(12, 8, logoWidth + 4, logoMaxHeight + 4, 2, 2, 'S');

                    doc.addImage(logoData, 'PNG', 14, 10, logoWidth, logoMaxHeight);
                    logoHeight = logoMaxHeight + 4;
                } catch (err) {
                    console.warn("Failed to add image to PDF:", err);
                }
            }

            const headerStartY = Math.max(15, logoHeight + 5);

            doc.setFontSize(24);
            doc.setTextColor(244, 121, 32);
            doc.setFont('helvetica', 'bold');
            doc.text(companySettings.companyName || 'Sandhya Softtech', pageWidth - 14, headerStartY, { align: 'right' });

            doc.setFontSize(14);
            doc.setTextColor(27, 94, 126);
            doc.setFont('helvetica', 'bold');
            doc.text(title.toUpperCase(), pageWidth - 14, headerStartY + 8, { align: 'right' });

            doc.setDrawColor(244, 121, 32);
            doc.setLineWidth(1);
            doc.line(14, headerStartY + 12, pageWidth - 14, headerStartY + 12);

            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            doc.setFont('helvetica', 'normal');

            let yPos = headerStartY + 18;
            const detailsX = pageWidth - 14;

            if (companySettings.companyAddress) {
                const addressLines = doc.splitTextToSize(companySettings.companyAddress, 70);
                doc.text(addressLines, detailsX, yPos, { align: 'right' });
                yPos += (addressLines.length * 3.5);
            }

            if (companySettings.companyEmail) {
                doc.text(`Email: ${companySettings.companyEmail}`, detailsX, yPos, { align: 'right' });
                yPos += 4;
            }

            if (companySettings.companyPhone) {
                doc.text(`Phone: ${companySettings.companyPhone}`, detailsX, yPos, { align: 'right' });
                yPos += 4;
            }

            const metaStartY = Math.max(yPos + 8, headerStartY + 35);
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'italic');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, metaStartY);

            const tableStartY = metaStartY + 6;

            autoTable(doc, {
                startY: tableStartY,
                head: [columns],
                body: data,
                theme: 'grid',
                headStyles: {
                    fillColor: [244, 121, 32],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    textColor: 50
                },
                alternateRowStyles: {
                    fillColor: [250, 245, 240]
                },
                didDrawPage: (data) => {
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text(`Page ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
                    doc.text('Confidential Report - Internal Use Only', 14, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            alert(`Failed to export PDF: ${error.message}`);
        }
    };

    const exportToCSV = (data, filename) => {
        try {
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (error) {
            console.error("Error exporting CSV:", error);
            alert("Failed to export CSV. Please try again.");
        }
    };

    // Chart Data Helpers
    const getSalesChartData = () => {
        const monthlyData = {};
        salesData.forEach(sale => {
            const month = sale.date ? sale.date.substring(0, 7) : 'Unknown';
            monthlyData[month] = (monthlyData[month] || 0) + Number(sale.amount || 0);
        });
        return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })).slice(-6);
    };

    const getExpensesByCategoryData = () => {
        const categoryData = {};
        expensesData.forEach(expense => {
            const category = expense.category || 'Others';
            categoryData[category] = (categoryData[category] || 0) + Number(expense.amount || 0);
        });
        return Object.entries(categoryData).map(([name, value]) => ({ name, value }));
    };

    const getProjectStatusData = () => [
        { name: 'Completed', value: stats.completedProjects },
        { name: 'In Progress', value: stats.totalProjects - stats.completedProjects }
    ];

    const getDepartmentData = () => {
        const deptData = {};
        employeesData.forEach(emp => {
            const dept = emp.department || 'Others';
            deptData[dept] = (deptData[dept] || 0) + 1;
        });
        return Object.entries(deptData).map(([name, count]) => ({ name, count }));
    };

    const getAttendanceData = () => {
        const last7Days = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last7Days[dateStr] = { date: dateStr, present: 0, absent: 0 };
        }
        attendanceData.forEach(record => {
            if (last7Days[record.date]) {
                if (record.status === 'Present') last7Days[record.date].present++;
                else last7Days[record.date].absent++;
            }
        });
        return Object.values(last7Days);
    };

    const getLeadStatusData = () => {
        const statusData = {};
        leadsData.forEach(lead => {
            const status = lead.status || 'Unknown';
            statusData[status] = (statusData[status] || 0) + 1;
        });
        return Object.entries(statusData).map(([name, value]) => ({ name, value }));
    };

    const getInventoryStatusData = () => {
        const lowStock = inventoryData.filter(item => item.quantity <= (item.minStock || 10)).length;
        const inStock = inventoryData.length - lowStock;
        return [
            { name: 'In Stock', value: inStock },
            { name: 'Low Stock', value: lowStock }
        ];
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    const profitMargin = stats.totalSales > 0 ? ((stats.profit / stats.totalSales) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Header - Mobile Optimized */}
          
               
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => exportToCSV(salesData, 'Sales_Report')}
                        className="flex items-center flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md text-xs sm:text-sm font-medium"
                    >
                        <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Export</span> CSV
                    </button>
                    <button
                        onClick={() => exportToPDF('Complete Business Report',
                            salesData.map(s => [s.date, s.client, s.amount, s.paymentStatus]),
                            ['Date', 'Client', 'Amount', 'Status']
                        )}
                        className="flex items-center flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md text-xs sm:text-sm font-medium"
                    >
                        <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Export</span> PDF
                    </button>
                </div>
            

            {/* Tabs - Mobile Optimized with Scroll */}
            <div className="flex gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-thin">
                {[
                    { key: 'overview', label: 'Overview', icon: <FiBarChart2 /> },
                    { key: 'telecalling', label: 'Telecalling', icon: <FiPhone /> },
                    { key: 'sales', label: 'Sales', icon: <FiDollarSign /> },
                    { key: 'projects', label: 'Projects', icon: <FiBriefcase /> },
                    { key: 'employees', label: 'Employees', icon: <FiUsers /> },
                    { key: 'expenses', label: 'Expenses', icon: <FiTrendingDown /> },
                    { key: 'inventory', label: 'Inventory', icon: <FiBox /> }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-t-lg ${activeTab === tab.key
                            ? 'bg-white text-[#F47920] border-b-2 border-[#F47920] shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <span className="text-sm sm:text-base">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6 animate-fade-in">
                    {/* Financial Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                        <Card
                            title="Total Revenue"
                            value={`₹${stats.totalSales.toLocaleString()}`}
                            subtitle="Income"
                            icon={FiDollarSign}
                            color="green"
                            trend="up"
                            trendValue="12%"
                        />
                        <Card
                            title="Total Expenses"
                            value={`₹${stats.totalExpenses.toLocaleString()}`}
                            subtitle="Outflow"
                            icon={FiTrendingDown}
                            color="red"
                        />
                        <Card
                            title="Net Profit"
                            value={`₹${stats.profit.toLocaleString()}`}
                            subtitle={`Margin: ${profitMargin}%`}
                            icon={FiTrendingUp}
                            color="purple"
                        />
                    </div>

                    {/* Operational Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                        <Card title="Projects" value={stats.totalProjects} subtitle={`${stats.completedProjects} done`} icon={FiBriefcase} color="blue" />
                        <Card title="Employees" value={stats.totalEmployees} icon={FiUsers} color="indigo" />
                        <Card title="Leads" value={stats.totalLeads} icon={FiPhone} color="orange" />
                        <Card title="Inventory" value={stats.totalInventory} icon={FiBox} color="teal" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Sales Trend */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                            <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                                <FiTrendingUp className="text-[#F47920]" /> Sales Trend
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={getSalesChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Line type="monotone" dataKey="amount" stroke="#F47920" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Expenses by Category */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                            <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                                <FiPieChart className="text-red-500" /> Expenses
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={getExpensesByCategoryData()} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {getExpensesByCategoryData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Lead Status */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                            <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                                <FiPhone className="text-orange-500" /> Lead Status
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={getLeadStatusData()} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                                        {getLeadStatusData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Inventory Status */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                            <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                                <FiBox className="text-teal-500" /> Inventory
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={getInventoryStatusData()} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                                        {getInventoryStatusData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Telecalling Report Tab */}
            {activeTab === 'telecalling' && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Telecalling Report</h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => exportToCSV(leadsData, 'Telecalling_Report')} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> CSV
                            </button>
                            <button onClick={() => exportToPDF('Telecalling Report', leadsData.map(l => [l.name || '', l.phone || '', l.status || '', l.telecaller || '', l.lastCallDate || '']), ['Name', 'Phone', 'Status', 'Telecaller', 'Last Call'])} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> PDF
                            </button>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                        {leadsData.map((lead) => (
                            <div key={lead.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{lead.name}</p>
                                        <p className="text-xs text-gray-600">{lead.phone}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${lead.status === 'Interested' ? 'bg-green-100 text-green-700' :
                                            lead.status === 'Follow-up' ? 'bg-yellow-100 text-yellow-700' :
                                                lead.status === 'Not Interested' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {lead.status}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p><strong>Company:</strong> {lead.company || '-'}</p>
                                    <p><strong>Telecaller:</strong> {lead.telecaller || 'Unassigned'}</p>
                                    <p><strong>Last Call:</strong> {lead.lastCallDate || '-'}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                        <Table headers={['Name', 'Phone', 'Company', 'Status', 'Telecaller', 'Last Call']} dense>
                            {leadsData.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                    <Table.Cell className="font-medium text-gray-900">{lead.name}</Table.Cell>
                                    <Table.Cell className="text-gray-600">{lead.phone}</Table.Cell>
                                    <Table.Cell className="text-gray-600">{lead.company || '-'}</Table.Cell>
                                    <Table.Cell>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${lead.status === 'Interested' ? 'bg-green-100 text-green-700' :
                                                lead.status === 'Follow-up' ? 'bg-yellow-100 text-yellow-700' :
                                                    lead.status === 'Not Interested' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                            }`}>
                                            {lead.status}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="text-gray-600">{lead.telecaller || 'Unassigned'}</Table.Cell>
                                    <Table.Cell className="text-gray-600">{lead.lastCallDate || '-'}</Table.Cell>
                                </tr>
                            ))}
                        </Table>
                    </div>
                </div>
            )}

            {/* Sales Report Tab */}
            {activeTab === 'sales' && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Sales Report</h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => exportToCSV(salesData, 'Sales_Report')} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> CSV
                            </button>
                            <button onClick={() => exportToPDF('Sales Report', salesData.map(s => [s.date || '', s.client || '', `₹${s.amount || 0}`, s.paymentStatus || '']), ['Date', 'Client', 'Amount', 'Payment Status'])} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> PDF
                            </button>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                        {salesData.map((sale) => (
                            <div key={sale.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{sale.client}</p>
                                        <p className="text-xs text-gray-600">{sale.project}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {sale.paymentStatus}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-600">{sale.date}</span>
                                    <span className="font-bold text-[#F47920]">₹{Number(sale.amount).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                        <Table headers={['Date', 'Client', 'Project', 'Amount', 'Status']} dense>
                            {salesData.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                    <Table.Cell>{sale.date}</Table.Cell>
                                    <Table.Cell className="font-medium text-gray-900">{sale.client}</Table.Cell>
                                    <Table.Cell className="text-gray-600 text-truncate">{sale.project}</Table.Cell>
                                    <Table.Cell align="right" className="font-bold text-[#F47920]">₹{Number(sale.amount).toLocaleString()}</Table.Cell>
                                    <Table.Cell>
                                        <span className={`badge ${sale.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                                            {sale.paymentStatus}
                                        </span>
                                    </Table.Cell>
                                </tr>
                            ))}
                        </Table>
                    </div>
                </div>
            )}

            {/* Projects Report Tab */}
            {activeTab === 'projects' && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Projects Report</h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => exportToCSV(projectsData, 'Projects_Report')} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> CSV
                            </button>
                            <button onClick={() => exportToPDF('Projects Report', projectsData.map(p => [p.title || '', p.client || '', `${p.progress || 0}%`, p.status || '']), ['Project', 'Client', 'Progress', 'Status'])} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> PDF
                            </button>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                        {projectsData.map((project) => (
                            <div key={project.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 text-sm">{project.title}</p>
                                        <p className="text-xs text-gray-600">{project.client}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="font-medium">{project.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div className="bg-[#F47920] h-1.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-700"><strong>Budget:</strong> ₹{Number(project.budget || 0).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                        <Table headers={['Project', 'Client', 'Budget', 'Progress', 'Status']} dense>
                            {projectsData.map((project) => (
                                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                    <Table.Cell className="font-medium text-gray-900">{project.title}</Table.Cell>
                                    <Table.Cell className="text-gray-600">{project.client}</Table.Cell>
                                    <Table.Cell align="right" className="font-bold text-[#F47920]">₹{Number(project.budget || 0).toLocaleString()}</Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div className="bg-[#F47920] h-2 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                                            </div>
                                            <span className="text-sm font-medium">{project.progress || 0}%</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className={`badge ${project.status === 'Completed' ? 'badge-success' :
                                                project.status === 'In Progress' ? 'badge-info' : 'badge-warning'
                                            }`}>
                                            {project.status}
                                        </span>
                                    </Table.Cell>
                                </tr>
                            ))}
                        </Table>
                    </div>
                </div>
            )}

            {/* Employees Report Tab */}
            {activeTab === 'employees' && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Employees Report</h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => exportToCSV(employeesData, 'Employees_Report')} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> CSV
                            </button>
                            <button onClick={() => exportToPDF('Employees Report', employeesData.map(e => [e.name || '', e.position || '', e.department || '', e.salary || '', e.email || '']), ['Name', 'Position', 'Department', 'Salary', 'Email'])} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> PDF
                            </button>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                        {employeesData.map((emp) => (
                            <div key={emp.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                                <p className="font-bold text-gray-900 text-sm mb-1">{emp.name}</p>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p><strong>Position:</strong> {emp.position}</p>
                                    <p><strong>Department:</strong> {emp.department || '-'}</p>
                                    <p><strong>Email:</strong> {emp.email || '-'}</p>
                                    {emp.salary && <p><strong>Salary:</strong> ₹{Number(emp.salary).toLocaleString()}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                        <Table headers={['Name', 'Position', 'Department', 'Email', 'Salary']} dense>
                            {employeesData.map((emp) => (
                                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                    <Table.Cell className="font-medium text-gray-900">{emp.name}</Table.Cell>
                                    <Table.Cell className="text-gray-600">{emp.position}</Table.Cell>
                                    <Table.Cell className="text-gray-600">{emp.department || '-'}</Table.Cell>
                                    <Table.Cell className="text-gray-600">{emp.email || '-'}</Table.Cell>
                                    <Table.Cell align="right" className="font-bold text-[#F47920]">
                                        {emp.salary ? `₹${Number(emp.salary).toLocaleString()}` : '-'}
                                    </Table.Cell>
                                </tr>
                            ))}
                        </Table>
                    </div>
                </div>
            )}

            {/* Expenses Report Tab */}
            {activeTab === 'expenses' && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Expenses Report</h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => exportToCSV(expensesData, 'Expenses_Report')} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> CSV
                            </button>
                            <button onClick={() => exportToPDF('Expenses Report', expensesData.map(e => [e.date || '', e.category || '', `₹${e.amount || 0}`, e.paidTo || '']), ['Date', 'Category', 'Amount', 'Paid To'])} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> PDF
                            </button>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                        {expensesData.map((expense) => (
                            <div key={expense.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium mb-1">
                                            {expense.category}
                                        </span>
                                        <p className="text-xs text-gray-600">{expense.date}</p>
                                    </div>
                                    <span className="font-bold text-red-600 text-sm">₹{Number(expense.amount).toLocaleString()}</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    <p><strong>Paid To:</strong> {expense.paidTo || '-'}</p>
                                    <p><strong>Method:</strong> {expense.paymentMethod}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                        <Table headers={['Date', 'Category', 'Amount', 'Paid To', 'Method']} dense>
                            {expensesData.map((expense) => (
                                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                    <Table.Cell>{expense.date}</Table.Cell>
                                    <Table.Cell>
                                        <span className="badge badge-info">{expense.category}</span>
                                    </Table.Cell>
                                    <Table.Cell align="right" className="font-bold text-red-600">₹{Number(expense.amount).toLocaleString()}</Table.Cell>
                                    <Table.Cell className="text-gray-600">{expense.paidTo || '-'}</Table.Cell>
                                    <Table.Cell className="text-gray-600">{expense.paymentMethod}</Table.Cell>
                                </tr>
                            ))}
                        </Table>
                    </div>
                </div>
            )}

            {/* Inventory Report Tab */}
            {activeTab === 'inventory' && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Inventory Report</h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => exportToCSV(inventoryData, 'Inventory_Report')} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> CSV
                            </button>
                            <button onClick={() => exportToPDF('Inventory Report', inventoryData.map(i => [i.name || '', i.category || '', i.quantity || 0, i.minStock || 0, i.supplier || '']), ['Item', 'Category', 'Quantity', 'Min Stock', 'Supplier'])} className="flex items-center flex-1 sm:flex-initial px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm">
                                <FiDownload className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> PDF
                            </button>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                        {inventoryData.map((item) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium mt-1">
                                            {item.category}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.quantity <= (item.minStock || 10) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {item.quantity <= (item.minStock || 10) ? 'Low Stock' : 'In Stock'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p><strong>Quantity:</strong> {item.quantity || 0}</p>
                                    <p><strong>Min Stock:</strong> {item.minStock || 0}</p>
                                    <p><strong>Supplier:</strong> {item.supplier || '-'}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                        <Table headers={['Item', 'Category', 'Quantity', 'Min Stock', 'Supplier', 'Status']} dense>
                            {inventoryData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <Table.Cell className="font-medium text-gray-900">{item.name}</Table.Cell>
                                    <Table.Cell>
                                        <span className="badge badge-info">{item.category}</span>
                                    </Table.Cell>
                                    <Table.Cell align="center" className="font-bold text-gray-800">{item.quantity || 0}</Table.Cell>
                                    <Table.Cell align="center" className="text-gray-600">{item.minStock || 0}</Table.Cell>
                                    <Table.Cell className="text-gray-600">{item.supplier || '-'}</Table.Cell>
                                    <Table.Cell>
                                        <span className={`badge ${item.quantity <= (item.minStock || 10) ? 'badge-danger' : 'badge-success'
                                            }`}>
                                            {item.quantity <= (item.minStock || 10) ? 'Low Stock' : 'In Stock'}
                                        </span>
                                    </Table.Cell>
                                </tr>
                            ))}
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
