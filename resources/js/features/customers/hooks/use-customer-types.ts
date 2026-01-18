import { Option } from '@/types/customer';
import { useQuery } from '@tanstack/react-query';
import { useAuthToken } from '@/hooks/use-auth-token';
import { apiClient } from '@/lib/api-client';

interface CustomerType {
    id: number;
    name: string;
    api_value: number;
}

export function useCustomerTypes() {
    const token = useAuthToken();

    const { data, isLoading, error } = useQuery({
        queryKey: ['customer-types', token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required');
            const response = await apiClient.get<CustomerType[]>('/customer/types', { token });
            return response.map((type) => ({
                label: type.name,
                value: type.id.toString(),
            }));
        },
        enabled: !!token,
    });

    return {
        types: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to load types') : null,
    };
}

export function useCustomerCategories(typeValue?: string) {
    const token = useAuthToken();

    const { data, isLoading, error } = useQuery({
        queryKey: ['customer-categories', typeValue, token],
        queryFn: async () => {
            if (!token || !typeValue) return [];
            const response = await apiClient.get<CustomerType[]>('/customer/categories', {
                token,
                params: { type_id: typeValue },
            });
            return response.map((category) => ({
                label: category.name,
                value: category.id.toString(),
            }));
        },
        enabled: !!token && !!typeValue,
    });

    return {
        categories: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to load categories') : null,
    };
}

export function useCustomerSubcategories(categoryValue?: string) {
    const token = useAuthToken();

    const { data, isLoading, error } = useQuery({
        queryKey: ['customer-subcategories', categoryValue, token],
        queryFn: async () => {
            if (!token || !categoryValue) return [];
            const response = await apiClient.get<CustomerType[]>('/customer/subcategories', {
                token,
                params: { category_id: categoryValue },
            });
            return response.map((subcategory) => ({
                label: subcategory.name,
                value: subcategory.id.toString(),
            }));
        },
        enabled: !!token && !!categoryValue,
    });

    return {
        subcategories: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to load subcategories') : null,
    };
}
