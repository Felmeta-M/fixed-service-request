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

export function useSurveyList(): UseSurveyListReturn {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    console.log('🚀 ~ useSurveyList ~ surveys:', surveys);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);

    const getCustomerCode = useCallback((): string | null => {
        try {
            const customerData = localStorage.getItem('activeCustomer');
            if (!customerData) {
                console.warn('No customer data found in localStorage');
                return null;
            }

            const parsed = JSON.parse(customerData);
            return parsed.customer?.code || parsed.customer_code || null;
        } catch (err) {
            console.error('Error parsing customer data from localStorage:', err);
            return null;
        }
    }, []);

    const fetchSurveys = useCallback(
        async (filters?: { search?: string; status?: string }): Promise<Survey[]> => {
            setLoading(true);
            setError(null);

            try {
                const customerCode = getCustomerCode();

                if (!customerCode) {
                    const errorMsg = 'No customer code available. Please ensure you are logged in.';
                    setError(errorMsg);
                    throw new Error(errorMsg);
                }

                // Build query parameters
                const params = new URLSearchParams({
                    customer_code: customerCode,
                    page: '1', // Always start from page 1 when fetching fresh
                    per_page: '12',
                });

                if (filters?.search) {
                    params.append('search', filters.search);
                }

                if (filters?.status && filters.status !== 'all') {
                    params.append('status', filters.status);
                }

                const res = await fetch(`/api/v1/survey-requests?${params.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const json: ApiResponse = await res.json();

                // if (!json.success) {
                //     throw new Error('API returned unsuccessful response');
                // }

                const surveysData = json.data || [];

                // Update state with new data
                setSurveys(surveysData);
                setCurrentPage(1);

                // Handle pagination metadata
                if (json.meta) {
                    setHasMore(json.meta.current_page < json.meta.last_page);
                    setTotal(json.meta.total);
                } else {
                    setHasMore(false);
                    setTotal(surveysData.length);
                }

                return surveysData;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch surveys';
                setError(errorMessage);

                // Fallback to fake data only in development
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Using fallback data due to error:', err);
                    const fakeSurveys: Survey[] = [
                        {
                            id: '1',
                            customer_survey_order_id: 'SO-20250901-001',
                            survey_type: 'EIC08',
                            status: 'waiting',
                            created_at: '2025-09-01T10:00:00Z',
                            customer_code: 'demo-customer',
                            address: '123 Main Street, Demo City',
                            contact_person: 'John Doe',
                            service_type: 'voice',
                        },
                        {
                            id: '2',
                            customer_survey_order_id: 'SO-20250815-002',
                            survey_type: 'EIC09',
                            status: 'completed',
                            created_at: '2025-08-15T14:30:00Z',
                            updated_at: '2025-08-20T09:15:00Z',
                            customer_code: 'demo-customer',
                            address: '456 Oak Avenue, Sample Town',
                            contact_person: 'Jane Smith',
                            service_type: 'internet',
                        },
                        {
                            id: '3',
                            customer_survey_order_id: 'SO-20250810-003',
                            survey_type: 'EIC07',
                            status: 'cancelled',
                            created_at: '2025-08-10T08:45:00Z',
                            updated_at: '2025-08-12T16:20:00Z',
                            customer_code: 'demo-customer',
                            address: '789 Pine Road, Test Village',
                            contact_person: 'Bob Johnson',
                            service_type: 'combo',
                            cancellation_reason: 'Cancellation due to change in plans.',
                        },
                        {
                            id: '4',
                            customer_survey_order_id: 'SO-20250810-003',
                            survey_type: 'EIC07',
                            status: 'subscribed',
                            created_at: '2025-08-10T08:45:00Z',
                            updated_at: '2025-08-12T16:20:00Z',
                            customer_code: 'demo-customer',
                            address: '789 Pine Road, Test Village',
                            contact_person: 'Bob Johnson',
                            service_type: 'combo',
                        },
                    ];
                    setSurveys(fakeSurveys);
                    setHasMore(false);
                    setTotal(fakeSurveys.length);
                    return fakeSurveys;
                }

                // In production, return empty array
                setSurveys([]);
                setHasMore(false);
                setTotal(0);
                return [];
            } finally {
                setLoading(false);
            }
        },
        [getCustomerCode],
    );

    const loadMore = useCallback(async (): Promise<void> => {
        if (!hasMore || loading) return;

        setLoading(true);

        try {
            const customerCode = getCustomerCode();
            if (!customerCode) {
                throw new Error('No customer code available');
            }

            const nextPage = currentPage + 1;
            const params = new URLSearchParams({
                customer_code: customerCode,
                page: nextPage.toString(),
                per_page: '12',
            });

            const res = await fetch(`/api/v1/survey-requests?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const json: ApiResponse = await res.json();

            if (!json.success) {
                throw new Error('API returned unsuccessful response');
            }

            const newSurveys = json.data || [];

            // Append new surveys to existing ones
            setSurveys((prev) => [...prev, ...newSurveys]);
            setCurrentPage(nextPage);

            // Update pagination metadata
            if (json.meta) {
                setHasMore(json.meta.current_page < json.meta.last_page);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load more surveys';
            setError(errorMessage);
            console.error('Error loading more surveys:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, hasMore, loading, getCustomerCode]);

    const refetch = useCallback(async (): Promise<void> => {
        await fetchSurveys();
    }, [fetchSurveys]);

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
