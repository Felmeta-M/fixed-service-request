import { BroadbandIcon, ComboIcon } from '@/components/icons/service-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ServiceList } from '@/features/services/components/service-list';
import { useSurveyList } from '@/features/surveys/hooks/use-surveys';
import { useServiceTypes } from '@/hooks/use-service-types';
import MainLayout from '@/layouts/main-layout';
import { getStatusInfo, statusOptions } from '@/lib/status-map';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, ChevronDown, ChevronUp, Filter, Phone, Plus, RefreshCw, Search, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const typeMap = {
    // '1943913918': { label: 'Internet', text: 'text-blue-700', bg: 'bg-blue-400', icon: BroadbandIcon },
    // '1207609454': { label: 'Voice', text: 'text-purple-700', bg: 'bg-purple-400', icon: Phone },
    // '102647257': { label: 'Combo', text: 'text-green-700', bg: 'bg-green-400', icon: ComboIcon },
    '1943913918': { label: 'Internet', text: 'text-et-blue', bg: 'bg-blue-400', icon: BroadbandIcon },
    '1207609454': { label: 'Voice', text: 'text-primary', bg: 'bg-purple-400', icon: Phone },
    '102647257': { label: 'Combo', text: 'text-et-green', bg: 'bg-green-400', icon: ComboIcon },
};

interface DashboardStats {
    totalServices: number;
    activeServices: number;
    pendingRequests: number;
    completedServices: number;
}

interface RecentActivity {
    id: string;
    type: string;
    message: string;
    time: string;
    status: string;
}

// Status categories using stable codes (with legacy label fallback)
const STATUS_CODES = {
    ACTIVE: ['processing', 'waiting', 'waiting_assessment', 'order_waiting', 'ready', 'paid', 'pending_payment', 'device_selection'],
    PENDING: ['created'],
    COMPLETED: ['assessment_complete', 'order_completed', 'failed', 'cancelled', 'refund'],
    SUSPENDED: ['suspended'],
} as const;

// Legacy labels for backward compatibility
const STATUS_LABELS = {
    ACTIVE: ['Processing', 'Waiting', 'Waiting Survey', 'Order Waiting', 'Ready', 'Paid', 'Pending Payment'],
    PENDING: ['Created'],
    COMPLETED: ['Survey Completed', 'Order Completed', 'Failed', 'Cancelled', 'Refund'],
    SUSPENDED: ['Suspended'],
} as const;

export default function CustomerDashboard() {
    const [globalFilter, setGlobalFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        type: '',
        status: '',
    });

    const { auth } = usePage().props;

    // Fetch dynamic service types
    const { serviceTypes, loading: loadingServiceTypes } = useServiceTypes();

    if (auth.user.customer_code) {
        // return create customer page
    }

    const [filters, setFilters] = useState<{ search?: string; status?: string }>({});
    const surveyListQuery = useSurveyList(filters);

    // Flatten pages to get all surveys
    const surveys = surveyListQuery.data?.pages.flatMap((page) => page.data || []) || [];
    const loading = surveyListQuery.isLoading;
    const isRefetching = surveyListQuery.isRefetching;
    const error = surveyListQuery.error?.message || null;
    const total = surveyListQuery.data?.pages[0]?.meta?.total || 0;
    const hasMore = surveyListQuery.hasNextPage || false;

    const fetchSurveys = () => {
        surveyListQuery.refetch();
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            surveyListQuery.fetchNextPage();
        }
    };

    const refetch = () => {
        surveyListQuery.refetch();
    };

    // Helper: Check if survey matches a status category (uses status_code with legacy fallback)
    const matchesCategory = (survey: any, category: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'SUSPENDED') => {
        const statusCode = String(survey.status_code ?? '');
        const statusLabel = String(survey.status ?? '');
        return STATUS_CODES[category].includes(statusCode as any) || STATUS_LABELS[category].includes(statusLabel as any);
    };

    // Calculate dashboard stats from survey data
    const dashboardStats = useMemo((): DashboardStats => {
        if (!surveys?.length) {
            return {
                totalServices: 0,
                activeServices: 0,
                pendingRequests: 0,
                completedServices: 0,
            };
        }

        const totalServices = surveys?.length;

        // Active services: Processing, Waiting, Ready, Paid
        const activeServices = surveys.filter((survey) => matchesCategory(survey, 'ACTIVE'))?.length;

        // Pending requests: Created
        const pendingRequests = surveys.filter((survey) => matchesCategory(survey, 'PENDING'))?.length;

        // Completed services: Completed, Failed, Cancelled, Refund
        const completedServices = surveys.filter((survey) => matchesCategory(survey, 'COMPLETED'))?.length;

        return {
            totalServices,
            activeServices,
            pendingRequests,
            completedServices,
        };
    }, [surveys]);

    // Generate recent activities from survey data using string-based status
    const recentActivities = useMemo((): RecentActivity[] => {
        if (!surveys?.length) return [];

        return surveys
            .slice(0, 5) // Show only 5 most recent
            .map((survey) => {
                const serviceType = typeMap[survey.main_offer_id as keyof typeof typeMap]?.label || 'Service';
                const statusInfo = getStatusInfo(survey.status, survey.status_code);

                return {
                    id: survey.id,
                    type: 'service_update',
                    message: `${serviceType} request ${survey.customer_survey_order_id} - ${statusInfo.label}`,
                    time: formatTimeAgo(survey.updated_at || survey.created_at),
                    status: getActivityStatus(survey),
                };
            });
    }, [surveys]);

    // Note: Type and Status filters are handled client-side in SurveyTable
    // Only search filter is sent to the backend API
    useEffect(() => {
        setFilters({
            search: globalFilter || undefined,
            // Don't send type/status to backend - filtered client-side
        });
    }, [globalFilter]);

    // Handle filter changes immediately
    const handleTypeFilterChange = (value: string) => {
        setAppliedFilters((prev) => ({ ...prev, type: value }));
        setTypeFilter(value);
    };

    const handleStatusFilterChange = (value: string) => {
        setAppliedFilters((prev) => ({ ...prev, status: value }));
        // Don't update statusFilter state that goes to API - only update appliedFilters
    };

    const handleClearFilters = () => {
        setAppliedFilters({
            type: '',
            status: '',
        });
        setShowAdvancedFilters(false);
    };

    const hasActiveFilters = appliedFilters.type || appliedFilters.status;

    const handleApplyFilters = () => {
        setAppliedFilters({
            type: typeFilter,
            status: statusFilter,
        });
        setShowAdvancedFilters(false);
    };
    function formatTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString();
    }

    // Determine activity status based on survey status
    function getActivityStatus(survey: any): string {
        if (matchesCategory(survey, 'COMPLETED')) return 'completed';
        if (matchesCategory(survey, 'ACTIVE')) return 'in-progress';
        return 'pending';
    }

    const StatCard = ({ title, value, description, loading: isLoading }: any) => (
        <Card className="overflow-hidden rounded-xl border border-primary bg-white py-4 shadow-none sm:py-8">
            <CardContent className="px-3 pt-0 sm:px-5">
                {isLoading ? (
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between sm:flex-row">
                            <div className="h-4 w-16 animate-pulse rounded bg-gray-200 sm:h-5 sm:w-28" />
                            <div className="h-7 w-8 animate-pulse rounded bg-gray-200 sm:h-9 sm:w-10" />
                        </div>
                        <div className="hidden h-4 w-36 animate-pulse rounded bg-gray-200 sm:block" />
                    </div>
                ) : (
                    <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-gray-600 sm:text-base">{title}</p>
                            <p className="text-xl font-bold text-gray-900 text-primary sm:text-3xl">{value}</p>
                        </div>
                        <p className="hidden text-sm text-gray-400 sm:block">{description}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (error) {
        return (
            <MainLayout>
                <div className="w-full space-y-6 px-4 lg:px-6">
                    <Card className="overflow-hidden rounded-xl border border-gray-400 bg-white py-8 shadow-none">
                        <CardContent className="flex flex-col justify-between p-6 sm:flex-row">
                            <div className="flex items-center space-x-3 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                <div>
                                    <p className="font-medium">Error loading dashboard</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                {/* // if error is customer not created, show a button that routes to the customer creation page */}
                                {error === 'User not authenticated or no customer code' && (
                                    <Button variant="outline" onClick={() => router.visit('/services/create')} className="gap-2">
                                        <UserPlus className="h-4 w-4" />
                                        Create Profile
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </MainLayout>
        );
    }
    const firstName = auth.user?.name ? auth.user.name.split(' ')[0] : '';

    return (
        <MainLayout>
            <div className="w-full max-w-full space-y-6 overflow-x-hidden px-4 py-2 lg:px-6">
                {/* Header Section */}
                <div className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
                        <p className="text-muted-foreground">{loading ? 'Loading your services...' : `Managing your service requests.`}</p>
                    </div>
                </div>

                {/* Stats Grid - 2x2 on mobile, 4 columns on large screens */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <StatCard title="Total Services" value={dashboardStats.totalServices} description="All your service requests" loading={loading} />
                    <StatCard title="Active Services" value={dashboardStats.activeServices} description="Currently in progress" loading={loading} />
                    <StatCard title="Pending Requests" value={dashboardStats.pendingRequests} description="Awaiting action" loading={loading} />
                    <StatCard title="Completed" value={dashboardStats.completedServices} description="Successfully delivered" loading={loading} />
                </div>

                <div className="border-0 pl-0 shadow-none">
                    <div className="p-0">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div className="min-w-0">
                                <CardTitle>Services</CardTitle>
                                <CardDescription>Here are your fixed service requests</CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap">
                                {/* Search input - full width on mobile */}
                                <div className="relative w-full sm:w-auto">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-600" />
                                    <Input
                                        placeholder="Search service"
                                        value={globalFilter}
                                        onChange={(e) => setGlobalFilter(e.target.value)}
                                        className="h-8 w-full border-primary pl-9 text-sm sm:w-[220px] lg:w-[260px]"
                                        size="sm"
                                    />
                                </div>
                                {/* Action buttons - row on mobile, wrap as needed */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant={hasActiveFilters ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                        className="flex items-center gap-1.5 border-primary"
                                    >
                                        <Filter className="h-4 w-4" />
                                        <span className="sm:inline">Filter</span>
                                        {hasActiveFilters && <span className="flex h-2 w-2 rounded-full bg-primary-foreground" />}
                                        {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => refetch()}
                                        disabled={loading}
                                        title="Refresh services list"
                                        className="border-primary"
                                    >
                                        <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
                                        <span className="ml-1.5 hidden sm:inline">Refresh</span>
                                    </Button>
                                    <Link href="/services/create" className="flex-1 sm:flex-none">
                                        <Button size="sm" className="w-full bg-primary hover:bg-primary/90 sm:w-auto">
                                            <Plus className="h-4 w-4" />
                                            <span className="ml-1.5">Add services</span>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <div className="flex flex-col gap-4">
                            {showAdvancedFilters && (
                                <div className="flex flex-col gap-4 border-t pt-2 pb-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Service Type</label>
                                            <select
                                                value={appliedFilters.type}
                                                onChange={(e) => handleTypeFilterChange(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                                disabled={loadingServiceTypes}
                                            >
                                                <option value="">All Types</option>
                                                {serviceTypes.map((st) => (
                                                    <option key={st.code} value={st.code}>
                                                        {st.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Status</label>
                                            <select
                                                value={appliedFilters.status}
                                                onChange={(e) => handleStatusFilterChange(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                            >
                                                <option value="">All Status</option>
                                                {statusOptions.map((status) => (
                                                    <option key={status.code} value={status.code}>
                                                        {status.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {hasActiveFilters && (
                                        <div className="flex items-center gap-2 sm:ml-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleClearFilters}
                                                className="flex w-full items-center gap-2 text-red-500 sm:w-auto"
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {hasActiveFilters && !showAdvancedFilters && (
                                <div className="flex flex-wrap gap-2">
                                    {appliedFilters.type && (
                                        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                                            Type: {serviceTypes.find((st) => st.code === appliedFilters.type)?.name || appliedFilters.type}
                                            <button onClick={() => handleTypeFilterChange('')} className="ml-1 rounded-full hover:bg-primary/20">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                    {appliedFilters.status && (
                                        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                                            Status: {statusOptions.find((s) => s.code === appliedFilters.status)?.label || appliedFilters.status}
                                            <button onClick={() => handleStatusFilterChange('')} className="ml-1 rounded-full hover:bg-primary/20">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </div>
                {/* <ServiceList globalFilter={globalFilter} typeFilter={appliedFilters.type} statusFilter={appliedFilters.status} /> */}
                <ServiceList
                    globalFilter={globalFilter}
                    typeFilter={appliedFilters.type}
                    statusFilter={appliedFilters.status}
                    surveys={surveys}
                    loading={loading}
                    error={error}
                    onSurveyUpdate={refetch}
                />
            </div>
        </MainLayout>
    );
}
