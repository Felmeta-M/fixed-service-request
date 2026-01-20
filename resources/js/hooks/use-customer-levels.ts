import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface CustomerLevelOption {
    value: string;
    label: string;
}

interface CustomerLevelsResponse {
    success: boolean;
    data: CustomerLevelOption[];
}

export function useCustomerLevels() {
    const { data, isLoading, error } = useQuery<CustomerLevelsResponse>({
        queryKey: ['customer-levels'],
        queryFn: async () => {
            const response = await axios.get('/api/v1/customer-levels');
            return response.data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return {
        customerLevels: data?.data ?? [],
        loading: isLoading,
        error: error ? (error as Error).message : null,
    };
}
