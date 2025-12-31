import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthToken } from './use-auth-token';
import { LocalTTResponse, TTDetailResponse, DisplayTT, LocalTroubleTicket, TTQueryResponse, LocalTTQueryParams } from '@/types/tt';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * Query hook for fetching paginated local trouble tickets
 */
export function useLocalTTs(params: LocalTTQueryParams) {
    const token = useAuthToken();

    return useQuery<LocalTTResponse, Error>({
        queryKey: ['localTTs', params, token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication token required');
            
            const queryString = new URLSearchParams();
            if (params.access_number) queryString.append('access_number', params.access_number);
            if (params.tt_serial_no) queryString.append('tt_serial_no', params.tt_serial_no);
            if (params.mobile_no) queryString.append('mobile_no', params.mobile_no);
            if (params.status) queryString.append('status', params.status);
            if (params.page) queryString.append('page', params.page.toString());
            if (params.per_page) queryString.append('per_page', params.per_page.toString());

            return apiClient.get<LocalTTResponse>(`/trouble-tickets?${queryString.toString()}`, {
                token,
            });
        },
        enabled: !!token,
    });
}

/**
 * Query hook for fetching a single local TT by serial number
 */
export function useLocalTT(ttSerialNo: string) {
    const token = useAuthToken();

    return useQuery<{ success: boolean; data: LocalTroubleTicket }, Error>({
        queryKey: ['localTT', ttSerialNo, token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication token required');
            return apiClient.get<{ success: boolean; data: LocalTroubleTicket }>(`/trouble-tickets/${ttSerialNo}`, {
                token,
            });
        },
        enabled: !!token && !!ttSerialNo,
    });
}

/**
 * Query hook for fetching external TT detail
 */
export function useExternalTTDetail(ttNumber: string) {
    const token = useAuthToken();

    return useQuery<TTDetailResponse, Error>({
        queryKey: ['externalTTDetail', ttNumber, token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication token required');
            return apiClient.post<TTDetailResponse>(`${API_BASE}/tt/detail`, { search: ttNumber }, {
                token,
            });
        },
        enabled: !!token && !!ttNumber,
        retry: false, // Don't retry on 404
    });
}

/**
 * Query hook for searching external TTs by access number
 */
export function useSearchExternalTTs(accessNumber: string) {
    const token = useAuthToken();

    return useQuery<TTQueryResponse, Error>({
        queryKey: ['externalTTs', accessNumber, token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication token required');
            return apiClient.post<TTQueryResponse>(`${API_BASE}/tt/query`, { access_number: accessNumber }, {
                token,
            });
        },
        enabled: !!token && !!accessNumber && accessNumber.trim().length > 0,
    });
}

/**
 * Query hook for fetching TT detail with fallback (external first, then local)
 * This is a helper that tries external first, then falls back to local
 */
export function useTTDetail(ttNumber: string) {
    const externalQuery = useExternalTTDetail(ttNumber);
    const localQuery = useLocalTT(ttNumber);

    return useQuery({
        queryKey: ['ttDetail', ttNumber],
        queryFn: async () => {
            // Try external first
            try {
                if (externalQuery.data?.success && externalQuery.data.data) {
                    return { ...externalQuery.data.data, source: 'external' as const };
                }
            } catch (e) {
                // External failed, continue to local
            }

            // Fallback to local
            if (localQuery.data?.success && localQuery.data.data) {
                const localTT = localQuery.data.data;
                // Transform local to TTDetail format (this is a simplified version)
                return {
                    ttNumber: localTT.tt_serial_no,
                    source: 'local' as const,
                    localData: localTT,
                };
            }

            throw new Error('TT not found');
        },
        enabled: !!ttNumber,
    });
}

