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

// Function to convert bandwidth string to numeric value
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

    // If it's just a number, assume it's Mbps
    return parseFloat(cleanValue);
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
    };
}
