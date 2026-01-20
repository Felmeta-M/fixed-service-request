import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface LanguageOption {
    value: string;
    label: string;
}

interface LanguagesResponse {
    success: boolean;
    data: LanguageOption[];
}

export function useLanguages() {
    const { data, isLoading, error } = useQuery<LanguagesResponse>({
        queryKey: ['languages'],
        queryFn: async () => {
            const response = await axios.get('/api/v1/languages');
            return response.data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return {
        languages: data?.data ?? [],
        loading: isLoading,
        error: error ? (error as Error).message : null,
    };
}
