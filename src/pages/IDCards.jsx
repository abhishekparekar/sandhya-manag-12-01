import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FiDownload, FiUsers, FiAward, FiCreditCard, FiUser, FiUserPlus } from 'react-icons/fi';
import Card from '../components/Card';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const IDCards = () => {
    const [employees, setEmployees] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('employees'); // employees, interns

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [employeesSnap, internsSnap] = await Promise.all([
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'interns'))
            ]);

            setEmployees(employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setInterns(internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = async (id, type) => {
        try {
            const verificationUrl = `https://sandhya-softtech.com/verify/${type}/${id}`;
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
                width: 150,
                margin: 1
            });
            return qrDataUrl;
        } catch (error) {
            console.error("Error generating QR code:", error);
            return null;
        }
    };

    const generateIDCard = async (person, type) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [85.6, 53.98] // Standard ID card size
            });

            // Background
            doc.setFillColor(27, 94, 126);
            doc.rect(0, 0, 85.6, 53.98, 'F');

            // Top section (white)
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, 85.6, 18, 'F');

            // Company name
            doc.setFontSize(10);
            doc.setTextColor(244, 121, 32);
            doc.setFont('helvetica', 'bold');
            doc.text('SANDHYA SOFTTECH', 42.8, 8, { align: 'center' });

            // ID Type
            doc.setFontSize(7);
            doc.setTextColor(27, 94, 126);
            doc.setFont('helvetica', 'normal');
            doc.text(type === 'employee' ? 'EMPLOYEE ID CARD' : 'INTERN ID CARD', 42.8, 14, { align: 'center' });

            // Photo placeholder (orange circle)
            doc.setFillColor(244, 121, 32);
            doc.circle(20, 30, 8, 'F');
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(person.name.charAt(0).toUpperCase(), 20, 32, { align: 'center' });

            // Name
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(person.name.toUpperCase(), 35, 26);

            // Details
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');

            if (type === 'employee') {
                doc.text(`Dept: ${person.department}`, 35, 31);
                doc.text(`Designation: ${person.designation}`, 35, 35);
                doc.text(`ID: EMP${person.id.substring(0, 6).toUpperCase()}`, 35, 39);
            } else {
                doc.text(`Course: ${person.course}`, 35, 31);
                doc.text(`College: ${person.college}`, 35, 35);
                doc.text(`ID: INT${person.id.substring(0, 6).toUpperCase()}`, 35, 39);
            }

            // QR Code
            const qrCode = await generateQRCode(person.id, type);
            if (qrCode) {
                doc.addImage(qrCode, 'PNG', 60, 25, 20, 20);
            }

            // Bottom strip
            doc.setFillColor(244, 121, 32);
            doc.rect(0, 48, 85.6, 6, 'F');
            doc.setFontSize(6);
            doc.setTextColor(255, 255, 255);
            doc.text('www.sandhya-softtech.com', 42.8, 51.5, { align: 'center' });

            // Save PDF
            doc.save(`${person.name}_ID_Card.pdf`);

        } catch (error) {
            console.error("Error generating ID card:", error);
            alert("Error generating ID card. Please try again.");
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
         

            {/* Stats - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                    title="Employee ID Cards"
                    value={employees.length}
                    icon={FiUser}
                    color="blue"
                />
                <Card
                    title="Intern ID Cards"
                    value={interns.length}
                    icon={FiUserPlus}
                    color="orange"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { key: 'employees', label: 'Employee ID Cards' },
                    { key: 'interns', label: 'Intern ID Cards' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.key ? 'text-[#F47920] border-b-2 border-[#F47920]' : 'text-gray-600'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Employee ID Cards */}
            {activeTab === 'employees' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((employee) => (
                        <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
                            {/* ID Card Preview */}
                            <div className="bg-gradient-to-br from-[#1B5E7E] to-[#164A5E] rounded-lg p-4 mb-4 text-white">
                                <div className="bg-white rounded-t-lg p-2 mb-3">
                                    <p className="text-[#F47920] font-bold text-center text-sm">SANDHYA SOFTTECH</p>
                                    <p className="text-[#1B5E7E] text-center text-xs">EMPLOYEE ID CARD</p>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-[#F47920] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        {employee.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{employee.name}</p>
                                        <p className="text-xs opacity-90">{employee.department}</p>
                                        <p className="text-xs opacity-90">{employee.designation}</p>
                                    </div>
                                </div>
                                <div className="bg-[#F47920] rounded p-1 text-center">
                                    <p className="text-xs">ID: EMP{employee.id.substring(0, 6).toUpperCase()}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => generateIDCard(employee, 'employee')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors"
                            >
                                <FiDownload /> Generate ID Card
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Intern ID Cards */}
            {activeTab === 'interns' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interns.map((intern) => (
                        <div key={intern.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
                            {/* ID Card Preview */}
                            <div className="bg-gradient-to-br from-[#F47920] to-[#E06810] rounded-lg p-4 mb-4 text-white">
                                <div className="bg-white rounded-t-lg p-2 mb-3">
                                    <p className="text-[#F47920] font-bold text-center text-sm">SANDHYA SOFTTECH</p>
                                    <p className="text-[#1B5E7E] text-center text-xs">INTERN ID CARD</p>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-[#1B5E7E] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        {intern.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{intern.name}</p>
                                        <p className="text-xs opacity-90">{intern.course}</p>
                                        <p className="text-xs opacity-90">{intern.college}</p>
                                    </div>
                                </div>
                                <div className="bg-[#1B5E7E] rounded p-1 text-center">
                                    <p className="text-xs">ID: INT{intern.id.substring(0, 6).toUpperCase()}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => generateIDCard(intern, 'intern')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors"
                            >
                                <FiDownload /> Generate ID Card
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default IDCards;
