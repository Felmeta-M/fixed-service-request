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
        // These fields are encrypted by the backend and must be forwarded as-is to survey create.
        longitude: string;
        latitude: string;
        cable_type: string;
        cable_type_desc: string;
    };
}

export const useResourceChecker = () => {
    const { auth } = usePage().props;
    const user = auth.user;

    console.log('Using resource checker with user:', user);

    const checkResourceAvailability = async (
        coordinates: { latitude: number; longitude: number },
        customerName?: string,
    ): Promise<{ available: boolean; message: string; data?: ResourceCheckResponse['data'] }> => {
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

            // console.log('Resource check request:', requestData);

            // Use the app API so we get the encrypted fields that survey-create expects.
            const response = await axios.post<ResourceCheckResponse>(`/api/v1/resource-check`, requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${user.api_token}`,
                    },
                }
            );

            // Check if response is successful
            if (response.data.success) {
                const resource = response.data.data;
                return {
                    available: true,
                    message: "Resource available",
                    data: resource,
                };
            }

            // Response was not successful
            return {
                available: false,
                message: response.data.message || 'Resource check failed',
                data: undefined,
            };
        } catch (error) {
            console.error('Resource check failed:', error);
            let message = 'Failed to check resource availability. Try again.';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                message = error.response.data.message;
            }
            return {
                available: false,
                message: message,
            };
        }
    };

    return { checkResourceAvailability };
};
