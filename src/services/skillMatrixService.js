import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Skill Matrix Service
 * Handles employee skill assessment and gap analysis
 */

// Skill categories
export const SKILL_CATEGORIES = {
    TECHNICAL: 'Technical Skills',
    SOFT_SKILLS: 'Soft Skills',
    DOMAIN: 'Domain Knowledge',
    TOOLS: 'Tools & Technologies',
    LANGUAGES: 'Programming Languages',
    FRAMEWORKS: 'Frameworks',
    MANAGEMENT: 'Management Skills'
};

// Skill levels
export const SKILL_LEVELS = {
    BEGINNER: { level: 1, label: 'Beginner', description: 'Basic understanding' },
    INTERMEDIATE: { level: 2, label: 'Intermediate', description: 'Can work independently' },
    ADVANCED: { level: 3, label: 'Advanced', description: 'Can mentor others' },
    EXPERT: { level: 4, label: 'Expert', description: 'Subject matter expert' }
};

// Add/Update employee skill
export const addEmployeeSkill = async (skillData) => {
    try {
        const skill = {
            ...skillData,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'skills'), skill);
        return { id: docRef.id, ...skill };
    } catch (error) {
        console.error('Error adding skill:', error);
        throw error;
    }
};

// Get employee skills
export const getEmployeeSkills = async (employeeId) => {
    try {
        const q = query(
            collection(db, 'skills'),
            where('employeeId', '==', employeeId),
            orderBy('category', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching employee skills:', error);
        throw error;
    }
};

// Update skill level
export const updateSkillLevel = async (skillId, level, assessedBy = null) => {
    try {
        const skillRef = doc(db, 'skills', skillId);
        const updates = {
            level,
            assessedBy,
            assessedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await updateDoc(skillRef, updates);
        return { id: skillId, ...updates };
    } catch (error) {
        console.error('Error updating skill level:', error);
        throw error;
    }
};

// Delete skill
export const deleteSkill = async (skillId) => {
    try {
        await deleteDoc(doc(db, 'skills', skillId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting skill:', error);
        throw error;
    }
};

// Get all skills (for skill catalog)
export const getAllSkills = async (category = null) => {
    try {
        let q = collection(db, 'skills');

        if (category) {
            q = query(q, where('category', '==', category));
        }

        const snapshot = await getDocs(q);
        const skills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Group by skill name to get unique skills
        const uniqueSkills = {};
        skills.forEach(skill => {
            if (!uniqueSkills[skill.skillName]) {
                uniqueSkills[skill.skillName] = {
                    skillName: skill.skillName,
                    category: skill.category,
                    employeeCount: 0,
                    averageLevel: 0,
                    levels: []
                };
            }
            uniqueSkills[skill.skillName].employeeCount++;
            uniqueSkills[skill.skillName].levels.push(skill.level);
        });

        // Calculate average levels
        Object.keys(uniqueSkills).forEach(skillName => {
            const skill = uniqueSkills[skillName];
            const sum = skill.levels.reduce((a, b) => a + b, 0);
            skill.averageLevel = (sum / skill.levels.length).toFixed(2);
        });

        return Object.values(uniqueSkills);
    } catch (error) {
        console.error('Error fetching all skills:', error);
        throw error;
    }
};

// Get team skill matrix
export const getTeamSkillMatrix = async (department = null) => {
    try {
        const allSkills = await getDocs(collection(db, 'skills'));
        let skills = allSkills.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (department) {
            skills = skills.filter(s => s.department === department);
        }

        // Group by employee
        const employeeSkills = {};
        skills.forEach(skill => {
            if (!employeeSkills[skill.employeeId]) {
                employeeSkills[skill.employeeId] = {
                    employeeId: skill.employeeId,
                    employeeName: skill.employeeName,
                    department: skill.department,
                    skills: []
                };
            }
            employeeSkills[skill.employeeId].skills.push({
                skillName: skill.skillName,
                category: skill.category,
                level: skill.level
            });
        });

        return Object.values(employeeSkills);
    } catch (error) {
        console.error('Error fetching team skill matrix:', error);
        throw error;
    }
};

// Skill gap analysis
export const performSkillGapAnalysis = async (department, requiredSkills) => {
    try {
        const teamSkills = await getTeamSkillMatrix(department);

        const gaps = [];

        requiredSkills.forEach(required => {
            const employeesWithSkill = teamSkills.filter(emp =>
                emp.skills.some(s =>
                    s.skillName === required.skillName &&
                    s.level >= required.minimumLevel
                )
            );

            const gap = {
                skillName: required.skillName,
                category: required.category,
                requiredLevel: required.minimumLevel,
                requiredCount: required.requiredCount || 1,
                availableCount: employeesWithSkill.length,
                gap: Math.max(0, (required.requiredCount || 1) - employeesWithSkill.length),
                employees: employeesWithSkill.map(e => ({
                    employeeId: e.employeeId,
                    employeeName: e.employeeName,
                    currentLevel: e.skills.find(s => s.skillName === required.skillName)?.level || 0
                }))
            };

            gaps.push(gap);
        });

        return gaps;
    } catch (error) {
        console.error('Error performing skill gap analysis:', error);
        throw error;
    }
};

// Get training recommendations
export const getTrainingRecommendations = async (employeeId) => {
    try {
        const employeeSkills = await getEmployeeSkills(employeeId);
        const allSkills = await getAllSkills();

        const recommendations = [];

        // Find skills below intermediate level
        employeeSkills.forEach(skill => {
            if (skill.level < 2) { // Below intermediate
                recommendations.push({
                    skillName: skill.skillName,
                    currentLevel: skill.level,
                    targetLevel: 2,
                    priority: 'High',
                    reason: 'Below intermediate level'
                });
            }
        });

        // Find missing critical skills (skills that many others have)
        const commonSkills = allSkills.filter(s => s.employeeCount >= 5);
        const employeeSkillNames = employeeSkills.map(s => s.skillName);

        commonSkills.forEach(skill => {
            if (!employeeSkillNames.includes(skill.skillName)) {
                recommendations.push({
                    skillName: skill.skillName,
                    currentLevel: 0,
                    targetLevel: 2,
                    priority: 'Medium',
                    reason: `Common skill in organization (${skill.employeeCount} employees have it)`
                });
            }
        });

        return recommendations;
    } catch (error) {
        console.error('Error getting training recommendations:', error);
        throw error;
    }
};

// Find employees by skill
export const findEmployeesBySkill = async (skillName, minimumLevel = 1) => {
    try {
        const q = query(
            collection(db, 'skills'),
            where('skillName', '==', skillName),
            where('level', '>=', minimumLevel)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error finding employees by skill:', error);
        throw error;
    }
};

// Skill-based team formation
export const suggestTeamFormation = async (requiredSkills) => {
    try {
        const teamSuggestions = [];

        for (const required of requiredSkills) {
            const employees = await findEmployeesBySkill(
                required.skillName,
                required.minimumLevel || 2
            );

            teamSuggestions.push({
                skillName: required.skillName,
                requiredLevel: required.minimumLevel || 2,
                suggestedEmployees: employees.map(e => ({
                    employeeId: e.employeeId,
                    employeeName: e.employeeName,
                    level: e.level,
                    department: e.department
                }))
            });
        }

        return teamSuggestions;
    } catch (error) {
        console.error('Error suggesting team formation:', error);
        throw error;
    }
};

// Get skill statistics
export const getSkillStatistics = async (department = null) => {
    try {
        const teamSkills = await getTeamSkillMatrix(department);

        const stats = {
            totalEmployees: teamSkills.length,
            totalSkills: 0,
            averageSkillsPerEmployee: 0,
            skillDistribution: {},
            categoryDistribution: {}
        };

        teamSkills.forEach(emp => {
            stats.totalSkills += emp.skills.length;

            emp.skills.forEach(skill => {
                // Skill level distribution
                const levelLabel = Object.values(SKILL_LEVELS).find(l => l.level === skill.level)?.label || 'Unknown';
                stats.skillDistribution[levelLabel] = (stats.skillDistribution[levelLabel] || 0) + 1;

                // Category distribution
                stats.categoryDistribution[skill.category] = (stats.categoryDistribution[skill.category] || 0) + 1;
            });
        });

        stats.averageSkillsPerEmployee = stats.totalEmployees > 0
            ? (stats.totalSkills / stats.totalEmployees).toFixed(2)
            : 0;

        return stats;
    } catch (error) {
        console.error('Error calculating skill statistics:', error);
        throw error;
    }
};
