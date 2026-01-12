import React, { useState } from 'react';
import { FiDollarSign, FiDownload, FiCalendar, FiUser, FiX } from 'react-icons/fi';
import { calculateSalaryComponents, downloadSalarySlipPDF } from '../../services/salaryService';

/**
 * Salary Slip Generator Component
 * Generates professional salary slips with PDF export
 */
const SalarySlipGenerator = ({ employee, onClose, onGenerate }) => {
    const [formData, setFormData] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        daysWorked: 30,
        bonus: 0,
        overtime: 0,
        otherDeductions: 0
    });

    const [salaryData, setSalaryData] = useState(null);
    const [generating, setGenerating] = useState(false);

    // Calculate salary when form changes
    const handleCalculate = () => {
        const basicPay = employee.salary || 0;
        const components = calculateSalaryComponents(basicPay);

        const finalData = {
            employeeId: employee.id,
            employeeName: employee.name,
            department: employee.department,
            designation: employee.designation,
            month: formData.month,
            year: formData.year,
            daysWorked: formData.daysWorked,
            payDate: new Date().toISOString().split('T')[0],
            ...components,
            bonus: parseFloat(formData.bonus) || 0,
            overtime: parseFloat(formData.overtime) || 0,
            otherDeductions: parseFloat(formData.otherDeductions) || 0
        };

        // Recalculate totals with bonus, overtime, and other deductions
        finalData.grossSalary = components.grossSalary + finalData.bonus + finalData.overtime;
        finalData.totalDeductions = components.totalDeductions + finalData.otherDeductions;
        finalData.netSalary = finalData.grossSalary - finalData.totalDeductions;

        setSalaryData(finalData);
    };

    const handleGenerate = async () => {
        if (!salaryData) {
            handleCalculate();
            return;
        }

        setGenerating(true);
        try {
            // Call the onGenerate callback to save to database
            if (onGenerate) {
                await onGenerate(salaryData);
            }

            // Download PDF
            downloadSalarySlipPDF(salaryData, {
                name: 'Sandhya Management',
                address: 'Company Address'
            });

            alert('Salary slip generated successfully!');
            if (onClose) onClose();
        } catch (error) {
            console.error('Error generating salary slip:', error);
            alert('Error generating salary slip. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <FiDollarSign className="w-6 h-6 text-[#F47920]" />
                        <h2 className="text-xl font-bold text-gray-800">Generate Salary Slip</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Employee Info */}
                    {employee ? (
                        <div className="bg-gradient-to-r from-[#1B5E7E] to-[#2A7A9E] rounded-lg p-6 text-white">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm opacity-80">Employee Name</p>
                                    <p className="font-bold text-lg">{employee.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-80">Employee ID</p>
                                    <p className="font-bold">{employee.id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-80">Department</p>
                                    <p className="font-bold">{employee.department || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-80">Designation</p>
                                    <p className="font-bold">{employee.designation || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                            <p className="font-medium">⚠️ No employee selected</p>
                            <p className="text-sm mt-1">Please select an employee to generate salary slip.</p>
                        </div>
                    )}

                    {/* Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Month *
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={formData.month}
                                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                    <option key={month} value={month}>
                                        {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year *
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Days Worked *
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="31"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={formData.daysWorked}
                                onChange={(e) => setFormData({ ...formData, daysWorked: parseInt(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bonus (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={formData.bonus}
                                onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Overtime (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={formData.overtime}
                                onChange={(e) => setFormData({ ...formData, overtime: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Other Deductions (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={formData.otherDeductions}
                                onChange={(e) => setFormData({ ...formData, otherDeductions: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Calculate Button */}
                    <button
                        onClick={handleCalculate}
                        className="w-full px-4 py-3 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors font-medium"
                    >
                        Calculate Salary
                    </button>

                    {/* Salary Breakdown */}
                    {salaryData && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800">Salary Breakdown</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Earnings */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-bold text-green-800 mb-3">Earnings</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Basic Pay</span>
                                            <span className="font-medium">₹{salaryData.basicPay.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>HRA (40%)</span>
                                            <span className="font-medium">₹{salaryData.hra.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>DA (20%)</span>
                                            <span className="font-medium">₹{salaryData.da.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Conveyance</span>
                                            <span className="font-medium">₹{salaryData.conveyance.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Medical Allowance</span>
                                            <span className="font-medium">₹{salaryData.medicalAllowance.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Special Allowance</span>
                                            <span className="font-medium">₹{salaryData.specialAllowance.toLocaleString()}</span>
                                        </div>
                                        {salaryData.bonus > 0 && (
                                            <div className="flex justify-between text-green-700">
                                                <span>Bonus</span>
                                                <span className="font-medium">₹{salaryData.bonus.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {salaryData.overtime > 0 && (
                                            <div className="flex justify-between text-green-700">
                                                <span>Overtime</span>
                                                <span className="font-medium">₹{salaryData.overtime.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-green-300 pt-2 mt-2">
                                            <div className="flex justify-between font-bold text-green-800">
                                                <span>Gross Salary</span>
                                                <span>₹{salaryData.grossSalary.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-bold text-red-800 mb-3">Deductions</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>PF (12%)</span>
                                            <span className="font-medium">₹{salaryData.pf.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Professional Tax</span>
                                            <span className="font-medium">₹{salaryData.professionalTax.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Income Tax</span>
                                            <span className="font-medium">₹{salaryData.incomeTax.toLocaleString()}</span>
                                        </div>
                                        {salaryData.otherDeductions > 0 && (
                                            <div className="flex justify-between text-red-700">
                                                <span>Other Deductions</span>
                                                <span className="font-medium">₹{salaryData.otherDeductions.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-red-300 pt-2 mt-2">
                                            <div className="flex justify-between font-bold text-red-800">
                                                <span>Total Deductions</span>
                                                <span>₹{salaryData.totalDeductions.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Net Salary */}
                            <div className="bg-gradient-to-r from-[#F47920] to-[#FF8C42] rounded-lg p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90">Net Salary (Take Home)</p>
                                        <p className="text-3xl font-bold mt-1">₹{salaryData.netSalary.toLocaleString()}</p>
                                    </div>
                                    <FiDollarSign className="w-16 h-16 opacity-50" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={!salaryData || generating}
                            className="flex-1 px-4 py-3 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <FiDownload />
                            {generating ? 'Generating...' : 'Generate & Download PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalarySlipGenerator;
