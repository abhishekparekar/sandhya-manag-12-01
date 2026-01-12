import React, { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiCalendar, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import {
    getContractors,
    createContractor,
    updateContractor,
    deleteContractor,
    addPaymentMilestone,
    updatePaymentStatus,
    getContractorPayments,
    getExpiringContracts,
    getContractorStatistics,
    CONTRACTOR_TYPES,
    CONTRACT_STATUS,
    PAYMENT_STATUS
} from '../services/contractorService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';

/**
 * Contractors & Freelancers Management Page
 * Manages contractors, freelancers, consultants with payment tracking
 */
const Contractors = () => {
    const { checkPermission } = useAuth();
    const [contractors, setContractors] = useState([]);
    const [expiringContracts, setExpiringContracts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingContractor, setEditingContractor] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedContractor, setSelectedContractor] = useState(null);
    const [payments, setPayments] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        type: CONTRACTOR_TYPES.CONTRACTOR,
        projectId: '',
        projectName: '',
        contractStartDate: '',
        contractEndDate: '',
        rate: '',
        rateType: 'hourly', // hourly, daily, monthly, project
        skills: '',
        notes: ''
    });

    const [paymentForm, setPaymentForm] = useState({
        description: '',
        amount: '',
        dueDate: ''
    });

    const canCreate = checkPermission('contractors', 'create');
    const canUpdate = checkPermission('contractors', 'update');
    const canDelete = checkPermission('contractors', 'delete');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [contractorsData, expiringData, statsData] = await Promise.all([
                getContractors(),
                getExpiringContracts(30),
                getContractorStatistics()
            ]);

            setContractors(contractorsData);
            setExpiringContracts(expiringData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingContractor) {
                await updateContractor(editingContractor.id, formData);
            } else {
                await createContractor(formData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving contractor:', error);
            alert('Error saving contractor');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this contractor?')) {
            try {
                await deleteContractor(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting contractor:', error);
            }
        }
    };

    const handleEdit = (contractor) => {
        setEditingContractor(contractor);
        setFormData(contractor);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingContractor(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            type: CONTRACTOR_TYPES.CONTRACTOR,
            projectId: '',
            projectName: '',
            contractStartDate: '',
            contractEndDate: '',
            rate: '',
            rateType: 'hourly',
            skills: '',
            notes: ''
        });
    };

    const handleViewPayments = async (contractor) => {
        try {
            setSelectedContractor(contractor);
            const paymentsData = await getContractorPayments(contractor.id);
            setPayments(paymentsData);
            setShowPaymentModal(true);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            await addPaymentMilestone(selectedContractor.id, paymentForm);
            const paymentsData = await getContractorPayments(selectedContractor.id);
            setPayments(paymentsData);
            setPaymentForm({ description: '', amount: '', dueDate: '' });
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Error adding payment milestone');
        }
    };

    const handleMarkPaid = async (paymentId, amount) => {
        try {
            await updatePaymentStatus(paymentId, PAYMENT_STATUS.PAID, amount);
            const paymentsData = await getContractorPayments(selectedContractor.id);
            setPayments(paymentsData);
        } catch (error) {
            console.error('Error updating payment:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FiUsers className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Contractors & Freelancers</h1>
                        <p className="text-gray-600 mt-1">Manage external workforce and payments</p>
                    </div>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors"
                    >
                        <FiPlus className="mr-2" />
                        Add Contractor
                    </button>
                )}
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card
                        title="Total Contractors"
                        value={stats.total}
                        subtitle={`${stats.active} active`}
                        icon={FiUsers}
                        color="blue"
                    />
                    <Card
                        title="Active Contracts"
                        value={stats.active}
                        icon={FiCheckCircle}
                        color="green"
                    />
                    <Card
                        title="Total Payments"
                        value={`₹${stats.totalPayments.toLocaleString()}`}
                        icon={FiDollarSign}
                        color="orange"
                    />
                    <Card
                        title="Pending Payments"
                        value={`₹${stats.pendingPayments.toLocaleString()}`}
                        icon={FiAlertCircle}
                        color="red"
                    />
                </div>
            )}

            {/* Expiring Contracts Alert */}
            {expiringContracts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-yellow-800">Contracts Expiring Soon</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                {expiringContracts.length} contract(s) expiring in the next 30 days
                            </p>
                            <div className="mt-2 space-y-1">
                                {expiringContracts.map(contractor => (
                                    <p key={contractor.id} className="text-sm text-yellow-800">
                                        • {contractor.name} - {contractor.expiryInfo.daysRemaining} days remaining
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contractors Table */}
            <Table
                headers={['Name', 'Type', 'Project', 'Contract Period', 'Rate', 'Status', 'Actions']}
                dense
            >
                {contractors.map((contractor) => (
                    <tr key={contractor.id} className="hover:bg-gray-50">
                        <Table.Cell>
                            <div>
                                <p className="font-medium text-gray-800">{contractor.name}</p>
                                <p className="text-sm text-gray-500">{contractor.email}</p>
                            </div>
                        </Table.Cell>
                        <Table.Cell>
                            <span className="badge badge-info">{contractor.type}</span>
                        </Table.Cell>
                        <Table.Cell className="text-gray-600">{contractor.projectName || '-'}</Table.Cell>
                        <Table.Cell>
                            <div className="text-sm">
                                <p>{contractor.contractStartDate}</p>
                                <p className="text-gray-500">to {contractor.contractEndDate}</p>
                            </div>
                        </Table.Cell>
                        <Table.Cell className="font-medium">
                            ₹{contractor.rate}/{contractor.rateType}
                        </Table.Cell>
                        <Table.Cell>
                            <span className={`badge ${contractor.status === CONTRACT_STATUS.ACTIVE ? 'badge-success' :
                                    contractor.status === CONTRACT_STATUS.EXPIRED ? 'badge-error' :
                                        'badge-warning'
                                }`}>
                                {contractor.status}
                            </span>
                        </Table.Cell>
                        <Table.Cell>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleViewPayments(contractor)}
                                    className="touch-target text-green-600 hover:text-green-800"
                                    title="View payments"
                                >
                                    <FiDollarSign className="icon icon-sm" />
                                </button>
                                {canUpdate && (
                                    <button
                                        onClick={() => handleEdit(contractor)}
                                        className="touch-target text-blue-600 hover:text-blue-800"
                                        title="Edit contractor"
                                    >
                                        <FiEdit2 className="icon icon-sm" />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(contractor.id)}
                                        className="touch-target text-red-600 hover:text-red-800"
                                        title="Delete contractor"
                                    >
                                        <FiTrash2 className="icon icon-sm" />
                                    </button>
                                )}
                            </div>
                        </Table.Cell>
                    </tr>
                ))}
            </Table>

            {/* Add/Edit Contractor Modal */}
            {showModal && (
                <Modal
                    onClose={handleCloseModal}
                    title={editingContractor ? 'Edit Contractor' : 'Add New Contractor'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    {Object.values(CONTRACTOR_TYPES).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.projectName}
                                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Type</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.rateType}
                                    onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}
                                >
                                    <option value="hourly">Hourly</option>
                                    <option value="daily">Daily</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="project">Project</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.rate}
                                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Start *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.contractStartDate}
                                    onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contract End *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.contractEndDate}
                                    onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                    placeholder="e.g., React, Node.js, Python"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors"
                            >
                                {editingContractor ? 'Update' : 'Add'} Contractor
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedContractor && (
                <Modal
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedContractor(null);
                        setPayments([]);
                    }}
                    title={`Payments - ${selectedContractor.name}`}
                >
                    <div className="space-y-4">
                        {/* Add Payment Form */}
                        <form onSubmit={handleAddPayment} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-bold text-gray-800 mb-3">Add Payment Milestone</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    required
                                    placeholder="Description"
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={paymentForm.description}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                />
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    placeholder="Amount (₹)"
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                />
                                <input
                                    type="date"
                                    required
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={paymentForm.dueDate}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="mt-3 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors text-sm"
                            >
                                Add Milestone
                            </button>
                        </form>

                        {/* Payments List */}
                        <div className="space-y-2">
                            <h4 className="font-bold text-gray-800">Payment History</h4>
                            {payments.length === 0 ? (
                                <p className="text-gray-500 text-sm">No payments recorded</p>
                            ) : (
                                payments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{payment.description}</p>
                                            <p className="text-sm text-gray-500">Due: {payment.dueDate}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-gray-800">₹{payment.amount?.toLocaleString()}</p>
                                            {payment.status === PAYMENT_STATUS.PAID ? (
                                                <span className="badge badge-success">Paid</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleMarkPaid(payment.id, payment.amount)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Contractors;
