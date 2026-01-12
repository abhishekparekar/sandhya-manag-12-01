/**
 * useAISuggestions Hook
 * React hook for AI-powered business suggestions
 */

import { useMemo } from 'react';
import { generateSuggestions, getCriticalSuggestions } from '../services/aiSuggestionsService';

/**
 * Hook to generate AI suggestions from metrics
 * @param {object} metrics - Metrics data
 * @returns {object} {suggestions, criticalSuggestions, hasCritical}
 */
export const useAISuggestions = (metrics) => {
    const suggestions = useMemo(() => {
        if (!metrics) return [];
        return generateSuggestions(metrics);
    }, [metrics]);

    const criticalSuggestions = useMemo(() => {
        return getCriticalSuggestions(suggestions);
    }, [suggestions]);

    const hasCritical = criticalSuggestions.length > 0;

    return {
        suggestions,
        criticalSuggestions,
        hasCritical,
        count: suggestions.length
    };
};

export default useAISuggestions;
