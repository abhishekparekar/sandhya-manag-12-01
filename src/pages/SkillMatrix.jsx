import React, { useState, useEffect } from 'react';
import { FiTarget, FiTrendingUp, FiUsers, FiAward, FiPlus, FiEdit2 } from 'react-icons/fi';
import {
    getTeamSkillMatrix,
    performSkillGapAnalysis,
    getTrainingRecommendations,
    addEmployeeSkill,
    updateSkillLevel,
    getSkillStatistics,
    SKILL_CATEGORIES,
    SKILL_LEVELS
} from '../services/skillMatrixService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

/**
 * Skill Matrix Dashboard
 * Team skill assessment, gap analysis, and training recommendations
 */
const SkillMatrix = () => {
    const { checkPermission } = useAuth();
    const [teamSkills, setTeamSkills] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [showAddSkillModal, setShowAddSkillModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [skillForm, setSkillForm] = useState({
        skillName: '',
        category: SKILL_CATEGORIES.TECHNICAL,
        level: 2
    });

    const canUpdate = checkPermission('employees', 'update');

    useEffect(() => {
        fetchData();
    }, [selectedDepartment]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const department = selectedDepartment === 'all' ? null : selectedDepartment;
            const [matrix, statistics] = await Promise.all([
                getTeamSkillMatrix(department),
                getSkillStatistics(department)
            ]);

            setTeamSkills(matrix);
            setStats(statistics);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        try {
            await addEmployeeSkill({
                employeeId: selectedEmployee.employeeId,
                employeeName: selectedEmployee.employeeName,
                department: selectedEmployee.department,
                ...skillForm
            });

            setShowAddSkillModal(false);
            setSelectedEmployee(null);
            setSkillForm({
                skillName: '',
                category: SKILL_CATEGORIES.TECHNICAL,
                level: 2
            });
            fetchData();
        } catch (error) {
            console.error('Error adding skill:', error);
            alert('Error adding skill');
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 4: return 'bg-purple-100 text-purple-800 border-purple-300';
            case 3: return 'bg-blue-100 text-blue-800 border-blue-300';
            case 2: return 'bg-green-100 text-green-800 border-green-300';
            case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getLevelLabel = (level) => {
        const skillLevel = Object.values(SKILL_LEVELS).find(l => l.level === level);
        return skillLevel ? skillLevel.label : 'Unknown';
    };

    // Get unique departments
    const departments = ['all', ...new Set(teamSkills.map(emp => emp.department))];

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
                    <FiTarget className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Skill Matrix</h1>
                        <p className="text-gray-600 mt-1">Team skills assessment and gap analysis</p>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card
                        title="Total Employees"
                        value={stats.totalEmployees}
                        icon={FiUsers}
                        color="blue"
                    />
                    <Card
                        title="Total Skills"
                        value={stats.totalSkills}
                        icon={FiTarget}
                        color="green"
                    />
                    <Card
                        title="Avg Skills/Employee"
                        value={stats.averageSkillsPerEmployee}
                        icon={FiTrendingUp}
                        color="orange"
                    />
                    <Card
                        title="Skill Categories"
                        value={Object.keys(stats.categoryDistribution).length}
                        icon={FiAward}
                        color="purple"
                    />
                </div>
            )}

            {/* Department Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Department</label>
                <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                >
                    {departments.map(dept => (
                        <option key={dept} value={dept}>
                            {dept === 'all' ? 'All Departments' : dept}
                        </option>
                    ))}
                </select>
            </div>

            {/* Skill Distribution */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Skill Level Distribution */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Skill Level Distribution</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.skillDistribution).map(([level, count]) => {
                                const total = Object.values(stats.skillDistribution).reduce((a, b) => a + b, 0);
                                const percentage = ((count / total) * 100).toFixed(1);
                                return (
                                    <div key={level}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{level}</span>
                                            <span className="text-sm font-bold text-gray-800">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-[#F47920] h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Distribution */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Category Distribution</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.categoryDistribution)
                                .sort((a, b) => b[1] - a[1])
                                .map(([category, count]) => {
                                    const total = Object.values(stats.categoryDistribution).reduce((a, b) => a + b, 0);
                                    const percentage = ((count / total) * 100).toFixed(1);
                                    return (
                                        <div key={category}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">{category}</span>
                                                <span className="text-sm font-bold text-gray-800">{count} ({percentage}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-[#1B5E7E] h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}

            {/* Team Skill Matrix */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Team Skill Matrix</h3>
                <div className="space-y-4">
                    {teamSkills.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No skills data available</p>
                    ) : (
                        teamSkills.map((employee) => (
                            <div key={employee.employeeId} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{employee.employeeName}</h4>
                                        <p className="text-sm text-gray-600">{employee.department}</p>
                                    </div>
                                    {canUpdate && (
                                        <button
                                            onClick={() => {
                                                setSelectedEmployee(employee);
                                                setShowAddSkillModal(true);
                                            }}
                                            className="flex items-center px-3 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors text-sm"
                                        >
                                            <FiPlus className="mr-1" />
                                            Add Skill
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {employee.skills.length === 0 ? (
                                        <p className="text-sm text-gray-500">No skills recorded</p>
                                    ) : (
                                        employee.skills.map((skill, idx) => (
                                            <div
                                                key={idx}
                                                className={`px-3 py-1 rounded-full border text-sm font-medium ${getLevelColor(skill.level)}`}
                                                title={`${skill.category} - ${getLevelLabel(skill.level)}`}
                                            >
                                                {skill.skillName} • {getLevelLabel(skill.level)}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Skill Modal */}
            {showAddSkillModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800">
                                Add Skill - {selectedEmployee.employeeName}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddSkillModal(false);
                                    setSelectedEmployee(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAddSkill} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={skillForm.skillName}
                                    onChange={(e) => setSkillForm({ ...skillForm, skillName: e.target.value })}
                                    placeholder="e.g., React, Python, Project Management"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={skillForm.category}
                                    onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                                >
                                    {Object.values(SKILL_CATEGORIES).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={skillForm.level}
                                    onChange={(e) => setSkillForm({ ...skillForm, level: parseInt(e.target.value) })}
                                >
                                    {Object.values(SKILL_LEVELS).map(level => (
                                        <option key={level.level} value={level.level}>
                                            {level.label} - {level.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddSkillModal(false);
                                        setSelectedEmployee(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors"
                                >
                                    Add Skill
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillMatrix;
