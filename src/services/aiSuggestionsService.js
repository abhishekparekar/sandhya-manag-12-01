/**
 * AI Business Suggestions Service
 * Rule-based AI system that analyzes metrics and provides actionable insights
 */

/**
 * Suggestion types
 */
export const SUGGESTION_TYPES = {
    CRITICAL: 'critical',
    WARNING: 'warning',
    OPPORTUNITY: 'opportunity',
    INSIGHT: 'insight'
};

/**
 * Suggestion priorities
 */
export const PRIORITIES = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

/**
 * Analyze sales metrics and generate suggestions
 */
const analyzeSales = (metrics) => {
    const suggestions = [];
    const { sales } = metrics;

    if (!sales) return suggestions;

    // Low sales alert
    if (sales.count === 0) {
        suggestions.push({
            id: 'sales-zero',
            type: SUGGESTION_TYPES.CRITICAL,
            priority: PRIORITIES.CRITICAL,
            title: 'No Sales Today',
            message: 'No sales recorded today. Review your lead pipeline and follow up with hot prospects.',
            action: 'View Leads',
            actionPath: '/telecalling',
            icon: 'alert-triangle'
        });
    } else if (sales.count < 3) {
        suggestions.push({
            id: 'sales-low',
            type: SUGGESTION_TYPES.WARNING,
            priority: PRIORITIES.HIGH,
            title: 'Sales Below Target',
            message: `Only ${sales.count} sales today. Focus on converting interested leads.`,
            action: 'View Sales',
            actionPath: '/sales',
            icon: 'trending-down'
        });
    }

    // High sales opportunity
    if (sales.amount > 100000) {
        suggestions.push({
            id: 'sales-high',
            type: SUGGESTION_TYPES.OPPORTUNITY,
            priority: PRIORITIES.MEDIUM,
            title: 'Strong Sales Performance!',
            message: `Excellent! You've achieved ₹${sales.amount.toLocaleString()} in sales today. Keep the momentum going.`,
            action: 'View Details',
            actionPath: '/sales',
            icon: 'trending-up'
        });
    }

    return suggestions;
};

/**
 * Analyze lead metrics and generate suggestions
 */
const analyzeLeads = (metrics) => {
    const suggestions = [];
    const { leads } = metrics;

    if (!leads) return suggestions;

    // High follow-ups backlog
    if (leads.followUpsDue >= 10) {
        suggestions.push({
            id: 'followups-high',
            type: SUGGESTION_TYPES.CRITICAL,
            priority: PRIORITIES.CRITICAL,
            title: 'High Follow-up Backlog',
            message: `${leads.followUpsDue} follow-ups are pending. Distribute workload among telecallers to avoid losing hot leads.`,
            action: 'Assign Tasks',
            actionPath: '/telecalling',
            icon: 'alert-circle'
        });
    } else if (leads.followUpsDue >= 5) {
        suggestions.push({
            id: 'followups-medium',
            type: SUGGESTION_TYPES.WARNING,
            priority: PRIORITIES.HIGH,
            title: 'Follow-ups Pending',
            message: `${leads.followUpsDue} follow-ups require attention today.`,
            action: 'View Leads',
            actionPath: '/telecalling',
            icon: 'phone'
        });
    }

    // Low conversion rate
    const conversionRate = parseFloat(leads.conversionRate);
    if (!isNaN(conversionRate) && conversionRate < 20) {
        suggestions.push({
            id: 'conversion-low',
            type: SUGGESTION_TYPES.WARNING,
            priority: PRIORITIES.MEDIUM,
            title: 'Low Conversion Rate',
            message: `Your conversion rate is ${leads.conversionRate}. Review call scripts and qualify leads better.`,
            action: 'View Training',
            actionPath: '/telecalling',
            icon: 'bar-chart-2'
        });
    }

    // High conversion rate
    if (!isNaN(conversionRate) && conversionRate > 40) {
        suggestions.push({
            id: 'conversion-high',
            type: SUGGESTION_TYPES.OPPORTUNITY,
            priority: PRIORITIES.LOW,
            title: 'Excellent Conversion Rate!',
            message: `Your ${leads.conversionRate} conversion rate is outstanding. Document successful strategies.`,
            action: 'View Stats',
            actionPath: '/telecalling',
            icon: 'award'
        });
    }

    return suggestions;
};

/**
 * Analyze call metrics and generate suggestions
 */
const analyzeCalls = (metrics) => {
    const suggestions = [];
    const { calls } = metrics;

    if (!calls) return suggestions;

    // Low answer rate
    const answerRate = parseFloat(calls.answerRate);
    if (!isNaN(answerRate) && answerRate < 70) {
        suggestions.push({
            id: 'answer-rate-low',
            type: SUGGESTION_TYPES.WARNING,
            priority: PRIORITIES.MEDIUM,
            title: 'Low Call Answer Rate',
            message: `Only ${calls.answerRate} of calls are being answered. Try calling at different times.`,
            action: 'View Analytics',
            actionPath: '/telecalling',
            icon: 'phone-off'
        });
    }

    // Top performer insight
    if (calls.topTelecaller && calls.topTelecaller !== 'None') {
        suggestions.push({
            id: 'top-performer',
            type: SUGGESTION_TYPES.INSIGHT,
            priority: PRIORITIES.LOW,
            title: 'Top Performer Identified',
            message: `${calls.topTelecaller} is your top telecaller. Consider having them train the team.`,
            action: 'View Performance',
            actionPath: '/telecalling',
            icon: 'star'
        });
    }

    return suggestions;
};

/**
 * Analyze expense metrics and generate suggestions
 */
const analyzeExpenses = (metrics) => {
    const suggestions = [];
    const { expenses } = metrics;

    if (!expenses) return suggestions;

    // High expenses warning
    if (expenses.thisMonth > 100000) {
        const budgetUsage = expenses.thisMonth / 120000 * 100; // Assuming 120k budget
        if (budgetUsage > 85) {
            suggestions.push({
                id: 'budget-high',
                type: SUGGESTION_TYPES.CRITICAL,
                priority: PRIORITIES.CRITICAL,
                title: 'Budget Alert',
                message: `Monthly expenses at ${budgetUsage.toFixed(0)}% of budget. Review discretionary spending.`,
                action: 'View Expenses',
                actionPath: '/expenses',
                icon: 'alert-triangle'
            });
        } else if (budgetUsage > 70) {
            suggestions.push({
                id: 'budget-medium',
                type: SUGGESTION_TYPES.WARNING,
                priority: PRIORITIES.MEDIUM,
                title: 'Expense Tracking',
                message: `You've used ${budgetUsage.toFixed(0)}% of monthly budget. Monitor spending closely.`,
                action: 'View Details',
                actionPath: '/expenses',
                icon: 'trending-up'
            });
        }
    }

    return suggestions;
};

/**
 * Analyze project metrics and generate suggestions
 */
const analyzeProjects = (metrics) => {
    const suggestions = [];
    const { projects } = metrics;

    if (!projects) return suggestions;

    // Delayed projects warning
    if (projects.delayed > 0) {
        suggestions.push({
            id: 'projects-delayed',
            type: SUGGESTION_TYPES.WARNING,
            priority: PRIORITIES.HIGH,
            title: 'Projects Delayed',
            message: `${projects.delayed} project${projects.delayed > 1 ? 's are' : ' is'} behind schedule. Review and reallocate resources.`,
            action: 'View Projects',
            actionPath: '/projects',
            icon: 'clock'
        });
    }

    // High completion rate
    const completionRate = parseFloat(projects.completionRate);
    if (!isNaN(completionRate) && completionRate > 80) {
        suggestions.push({
            id: 'projects-success',
            type: SUGGESTION_TYPES.OPPORTUNITY,
            priority: PRIORITIES.LOW,
            title: 'Great Project Delivery',
            message: `${projects.completionRate} project completion rate. Team is performing excellently!`,
            action: 'View Stats',
            actionPath: '/projects',
            icon: 'check-circle'
        });
    }

    return suggestions;
};

/**
 * Analyze team metrics and generate suggestions
 */
const analyzeTeam = (metrics) => {
    const suggestions = [];
    const { team } = metrics;

    if (!team) return suggestions;

    // Low productivity
    const productivity = parseFloat(team.productivity);
    if (!isNaN(productivity) && productivity < 60) {
        suggestions.push({
            id: 'productivity-low',
            type: SUGGESTION_TYPES.WARNING,
            priority: PRIORITIES.MEDIUM,
            title: 'Team Productivity Below Average',
            message: `Only ${team.productivity} of tasks completed. Check for blockers and provide support.`,
            action: 'View Tasks',
            actionPath: '/tasks',
            icon: 'activity'
        });
    }

    // High productivity
    if (!isNaN(productivity) && productivity > 85) {
        suggestions.push({
            id: 'productivity-high',
            type: SUGGESTION_TYPES.INSIGHT,
            priority: PRIORITIES.LOW,
            title: 'Excellent Team Performance',
            message: `${team.productivity} productivity rate! Team is crushing their goals.`,
            action: 'View Details',
            actionPath: '/tasks',
            icon: 'zap'
        });
    }

    return suggestions;
};

/**
 * Analyze inventory metrics and generate suggestions
 */
const analyzeInventory = (metrics) => {
    const suggestions = [];
    const { inventory } = metrics;

    if (!inventory) return suggestions;

    // Out of stock alert
    if (inventory.outOfStock > 0) {
        suggestions.push({
            id: 'stock-out',
            type: SUGGESTION_TYPES.CRITICAL,
            priority: PRIORITIES.CRITICAL,
            title: 'Items Out of Stock',
            message: `${inventory.outOfStock} item${inventory.outOfStock > 1 ? 's are' : ' is'} out of stock. Reorder immediately to avoid delays.`,
            action: 'View Inventory',
            actionPath: '/inventory',
            icon: 'package'
        });
    }

    // Low stock warning
    if (inventory.lowStock > 0) {
        suggestions.push({
            id: 'stock-low',
            type: SUGGESTION_TYPES.WARNING,
            priority: PRIORITIES.MEDIUM,
            title: 'Low Stock Alert',
            message: `${inventory.lowStock} item${inventory.lowStock > 1 ? 's have' : ' has'} less than 10 units. Consider reordering.`,
            action: 'View Items',
            actionPath: '/inventory',
            icon: 'alert-circle'
        });
    }

    return suggestions;
};

/**
 * Generate AI suggestions from metrics
 * @param {object} metrics - Metrics data
 * @returns {array} Array of suggestions sorted by priority
 */
export const generateSuggestions = (metrics) => {
    if (!metrics) return [];

    const allSuggestions = [
        ...analyzeSales(metrics),
        ...analyzeLeads(metrics),
        ...analyzeCalls(metrics),
        ...analyzeExpenses(metrics),
        ...analyzeProjects(metrics),
        ...analyzeTeam(metrics),
        ...analyzeInventory(metrics)
    ];

    // Sort by priority (critical first)
    const priorityOrder = {
        [PRIORITIES.CRITICAL]: 0,
        [PRIORITIES.HIGH]: 1,
        [PRIORITIES.MEDIUM]: 2,
        [PRIORITIES.LOW]: 3
    };

    return allSuggestions.sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
};

/**
 * Get critical suggestions only (for notifications)
 * @param {array} suggestions - All suggestions
 * @returns {array} Critical suggestions only
 */
export const getCriticalSuggestions = (suggestions) => {
    return suggestions.filter(s => s.priority === PRIORITIES.CRITICAL);
};

export default {
    generateSuggestions,
    getCriticalSuggestions,
    SUGGESTION_TYPES,
    PRIORITIES
};
