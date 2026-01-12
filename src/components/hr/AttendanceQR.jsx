import React, { useState, useRef, useEffect } from 'react';
import { FiCamera, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { markAttendanceViaQR } from '../../services/attendanceService';

/**
 * QR Code Scanner Component for Attendance
 * Uses device camera to scan employee QR codes
 */
const AttendanceQR = ({ onSuccess, onClose }) => {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scanIntervalRef = useRef(null);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera on mobile
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setCameraActive(true);
                setScanning(true);

                // Start scanning for QR codes
                scanIntervalRef.current = setInterval(scanQRCode, 500);
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Unable to access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }

        setCameraActive(false);
        setScanning(false);
    };

    const scanQRCode = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
            // Get image data
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            // Try to decode QR code using jsQR library
            // Note: You'll need to install jsQR: npm install jsqr
            const jsQR = await import('jsqr');
            const code = jsQR.default(imageData.data, imageData.width, imageData.height);

            if (code) {
                // QR code detected
                stopCamera();
                await handleQRCodeDetected(code.data);
            }
        } catch (err) {
            // Continue scanning
        }
    };

    const handleQRCodeDetected = async (qrData) => {
        try {
            setScanning(false);
            const result = await markAttendanceViaQR(qrData);

            setSuccess({
                employeeName: result.employeeName,
                action: result.checkOut ? 'Check-out' : 'Check-in',
                time: result.checkOut || result.checkIn
            });

            // Call success callback
            if (onSuccess) {
                onSuccess(result);
            }

            // Auto-close after 3 seconds
            setTimeout(() => {
                handleClose();
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to mark attendance');
            setScanning(false);
        }
    };

    const handleClose = () => {
        stopCamera();
        if (onClose) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <FiCamera className="w-6 h-6 text-[#1B5E7E]" />
                        <h2 className="text-xl font-bold text-gray-800">Scan QR Code</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Success Message */}
                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <FiCheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-green-800">Attendance Marked!</h3>
                                    <p className="text-sm text-green-700 mt-1">
                                        <strong>{success.employeeName}</strong> - {success.action} at {success.time}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <FiAlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-red-800">Error</h3>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Camera View */}
                    {!success && (
                        <div className="space-y-4">
                            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    playsInline
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Scanning Overlay */}
                                {scanning && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-64 h-64 border-4 border-[#F47920] rounded-lg animate-pulse"></div>
                                    </div>
                                )}

                                {/* Instructions */}
                                {!cameraActive && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                        <p className="text-white text-center px-4">
                                            Click "Start Camera" to begin scanning
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Instructions */}
                            <div className="text-center text-sm text-gray-600">
                                <p>Position the QR code within the frame</p>
                                <p className="mt-1">Scanning will happen automatically</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                {!cameraActive ? (
                                    <button
                                        onClick={startCamera}
                                        className="flex-1 px-4 py-3 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors font-medium"
                                    >
                                        <FiCamera className="inline mr-2" />
                                        Start Camera
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopCamera}
                                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        Stop Camera
                                    </button>
                                )}
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceQR;
