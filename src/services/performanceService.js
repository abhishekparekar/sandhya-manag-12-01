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
 * Performance Service
 * Handles performance reviews, KPI tracking, and analytics
 */

// Performance rating scale
export const PERFORMANCE_RATINGS = {
    EXCELLENT: 5,
    GOOD: 4,
    SATISFACTORY: 3,
    NEEDS_IMPROVEMENT: 2,
    POOR: 1
};

// KPI categories
export const KPI_CATEGORIES = {
    QUALITY: 'Quality of Work',
    PRODUCTIVITY: 'Productivity',
    COMMUNICATION: 'Communication',
    TEAMWORK: 'Teamwork',
    INITIATIVE: 'Initiative',
    PUNCTUALITY: 'Punctuality',
    TECHNICAL_SKILLS: 'Technical Skills',
    PROBLEM_SOLVING: 'Problem Solving'
};

// Create performance review
export const createPerformanceReview = async (reviewData) => {
    try {
        const review = {
            ...reviewData,
            overallRating: calculateOverallRating(reviewData.kpis),
            createdAt: serverTimestamp(),
            status: 'Completed'
        };

        const docRef = await addDoc(collection(db, 'performance'), review);
        return { id: docRef.id, ...review };
    } catch (error) {
        console.error('Error creating performance review:', error);
        throw error;
    }
};

// Get performance reviews
export const getPerformanceReviews = async (filters = {}) => {
    try {
        let q = collection(db, 'performance');

        if (filters.employeeId) {
            q = query(q, where('employeeId', '==', filters.employeeId));
        }

        if (filters.reviewPeriod) {
            q = query(q, where('reviewPeriod', '==', filters.reviewPeriod));
        }

        q = query(q, orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching performance reviews:', error);
        throw error;
    }
};

// Update performance review
export const updatePerformanceReview = async (reviewId, updates) => {
    try {
        const reviewRef = doc(db, 'performance', reviewId);

        if (updates.kpis) {
            updates.overallRating = calculateOverallRating(updates.kpis);
        }

        await updateDoc(reviewRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { id: reviewId, ...updates };
    } catch (error) {
        console.error('Error updating performance review:', error);
        throw error;
    }
};

// Delete performance review
export const deletePerformanceReview = async (reviewId) => {
    try {
        await deleteDoc(doc(db, 'performance', reviewId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting performance review:', error);
        throw error;
    }
};

// Calculate overall rating from KPIs
export const calculateOverallRating = (kpis) => {
    if (!kpis || kpis.length === 0) return 0;

    const totalRating = kpis.reduce((sum, kpi) => sum + (kpi.rating || 0), 0);
    const averageRating = totalRating / kpis.length;

    return parseFloat(averageRating.toFixed(2));
};

// Get employee performance summary
export const getEmployeePerformanceSummary = async (employeeId) => {
    try {
        const reviews = await getPerformanceReviews({ employeeId });

        if (reviews.length === 0) {
            return {
                employeeId,
                totalReviews: 0,
                averageRating: 0,
                latestRating: 0,
                trend: 'N/A'
            };
        }

        const totalRating = reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0);
        const averageRating = totalRating / reviews.length;
        const latestRating = reviews[0].overallRating || 0;

        // Calculate trend (comparing latest vs previous)
        let trend = 'stable';
        if (reviews.length > 1) {
            const previousRating = reviews[1].overallRating || 0;
            if (latestRating > previousRating) trend = 'improving';
            else if (latestRating < previousRating) trend = 'declining';
        }

        return {
            employeeId,
            totalReviews: reviews.length,
            averageRating: parseFloat(averageRating.toFixed(2)),
            latestRating,
            trend,
            reviews
        };
    } catch (error) {
        console.error('Error getting performance summary:', error);
        throw error;
    }
};

// Get top performers
export const getTopPerformers = async (limit = 10) => {
    try {
        const allReviews = await getDocs(collection(db, 'performance'));
        const reviews = allReviews.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Group by employee and calculate average
        const employeePerformance = {};

        reviews.forEach(review => {
            if (!employeePerformance[review.employeeId]) {
                employeePerformance[review.employeeId] = {
                    employeeId: review.employeeId,
                    employeeName: review.employeeName,
                    department: review.department,
                    ratings: [],
                    totalReviews: 0
                };
            }

            employeePerformance[review.employeeId].ratings.push(review.overallRating || 0);
            employeePerformance[review.employeeId].totalReviews++;
        });

        // Calculate averages and sort
        const performers = Object.values(employeePerformance).map(emp => ({
            ...emp,
            averageRating: emp.ratings.reduce((a, b) => a + b, 0) / emp.ratings.length
        }));

        performers.sort((a, b) => b.averageRating - a.averageRating);

        return performers.slice(0, limit);
    } catch (error) {
        console.error('Error getting top performers:', error);
        throw error;
    }
};

// Get performance analytics
export const getPerformanceAnalytics = async (filters = {}) => {
    try {
        const reviews = await getPerformanceReviews(filters);

        if (reviews.length === 0) {
            return {
                totalReviews: 0,
                averageRating: 0,
                distribution: {},
                departmentWise: {},
                trends: []
            };
        }

        // Rating distribution
        const distribution = {
            excellent: reviews.filter(r => r.overallRating >= 4.5).length,
            good: reviews.filter(r => r.overallRating >= 3.5 && r.overallRating < 4.5).length,
            satisfactory: reviews.filter(r => r.overallRating >= 2.5 && r.overallRating < 3.5).length,
            needsImprovement: reviews.filter(r => r.overallRating < 2.5).length
        };

        // Department-wise performance
        const departmentWise = {};
        reviews.forEach(review => {
            const dept = review.department || 'Unknown';
            if (!departmentWise[dept]) {
                departmentWise[dept] = {
                    count: 0,
                    totalRating: 0,
                    averageRating: 0
                };
            }
            departmentWise[dept].count++;
            departmentWise[dept].totalRating += review.overallRating || 0;
        });

        Object.keys(departmentWise).forEach(dept => {
            departmentWise[dept].averageRating =
                departmentWise[dept].totalRating / departmentWise[dept].count;
        });

        // Overall average
        const totalRating = reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0);
        const averageRating = totalRating / reviews.length;

        return {
            totalReviews: reviews.length,
            averageRating: parseFloat(averageRating.toFixed(2)),
            distribution,
            departmentWise,
            reviews
        };
    } catch (error) {
        console.error('Error getting performance analytics:', error);
        throw error;
    }
};

// Set employee goals
export const setEmployeeGoals = async (goalData) => {
    try {
        const goal = {
            ...goalData,
            status: 'In Progress',
            progress: 0,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'goals'), goal);
        return { id: docRef.id, ...goal };
    } catch (error) {
        console.error('Error setting goals:', error);
        throw error;
    }
};

// Update goal progress
export const updateGoalProgress = async (goalId, progress, status) => {
    try {
        const goalRef = doc(db, 'goals', goalId);
        await updateDoc(goalRef, {
            progress,
            status,
            updatedAt: serverTimestamp()
        });

        return { id: goalId, progress, status };
    } catch (error) {
        console.error('Error updating goal progress:', error);
        throw error;
    }
};

// Get employee goals
export const getEmployeeGoals = async (employeeId) => {
    try {
        const q = query(
            collection(db, 'goals'),
            where('employeeId', '==', employeeId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching goals:', error);
        throw error;
    }
};
