/**
 * TanStack Query Client Configuration
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time: data is considered fresh for 5 minutes
            staleTime: 1000 * 60 * 5,
            // Cache time: data stays in cache for 10 minutes after last use
            gcTime: 1000 * 60 * 10,
            // Retry failed requests 2 times
            retry: 2,
            // Retry delay increases exponentially
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus in development only
            refetchOnWindowFocus: import.meta.env.DEV,
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Don't refetch on mount if data exists
            refetchOnMount: true,
        },
        mutations: {
            // Retry failed mutations once
            retry: 1,
            // Retry delay
            retryDelay: 1000,
        },
    },
});

