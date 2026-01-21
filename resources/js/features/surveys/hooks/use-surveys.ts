import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthToken, useAuthUser } from '@/hooks/use-auth-token';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface Survey {
    id: string;
    customer_survey_order_id: string;
    customer_subscription_order_id?: string | null;
    survey_type: string;
    status: string;
    created_at: string;
    updated_at?: string;
    customer_code: string;
    address?: string;
    contact_person?: string;
    main_offer_id?: string;
    service_type?: string;
    service_number?: string | null;
    cancellation_reason?: string;
    payment?: {
        subscription_fee?: number | string;
        device_fee?: number | string;
        cable_charge?: number | string;
        total_amount?: number | string;
        payment_order_id?: string | null;
        merch_order_id?: string | null;
        status?: string;
    };
    // Backend-provided action flags (single source of truth)
    is_paid?: boolean;
    can_pay?: boolean;
    can_subscribe?: boolean;
    can_change_offer?: boolean;
    can_cancel?: boolean;
    can_terminate?: boolean;
}

interface SurveyListResponse {
    data: Survey[];
    links?: {
        first?: string | null;
        last?: string | null;
        prev?: string | null;
        next?: string | null;
    };
    meta?: {
        current_page: number;
        from?: number;
        last_page: number;
        per_page: number;
        to?: number;
        total: number;
    };
}

interface SurveyDetailResponse {
    success: boolean;
    data: {
        customer_survey_order_id: string;
        customer_subscription_order_id?: string | null;
        customer_type?: string | null;
        survey_type?: string | null;
        main_offer_id: string;
        bandwidth?: string | null;
        cable_length?: string | number | null;
        with_device?: boolean;
        status?: string | number | null;
        service_number?: string | null;
        created_at?: string;
        updated_at?: string;
        payment?: {
            subscription_fee?: string | number | null;
            device_fee?: string | number | null;
            cable_charge?: string | number | null;
            total_amount?: string | number | null;
            payment_order_id?: string | null;
            merch_order_id?: string | null;
        };
        // Backend-provided action flags (single source of truth)
        is_paid?: boolean;
        can_pay?: boolean;
        can_subscribe?: boolean;
        can_change_offer?: boolean;
        can_cancel?: boolean;
        can_terminate?: boolean;
    };
    message?: string;
}

interface SurveyListFilters {
    search?: string;
    status?: string;
}

/**
 * Query hook for fetching paginated survey list with infinite scroll support
 */
export function useSurveyList(filters?: SurveyListFilters) {
    const token = useAuthToken();
    const user = useAuthUser();

    return useInfiniteQuery<SurveyListResponse, Error>({
        queryKey: ['surveyList', filters, token, user?.customer_code],
        queryFn: async ({ pageParam = 1 }) => {
            const page = typeof pageParam === 'number' ? pageParam : 1;
            if (!token || !user?.customer_code) {
                throw new Error('Authentication required');
            }

            const params = new URLSearchParams({
                customer_code: user.customer_code,
                page: page.toString(),
                per_page: '12',
            });

            if (filters?.search) params.append('search', filters.search);
            if (filters?.status && filters.status !== 'all') params.append('status', filters.status);

            return apiClient.get<SurveyListResponse>(`/survey-requests?${params.toString()}`, {
                token,
            });
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage.meta) return undefined;
            const { current_page, last_page } = lastPage.meta;
            return current_page < last_page ? current_page + 1 : undefined;
        },
        initialPageParam: 1,
        enabled: !!token && !!user?.customer_code,
    });
}

/**
 * Query hook for fetching a single survey/service detail
 * Accepts either customer_subscription_order_id (preferred) or customer_survey_order_id (fallback)
 */
export function useSurveyDetail(orderId: string, isSubscriptionOrderId?: boolean) {
    const token = useAuthToken();

    return useQuery<SurveyDetailResponse, Error>({
        queryKey: ['surveyDetail', orderId, isSubscriptionOrderId, token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication token required');
            // Use customer_subscription_order_id when provided, otherwise fallback to customer_survey_order_id
            const param = isSubscriptionOrderId 
                ? `customer_subscription_order_id=${orderId}` 
                : `customer_survey_order_id=${orderId}`;
            return apiClient.get<SurveyDetailResponse>(`/survey-requests/show?${param}`, {
                token,
            });
        },
        enabled: !!token && !!orderId,
    });
}

