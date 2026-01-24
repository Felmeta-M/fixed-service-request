/**
 * Dynamic Status Service
 * 
 * Fetches status definitions from backend API to ensure frontend
 * always uses the latest status labels. This solves the problem of
 * hardcoded status labels becoming out of sync when backend changes them.
 */

import axios from 'axios';

interface StatusDefinition {
    value: number;
    label: string;
    name: string;
}

interface StatusDefinitionsResponse {
    success: boolean;
    data: {
        statuses: StatusDefinition[];
        status_map: Record<number, string>;
        label_map: Record<string, number>;
    };
}

// Cache for status definitions
let statusDefinitionsCache: StatusDefinitionsResponse['data'] | null = null;
let statusDefinitionsPromise: Promise<StatusDefinitionsResponse['data']> | null = null;

/**
 * Fetch status definitions from backend API
 * Uses caching to avoid multiple requests
 */
export async function fetchStatusDefinitions(): Promise<StatusDefinitionsResponse['data']> {
    // Return cached data if available
    if (statusDefinitionsCache) {
        return statusDefinitionsCache;
    }

    // Return existing promise if request is in flight
    if (statusDefinitionsPromise) {
        return statusDefinitionsPromise;
    }

    // Fetch from API
    statusDefinitionsPromise = axios
        .get<StatusDefinitionsResponse>('/api/v1/status-definitions')
        .then((response) => {
            if (response.data.success && response.data.data) {
                statusDefinitionsCache = response.data.data;
                return response.data.data;
            }
            throw new Error('Failed to fetch status definitions');
        })
        .catch((error) => {
            // Clear promise on error so we can retry
            statusDefinitionsPromise = null;
            console.error('Error fetching status definitions:', error);
            throw error;
        });

    return statusDefinitionsPromise;
}

/**
 * Get status label by value
 */
export async function getStatusLabel(value: number): Promise<string> {
    const definitions = await fetchStatusDefinitions();
    return definitions.status_map[value] || 'Unknown';
}

/**
 * Get status value by label
 */
export async function getStatusValue(label: string): Promise<number | null> {
    const definitions = await fetchStatusDefinitions();
    return definitions.label_map[label] || null;
}

/**
 * Get all status definitions
 */
export async function getAllStatusDefinitions(): Promise<StatusDefinition[]> {
    const definitions = await fetchStatusDefinitions();
    return definitions.statuses;
}

/**
 * Clear status definitions cache (useful for testing or forced refresh)
 */
export function clearStatusDefinitionsCache(): void {
    statusDefinitionsCache = null;
    statusDefinitionsPromise = null;
}
