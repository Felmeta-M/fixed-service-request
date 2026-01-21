import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface LanguageOption {
    value: string;
    label: string;
}

interface LanguagesResponse {
    success: boolean;
    data: LanguageOption[];
}

export function useLanguages() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['languages'],
        queryFn: async () => {
            const response = await apiClient.get<LanguagesResponse>('/languages');

            if (response.success && response.data) {
                return response.data;
            }

            return [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return {
        languages: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch languages') : null,
    };
}
