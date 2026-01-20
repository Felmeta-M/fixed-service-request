import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ReligionOption {
    label: string;
    value: string;
}

interface ReligionsApiResponse {
    success: boolean;
    data: ReligionOption[];
}

export function useReligions() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['religions'],
        queryFn: async () => {
            const response = await apiClient.get<ReligionsApiResponse>('/religions');

            if (response.success && response.data) {
                return response.data;
            }

            return [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return {
        religions: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch religions') : null,
    };
}
