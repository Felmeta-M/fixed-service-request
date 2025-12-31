import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthToken, useAuthUser } from './use-auth-token';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface Survey {
    id: string;
    customer_survey_order_id: string;
    survey_type: string;
    status: string;
    created_at: string;
    updated_at?: string;
    customer_code: string;
    address?: string;
    contact_person?: string;
    main_offer_id?: string;
    service_type?: string;
    cancellation_reason?: string;
    payment?: {
        total_amount?: number | string;
        status?: string;
    };
}

interface SurveyListResponse {
    success: boolean;
    data: Survey[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface SurveyDetailResponse {
    success: boolean;
    data: {
        customer_survey_order_id: string;
        customer_type?: string | null;
        survey_type?: string | null;
        main_offer_id: string;
        bandwidth?: string | null;
        status?: string | number | null;
        service_number?: string | null;
        created_at?: string;
        updated_at?: string;
        payment?: {
            status?: string;
            cable_charge?: string | number | null;
            subscription_fee?: string | number | null;
            device_price?: string | number | null;
            total_amount?: string | number | null;
            amount?: string | number | null;
            service_number?: string | null;
            customer_survey_order_id?: string;
        };
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
 */
export function useSurveyDetail(customerSurveyOrderId: string) {
    const token = useAuthToken();

    return useQuery<SurveyDetailResponse, Error>({
        queryKey: ['surveyDetail', customerSurveyOrderId, token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication token required');
            return apiClient.get<SurveyDetailResponse>(`/survey-requests/show?customer_survey_order_id=${customerSurveyOrderId}`, {
                token,
            });
        },
        enabled: !!token && !!customerSurveyOrderId,
    });
}

