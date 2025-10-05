import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export interface ActiveCustomerPayload {
	customer: any | null;
	contacts: any[];
	addresses: any[];
	subscribers: any[];
	ext_params: Record<string, any>;
}

const STORAGE_KEY = 'activeCustomer';

export function useActiveCustomer() {
	const page = usePage();
	const serverCustomer = (page.props as any)?.customer as ActiveCustomerPayload | undefined;
	const [activeCustomer, setActiveCustomer] = useState<ActiveCustomerPayload | null>(null);

	// Hydrate from server or localStorage
	useEffect(() => {
		if (serverCustomer) {
			setActiveCustomer(serverCustomer);
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(serverCustomer));
			} catch {}
			return;
		}
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) setActiveCustomer(JSON.parse(raw));
		} catch {}
	}, [serverCustomer]);

	const clearActiveCustomer = () => {
		setActiveCustomer(null);
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {}
	};

	return { activeCustomer, setActiveCustomer, clearActiveCustomer };
} 