/**
 * Geocoding utility
 *
 * Uses the server-side proxy first, then falls back to the browser-side
 * Google Maps Geocoder (available when the Maps JS API is loaded).
 *
 * Returns structured address components (city, subcity, street, etc.) alongside
 * the formatted address. Includes smart address selection that skips Plus Codes
 * and prefers human-readable addresses.
 */

import { apiClient } from './api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StructuredAddress {
    formatted: string;
    street?: string;
    neighborhood?: string;
    subcity?: string;
    city?: string;
    woreda?: string;
    region?: string;
    country?: string;
}

interface GeocodeResult {
    formatted_address?: string;
    types?: string[];
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

// ─── Address component extraction ─────────────────────────────────────────────

const PLUS_CODE_REGEX = /^[A-Z0-9]{4,8}\+/i;

const PREFERRED_TYPES_ORDER = [
    'street_address',
    'route',
    'premise',
    'neighborhood',
    'sublocality',
    'sublocality_level_1',
    'locality',
    'administrative_area_level_3',
    'administrative_area_level_2',
];

type AddressField = Exclude<keyof StructuredAddress, 'formatted'>;

/**
 * Maps Google address_component types to our StructuredAddress fields.
 * Order matters: first match wins for each field.
 */
const COMPONENT_MAP: Array<{ field: AddressField; types: string[] }> = [
    { field: 'street', types: ['route'] },
    { field: 'neighborhood', types: ['neighborhood'] },
    { field: 'subcity', types: ['sublocality_level_1', 'sublocality', 'administrative_area_level_2'] },
    { field: 'woreda', types: ['administrative_area_level_3'] },
    { field: 'city', types: ['locality'] },
    { field: 'region', types: ['administrative_area_level_1'] },
    { field: 'country', types: ['country'] },
];

function isPlusCode(result: { types?: string[]; formatted_address?: string }): boolean {
    if (result.types?.includes('plus_code')) return true;
    if (result.formatted_address && PLUS_CODE_REGEX.test(result.formatted_address)) return true;
    return false;
}

function extractComponents(
    results: Array<{ address_components?: GeocodeResult['address_components']; types?: string[]; formatted_address?: string }>,
): Omit<StructuredAddress, 'formatted'> {
    const components: Omit<StructuredAddress, 'formatted'> = {};

    const allAddressComponents = results
        .filter((r) => !isPlusCode(r))
        .flatMap((r) => r.address_components ?? []);

    for (const mapping of COMPONENT_MAP) {
        if (components[mapping.field]) continue;
        for (const type of mapping.types) {
            const comp = allAddressComponents.find((c) => c.types.includes(type));
            if (comp) {
                components[mapping.field] = comp.long_name;
                break;
            }
        }
    }

    return components;
}

function pickBestAddress(results: Array<{ types?: string[]; formatted_address?: string }>): string {
    if (!results || results.length === 0) return '';

    for (const preferredType of PREFERRED_TYPES_ORDER) {
        const match = results.find(
            (r) => r.types?.includes(preferredType) && !isPlusCode(r) && r.formatted_address,
        );
        if (match) return match.formatted_address!;
    }

    const firstNonPlusCode = results.find((r) => !isPlusCode(r) && r.formatted_address);
    if (firstNonPlusCode) return firstNonPlusCode.formatted_address!;

    return results[0]?.formatted_address || '';
}

function buildStructuredAddress(
    results: Array<GeocodeResult>,
): StructuredAddress {
    const formatted = pickBestAddress(results);
    const components = extractComponents(results);
    return { formatted, ...components };
}

/**
 * Build a compact one-line summary from structured components.
 * e.g. "Woreda 03 · Bole · Addis Ababa · Ethiopia"
 */
export function formatAddressSummary(ac: StructuredAddress | undefined | null): string {
    if (!ac) return '';
    const parts: string[] = [];
    if (ac.street) parts.push(ac.street);
    if (ac.neighborhood) parts.push(ac.neighborhood);
    if (ac.woreda) parts.push(ac.woreda);
    if (ac.subcity) parts.push(ac.subcity);
    if (ac.city && ac.city !== ac.subcity) parts.push(ac.city);
    if (ac.region && ac.region !== ac.city && ac.region !== ac.subcity) parts.push(ac.region);
    if (ac.country) parts.push(ac.country);
    return parts.join(' · ');
}

// ─── Browser-side geocoder ────────────────────────────────────────────────────

function browserReverseGeocodeDetailed(lat: number, lng: number): Promise<StructuredAddress | null> {
    return new Promise((resolve) => {
        if (typeof google === 'undefined' || !google.maps?.Geocoder) {
            resolve(null);
            return;
        }

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
            { location: { lat, lng } },
            (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                    resolve(buildStructuredAddress(results as unknown as GeocodeResult[]));
                } else {
                    resolve(null);
                }
            },
        );
    });
}

// ─── Public API ───────────────────────────────────────────────────────────────

const EMPTY_STRUCTURED: StructuredAddress = { formatted: 'Address details not available' };

/**
 * Reverse geocode with full structured address components.
 *
 * Returns city, subcity, neighborhood, street, woreda, region, country
 * alongside the formatted address string.
 */
export async function reverseGeocodeDetailed(lat: number, lng: number): Promise<StructuredAddress> {
    try {
        const response = await apiClient.post<GeocodeResponse>('/geocode/reverse', {
            latitude: lat,
            longitude: lng,
        });

        if (response.success && response.results?.length > 0) {
            const structured = buildStructuredAddress(response.results);
            if (structured.formatted) return structured;
        }

        if (response.status === 'ZERO_RESULTS') {
            return { formatted: 'Location identified (specific address not available)' };
        }
    } catch {
        // Server call failed -- fall through to browser fallback
    }

    const browserResult = await browserReverseGeocodeDetailed(lat, lng);
    if (browserResult && browserResult.formatted) {
        return browserResult;
    }

    return { ...EMPTY_STRUCTURED };
}

/**
 * Reverse geocode: returns only the formatted address string.
 * Convenience wrapper around reverseGeocodeDetailed for call-sites
 * that don't need structured components.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
    const result = await reverseGeocodeDetailed(lat, lng);
    return result.formatted;
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
