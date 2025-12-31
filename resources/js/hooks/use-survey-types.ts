import { Option } from '@/types/customer';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface SurveyType {
    id: number;
    name: string;
}

export function useSurveyTypes() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['survey-types'],
        queryFn: async () => {
            const response = await apiClient.get<SurveyType[]>('/survey-types');
            return response.map((type) => ({
                label: type.name,
                value: type.id.toString(),
            }));
        },
    });

    return {
        types: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to load types') : null,
    };
}
