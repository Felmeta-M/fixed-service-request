import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface AvailableDevice {
    id: string;
    name: string;
    vendor: string;
    model: string | null;
    price: number;
    description: string | null;
    status: 'active' | 'inactive';
    image_url: string | null;
    stock_quantity: number;
    specifications: Record<string, any> | null;
}

interface AvailableDevicesApiResponse {
    success: boolean;
    data: AvailableDevice[];
}

export function useAvailableDevices() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['available-devices'],
        queryFn: async () => {
            const response = await apiClient.get<any>('/available-devices');

            // Handle ApiResponse format: { success: true, data: [...] }
            if (response.success !== undefined && Array.isArray(response.data)) {
                return response.data;
            }

            // Handle Laravel Resource Collection response: { data: [...] }
            if (Array.isArray(response.data)) {
                return response.data;
            }

            // Handle direct array response (fallback)
            if (Array.isArray(response)) {
                return response;
            }

            return [];
        },
    });

    return {
        devices: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch available devices') : null,
    };
}

