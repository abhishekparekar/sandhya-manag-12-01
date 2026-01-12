/**
 * Assignment Service
 * Auto-assign leads to telecallers using various algorithms
 */

import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Assignment algorithms
 */
export const ALGORITHMS = {
    ROUND_ROBIN: 'roundRobin',
    WORKLOAD_BALANCE: 'workloadBalance',
    RULE_BASED: 'ruleBased'
};

/**
 * Get active telecallers with their workload
 * @returns {Promise<Array>} Array of telecallers with lead counts
 */
export const getTelecallersWithWorkload = async () => {
    try {
        // Get all active telecallers
        const usersSnapshot = await getDocs(
            query(
                collection(db, 'users'),
                where('role', 'in', ['employee', 'manager']),
                where('status', '==', 'active')
            )
        );

        const telecallers = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            email: doc.data().email,
            name: doc.data().name || doc.data().email,
            role: doc.data().role
        }));

        // Get leads count for each telecaller
        const workload = await Promise.all(
            telecallers.map(async (telecaller) => {
                const leadsSnapshot = await getDocs(
                    query(
                        collection(db, 'leads'),
                        where('telecaller', '==', telecaller.email),
                        where('status', 'in', ['new', 'follow-up', 'interested'])
                    )
                );

                return {
                    ...telecaller,
                    activeLeads: leadsSnapshot.size
                };
            })
        );

        return workload;
    } catch (error) {
        console.error('Error getting telecallers with workload:', error);
        return [];
    }
};

/**
 * Round-robin assignment
 * @param {Array} leads - Leads to assign
 * @param {Array} telecallers - Available telecallers
 * @returns {Array} Leads with assigned telecaller
 */
const roundRobinAssignment = (leads, telecallers) => {
    if (telecallers.length === 0) return leads;

    let index = 0;
    return leads.map(lead => ({
        ...lead,
        telecaller: telecallers[index++ % telecallers.length].email,
        assignedBy: 'auto-roundRobin'
    }));
};

/**
 * Workload-balanced assignment
 * @param {Array} leads - Leads to assign
 * @param {Array} telecallers - Available telecallers with workload
 * @returns {Array} Leads with assigned telecaller
 */
const workloadBalanceAssignment = (leads, telecallers) => {
    if (telecallers.length === 0) return leads;

    // Sort by workload (ascending)
    const sorted = [...telecallers].sort((a, b) => a.activeLeads - b.activeLeads);

    return leads.map(lead => {
        // Assign to telecaller with lowest workload
        const assignedTo = sorted[0];

        // Update workload count
        sorted[0].activeLeads++;

        // Re-sort
        sorted.sort((a, b) => a.activeLeads - b.activeLeads);

        return {
            ...lead,
            telecaller: assignedTo.email,
            assignedBy: 'auto-workloadBalance'
        };
    });
};

/**
 * Rule-based assignment
 * @param {Array} leads - Leads to assign
 * @param {Array} telecallers - Available telecallers with workload
 * @returns {Array} Leads with assigned telecaller
 */
const ruleBasedAssignment = (leads, telecallers) => {
    if (telecallers.length === 0) return leads;

    // Get top performer (most active leads = experienced)
    const topPerformer = telecallers.reduce((max, t) =>
        t.activeLeads > max.activeLeads ? t : max
        , telecallers[0]);

    // Get managers
    const managers = telecallers.filter(t => t.role === 'manager');

    return leads.map(lead => {
        let assignedTo;

        // High priority leads go to top performer
        if (lead.priority === 'high') {
            assignedTo = topPerformer;
        }
        // Referral leads go to managers
        else if (lead.source === 'referral' && managers.length > 0) {
            assignedTo = managers[0];
        }
        // Others: workload balance
        else {
            const sorted = [...telecallers].sort((a, b) => a.activeLeads - b.activeLeads);
            assignedTo = sorted[0];
            sorted[0].activeLeads++;
        }

        return {
            ...lead,
            telecaller: assignedTo.email,
            assignedBy: 'auto-ruleBased'
        };
    });
};

/**
 * Auto-assign leads to telecallers
 * @param {Array} leadIds - Array of lead IDs to assign
 * @param {string} algorithm - Assignment algorithm to use
 * @returns {Promise<Object>} { success: number, failed: number }
 */
export const autoAssignLeads = async (leadIds, algorithm = ALGORITHMS.ROUND_ROBIN) => {
    try {
        // Get telecallers with workload
        const telecallers = await getTelecallersWithWorkload();

        if (telecallers.length === 0) {
            throw new Error('No active telecallers found');
        }

        // Get leads
        const leadsSnapshot = await getDocs(collection(db, 'leads'));
        const leads = leadsSnapshot.docs
            .filter(doc => leadIds.includes(doc.id))
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        // Apply assignment algorithm
        let assignedLeads;
        switch (algorithm) {
            case ALGORITHMS.WORKLOAD_BALANCE:
                assignedLeads = workloadBalanceAssignment(leads, telecallers);
                break;
            case ALGORITHMS.RULE_BASED:
                assignedLeads = ruleBasedAssignment(leads, telecallers);
                break;
            case ALGORITHMS.ROUND_ROBIN:
            default:
                assignedLeads = roundRobinAssignment(leads, telecallers);
        }

        // Update Firestore
        let success = 0;
        let failed = 0;

        for (const lead of assignedLeads) {
            try {
                await updateDoc(doc(db, 'leads', lead.id), {
                    telecaller: lead.telecaller,
                    assignedAt: serverTimestamp(),
                    assignedBy: lead.assignedBy,
                    updatedAt: serverTimestamp()
                });
                success++;
            } catch (error) {
                console.error(`Failed to assign lead ${lead.id}:`, error);
                failed++;
            }
        }

        return { success, failed };
    } catch (error) {
        console.error('Error auto-assigning leads:', error);
        throw error;
    }
};

/**
 * Reassign lead from one telecaller to another
 * @param {string} leadId - Lead ID
 * @param {string} toTelecaller - Email of new telecaller
 * @param {string} reassignedBy - User who reassigned
 * @returns {Promise<void>}
 */
export const reassignLead = async (leadId, toTelecaller, reassignedBy = 'admin') => {
    try {
        await updateDoc(doc(db, 'leads', leadId), {
            telecaller: toTelecaller,
            assignedAt: serverTimestamp(),
            assignedBy: 'manual',
            reassignedBy,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error reassigning lead:', error);
        throw error;
    }
};

/**
 * Balance workload across all telecallers
 * @returns {Promise<Object>} { redistributed: number }
 */
export const balanceWorkload = async () => {
    try {
        const telecallers = await getTelecallersWithWorkload();

        if (telecallers.length === 0) {
            return { redistributed: 0 };
        }

        // Calculate average workload
        const totalLeads = telecallers.reduce((sum, t) => sum + t.activeLeads, 0);
        const avgWorkload = Math.floor(totalLeads / telecallers.length);

        // Find overloaded telecallers
        const overloaded = telecallers.filter(t => t.activeLeads > avgWorkload + 2);
        const underloaded = telecallers.filter(t => t.activeLeads < avgWorkload - 2);

        if (overloaded.length === 0 || underloaded.length === 0) {
            return { redistributed: 0 };
        }

        let redistributed = 0;

        // Redistribute leads
        for (const overloadedTelecaller of overloaded) {
            const excess = overloadedTelecaller.activeLeads - avgWorkload;

            // Get leads to redistribute
            const leadsSnapshot = await getDocs(
                query(
                    collection(db, 'leads'),
                    where('telecaller', '==', overloadedTelecaller.email),
                    where('status', 'in', ['new', 'follow-up'])
                )
            );

            const leadsToRedistribute = leadsSnapshot.docs.slice(0, excess);

            for (const leadDoc of leadsToRedistribute) {
                if (underloaded.length === 0) break;

                const targetTelecaller = underloaded[0];

                await reassignLead(leadDoc.id, targetTelecaller.email, 'system-balance');
                redistributed++;

                // Update counts
                targetTelecaller.activeLeads++;
                if (targetTelecaller.activeLeads >= avgWorkload) {
                    underloaded.shift();
                }
            }
        }

        return { redistributed };
    } catch (error) {
        console.error('Error balancing workload:', error);
        throw error;
    }
};

/**
 * Get workload statistics
 * @returns {Promise<Object>} Workload stats
 */
export const getWorkloadStats = async () => {
    try {
        const telecallers = await getTelecallersWithWorkload();

        const totalLeads = telecallers.reduce((sum, t) => sum + t.activeLeads, 0);
        const avgWorkload = telecallers.length > 0 ? totalLeads / telecallers.length : 0;

        return {
            telecallers,
            totalLeads,
            avgWorkload: Math.round(avgWorkload),
            distribution: telecallers.map(t => ({
                name: t.name,
                leads: t.activeLeads,
                percentage: totalLeads > 0 ? ((t.activeLeads / totalLeads) * 100).toFixed(1) + '%' : '0%'
            }))
        };
    } catch (error) {
        console.error('Error getting workload stats:', error);
        throw error;
    }
};

export default {
    ALGORITHMS,
    getTelecallersWithWorkload,
    autoAssignLeads,
    reassignLead,
    balanceWorkload,
    getWorkloadStats
};
