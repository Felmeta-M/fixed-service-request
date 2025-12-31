import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Occupation {
    id: number;
    remark: string;
}

interface OccupationsResponse {
    success: boolean;
    data: Occupation[];
}

export function useOccupations() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['occupations'],
        queryFn: async () => {
            const response = await apiClient.get<OccupationsResponse>('/occupations');
            if (response.success) {
                return response.data.map((occ) => ({
                    label: occ.remark,
                    value: occ.id.toString(),
                }));
            }
            return [];
        },
    });

    return {
        occupations: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch occupations') : null,
    };
}
