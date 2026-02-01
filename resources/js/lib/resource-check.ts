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
    error_code?: string;
    errors?: {
        require_manual_survey?: boolean;
    };
    data?: {
        distance: string;
        ava_port: string;
        neid: string;
        nename: string;
        typeid: string;
        longitude: string;
        latitude: string;
        cable_type: string;
        cable_type_desc: string;
        area_code: string;
        area_name: string;
        zone_code?: string;
    };
}

export const useResourceChecker = () => {
    const { auth } = usePage<{ auth: { user: { api_token: string; id?: number; name?: string; address?: string } } }>().props;
    const user = auth.user;
    const token = useAuthToken();

    const mutation = useMutation({
        mutationFn: async ({
            coordinates,
            customerName,
        }: {
            coordinates: { latitude: number; longitude: number };
            customerName?: string;
        }): Promise<{ 
            available: boolean; 
            message: string; 
            requireManualSurvey?: boolean;
            data?: ResourceCheckResponse['data'];
        }> => {
            if (!token) throw new Error('Authentication required');

            const requestData: ResourceCheckRequest = {
                prod_spec_code: 'C_P_UFBI_E',
                event_code: '101',
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

            const response = await apiClient.post<ResourceCheckResponse>(`/resource-check`, requestData, {
                token,
            });

            // Check if manual survey is required (zone not resolvable)
            if (!response.success && response.errors?.require_manual_survey) {
                return {
                    available: false,
                    message: response.message || 'Manual survey required for this location',
                    requireManualSurvey: true,
                    data: undefined,
                };
            }

            if (response.success) {
                if (!response.data) {
                    return {
                        available: false,
                        message: 'No available resources in this area',
                        data: undefined,
                    };
                }

                const resource = response.data;
                const availablePorts = parseInt(resource.ava_port) || 0;
                const isAvailable = availablePorts > 0;

                return {
                    available: isAvailable,
                    message: isAvailable
                        ? `Resource available in this area`
                        : 'No available resources in this area',
                    data: resource,
                };
            }

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
    ): Promise<{ 
        available: boolean; 
        message: string; 
        requireManualSurvey?: boolean;
        data?: ResourceCheckResponse['data'];
    }> => {
        try {
            const result = await mutation.mutateAsync({ coordinates, customerName });
            return result;
        } catch (error) {
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
