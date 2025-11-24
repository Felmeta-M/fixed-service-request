import { usePage } from '@inertiajs/react';
import axios from 'axios';

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
        longitude: string;
        latitude: string;
        cable_type: string;
        cable_type_desc: string;
    };
}

export const useResourceChecker = () => {
    const { auth } = usePage().props;
    const user = auth.user;

    const checkResourceAvailability = async (
        coordinates: { latitude: number; longitude: number },
        customerName?: string,
    ): Promise<{ available: boolean; message: string; data?: any }> => {
        try {
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

            console.log('Resource check request:', requestData);

            const response = await axios.post<ResourceCheckResponse>(`${import.meta.env.VITE_API_BASE_URL}/resource-check`, requestData, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.success && response.data.data) {
                const resource = response.data.data;
                const availablePorts = parseInt(resource.ava_port) || 0;
                const distance = parseFloat(resource.distance) || 0;

                const isAvailable = availablePorts > 0 && distance <= 200;

                return {
                    available: isAvailable,
                    message: isAvailable ? `Resource available (${availablePorts} ports, ${distance}m away)` : 'No available resources in this area',
                    data: resource,
                };
            }

            return {
                available: false,
                message: response.data.message || 'Resource check failed',
                data: response.data.data,
            };
        } catch (error) {
            console.error('Resource check failed:', error);
            return {
                available: false,
                message: 'Failed to check resource availability. Try again.',
            };
        }
    };

    return { checkResourceAvailability };
};
