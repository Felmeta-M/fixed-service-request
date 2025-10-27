/**
 * Format coordinates to exactly 6 decimal places as strings
 * This matches the API endpoint requirement
 */
export const formatCoordinate = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
        return '0.000000';
    }

    // Round to 6 decimal places and format as string with exactly 6 decimals
    return num.toFixed(6);
};

/**
 * Validate and format latitude (must be between -90 and 90)
 */
export const formatLatitude = (lat: number | string): string => {
    const num = typeof lat === 'string' ? parseFloat(lat) : lat;

    if (isNaN(num) || num < -90 || num > 90) {
        throw new Error('Latitude must be between -90 and 90');
    }

    return formatCoordinate(num);
};

/**
 * Validate and format longitude (must be between -180 and 180)
 */
export const formatLongitude = (lng: number | string): string => {
    const num = typeof lng === 'string' ? parseFloat(lng) : lng;

    if (isNaN(num) || num < -180 || num > 180) {
        throw new Error('Longitude must be between -180 and 180');
    }

    return formatCoordinate(num);
};

/**
 * Format coordinate pair for API submission
 */
export const formatCoordinatesForAPI = (lat: number | string, lng: number | string): { latitude: string; longitude: string } => {
    return {
        latitude: formatLatitude(lat),
        longitude: formatLongitude(lng),
    };
};

/**
 * Parse coordinate string to number, handling empty/undefined values
 */
export const parseCoordinate = (value: string | number | undefined | null): number => {
    if (value === undefined || value === null || value === '') {
        return 0;
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
};
