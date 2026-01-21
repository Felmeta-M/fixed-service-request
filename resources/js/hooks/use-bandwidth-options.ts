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

// Function to format bandwidth value for display (KB to MB/Gbps)
export const formatBandwidthDisplay = (bandwidth?: string | null): string | null => {
    if (!bandwidth) return null;
    
    // If bandwidth ends with 'M', it's already in Mbps format (e.g., "10M")
    if (bandwidth.endsWith('M')) {
        const mbps = parseInt(bandwidth);
        if (mbps >= 1000) {
            return `${(mbps / 1000).toFixed(mbps % 1000 === 0 ? 0 : 1)} Gbps`;
        }
        return `${mbps} Mbps`;
    }
    
    // If it's a pure number, assume it's in KB and convert to MB
    const numericValue = parseInt(bandwidth);
    if (!isNaN(numericValue)) {
        const mbps = numericValue / 1024; // Convert KB to MB
        if (mbps >= 1000) {
            return `${(mbps / 1000).toFixed(mbps % 1000 === 0 ? 0 : 1)} Gbps`;
        }
        // Show as integer if it's a whole number, otherwise show 1 decimal
        return `${mbps % 1 === 0 ? mbps : mbps.toFixed(1)} Mbps`;
    }
    
    return bandwidth;
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
                    label: value,
                    value,
                    numericValue: parseBandwidthValue(value),
                }));

                // Process enterprise options
                const formattedEnterprise = bandwidthData.enterprise_options.map((value) => ({
                    label: value,
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
