/**
 * Metrics Service
 * Centralized service for real-time metrics aggregation from 8 Firestore collections
 */

import { db } from './firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import cache from '../utils/cacheManager';

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Get date range for different periods
 * @param {string} period - 'today', 'week', 'month'
 * @returns {object} { start, end }
 */
const getDateRange = (period = 'today') => {
    const today = new Date();
    const end = getTodayDate();

    let start;
    switch (period) {
        case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            start = weekAgo.toISOString().split('T')[0];
            break;
        case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            start = monthAgo.toISOString().split('T')[0];
            break;
        case 'today':
        default:
            start = end;
    }

    return { start, end };
};

/**
 * Fetch leads metrics
 */
const fetchLeadsMetrics = async (dateRange) => {
    try {
        const leadsSnap = await getDocs(collection(db, 'leads'));
        const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const today = getTodayDate();

        // Filter for today
        const todayLeads = leads.filter(l => l.lastCallDate === today || l.createdAt?.toDate?.().toISOString().split('T')[0] === today);

        return {
            total: leads.length,
            new: todayLeads.filter(l => l.createdAt?.toDate?.().toISOString().split('T')[0] === today).length,
            interested: leads.filter(l => l.status === 'Interested').length,
            followUpsDue: leads.filter(l => l.followUpDate && l.followUpDate >= today && l.status !== 'Interested').length,
            notPicked: leads.filter(l => l.status === 'Not Picked').length,
            conversionRate: leads.length > 0 ? ((leads.filter(l => l.status === 'Interested').length / leads.length) * 100).toFixed(1) + '%' : '0%'
        };
    } catch (error) {
        console.error('Error fetching leads metrics:', error);
        return {
            total: 0,
            new: 0,
            interested: 0,
            followUpsDue: 0,
            notPicked: 0,
            conversionRate: '0%'
        };
    }
};

/**
 * Fetch sales metrics
 */
const fetchSalesMetrics = async (dateRange) => {
    try {
        const salesSnap = await getDocs(collection(db, 'sales'));
        const sales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const today = getTodayDate();
        const todaySales = sales.filter(s => s.date === today);

        const todayAmount = todaySales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
        const totalAmount = sales.reduce((acc, s) => acc + Number(s.amount || 0), 0);

        // Get top sale
        const topSale = sales.length > 0 ? sales.reduce((max, s) => Number(s.amount || 0) > Number(max.amount || 0) ? s : max) : null;

        return {
            count: todaySales.length,
            amount: todayAmount,
            totalAmount,
            avgSale: todaySales.length > 0 ? Math.round(todayAmount / todaySales.length) : 0,
            topSale: topSale ? {
                customer: topSale.customerName || topSale.client || 'Unknown',
                amount: Number(topSale.amount || 0)
            } : null
        };
    } catch (error) {
        console.error('Error fetching sales metrics:', error);
        return {
            count: 0,
            amount: 0,
            totalAmount: 0,
            avgSale: 0,
            topSale: null
        };
    }
};

/**
 * Fetch call metrics
 */
const fetchCallMetrics = async (dateRange) => {
    try {
        const leadsSnap = await getDocs(collection(db, 'leads'));
        const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const today = getTodayDate();
        const todayCalls = leads.filter(l => l.lastCallDate === today);

        const answered = todayCalls.filter(l => l.status !== 'Not Picked').length;
        const notPicked = todayCalls.filter(l => l.status === 'Not Picked').length;

        // Get top telecaller
        const telecallerStats = {};
        leads.forEach(lead => {
            if (lead.telecaller) {
                if (!telecallerStats[lead.telecaller]) {
                    telecallerStats[lead.telecaller] = 0;
                }
                telecallerStats[lead.telecaller]++;
            }
        });

        const topTelecaller = Object.entries(telecallerStats).length > 0
            ? Object.entries(telecallerStats).reduce((max, [name, count]) => count > (max[1] || 0) ? [name, count] : max, ['None', 0])[0]
            : 'None';

        return {
            total: todayCalls.length,
            answered,
            notPicked,
            answerRate: todayCalls.length > 0 ? ((answered / todayCalls.length) * 100).toFixed(1) + '%' : '0%',
            topTelecaller
        };
    } catch (error) {
        console.error('Error fetching call metrics:', error);
        return {
            total: 0,
            answered: 0,
            notPicked: 0,
            answerRate: '0%',
            topTelecaller: 'None'
        };
    }
};

/**
 * Fetch project metrics
 */
const fetchProjectMetrics = async (dateRange) => {
    try {
        const projectsSnap = await getDocs(collection(db, 'projects'));
        const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const inProgress = projects.filter(p => p.status === 'In Progress' || p.status === 'Active').length;
        const completed = projects.filter(p => p.status === 'Completed').length;
        const delayed = projects.filter(p => p.status === 'Delayed' || p.status === 'On Hold').length;

        return {
            total: projects.length,
            inProgress,
            completed,
            delayed,
            completionRate: projects.length > 0 ? ((completed / projects.length) * 100).toFixed(1) + '%' : '0%'
        };
    } catch (error) {
        console.error('Error fetching project metrics:', error);
        return {
            total: 0,
            inProgress: 0,
            completed: 0,
            delayed: 0,
            completionRate: '0%'
        };
    }
};

/**
 * Fetch expense metrics
 */
const fetchExpenseMetrics = async (dateRange) => {
    try {
        const expensesSnap = await getDocs(collection(db, 'expenses'));
        const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const today = getTodayDate();
        const thisMonth = new Date().getMonth();

        const todayExpenses = expenses.filter(e => e.date === today);
        const monthExpenses = expenses.filter(e => {
            const expDate = new Date(e.date);
            return expDate.getMonth() === thisMonth;
        });

        const todayTotal = todayExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
        const monthTotal = monthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
        const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

        // Category breakdown
        const categories = {};
        monthExpenses.forEach(exp => {
            const cat = exp.category || 'Other';
            categories[cat] = (categories[cat] || 0) + Number(exp.amount || 0);
        });

        return {
            today: todayTotal,
            thisMonth: monthTotal,
            total: totalExpenses,
            categories,
            count: todayExpenses.length
        };
    } catch (error) {
        console.error('Error fetching expense metrics:', error);
        return {
            today: 0,
            thisMonth: 0,
            total: 0,
            categories: {},
            count: 0
        };
    }
};

/**
 * Fetch team metrics
 */
const fetchTeamMetrics = async (dateRange) => {
    try {
        const [employeesSnap, tasksSnap] = await Promise.all([
            getDocs(collection(db, 'employees')),
            getDocs(collection(db, 'tasks'))
        ]);

        const employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const today = getTodayDate();
        const todayTasks = tasks.filter(t => t.date === today);
        const completed = todayTasks.filter(t => t.status === 'Completed').length;

        return {
            totalEmployees: employees.length,
            tasksToday: todayTasks.length,
            tasksCompleted: completed,
            productivity: todayTasks.length > 0 ? ((completed / todayTasks.length) * 100).toFixed(0) + '%' : '0%'
        };
    } catch (error) {
        console.error('Error fetching team metrics:', error);
        return {
            totalEmployees: 0,
            tasksToday: 0,
            tasksCompleted: 0,
            productivity: '0%'
        };
    }
};

/**
 * Fetch inventory metrics
 */
const fetchInventoryMetrics = async () => {
    try {
        const inventorySnap = await getDocs(collection(db, 'inventory'));
        const inventory = inventorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const lowStock = inventory.filter(i => Number(i.quantity || 0) < 10).length;
        const outOfStock = inventory.filter(i => Number(i.quantity || 0) === 0).length;

        return {
            total: inventory.length,
            lowStock,
            outOfStock
        };
    } catch (error) {
        console.error('Error fetching inventory metrics:', error);
        return {
            total: 0,
            lowStock: 0,
            outOfStock: 0
        };
    }
};

/**
 * Get all metrics (aggregated)
 * @param {string} period - 'today', 'week', 'month'
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<object>} All metrics
 */
export const getMetrics = async (period = 'today', useCache = true) => {
    const cacheKey = `metrics_${period}`;

    // Try cache first
    if (useCache) {
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
    }

    try {
        const dateRange = getDateRange(period);

        // Fetch all metrics in parallel
        const [leads, sales, calls, projects, expenses, team, inventory] = await Promise.all([
            fetchLeadsMetrics(dateRange),
            fetchSalesMetrics(dateRange),
            fetchCallMetrics(dateRange),
            fetchProjectMetrics(dateRange),
            fetchExpenseMetrics(dateRange),
            fetchTeamMetrics(dateRange),
            fetchInventoryMetrics()
        ]);

        const metrics = {
            period,
            timestamp: new Date().toISOString(),
            leads,
            sales,
            calls,
            projects,
            expenses,
            team,
            inventory
        };

        // Cache for 5 minutes
        cache.set(cacheKey, metrics, cache.TTL.SHORT);

        return metrics;
    } catch (error) {
        console.error('Error getting metrics:', error);
        throw error;
    }
};

/**
 * Subscribe to real-time metrics updates
 * @param {function} callback - Callback function
 * @returns {function} Unsubscribe function
 */
export const subscribeToMetrics = (callback) => {
    const unsubscribers = [];

    // Listen to leads changes
    const leadsUnsub = onSnapshot(collection(db, 'leads'), () => {
        cache.invalidate('metrics_today');
        getMetrics('today', false).then(callback);
    });
    unsubscribers.push(leadsUnsub);

    // Listen to sales changes
    const salesUnsub = onSnapshot(collection(db, 'sales'), () => {
        cache.invalidate('metrics_today');
        getMetrics('today', false).then(callback);
    });
    unsubscribers.push(salesUnsub);

    // Return combined unsubscribe function
    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
};

/**
 * Invalidate metrics cache
 */
export const invalidateMetricsCache = () => {
    cache.invalidatePattern('metrics_');
};

export default {
    getMetrics,
    subscribeToMetrics,
    invalidateMetricsCache
};
