import { usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';

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

interface UseSurveyListReturn {
    surveys: Survey[];
    loading: boolean;
    error: string | null;
    fetchSurveys: (filters?: { search?: string; status?: string }) => Promise<Survey[]>;
    refetch: () => Promise<void>;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    currentPage: number;
    total: number;
}

interface ApiResponse {
    success: boolean;
    data: Survey[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface User {
    id: number;
    customer_code: string;
    name: string;
    phone: string;
}

export function useSurveyList(): UseSurveyListReturn {
    const { user } = usePage().props.auth;
    console.log(user);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);

    const fetchSurveys = useCallback(
        async (filters?: { search?: string; status?: string }): Promise<Survey[]> => {
            setLoading(true);
            setError(null);

            try {
                const customerCode = user?.customer_code;

                if (!customerCode) {
                    const msg = 'No customer code available from auth.user';
                    setError(msg);
                    throw new Error(msg);
                }

                const params = new URLSearchParams({
                    customer_code: customerCode,
                    page: '1',
                    per_page: '12',
                });

                if (filters?.search) params.append('search', filters.search);
                if (filters?.status && filters.status !== 'all') params.append('status', filters.status);

                const res = await fetch(`/api/v1/survey-requests?${params.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${user.api_token}`,
                    },
                });

                const json: ApiResponse = await res.json();
                const surveysData = json.data || [];

                setSurveys(surveysData);
                setCurrentPage(1);

                if (json.meta) {
                    setHasMore(json.meta.current_page < json.meta.last_page);
                    setTotal(json.meta.total);
                } else {
                    setHasMore(false);
                    setTotal(surveysData.length);
                }

                return surveysData;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to fetch surveys';
                setError(message);
                setSurveys([]);
                setHasMore(false);
                setTotal(0);
                return [];
            } finally {
                setLoading(false);
            }
        },
        [user],
    );

    const loadMore = useCallback(
        async (filters?: { search?: string; status?: string }): Promise<void> => {
            if (!hasMore || loading) return;
            setLoading(true);

            try {
                const customerCode = user?.customer_code;
                if (!customerCode) throw new Error('No customer code available');

                const nextPage = currentPage + 1;

                const params = new URLSearchParams({
                    customer_code: customerCode,
                    page: nextPage.toString(),
                    per_page: '12',
                });

                if (filters?.search) params.append('search', filters.search);
                if (filters?.status && filters.status !== 'all') params.append('status', filters.status);

                const res = await fetch(`/api/v1/survey-requests?${params.toString()}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${user.api_token}`,
                    },
                });
                const json: ApiResponse = await res.json();

                const newData = json.data || [];
                setSurveys((prev) => [...prev, ...newData]);
                setCurrentPage(nextPage);
                setHasMore(json.meta ? json.meta.current_page < json.meta.last_page : false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load more surveys');
            } finally {
                setLoading(false);
            }
        },
        [currentPage, hasMore, loading, user],
    );

    const refetch = useCallback(async (): Promise<void> => {
        await fetchSurveys();
    }, [fetchSurveys]);

    if (!user?.customer_code) {
        setError('User not authenticated or no customer code');
        setSurveys([]);
        setHasMore(false);
        setTotal(0);
        setLoading(false);
        return [] as unknown as UseSurveyListReturn;
    }

    return {
        surveys,
        loading,
        error,
        fetchSurveys,
        refetch,
        hasMore,
        loadMore,
        currentPage,
        total,
    };
}
