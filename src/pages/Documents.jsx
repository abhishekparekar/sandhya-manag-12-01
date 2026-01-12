import React, { useState, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    FiPlus, FiTrash2, FiDownload, FiFile, FiFolder, FiUpload, FiBriefcase, FiUser, FiLayers
} from 'react-icons/fi';
import Modal from '../components/Modal';
import Card from '../components/Card';
import Toast from '../components/Toast';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        category: 'Company',
        description: '',
        url: '',
        fileName: ''
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const categories = ['Company', 'Employee', 'Project', 'General'];

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const docsSnap = await getDocs(collection(db, 'documents'));
            const docsList = docsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDocuments(docsList);
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 10MB for documents)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showToast("❌ File too large! Maximum size is 10MB.", "error");
            return;
        }

        // Validate file type (common document formats)
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'text/plain'
        ];

        if (!validTypes.includes(file.type)) {
            showToast("❌ Invalid file type! Please upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, or TXT files.", "error");
            return;
        }

        setUploadingDoc(true);
        showToast("📤 Uploading document...", "info");

        try {
            const timestamp = Date.now();
            const storageRef = ref(storage, `documents/${formData.category}/${timestamp}_${file.name}`);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            setFormData({
                ...formData,
                url: downloadURL,
                fileName: file.name
            });

            showToast("✅ Document uploaded successfully!", "success");
        } catch (error) {
            console.error("Error uploading file:", error);
            showToast("❌ Upload failed. Please check your connection and try again.", "error");
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'documents'), {
                ...formData,
                createdAt: new Date().toISOString()
            });
            showToast("✅ Document saved successfully!", "success");
            fetchDocuments();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving document:", error);
            showToast("❌ Error saving document. Please try again.", "error");
        }
    };

    const handleDelete = async (id, fileUrl) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                // Delete from storage
                if (fileUrl) {
                    try {
                        const fileRef = ref(storage, fileUrl);
                        await deleteObject(fileRef);
                    } catch (error) {
                        console.log("File already deleted or doesn't exist");
                    }
                }

                await deleteDoc(doc(db, 'documents', id));
                showToast("✅ Document deleted successfully!", "success");
                fetchDocuments();
            } catch (error) {
                console.error("Error deleting document:", error);
                showToast("❌ Error deleting document. Please try again.", "error");
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            name: '',
            category: 'Company',
            description: '',
            url: '',
            fileName: ''
        });
    };

    const filteredDocuments = documents.filter(doc =>
        activeCategory === 'all' || doc.category === activeCategory
    );

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                >
                    <FiPlus className="mr-2" /> Upload Document
                </button>
            </div>

            {/* Stats - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card
                    title="Total Documents"
                    value={documents.length}
                    icon={FiFile}
                    color="blue"
                />
                <Card
                    title="Company"
                    value={documents.filter(d => d.category === 'Company').length}
                    icon={FiBriefcase}
                    color="purple"
                />
                <Card
                    title="Employee"
                    value={documents.filter(d => d.category === 'Employee').length}
                    icon={FiUser}
                    color="green"
                />
                <Card
                    title="Project"
                    value={documents.filter(d => d.category === 'Project').length}
                    icon={FiLayers}
                    color="orange"
                />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-4 py-2 font-medium transition-colors ${activeCategory === 'all' ? 'text-[#F47920] border-b-2 border-[#F47920]' : 'text-gray-600'
                        }`}
                >
                    All Documents
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 font-medium transition-colors ${activeCategory === cat ? 'text-[#F47920] border-b-2 border-[#F47920]' : 'text-gray-600'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((document) => (
                    <div key={document.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#1B5E7E] bg-opacity-10 rounded-lg">
                                    <FiFile className="text-[#1B5E7E] text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{document.name}</h3>
                                    <span className="text-xs px-2 py-1 bg-[#F47920] bg-opacity-10 text-[#F47920] rounded-full">
                                        {document.category}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {document.description && (
                            <p className="text-sm text-gray-600 mb-4">{document.description}</p>
                        )}

                        <p className="text-xs text-gray-500 mb-4">{document.fileName}</p>

                        <div className="flex gap-2">
                            <a
                                href={document.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                            >
                                <FiDownload /> Download
                            </a>
                            <button
                                onClick={() => handleDelete(document.id, document.url)}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title="Upload Document">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Company Agreement"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Document description..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload File *</label>
                            {formData.url ? (
                                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                                    <div className="flex items-center gap-2">
                                        <FiFile className="text-green-600" />
                                        <span className="text-sm font-medium text-green-700">{formData.fileName}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, url: '', fileName: '' })}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#F47920] hover:bg-orange-50 transition-colors">
                                    <FiUpload className="text-[#F47920]" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {uploadingDoc ? 'Uploading...' : 'Choose File'}
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={uploadingDoc}
                                    />
                                </label>
                            )}
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
                                disabled={!formData.url}
                                className="flex-1 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Document
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Documents;
