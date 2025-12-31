/**
 * Hook to get authentication token from Inertia page props
 */
import { usePage } from '@inertiajs/react';

interface AuthUser {
    api_token?: string;
    id?: number;
    name?: string;
    phone?: string;
    email?: string;
    customer_code?: string;
    customer_sub_id?: string;
    address?: string;
}

interface AuthProps {
    auth: {
        user: AuthUser;
    };
    [key: string]: any;
}

export function useAuthToken(): string | null {
    try {
        const { auth } = usePage<AuthProps>().props;
        return auth?.user?.api_token || null;
    } catch {
        return null;
    }
}

export function useAuthUser(): AuthUser | null {
    try {
        const { auth } = usePage<AuthProps>().props;
        return auth?.user || null;
    } catch {
        return null;
    }
}
