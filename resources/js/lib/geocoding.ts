/**
 * Geocoding utility - Uses server-side proxy to hide Google API key
 *
 * Security: API key is never exposed to frontend for geocoding calls
 */

import { apiClient } from './api-client';

interface GeocodeResult {
    formatted_address?: string;
    geometry?: {
        location: {
            lat: number;
            lng: number;
        };
    };
    address_components?: Array<{
        long_name: string;
        short_name: string;
        types: string[];
    }>;
}

interface GeocodeResponse {
    success: boolean;
    status?: string;
    results: GeocodeResult[];
    error?: string;
}

/**
 * Reverse geocode: Convert coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const response = await apiClient.post<GeocodeResponse>('/geocode/reverse', {
            latitude: lat,
            longitude: lng,
        });

        if (response.success && response.results?.length > 0) {
            return response.results[0].formatted_address || 'Address found';
        }

        if (response.status === 'ZERO_RESULTS') {
            return 'Location identified (specific address not available)';
        }

        return 'Address details not available';
    } catch (error) {
        return 'Address service temporarily unavailable';
    }
}

/**
 * Forward geocode: Convert address to coordinates
 */
export async function geocodeAddress(
    address: string
): Promise<{ lat: number; lng: number; address: string } | null> {
    try {
        const response = await apiClient.post<GeocodeResponse>('/geocode/address', {
            address,
        });

        if (response.success && response.results?.length > 0) {
            const result = response.results[0];
            if (result.geometry?.location) {
                return {
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng,
                    address: result.formatted_address || address,
                };
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}
