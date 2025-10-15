import { Filter, RefreshCw, Search } from 'lucide-react';

interface SurveyFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    onRefresh: () => void;
    loading?: boolean;
}

export default function SurveyFilters({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange, onRefresh, loading }: SurveyFiltersProps) {
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        // { value: 'pending', label: 'Pending' },
        { value: 'waiting', label: 'Waiting' },
        // { value: 'approved', label: 'Approved' },
        { value: 'completed', label: 'Completed' },
        { value: 'subscribed', label: 'Subscribed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-4">
                {/* Search Input */}
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by order ID, type, or status..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 text-sm transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <Filter className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value)}
                        className="min-w-[140px] appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pr-8 pl-10 text-sm transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Refresh Button */}
            <button
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-50"
            >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </button>
        </div>
    );
}
