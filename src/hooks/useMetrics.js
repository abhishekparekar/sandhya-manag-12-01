/**
 * useMetrics Hook
 * React hook for fetching and managing dashboard metrics
 */

import { useState, useEffect, useCallback } from 'react';
import { getMetrics, subscribeToMetrics, invalidateMetricsCache } from '../services/metricsService';

/**
 * Hook to fetch and manage metrics
 * @param {string} period - 'today', 'week', 'month'
 * @param {boolean} realtime - Enable real-time updates (default: false)
 * @param {number} refreshInterval - Auto-refresh interval in ms (default: 5 min, 0 = disabled)
 * @returns {object} { metrics, loading, error, refresh }
 */
export const useMetrics = (period = 'today', realtime = false, refreshInterval = 5 * 60 * 1000) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Fetch metrics
     */
    const fetchMetrics = useCallback(async (useCache = true) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMetrics(period, useCache);
            setMetrics(data);
        } catch (err) {
            console.error('Error fetching metrics:', err);
            setError(err.message || 'Failed to fetch metrics');
        } finally {
            setLoading(false);
        }
    }, [period]);

    /**
     * Refresh metrics (force fetch, bypass cache)
     */
    const refresh = useCallback(() => {
        invalidateMetricsCache();
        fetchMetrics(false);
    }, [fetchMetrics]);

    // Initial fetch
    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    // Real-time updates
    useEffect(() => {
        if (!realtime) return;

        const unsubscribe = subscribeToMetrics((newMetrics) => {
            setMetrics(newMetrics);
        });

        return () => unsubscribe();
    }, [realtime]);

    // Auto-refresh interval
    useEffect(() => {
        if (refreshInterval <= 0) return;

        const interval = setInterval(() => {
            fetchMetrics(false);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval, fetchMetrics]);

    return {
        metrics,
        loading,
        error,
        refresh
    };
};

export default useMetrics;
