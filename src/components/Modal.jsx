import React from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ onClose, title, children }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl mx-auto my-6 px-4">
                <div className="relative flex flex-col w-full bg-white border-0 rounded-xl shadow-2xl outline-none focus:outline-none max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-solid border-gray-200 rounded-t sticky top-0 bg-white z-10">
                        <h3 className="text-xl font-semibold text-gray-800">
                            {title}
                        </h3>
                        <button
                            className="p-1 ml-auto bg-transparent border-0 text-gray-500 hover:text-gray-800 float-right text-3xl leading-none font-semibold outline-none focus:outline-none transition-colors"
                            onClick={onClose}
                            type="button"
                        >
                            <FiX className="text-xl" />
                        </button>
                    </div>
                    {/* Body */}
                    <div className="relative p-6 flex-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
