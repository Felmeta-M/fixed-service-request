import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

type SourceFilter = 'all' | 'local' | 'external';

interface ComplaintFilters {
    sourceFilter: SourceFilter;
    statusFilter: string;
    searchQuery: string;
    accessNumber: string;
    filterAccessNumber: string;
    filterTTSerialNo: string;
    activeTab: 'my-tickets' | 'search';
    showFilters: boolean;
    currentPage: number;
}

interface ServiceFilters {
    globalFilter: string;
    typeFilter: string;
    statusFilter: string;
    showAdvancedFilters: boolean;
    appliedType: string;
    appliedStatus: string;
}

interface FilterStore {
    // ── Complaint Filters ──────────────────────────────────────────────────
    complaints: ComplaintFilters;
    setComplaintFilter: <K extends keyof ComplaintFilters>(key: K, value: ComplaintFilters[K]) => void;
    resetComplaintFilters: () => void;

    // ── Service Filters ────────────────────────────────────────────────────
    services: ServiceFilters;
    setServiceFilter: <K extends keyof ServiceFilters>(key: K, value: ServiceFilters[K]) => void;
    applyServiceFilters: () => void;
    resetServiceFilters: () => void;
}

// ─── Initial State ───────────────────────────────────────────────────────────

const initialComplaintFilters: ComplaintFilters = {
    sourceFilter: 'all',
    statusFilter: 'all',
    searchQuery: '',
    accessNumber: '',
    filterAccessNumber: '',
    filterTTSerialNo: '',
    activeTab: 'my-tickets',
    showFilters: false,
    currentPage: 1,
};

const initialServiceFilters: ServiceFilters = {
    globalFilter: '',
    typeFilter: '',
    statusFilter: '',
    showAdvancedFilters: false,
    appliedType: '',
    appliedStatus: '',
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useFilterStore = create<FilterStore>()(
    devtools(
        (set, get) => ({
            // Complaint filters
            complaints: { ...initialComplaintFilters },

            setComplaintFilter: (key, value) =>
                set(
                    (state) => ({
                        complaints: { ...state.complaints, [key]: value },
                    }),
                    undefined,
                    `setComplaintFilter:${key}`,
                ),

            resetComplaintFilters: () =>
                set(
                    { complaints: { ...initialComplaintFilters } },
                    undefined,
                    'resetComplaintFilters',
                ),

            // Service filters
            services: { ...initialServiceFilters },

            setServiceFilter: (key, value) =>
                set(
                    (state) => ({
                        services: { ...state.services, [key]: value },
                    }),
                    undefined,
                    `setServiceFilter:${key}`,
                ),

            applyServiceFilters: () =>
                set(
                    (state) => ({
                        services: {
                            ...state.services,
                            appliedType: state.services.typeFilter,
                            appliedStatus: state.services.statusFilter,
                        },
                    }),
                    undefined,
                    'applyServiceFilters',
                ),

            resetServiceFilters: () =>
                set(
                    { services: { ...initialServiceFilters } },
                    undefined,
                    'resetServiceFilters',
                ),
        }),
        { name: 'FilterStore' },
    ),
);
