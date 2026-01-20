import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface EducationLevelOption {
    label: string;
    value: string;
}

interface EducationLevelsApiResponse {
    success: boolean;
    data: EducationLevelOption[];
}

export function useEducationLevels() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['education-levels'],
        queryFn: async () => {
            const response = await apiClient.get<EducationLevelsApiResponse>('/education-levels');

            if (response.success && response.data) {
                return response.data;
            }

            return [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return {
        educationLevels: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch education levels') : null,
    };
}
