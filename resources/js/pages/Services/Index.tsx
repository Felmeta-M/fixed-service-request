import { ServiceList } from '@/components/service/service-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSurveyList } from '@/hooks/use-surveys';
import MainLayout from '@/layouts/main-layout';
import { ServiceProvisionStatus } from '@/lib/status-map';
import { Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, BarChart3, Box, CheckCircle2, ChevronDown, ChevronUp, Clock, Filter, Phone, Plus, TrendingUp, UserPlus, Wifi, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const typeMap = {
    '1943913918': { label: 'Internet', text: 'text-blue-700', bg: 'bg-blue-400', icon: Wifi },
    '1207609454': { label: 'Voice', text: 'text-purple-700', bg: 'bg-purple-400', icon: Phone },
    '180427974': { label: 'Combo', text: 'text-green-700', bg: 'bg-green-400', icon: Box },
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

// Define status categories
const STATUS_CATEGORIES = {
    ACTIVE: [1, 3, 6, 11], // Processing, Waiting, Ready, Paid
    PENDING: [0, 10], // Created, Pending Payment
    COMPLETED: [4, 5, 9, 13, 14], // Failed, Survey Completed, Cancelled, Refund, Subscription Completed
    SUSPENDED: [2], // Suspended
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

    if (auth.user.customer_code) {
        // return create customer page
    }

    const [filters, setFilters] = useState<{ search?: string; status?: string }>({});
    const surveyListQuery = useSurveyList(filters);
    
    // Flatten pages to get all surveys
    const surveys = surveyListQuery.data?.pages.flatMap((page) => page.data || []) || [];
    const loading = surveyListQuery.isLoading;
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

    console.log('🚀 ~ Dashboard ~ surveys:', surveys);

    useEffect(() => {
        // Initial fetch is handled by the query
    }, []);

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
        const activeServices = surveys.filter((survey) => {
            const statusNum = Number(survey.status);
            return STATUS_CATEGORIES.ACTIVE.includes(statusNum);
        })?.length;

        // Pending requests: Created, Pending Payment
        const pendingRequests = surveys.filter((survey) => {
            const statusNum = Number(survey.status);
            return STATUS_CATEGORIES.PENDING.includes(statusNum);
        })?.length;

        // Completed services: Failed, Survey Completed, Cancelled, Refund
        const completedServices = surveys.filter((survey) => {
            const statusNum = Number(survey.status);
            return STATUS_CATEGORIES.COMPLETED.includes(statusNum);
        })?.length;

        return {
            totalServices,
            activeServices,
            pendingRequests,
            completedServices,
        };
    }, [surveys]);

    // Generate recent activities from survey data
    const recentActivities = useMemo((): RecentActivity[] => {
        if (!surveys?.length) return [];

        return surveys
            .slice(0, 5) // Show only 5 most recent
            .map((survey) => {
                const serviceType = typeMap[survey.main_offer_id as keyof typeof typeMap]?.label || 'Service';
                const statusInfo = ServiceProvisionStatus[Number(survey.status)] || { label: 'Updated' };

                return {
                    id: survey.id,
                    type: 'service_update',
                    message: `${serviceType} request ${survey.customer_survey_order_id} - ${statusInfo.label}`,
                    time: formatTimeAgo(survey.updated_at || survey.created_at),
                    status: getActivityStatus(Number(survey.status)),
                };
            });
    }, [surveys]);

    // Update filters when they change
    useEffect(() => {
        setFilters({
            search: globalFilter || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
        });
    }, [globalFilter, statusFilter]);

    // Handle filter changes immediately
    const handleTypeFilterChange = (value: string) => {
        setAppliedFilters((prev) => ({ ...prev, type: value }));
        setTypeFilter(value);
    };

    const handleStatusFilterChange = (value: string) => {
        setAppliedFilters((prev) => ({ ...prev, status: value }));
        setStatusFilter(value);
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
    function getActivityStatus(status: number): string {
        if (STATUS_CATEGORIES.COMPLETED.includes(status)) return 'completed';
        if (STATUS_CATEGORIES.ACTIVE.includes(status)) return 'in-progress';
        return 'pending';
    }

    const StatCard = ({ title, value, description, icon: Icon, trend, color, loading: isLoading }: any) => (
        <Card className="overflow-hidden pt-3 pb-3 shadow-xs">
            <CardContent className="pt-0 pr-4 pb-0 pl-4">
                {isLoading ? (
                    <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200"></div>
                            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200"></div>
                        </div>
                        <div className="animate-pulse rounded-full bg-gray-200 p-3">
                            <div className="h-6 w-6"></div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                                <p className="text-3xl font-bold">{value}</p>
                                <p className="text-xs text-muted-foreground">{description}</p>
                            </div>
                            <div className={`rounded-full p-3 ${color} bg-opacity-10`}>
                                <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
                            </div>
                        </div>
                        {trend && (
                            <div className="mt-3 flex items-center text-xs">
                                <TrendingUp className="mr-1 h-3 w-3 text-primary" />
                                <span className="text-primary">{trend}</span>
                                <span className="ml-1 text-muted-foreground">from last month</span>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );

    if (error) {
        return (
            <MainLayout>
                <div className="w-full space-y-6 px-4 lg:px-6">
                    <Card>
                        <CardContent className="p-6 flex flex-col sm:flex-row justify-between">
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
            <div className="w-full space-y-6 px-4 py-2 lg:px-6">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="">
                        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
                        <p className="text-muted-foreground">{loading ? 'Loading your services...' : `Managing your service requests.`}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Services"
                        value={dashboardStats.totalServices}
                        description="All your service requests"
                        icon={BarChart3}
                        color="text-blue-600"
                        loading={loading}
                    />
                    <StatCard
                        title="Active Services"
                        value={dashboardStats.activeServices}
                        description="Currently in progress"
                        icon={CheckCircle2}
                        color="text-primary"
                        loading={loading}
                    />
                    <StatCard
                        title="Pending Requests"
                        value={dashboardStats.pendingRequests}
                        description="Awaiting action"
                        icon={Clock}
                        color="text-orange-600"
                        loading={loading}
                    />
                    <StatCard
                        title="Completed"
                        value={dashboardStats.completedServices}
                        description="Successfully delivered"
                        icon={TrendingUp}
                        color="text-purple-600"
                        loading={loading}
                    />
                </div>

                <div className="border-0 pl-0 shadow-none">
                    <div className="p-0">
                        <div className="flex flex-col justify-between lg:flex-row lg:items-center">
                            <div>
                                <CardTitle>Your Services</CardTitle>
                                <CardDescription>{` Here are your fixed service requests`}</CardDescription>
                            </div>
                            <div className="mt-4 flex items-center gap-2 lg:mt-0">
                                <Input
                                    placeholder="Search services..."
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="h-8 max-w-sm text-sm"
                                    size="sm"
                                />
                                <Button
                                    variant={hasActiveFilters ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className="flex items-center gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                    {hasActiveFilters && <span className="flex h-2 w-2 rounded-full bg-primary-foreground" />}
                                    {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                                <div className="flex gap-1">
                                    {/* <Link href="/tickets/create">
                                        <Button>
                                            <Plus className="h-4 w-4" />
                                            Create Ticket
                                        </Button>
                                    </Link> */}
                                    <Link href="/services/create">
                                        <Button size="sm">
                                            <Plus className="h-4 w-4" />
                                            New Service
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <div className="flex flex-col gap-4">
                            {showAdvancedFilters && (
                                <div className="flex items-end justify-between gap-4 border-t pt-2 pb-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Service Type</label>
                                            <select
                                                value={appliedFilters.type}
                                                onChange={(e) => handleTypeFilterChange(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                            >
                                                <option value="">All Types</option>
                                                <option value="1943913918">🌐 Internet</option>
                                                <option value="1207609454">📞 Voice</option>
                                                <option value="180427974">📦 Combo</option>
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
                                                {Object.values(ServiceProvisionStatus).map((s, i) => (
                                                    <option key={i} value={s.label.toLowerCase()}>
                                                        {s.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {hasActiveFilters && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleClearFilters}
                                                className="flex items-center gap-2 text-red-500"
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
                                            Type:{' '}
                                            {appliedFilters.type === '1943913918'
                                                ? 'Internet'
                                                : appliedFilters.type === '1207609454'
                                                    ? 'Voice'
                                                    : 'Combo'}
                                            <button onClick={() => handleTypeFilterChange('')} className="ml-1 rounded-full hover:bg-primary/20">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                    {appliedFilters.status && (
                                        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                                            Status: {appliedFilters.status.charAt(0).toUpperCase() + appliedFilters.status.slice(1)}
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
