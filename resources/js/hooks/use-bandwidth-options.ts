import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface BandwidthOptionResponse {
    id: number;
    residential_options: string[];
    enterprise_options: string[];
}

interface BandwidthOptionsApiResponse {
    success: boolean;
    data: BandwidthOptionResponse[];
}

export interface ProcessedBandwidthOption {
    label: string;
    value: string;
    numericValue: number;
}

// Function to convert bandwidth string to numeric value (in Mbps)
const parseBandwidthValue = (bandwidth: string): number => {
    // Remove any whitespace and convert to lowercase
    const cleanValue = bandwidth.trim().toLowerCase();

    // Check if it's in Gbps
    if (cleanValue.includes('gbps')) {
        const numericPart = parseFloat(cleanValue.replace('gbps', ''));
        return numericPart * 1024; // Convert Gbps to Mbps
    }

    // Check if it's in Mbps or just M
    if (cleanValue.includes('m') || cleanValue.includes('mbps')) {
        const numericPart = parseFloat(cleanValue.replace('mbps', '').replace('m', ''));
        return numericPart;
    }

    // If it's just a number, check if it looks like KB (>= 1024) and convert to MB
    const numericValue = parseFloat(cleanValue);
    if (!isNaN(numericValue) && numericValue >= 1024) {
        return numericValue / 1024; // Assume KB, convert to MB
    }

    // If it's a small number, assume it's already Mbps
    return numericValue;
};

/**
 * @deprecated Backend is now the single source of truth for bandwidth formatting.
 * The API returns 'bandwidth' pre-formatted (e.g., "10 Mbps", "1 Gbps").
 * Frontend should just display the value as-is without parsing.
 * 
 * This function is kept for backward compatibility but should not be used for API responses.
 * Use it only for formatting user-selected bandwidth options before display.
 */
export const formatBandwidthDisplay = (bandwidth?: string | null): string | null => {
    // Just return as-is - backend handles formatting for API responses
    return bandwidth || null;
};

// Function to format bandwidth label (e.g., "10M" -> "10 Mbps")
export const formatBandwidthLabel = (value: string): string => {
    const cleanValue = value.trim();
    const lower = cleanValue.toLowerCase();
    
    // Handle "10M" or "10m" -> "10 Mbps"
    if (lower.endsWith('m')) {
        return cleanValue + 'bps'; 
    }
    
    // Handle plain numbers -> assume Mbps
    if (/^\d+$/.test(cleanValue)) {
        return cleanValue + ' Mbps';
    }

    return cleanValue;
};

export function useBandwidthOptions() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['bandwidth-options'],
        queryFn: async () => {
            const response = await apiClient.get<BandwidthOptionsApiResponse>('/bandwidth-options');

            if (response.success && response.data.length > 0) {
                const bandwidthData = response.data[0];

                // Process residential options
                const formattedResidential = bandwidthData.residential_options.map((value) => ({
                    label: formatBandwidthLabel(value),
                    value,
                    numericValue: parseBandwidthValue(value),
                }));

                // Process enterprise options
                const formattedEnterprise = bandwidthData.enterprise_options.map((value) => ({
                    label: formatBandwidthLabel(value),
                    value,
                    numericValue: parseBandwidthValue(value),
                }));

                return {
                    residentialOptions: formattedResidential,
                    enterpriseOptions: formattedEnterprise,
                };
            }

            return {
                residentialOptions: [],
                enterpriseOptions: [],
            };
        },
    });

    return {
        residentialOptions: data?.residentialOptions || [],
        enterpriseOptions: data?.enterpriseOptions || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch bandwidth options') : null,
        parseBandwidthValue,
        formatBandwidthDisplay,
    };
}
