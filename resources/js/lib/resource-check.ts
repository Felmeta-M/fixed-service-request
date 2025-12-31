import { usePage } from '@inertiajs/react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from './api-client';
import { useAuthToken } from '@/hooks/use-auth-token';

export interface ResourceCheckRequest {
    prod_spec_code?: string;
    number_line?: string;
    acc_nbr?: string;
    event_code?: string;
    cust_id?: string;
    cust_name?: string;
    cust_addr?: string;
    longitude: string;
    latitude: string;
    bandwidth?: string;
    radius?: string;
    combo_flag?: string;
}

export interface ResourceCheckResponse {
    success: boolean;
    message: string;
    data?: {
        distance: string;
        ava_port: string;
        neid: string;
        nename: string;
        typeid: string;
        // These fields are encrypted by the backend and must be forwarded as-is to survey create.
        longitude: string;
        latitude: string;
        cable_type: string;
        cable_type_desc: string;
    };
}

export const useResourceChecker = () => {
    const { auth } = usePage<{ auth: { user: { api_token: string; id?: number; name?: string; address?: string } } }>().props;
    const user = auth.user;
    const token = useAuthToken();

    console.log('Using resource checker with user:', user);

    const mutation = useMutation({
        mutationFn: async ({
            coordinates,
            customerName,
        }: {
            coordinates: { latitude: number; longitude: number };
            customerName?: string;
        }): Promise<{ available: boolean; message: string; data?: ResourceCheckResponse['data'] }> => {
            if (!token) throw new Error('Authentication required');

            const requestData: ResourceCheckRequest = {
                prod_spec_code: 'C_P_UFBI_E',
                event_code: '101',

                // extracted from Inertia user
                cust_id: user?.id?.toString(),
                cust_name: user?.name || customerName,
                cust_addr: user?.address ?? 'Not Provided',

                longitude: coordinates.longitude.toString(),
                latitude: coordinates.latitude.toString(),

                number_line: '1',
                acc_nbr: '-1',
                bandwidth: '',
                radius: '200',
                combo_flag: '0',
            };

            // Use the app API so we get the encrypted fields that survey-create expects.
            const response = await apiClient.post<ResourceCheckResponse>(`/resource-check`, requestData, {
                token,
            });

            // Check if response is successful
            if (response.success) {
                // If data is null, no resource is available
                if (!response.data || response.data === null) {
                    return {
                        available: false,
                        message: 'No available resources in this area',
                        data: undefined,
                    };
                }

                // Process the resource data
                const resource = response.data;
                const availablePorts = parseInt(resource.ava_port) || 0;

                // `distance`, `cable_type`, `latitude`, `longitude`, `neid` are encrypted by the backend (Crypt::encryptString),
                // and the SOAP call already receives `radius=200`, so we treat ports>0 as availability.
                // IMPORTANT: Even when ports <= 0 (resource not available), we still return the encrypted resource data
                // because it contains encrypted fields that must be forwarded to survey/create API.
                const isAvailable = availablePorts > 0;

                return {
                    available: isAvailable,
                    message: isAvailable
                        ? `Resource available (${availablePorts} ports)`
                        : 'No available resources in this area',
                    // Always return resource data (even when not available) as it contains encrypted fields needed for survey creation
                    data: resource,
                };
            }

            // Response was not successful
            return {
                available: false,
                message: response.message || 'Resource check failed',
                data: response.data || undefined,
            };
        },
    });

    const checkResourceAvailability = async (
        coordinates: { latitude: number; longitude: number },
        customerName?: string,
    ): Promise<{ available: boolean; message: string; data?: ResourceCheckResponse['data'] }> => {
        try {
            const result = await mutation.mutateAsync({ coordinates, customerName });
            return result;
        } catch (error) {
            console.error('Resource check failed:', error);
            return {
                available: false,
                message: error instanceof Error ? error.message : 'Failed to check resource availability. Try again.',
            };
        }
    };

    return {
        checkResourceAvailability,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
};
