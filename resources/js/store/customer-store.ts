import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActiveCustomerPayload {
    customer: any | null;
    contacts: any[];
    addresses: any[];
    subscribers: any[];
    ext_params: Record<string, any>;
}

interface CustomerStore {
    activeCustomer: ActiveCustomerPayload | null;
    setActiveCustomer: (customer: ActiveCustomerPayload | null) => void;
    clearActiveCustomer: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCustomerStore = create<CustomerStore>()(
    devtools(
        (set) => ({
            activeCustomer: null,

            setActiveCustomer: (customer) =>
                set({ activeCustomer: customer }, undefined, 'setActiveCustomer'),

            clearActiveCustomer: () =>
                set({ activeCustomer: null }, undefined, 'clearActiveCustomer'),
        }),
        { name: 'CustomerStore' },
    ),
);

// ─── Hydration Hook ──────────────────────────────────────────────────────────
// Syncs Inertia page props (server-driven auth data) into the Zustand store.
// Call this once in a layout or root component.

export function useHydrateCustomerStore() {
    const page = usePage();
    const serverCustomer = (page.props as any)?.auth?.user as ActiveCustomerPayload | undefined;
    const setActiveCustomer = useCustomerStore((s) => s.setActiveCustomer);

    useEffect(() => {
        if (serverCustomer) {
            setActiveCustomer(serverCustomer);
        } else {
            setActiveCustomer(null);
        }
    }, [serverCustomer, setActiveCustomer]);
}

// ─── Backward-compatible hook ────────────────────────────────────────────────
// Drop-in replacement for the old hook-based API so existing consumers don't break.

export function useActiveCustomer() {
    const activeCustomer = useCustomerStore((s) => s.activeCustomer);
    const setActiveCustomer = useCustomerStore((s) => s.setActiveCustomer);
    const clearActiveCustomer = useCustomerStore((s) => s.clearActiveCustomer);

    // Hydrate from Inertia props (same as the old hook did)
    const page = usePage();
    const serverCustomer = (page.props as any)?.auth?.user as ActiveCustomerPayload | undefined;

    useEffect(() => {
        if (serverCustomer) {
            setActiveCustomer(serverCustomer);
        } else {
            setActiveCustomer(null);
        }
    }, [serverCustomer, setActiveCustomer]);

    return { activeCustomer, setActiveCustomer, clearActiveCustomer };
}
