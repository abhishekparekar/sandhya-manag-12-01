/**
 * BulkUpload Component
 * Drag & drop Excel upload with validation and preview
 */

import React, { useState } from 'react';
import { FiUpload, FiFile, FiCheckCircle, FiAlertCircle, FiX, FiDownload } from 'react-icons/fi';
import {
    parseExcelFile,
    validateLeads,
    detectDuplicates,
    importLeads,
    downloadTemplate
} from '../services/excelImportService';

const BulkUpload = ({ onComplete }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [step, setStep] = useState('upload'); // upload, preview, importing, complete
    const [leads, setLeads] = useState([]);
    const [validation, setValidation] = useState({ valid: [], errors: [] });
    const [duplicates, setDuplicates] = useState({ duplicates: [], unique: [] });
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [autoAssign, setAutoAssign] = useState(true);

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    // Handle drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    // Handle file selection
    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    // Process file
    const handleFile = async (selectedFile) => {
        // Validate file type
        if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
            alert('Please upload an Excel file (.xlsx or .xls)');
            return;
        }

        setFile(selectedFile);
        setStep('preview');

        try {
            // Parse Excel
            const parsedLeads = await parseExcelFile(selectedFile);
            setLeads(parsedLeads);

            // Validate
            const validated = validateLeads(parsedLeads);
            setValidation(validated);

            // Check duplicates
            const dupes = await detectDuplicates(validated.valid);
            setDuplicates(dupes);
        } catch (error) {
            alert('Error processing file: ' + error.message);
            setStep('upload');
        }
    };

    // Import leads
    const handleImport = async () => {
        setImporting(true);
        setStep('importing');

        try {
            const result = await importLeads(duplicates.unique, autoAssign);
            setResult(result);
            setStep('complete');

            if (onComplete) {
                onComplete(result);
            }
        } catch (error) {
            alert('Error importing leads: ' + error.message);
            setStep('preview');
        } finally {
            setImporting(false);
        }
    };

    // Reset
    const handleReset = () => {
        setFile(null);
        setStep('upload');
        setLeads([]);
        setValidation({ valid: [], errors: [] });
        setDuplicates({ duplicates: [], unique: [] });
        setResult(null);
    };

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Bulk Lead Upload</h2>
                    <p className="text-gray-600 text-sm mt-1">Import multiple leads from Excel file</p>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-[#F47920] text-[#F47920] rounded-lg hover:bg-orange-50 transition-colors"
                >
                    <FiDownload className="w-4 h-4" />
                    Download Template
                </button>
            </div>

            {/* Upload Step */}
            {step === 'upload' && (
                <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-[#F47920] bg-orange-50' : 'border-gray-300'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <FiUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                        Drag & drop your Excel file here
                    </p>
                    <p className="text-gray-500 mb-4">or</p>
                    <label className="px-6 py-3 bg-[#F47920] text-white rounded-lg cursor-pointer hover:bg-[#E06810] transition-colors inline-block">
                        Browse Files
                        <input
                            type="file"
                            className="hidden"
                            accept=".xlsx,.xls"
                            onChange={handleFileInput}
                        />
                    </label>
                    <p className="text-sm text-gray-500 mt-4">Supported formats: .xlsx, .xls</p>
                </div>
            )}

            {/* Preview Step */}
            {step === 'preview' && (
                <div className="space-y-6">
                    {/* File Info */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <FiFile className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="font-semibold text-gray-800">{file?.name}</p>
                                <p className="text-sm text-gray-600">{leads.length} leads found</p>
                            </div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                            <FiCheckCircle className="w-6 h-6 text-green-600 mb-2" />
                            <p className="text-2xl font-bold text-green-900">{duplicates.unique.length}</p>
                            <p className="text-sm text-green-600">Valid & Unique</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                            <FiAlertCircle className="w-6 h-6 text-yellow-600 mb-2" />
                            <p className="text-2xl font-bold text-yellow-900">{duplicates.duplicates.length}</p>
                            <p className="text-sm text-yellow-600">Duplicates</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                            <FiAlertCircle className="w-6 h-6 text-red-600 mb-2" />
                            <p className="text-2xl font-bold text-red-900">{validation.errors.length}</p>
                            <p className="text-sm text-red-600">Errors</p>
                        </div>
                    </div>

                    {/* Errors */}
                    {validation.errors.length > 0 && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                            <h3 className="font-bold text-red-900 mb-2">Validation Errors</h3>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {validation.errors.slice(0, 10).map((error, index) => (
                                    <div key={index} className="text-sm text-red-700">
                                        <strong>Row {error.rowNumber}:</strong> {error.errors.join(', ')}
                                    </div>
                                ))}
                                {validation.errors.length > 10 && (
                                    <p className="text-sm text-red-600">
                                        +{validation.errors.length - 10} more errors
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Duplicates */}
                    {duplicates.duplicates.length > 0 && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                            <h3 className="font-bold text-yellow-900 mb-2">Duplicate Leads (Will be skipped)</h3>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {duplicates.duplicates.slice(0, 10).map((dup, index) => (
                                    <div key={index} className="text-sm text-yellow-700">
                                        <strong>{dup.name}</strong> - {dup.phone} ({dup.duplicateReason})
                                    </div>
                                ))}
                                {duplicates.duplicates.length > 10 && (
                                    <p className="text-sm text-yellow-600">
                                        +{duplicates.duplicates.length - 10} more duplicates
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Auto-Assignment Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="autoAssign"
                            checked={autoAssign}
                            onChange={(e) => setAutoAssign(e.target.checked)}
                            className="w-5 h-5 text-[#F47920]"
                        />
                        <label htmlFor="autoAssign" className="text-gray-700 cursor-pointer">
                            <strong>Auto-assign leads to telecallers</strong>
                            <p className="text-sm text-gray-500">Distribute leads evenly among available team members</p>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={duplicates.unique.length === 0}
                            className="flex-1 px-6 py-3 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Import {duplicates.unique.length} Lead{duplicates.unique.length !== 1 ? 's' : ''}
                        </button>
                    </div>
                </div>
            )}

            {/* Importing Step */}
            {step === 'importing' && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#F47920] mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-gray-700">Importing leads...</p>
                    <p className="text-gray-500 mt-2">Please wait while we process your data</p>
                </div>
            )}

            {/* Complete Step */}
            {step === 'complete' && result && (
                <div className="text-center py-12">
                    <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Import Complete!</h3>
                    <div className="max-w-md mx-auto space-y-2 mb-6">
                        <p className="text-lg text-green-600">
                            ✓ {result.success} lead{result.success !== 1 ? 's' : ''} imported successfully
                        </p>
                        {result.failed > 0 && (
                            <p className="text-lg text-red-600">
                                ✗ {result.failed} lead{result.failed !== 1 ? 's' : ''} failed
                            </p>
                        )}
                        {autoAssign && (
                            <p className="text-sm text-gray-600">
                                Leads have been auto-assigned to telecallers
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors"
                    >
                        Upload Another File
                    </button>
                </div>
            )}
        </div>
    );
};

export default BulkUpload;
