import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface AvailableDevice {
    id: string;
    name: string;
    vendor: string;
    model: string | null;
    device_type: 'broadband' | 'voice' | 'universal';
    media_type: 'PON' | 'COPPER' | 'UNIVERSAL';
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

export interface UseAvailableDevicesOptions {
    serviceType?: string;
    mediaType?: string; // PON (fiber) or COPPER - from survey result
}

export function useAvailableDevices(serviceType?: string, mediaType?: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['available-devices', serviceType, mediaType],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (serviceType) {
                params.service_type = serviceType;
            }
            if (mediaType) {
                params.media_type = mediaType;
            }

            const response = await apiClient.get<any>('/available-devices', { params });

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

