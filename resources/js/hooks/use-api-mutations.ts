/**
 * Mutation hooks for API operations (POST, PUT, DELETE)
 */
import { apiClient } from '@/lib/api-client';
import { showSuccessToast } from '@/lib/toast-helpers';
import { router } from '@inertiajs/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from './use-auth-token';

/**
 * Parse API error messages for complaints
 */
export function parseApiError(message: string): {
    type: 'field' | 'business' | 'general';
    text: string;
} {
    const lower = message.toLowerCase();

    if (lower.includes('mobile')) {
        return {
            type: 'field',
            text: 'Mobile number must be 10 digits and start with 0.',
        };
    }

    if (lower.includes('already cct')) {
        return {
            type: 'business',
            text: message,
        };
    }

    return {
        type: 'general',
        text: message || 'Something went wrong.',
    };
}

/**
 * Hook for creating a complaint/trouble ticket
 */
export function useCreateComplaint() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            if (!token) throw new Error('Authentication required');
            const response = await apiClient.post<any>('/tt/create', data, { token });

            // Check for API-level failure (success: false)
            if (response?.success === false) {
                const parsed = parseApiError(response.message);
                const error = new Error(parsed.text);
                (error as any).parsed = parsed;
                throw error;
            }

            return response;
        },
        onSuccess: (response) => {
            // Invalidate related queries - use the correct query key
            queryClient.invalidateQueries({ queryKey: ['localTTs'] });

            // Check if this is an existing TT or a new one
            const ttData = response?.data;
            if (ttData?.is_existing) {
                showSuccessToast(`A trouble ticket already exists: ${ttData.tt_serial_no}`);
            } else {
                showSuccessToast(`Complaint submitted successfully! TT: ${ttData?.tt_serial_no || ''}`);
            }

            setTimeout(() => {
                router.visit('/complaints', { preserveScroll: false });
            }, 1000);
        },
        // Error toast handled by component to show backend error message
    });
}

/**
 * Hook for creating a complaint/trouble ticket as guest (no auth required)
 */
export function useCreateComplaintGuest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.post<any>('/tt/create-guest', data, {
                token: undefined,
                skipAuthRedirect: true, // Public endpoint - don't redirect on auth errors
            });

            // Check for API-level failure (success: false)
            if (response?.success === false) {
                // Check if this is a reCAPTCHA error
                if (response.error_type === 'recaptcha') {
                    const error = new Error(response.message);
                    (error as any).parsed = { type: 'recaptcha', text: response.message };
                    throw error;
                }

                const parsed = parseApiError(response.message);
                const error = new Error(parsed.text);
                (error as any).parsed = parsed;
                throw error;
            }

            return response;
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['localTTs'] });

            // Check if this is an existing TT or a new one
            const ttData = response?.data;
            if (ttData?.is_existing) {
                showSuccessToast(`A trouble ticket already exists: ${ttData.tt_serial_no}`);
            } else {
                showSuccessToast(`Complaint submitted successfully! TT: ${ttData?.tt_serial_no || ''}`);
            }
            // No redirect - guest stays on page; caller can close modal via onSuccess
        },
    });
}

/**
 * Hook for fetching customer by customer_sub_id
 */
export function useGetCustomer(customerSubId?: string | number) {
    const token = useAuthToken();

    return useQuery({
        queryKey: ['customer', customerSubId, token],
        queryFn: async () => {
            if (!token || !customerSubId) throw new Error('Authentication and customer ID required');
            return apiClient.get<any>(`/customer?customer_sub_id=${customerSubId.toString()}`, { token });
        },
        enabled: !!token && !!customerSubId,
    });
}

/**
 * Hook for creating a customer
 */
export function useCreateCustomer() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            if (!token) throw new Error('Authentication required');
            // Format date_of_birth if present
            const payload = {
                ...data,
                date_of_birth: data.date_of_birth ? data.date_of_birth.replace(/-/g, '') : null,
            };
            const response = await apiClient.post<any>('/customer/create', payload, { token });

            // Check for nested error structure
            if (!response.success) {
                throw new Error(response.message || 'Customer creation failed');
            }

            // Check for nested error in data.original
            if ((response as any).data?.original && (response as any).data.original.success === false) {
                throw new Error((response as any).data.original.message || 'Customer creation failed');
            }

            return (response as any).data?.original?.data || (response as any).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

/**
 * Hook for creating a survey
 *
 * After successful survey creation, waits 7.5 seconds for third-party
 * activation to complete before resolving. This ensures the backend
 * has time to process the service activation with external systems.
 */
export function useCreateSurvey() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            if (!token) throw new Error('Authentication required');
            const response = await apiClient.post<any>('/survey/create', data, { token });

            // Check for nested error structure (common in Laravel API wrappers)
            const isSuccess = (response as any).success && (response as any).data?.original?.success !== false;

            if (!isSuccess) {
                const errorMsg =
                    (response as any).data?.original?.message || (response as any).message || 'Failed to create service request. Please try again.';
                throw new Error(errorMsg);
            }

            // Wait for third-party activation to complete
            // Backend triggers activation after survey creation, this gives time for processing
            await new Promise((resolve) => setTimeout(resolve, 7500)); // 7.5 seconds

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveyList'] });
            queryClient.invalidateQueries({ queryKey: ['surveyDetail'] });
        },
    });
}

/**
 * Hook for resource check
 */
export function useResourceCheck() {
    const token = useAuthToken();

    return useMutation({
        mutationFn: async (data: any) => {
            if (!token) throw new Error('Authentication required');
            return apiClient.post<{
                available: boolean;
                message: string;
                data?: any;
            }>('/resource-check', data, { token });
        },
        // Error toast handled by component to show backend error message
    });
}

// ECAF upload is now handled automatically by backend during subscription
// Removed useUploadEcaf hook - no longer needed in frontend

/**
 * Hook for NID OTP verification
 */
export function useNidOtp() {
    return useMutation({
        mutationFn: async (data: { individual_id: string }) => {
            const response = await apiClient.post<any>('/nid/otp', data);
            const otpData = response?.data?.original?.data;

            if (!otpData || otpData.ret_code !== '0') {
                const error = new Error(otpData?.ret_msg || 'Failed to send verification code');
                (error as any).ret_code = otpData?.ret_code;
                throw error;
            }

            return otpData;
        },
    });
}

/**
 * Hook for NID KYC verification
 */
export function useNidKyc() {
    return useMutation({
        mutationFn: async (data: { individual_id: string; otp_value: string; transaction_id: string }) => {
            const response = await apiClient.post<any>('/nid/kyc', data);

            if (!response.success || response.ret_code !== '0') {
                const error = new Error(response.message || 'Verification failed');
                (error as any).ret_code = response.ret_code;
                throw error;
            }

            return response;
        },
        onSuccess: (data) => {
            if (data.data) {
                localStorage.setItem('kycData', JSON.stringify(data.data));
            }
            window.location.href = '/profile';
        },
    });
}

/**
 * Mutation hook for confirming TT feedback
 */
export function useConfirmFeedback() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { tt_no: string; result_code: '0' | '1'; desc: string }) => {
            if (!token) throw new Error('Authentication token required');
            const response = await apiClient.post<any>(`${import.meta.env.VITE_API_BASE_URL}/tt/confirm-feedback`, data, { token });
            if (!response.success) {
                throw new Error(response.message || 'Failed to confirm feedback');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['localTTs'] });
            queryClient.invalidateQueries({ queryKey: ['localTT'] });
            queryClient.invalidateQueries({ queryKey: ['externalTTDetail'] });
            // Toast handled by component
        },
        // Error toast handled by component to show backend error message
    });
}

/**
 * Mutation hook for canceling a survey order
 */
export function useCancelSurveyOrder() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { customer_survey_order_id: string; cancel_reason: string }) => {
            if (!token) throw new Error('Authentication token required');
            const response = await apiClient.post<any>('/cancel-survey-order', data, { token });
            if (!response.success) {
                throw new Error(response.message || 'Failed to cancel survey order');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveyList'] });
            queryClient.invalidateQueries({ queryKey: ['surveyDetail'] });
            // Toast handled by component for proper loading toast replacement
        },
        // Error toast handled by component to show backend error message
    });
}

/**
 * Mutation hook for deleting a survey order
 */
export function useDeleteSurveyOrder() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { customer_code: string | number; customer_survey_order_id: string | number }) => {
            if (!token) throw new Error('Authentication token required');
            const response = await apiClient.delete<any>('/survey-requests/delete', {
                token,
                body: data,
            });
            if (!response.success) {
                throw new Error(response.message || 'Failed to delete survey order');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveyList'] });
            queryClient.invalidateQueries({ queryKey: ['surveyDetail'] });
            // Toast handled by component
        },
        // Error toast handled by component to show backend error message
    });
}

/**
 * Mutation hook for calculating one-off fee
 */
export function useCalculateOneOffFee() {
    const token = useAuthToken();

    return useMutation({
        mutationFn: async (data: any) => {
            if (!token) throw new Error('Authentication token required');
            const response = await apiClient.post<any>('/calc-one-off-fee', data, { token });
            if (!response.success) {
                throw new Error(response.message || 'Failed to calculate fees');
            }
            return response;
        },
    });
}

/**
 * Mutation hook for creating payment order
 */
export function useCreatePaymentOrder() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { customerSurveyOrderId: string; customerCode: string | number; amount: number }) => {
            if (!token) throw new Error('Authentication token required');
            const response = await apiClient.post<any>('/create-order', data, { token });
            if (!response.success) {
                throw new Error(response.message || 'Failed to create payment order');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveyDetail'] });
            queryClient.invalidateQueries({ queryKey: ['surveyList'] });
        },
    });
}

/**
 * Mutation hook for creating a subscription
 */
export function useCreateSubscription() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        // Disable retry for subscription mutations to prevent duplicate API calls
        retry: false,
        mutationFn: async (data: {
            offering_id: string;
            survey_order_id: string;
            customer_code: string;
            name: string;
            enterprise_name?: string;
            region: string;
            city: string;
            zone: string;
            wereda: string;
            kebele: string;
            house_no: string;
            sms_no: string;
            external_operid?: string;
            completed_date: string;
        }) => {
            if (!token) throw new Error('Authentication token required');
            const response = await apiClient.post<any>('/services/subscription', data, {
                token,
            });

            if (!response.success) {
                throw new Error(response.message || 'Failed to create subscription');
            }

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveyList'] });
            queryClient.invalidateQueries({ queryKey: ['surveyDetail'] });
        },
    });
}

/**
 * Mutation hook for changing primary offering (upgrade/downgrade bandwidth)
 */
export function useChangePrimaryOffering() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: async (data: { service_number: string; bandwidth: string }) => {
            if (!token) throw new Error('Authentication token required');
            const response = await apiClient.post<any>('/change-primary-offering', data, {
                token,
            });

            if (!response.success) {
                throw new Error(response.message || 'Failed to change primary offering');
            }

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveyList'] });
            queryClient.invalidateQueries({ queryKey: ['surveyDetail'] });
            queryClient.invalidateQueries({ queryKey: ['survey'] });
        },
    });
}

/**
 * Mutation hook for updating survey device selection (for manual surveys)
 * Updates the device selection and recalculates payment
 */
export function useUpdateSurveyDevice() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: async (data: { customer_survey_order_id: string; with_device: boolean; device_id?: string; device_voice_id?: string }) => {
            if (!token) throw new Error('Authentication token required');
            const response = await apiClient.post<any>('/survey-requests/update-device', data, {
                token,
            });

            if (!response.success) {
                throw new Error(response.message || 'Failed to update device selection');
            }

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveyList'] });
            queryClient.invalidateQueries({ queryKey: ['surveyDetail'] });
            queryClient.invalidateQueries({ queryKey: ['survey'] });
        },
    });
}
