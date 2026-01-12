import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiTrash2, FiDownload, FiAward, FiBookOpen, FiStar,
    FiArrowUp, FiPieChart, FiBarChart2
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const Certificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState({ types: [], monthly: [] });

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const [formData, setFormData] = useState({
        type: 'Internship',
        recipientName: '',
        course: '',
        college: '',
        startDate: '',
        endDate: '',
        performance: '',
        internId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [certsSnap, internsSnap] = await Promise.all([
                getDocs(collection(db, 'certificates')),
                getDocs(collection(db, 'interns'))
            ]);

            const certsList = certsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const internsList = internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setCertificates(certsList);
            setInterns(internsList);
            generateChartData(certsList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (certsList) => {
        // Certificate types
        const typeMap = {};
        certsList.forEach(c => {
            const type = c.type || 'Unknown';
            typeMap[type] = (typeMap[type] || 0) + 1;
        });
        const types = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

        // Monthly generation (last 6 months)
        const monthly = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const month = date.toISOString().slice(0, 7);
            const monthCerts = certsList.filter(c => c.generatedAt && c.generatedAt.startsWith(month));
            return { month: month.substring(5), count: monthCerts.length };
        });

        setChartData({ types, monthly });
    };

    const generateQRCode = async (certificateId) => {
        try {
            const verificationUrl = `https://sandhya-softtech.com/verify/${certificateId}`;
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 200, margin: 1 });
            return qrDataUrl;
        } catch (error) {
            console.error("Error generating QR code:", error);
            return null;
        }
    };

    const generatePDF = async (certificate) => {
        try {
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            // Background
            doc.setFillColor(255, 249, 245);
            doc.rect(0, 0, 297, 210, 'F');

            // Border
            doc.setDrawColor(244, 121, 32);
            doc.setLineWidth(2);
            doc.rect(10, 10, 277, 190);

            // Inner border
            doc.setDrawColor(27, 94, 126);
            doc.setLineWidth(0.5);
            doc.rect(15, 15, 267, 180);

            // Title
            doc.setFontSize(40);
            doc.setTextColor(244, 121, 32);
            doc.setFont('helvetica', 'bold');
            doc.text('CERTIFICATE', 148.5, 40, { align: 'center' });

            // Subtitle
            doc.setFontSize(16);
            doc.setTextColor(27, 94, 126);
            doc.setFont('helvetica', 'normal');
            doc.text(`of ${certificate.type}`, 148.5, 50, { align: 'center' });

            // Divider
            doc.setDrawColor(244, 121, 32);
            doc.setLineWidth(0.5);
            doc.line(60, 55, 237, 55);

            // Content
            doc.setFontSize(14);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');
            doc.text('This is to certify that', 148.5, 70, { align: 'center' });

            // Recipient Name
            doc.setFontSize(28);
            doc.setTextColor(27, 94, 126);
            doc.setFont('helvetica', 'bold');
            doc.text(certificate.recipientName, 148.5, 85, { align: 'center' });

            // Details
            doc.setFontSize(12);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');

            if (certificate.type === 'Internship') {
                doc.text(`has successfully completed an internship in ${certificate.course}`, 148.5, 100, { align: 'center' });
                doc.text(`at Sandhya Softtech from ${certificate.startDate} to ${certificate.endDate}`, 148.5, 110, { align: 'center' });
                if (certificate.performance) {
                    doc.text(`with a performance rating of ${certificate.performance}%`, 148.5, 120, { align: 'center' });
                }
            } else {
                doc.text(`has successfully completed the ${certificate.course} program`, 148.5, 100, { align: 'center' });
                doc.text(`from ${certificate.startDate} to ${certificate.endDate}`, 148.5, 110, { align: 'center' });
            }

            // QR Code
            const qrCode = await generateQRCode(certificate.id);
            if (qrCode) {
                doc.addImage(qrCode, 'PNG', 20, 150, 30, 30);
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Scan to verify', 35, 185, { align: 'center' });
            }

            // Company Info
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'bold');
            doc.text('Sandhya Softtech', 148.5, 160, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('Software Development Company', 148.5, 167, { align: 'center' });

            // Date
            doc.setFontSize(10);
            doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 250, 180, { align: 'right' });

            // Certificate ID
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Certificate ID: ${certificate.id}`, 148.5, 195, { align: 'center' });

            // Save PDF
            doc.save(`${certificate.recipientName}_${certificate.type}_Certificate.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error generating PDF. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const certData = { ...formData, generatedAt: new Date().toISOString() };
            await addDoc(collection(db, 'certificates'), certData);
            fetchData();
            handleCloseModal();
            alert("Certificate created successfully!");
        } catch (error) {
            console.error("Error creating certificate:", error);
            alert("Error creating certificate. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this certificate?')) {
            try {
                await deleteDoc(doc(db, 'certificates', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting certificate:", error);
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            type: 'Internship', recipientName: '', course: '', college: '',
            startDate: '', endDate: '', performance: '', internId: ''
        });
    };

    const totalCertificates = certificates.length;
    const internshipCerts = certificates.filter(c => c.type === 'Internship').length;
    const completionCerts = certificates.filter(c => c.type === 'Completion').length;

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
                        <FiPlus className="mr-2 w-4 h-4" /> Create Certificate
                    </button>
           

            {/* Gradient Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <FiAward className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-purple-600 text-xs font-medium">
                            <FiArrowUp className="w-3 h-3" /> 20%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Total Certificates</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{totalCertificates}</p>
                    <p className="text-[10px] text-gray-500 mt-1">All generated</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FiBookOpen className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Internship</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{internshipCerts}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Intern certs</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <FiStar className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Completion</p>
                    <p className="text-xl font-bold text-green-700 mt-1">{completionCerts}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Course certs</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'overview', label: 'Overview', icon: FiPieChart },
                    { key: 'certificates', label: 'Certificates', icon: FiAward }
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
                        {/* Certificate Types - Pie Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPieChart className="w-5 h-5 text-[#F59E0B]" />
                                Certificate Types
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={chartData.types}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {chartData.types.map((entry, index) => (
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

                        {/* Monthly Generation - Bar Chart */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBarChart2 className="w-5 h-5 text-[#F59E0B]" />
                                Monthly Generation
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.monthly}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #F59E0B',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }} />
                                    <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificates Tab */}
            {activeTab === 'certificates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {certificates.map((certificate) => (
                        <div key={certificate.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-[#F59E0B] bg-opacity-10 rounded-lg">
                                        <FiAward className="text-[#F59E0B] text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{certificate.recipientName}</h3>
                                        <span className="text-xs px-2 py-1 bg-[#1B5E7E] bg-opacity-10 text-[#1B5E7E] rounded-full">
                                            {certificate.type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Course:</span>
                                    <span className="font-medium text-gray-800 ml-2">{certificate.course}</span>
                                </div>
                                {certificate.college && (
                                    <div>
                                        <span className="text-gray-600">College:</span>
                                        <span className="font-medium text-gray-800 ml-2">{certificate.college}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-600">Duration:</span>
                                    <span className="font-medium text-gray-800 ml-2">
                                        {certificate.startDate} to {certificate.endDate}
                                    </span>
                                </div>
                                {certificate.performance && (
                                    <div>
                                        <span className="text-gray-600">Performance:</span>
                                        <span className="font-bold text-[#F59E0B] ml-2">{certificate.performance}%</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => generatePDF(certificate)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium"
                                >
                                    <FiDownload /> Download
                                </button>
                                <button
                                    onClick={() => handleDelete(certificate.id)}
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
                <Modal onClose={handleCloseModal} title="Create Certificate">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="Internship">Internship Certificate</option>
                                    <option value="Completion">Completion Certificate</option>
                                </select>
                            </div>
                            {formData.type === 'Internship' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Intern</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                        value={formData.internId}
                                        onChange={(e) => {
                                            const intern = interns.find(i => i.id === e.target.value);
                                            if (intern) {
                                                setFormData({
                                                    ...formData, internId: e.target.value, recipientName: intern.name,
                                                    course: intern.course, college: intern.college, startDate: intern.startDate,
                                                    endDate: intern.endDate || '', performance: intern.performance
                                                });
                                            }
                                        }}>
                                        <option value="">Manual Entry</option>
                                        {interns.filter(i => i.status === 'Completed').map((intern) => (
                                            <option key={intern.id} value={intern.id}>{intern.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course/Program</label>
                                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                    value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })} />
                            </div>
                            {formData.type === 'Internship' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                        value={formData.college} onChange={(e) => setFormData({ ...formData, college: e.target.value })} />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                        value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                        value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>
                            {formData.type === 'Internship' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Performance (%)</label>
                                    <input type="number" min="0" max="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                                        value={formData.performance} onChange={(e) => setFormData({ ...formData, performance: e.target.value })} />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706]">
                                Create Certificate
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Certificates;
