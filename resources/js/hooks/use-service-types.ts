import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ServiceTypeOption {
    id: number;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    status: boolean;
    recommended: boolean;
    sort_order: number;
}

interface ServiceTypesApiResponse {
    success: boolean;
    data: ServiceTypeOption[];
}

export function useServiceTypes() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['service-types'],
        queryFn: async () => {
            const response = await apiClient.get<ServiceTypesApiResponse>('/service-types');

            if (response.success && response.data) {
                return response.data;
            }

            return [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return {
        serviceTypes: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch service types') : null,
    };
}
