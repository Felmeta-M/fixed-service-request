import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export interface ActiveCustomerPayload {
    customer: any | null;
    contacts: any[];
    addresses: any[];
    subscribers: any[];
    ext_params: Record<string, any>;
}

export function useActiveCustomer() {
    const page = usePage();
    const serverCustomer = (page.props as any)?.auth.user as ActiveCustomerPayload | undefined;

    const [activeCustomer, setActiveCustomer] = useState<ActiveCustomerPayload | null>(null);

    // Hydrate only from server session data
    useEffect(() => {
        if (serverCustomer) {
            setActiveCustomer(serverCustomer);
            return;
        }

        // If backend returns null → customer is cleared from session
        setActiveCustomer(null);
    }, [serverCustomer]);

    const clearActiveCustomer = () => {
        setActiveCustomer(null);
        // No localStorage cleanup needed
        // Backend should also clear session customer
    };

    return { activeCustomer, setActiveCustomer, clearActiveCustomer };
}
