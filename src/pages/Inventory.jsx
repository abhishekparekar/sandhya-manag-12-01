import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiPackage, FiAlertTriangle,
    FiCheckCircle, FiTruck, FiArrowUp, FiArrowDown,
    FiPieChart, FiBarChart2, FiActivity, FiBox
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';
import Table from '../components/Table';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState({ categories: [], status: [], vendors: [] });

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const [formData, setFormData] = useState({
        itemName: '',
        category: 'Electronics',
        quantity: 0,
        status: 'Available',
        assignedTo: '',
        vendor: '',
        price: ''
    });

    const categories = ['Electronics', 'Furniture', 'Stationery', 'Accessories', 'Others'];
    const statuses = ['Available', 'Assigned', 'Damaged', 'Lost'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [itemsSnap, employeesSnap] = await Promise.all([
                getDocs(collection(db, 'inventory')),
                getDocs(collection(db, 'employees'))
            ]);

            const itemsList = itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const employeesList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setItems(itemsList);
            setEmployees(employeesList);
            generateChartData(itemsList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (itemsList) => {
        // Category distribution
        const categoryMap = {};
        itemsList.forEach(i => {
            const cat = i.category || 'Others';
            categoryMap[cat] = (categoryMap[cat] || 0) + Number(i.quantity || 0);
        });
        const categories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

        // Status distribution
        const statusMap = {};
        itemsList.forEach(i => {
            const status = i.status || 'Available';
            statusMap[status] = (statusMap[status] || 0) + 1;
        });
        const status = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        // Top vendors
        const vendorMap = {};
        itemsList.forEach(i => {
            if (i.vendor) {
                vendorMap[i.vendor] = (vendorMap[i.vendor] || 0) + 1;
            }
        });
        const vendors = Object.entries(vendorMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        setChartData({ categories, status, vendors });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const itemData = { ...formData, createdAt: new Date().toISOString() };
            if (editingItem) {
                await updateDoc(doc(db, 'inventory', editingItem.id), itemData);
            } else {
                await addDoc(collection(db, 'inventory'), itemData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving item:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteDoc(doc(db, 'inventory', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting item:", error);
            }
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData(item);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            itemName: '', category: 'Electronics', quantity: 0,
            status: 'Available', assignedTo: '', vendor: '', price: ''
        });
    };

    const totalItems = items.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
    const assignedItems = items.filter(i => i.status === 'Assigned').length;
    const availableItems = items.filter(i => i.status === 'Available').length;
    const lowStockItems = items.filter(i => Number(i.quantity) < 10).length;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14B8A6]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
           
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-3 sm:px-4 py-2 bg-white text-[#14B8A6] rounded-lg hover:bg-teal-50 text-sm font-medium shadow-md"
                    >
                        <FiPlus className="mr-2 w-4 h-4" /> Add Item
                    </button>
            

            {/* Gradient Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl p-4 border-2 border-teal-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                            <FiPackage className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-teal-600 text-xs font-medium">
                            <FiArrowUp className="w-3 h-3" /> 8%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Items</p>
                    <p className="text-xl font-bold text-teal-700 mt-1">{totalItems}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{items.length} unique</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <FiCheckCircle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Available</p>
                    <p className="text-xl font-bold text-green-700 mt-1">{availableItems}</p>
                    <p className="text-[10px] text-gray-500 mt-1">In stock</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FiBox className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Assigned</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{assignedItems}</p>
                    <p className="text-[10px] text-gray-500 mt-1">In use</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <FiAlertTriangle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Low Stock</p>
                    <p className="text-xl font-bold text-orange-700 mt-1">{lowStockItems}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Need reorder</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'overview', label: 'Overview', icon: FiPieChart },
                    { key: 'items', label: 'Items', icon: FiPackage }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                ? 'bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white shadow-lg'
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
                                <FiPieChart className="w-5 h-5 text-[#14B8A6]" />
                                Items by Category
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
                                        border: '2px solid #14B8A6',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Status Distribution - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBarChart2 className="w-5 h-5 text-[#14B8A6]" />
                                Items by Status
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.status}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #14B8A6',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Bar dataKey="value" fill="#14B8A6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Vendors - Bar Chart */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiTruck className="w-5 h-5 text-[#14B8A6]" />
                            Top Vendors
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData.vendors}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #14B8A6',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }} />
                                <Bar dataKey="value" fill="#0D9488" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Items Tab */}
            {activeTab === 'items' && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
                    <Table headers={['Item Name', 'Category', 'Quantity', 'Status', 'Assigned To', 'Vendor', 'Actions']} dense>
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell className="font-medium text-gray-900">{item.itemName}</Table.Cell>
                                <Table.Cell>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                                        {item.category}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="font-bold text-gray-800">{item.quantity}</Table.Cell>
                                <Table.Cell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Available' ? 'bg-green-100 text-green-700' :
                                            item.status === 'Assigned' ? 'bg-blue-100 text-blue-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {item.status}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="text-gray-600">{item.assignedTo || '-'}</Table.Cell>
                                <Table.Cell className="text-gray-600">{item.vendor || '-'}</Table.Cell>
                                <Table.Cell>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
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
                <Modal onClose={handleCloseModal} title={editingItem ? 'Edit Item' : 'Add New Item'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input type="number" required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}>
                                    <option value="">Not Assigned</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0D9488]">
                                {editingItem ? 'Update' : 'Add'} Item
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Inventory;
