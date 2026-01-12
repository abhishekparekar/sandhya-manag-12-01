/**
 * AIAssistant Component
 * Floating AI panel with calling scripts, lead predictions, and next actions
 */

import React, { useState, useEffect } from 'react';
import { FiZap, FiCopy, FiChevronDown, FiChevronUp, FiTarget, FiTrendingUp } from 'react-icons/fi';
import {
    generateCallingScript,
    predictLeadResponse,
    suggestNextAction
} from '../services/aiCallingAssistant';

const AIAssistant = ({ lead, onClose }) => {
    const [expanded, setExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState('script'); // script, prediction, action
    const [script, setScript] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [nextAction, setNextAction] = useState(null);
    const [callType, setCallType] = useState('intro');

    useEffect(() => {
        if (lead) {
            // Determine call type based on lead status
            const type = lead.callCount === 0 ? 'intro'
                : lead.status === 'interested' ? 'closing'
                    : 'followup';
            setCallType(type);

            // Generate AI suggestions
            setScript(generateCallingScript(lead, type));
            setPrediction(predictLeadResponse(lead));
            setNextAction(suggestNextAction(lead));
        }
    }, [lead]);

    if (!lead) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl border-2 border-[#F47920] shadow-2xl z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-xl">
                <div className="flex items-center gap-2">
                    <FiZap className="w-5 h-5" />
                    <h3 className="font-bold">AI Calling Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-1 hover:bg-orange-700 rounded transition-colors"
                    >
                        {expanded ? <FiChevronDown /> : <FiChevronUp />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-orange-700 rounded transition-colors text-xl"
                    >
                        ×
                    </button>
                </div>
            </div>

            {expanded && (
                <>
                    {/* Lead Info */}
                    <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
                        <p className="font-semibold text-gray-800">{lead.name}</p>
                        <p className="text-sm text-gray-600">{lead.company || 'No company'} • {lead.phone}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${lead.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-blue-100 text-blue-700'
                                }`}>
                                {lead.priority || 'medium'}
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                                {lead.status || 'new'}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b-2 border-gray-200">
                        <button
                            onClick={() => setActiveTab('script')}
                            className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors ${activeTab === 'script'
                                    ? 'bg-[#F47920] text-white'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Script
                        </button>
                        <button
                            onClick={() => setActiveTab('prediction')}
                            className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors ${activeTab === 'prediction'
                                    ? 'bg-[#F47920] text-white'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Score
                        </button>
                        <button
                            onClick={() => setActiveTab('action')}
                            className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors ${activeTab === 'action'
                                    ? 'bg-[#F47920] text-white'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Next Step
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-96 overflow-y-auto">
                        {/* Script Tab */}
                        {activeTab === 'script' && script && (
                            <div className="space-y-4">
                                {/* Call Type Selector */}
                                <div className="flex gap-2">
                                    {['intro', 'followup', 'closing'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setCallType(type);
                                                setScript(generateCallingScript(lead, type));
                                            }}
                                            className={`px-3 py-1 rounded text-sm font-medium ${callType === type
                                                    ? 'bg-[#F47920] text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {/* Script Sections */}
                                {Object.entries(script).filter(([key]) => key !== 'talkPoints').map(([key, value]) => (
                                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-700 text-sm capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </h4>
                                            <button
                                                onClick={() => copyToClipboard(value)}
                                                className="p-1 text-gray-500 hover:text-[#F47920] transition-colors"
                                            >
                                                <FiCopy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-600">{value}</p>
                                    </div>
                                ))}

                                {/* Talk Points */}
                                {script.talkPoints && (
                                    <div className="bg-blue-50 rounded-lg p-3">
                                        <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 Key Points</h4>
                                        <ul className="space-y-1">
                                            {script.talkPoints.map((point, index) => (
                                                <li key={index} className="text-sm text-blue-700">• {point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Prediction Tab */}
                        {activeTab === 'prediction' && prediction && (
                            <div className="space-y-4">
                                {/* Score Circle */}
                                <div className="text-center py-4">
                                    <div className="relative w-32 h-32 mx-auto mb-4">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#E5E7EB"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke={prediction.confidence === 'high' ? '#10B981' : prediction.confidence === 'medium' ? '#F59E0B' : '#EF4444'}
                                                strokeWidth="3"
                                                strokeDasharray={`${prediction.score}, 100`}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <p className="text-3xl font-bold text-gray-800">{prediction.score}</p>
                                            <p className="text-xs text-gray-600">Score</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <FiTarget className={`w-5 h-5 ${prediction.confidence === 'high' ? 'text-green-600' :
                                                prediction.confidence === 'medium' ? 'text-yellow-600' :
                                                    'text-red-600'
                                            }`} />
                                        <p className={`font-semibold ${prediction.confidence === 'high' ? 'text-green-600' :
                                                prediction.confidence === 'medium' ? 'text-yellow-600' :
                                                    'text-red-600'
                                            }`}>
                                            {prediction.confidence.toUpperCase()} Confidence
                                        </p>
                                    </div>
                                    <p className="text-gray-700 font-medium">{prediction.likelihood}</p>
                                </div>

                                {/* Reasons */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-700 text-sm mb-2">Why this score?</h4>
                                    <ul className="space-y-1">
                                        {prediction.reasons.map((reason, index) => (
                                            <li key={index} className="text-sm text-gray-600">✓ {reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Next Action Tab */}
                        {activeTab === 'action' && nextAction && (
                            <div className="space-y-4">
                                {/* Action Card */}
                                <div className={`rounded-lg p-4 border-2 ${nextAction.priority === 'urgent' ? 'bg-red-50 border-red-200' :
                                        nextAction.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                                            'bg-blue-50 border-blue-200'
                                    }`}>
                                    <div className="flex items-start gap-3 mb-2">
                                        <FiTrendingUp className={`w-5 h-5 mt-0.5 ${nextAction.priority === 'urgent' ? 'text-red-600' :
                                                nextAction.priority === 'high' ? 'text-orange-600' :
                                                    'text-blue-600'
                                            }`} />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 mb-1">{nextAction.action}</h4>
                                            <p className="text-sm text-gray-600 mb-2">{nextAction.why}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${nextAction.priority === 'urgent' ? 'bg-red-200 text-red-800' :
                                                        nextAction.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                                                            'bg-blue-200 text-blue-800'
                                                    }`}>
                                                    {nextAction.priority.toUpperCase()}
                                                </span>
                                                <span className="text-sm text-gray-600">📅 {nextAction.when}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Talk Points */}
                                <div className="bg-purple-50 rounded-lg p-3">
                                    <h4 className="font-semibold text-purple-900 text-sm mb-2">📋 Talk Points</h4>
                                    <ul className="space-y-1">
                                        {nextAction.talkPoints.map((point, index) => (
                                            <li key={index} className="text-sm text-purple-700">• {point}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Suggested Script */}
                                <button
                                    onClick={() => {
                                        setCallType(nextAction.script);
                                        setScript(generateCallingScript(lead, nextAction.script));
                                        setActiveTab('script');
                                    }}
                                    className="w-full px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors font-medium"
                                >
                                    View Suggested Script
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AIAssistant;
