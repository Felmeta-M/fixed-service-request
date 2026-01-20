import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface IncomeLevelOption {
    label: string;
    value: string;
}

interface IncomeLevelsApiResponse {
    success: boolean;
    data: IncomeLevelOption[];
}

export function useIncomeLevels() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['income-levels'],
        queryFn: async () => {
            const response = await apiClient.get<IncomeLevelsApiResponse>('/income-levels');

            if (response.success && response.data) {
                return response.data;
            }

            return [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return {
        incomeLevels: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch income levels') : null,
    };
}
