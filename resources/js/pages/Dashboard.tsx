import SurveyTable from '@/components/survey-table';
import DashboardStats from '@/components/survey/dashboard-stats';
// import SurveyTable from '@/components/survey/survey-table';
import { useSurveyList } from '@/hooks/use-survey-list';
import AuthLayout from '@/layouts/AuthLayout';
import { useActiveCustomer } from '@/store/customer-store';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, FileText, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface DashboardStatsData {
    total: number;
    // pending: number;
    waiting: number;
    completed: number;
    subscribed: number;
    cancelled: number;
}

export default function Dashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState<DashboardStatsData>({
        total: 0,
        // pending: 0,
        waiting: 0,
        completed: 0,
        subscribed: 0,
        cancelled: 0,
    });

    const { surveys, loading, error, fetchSurveys, refetch, hasMore, loadMore, total } = useSurveyList();

    const page = usePage();
    const serverCustomer = (page.props as any)?.customer;
    const { activeCustomer } = useActiveCustomer();

    useEffect(() => {
        const newStats = {
            total: surveys.length,
            // pending: surveys.filter((s) => s.status?.toLowerCase() === 'pending').length,
            waiting: surveys.filter((s) => s.status?.toLowerCase() === 'waiting').length,
            completed: surveys.filter((s) => s.status?.toLowerCase() === 'completed').length,
            subscribed: surveys.filter((s) => s.status?.toLowerCase() === 'subscribed').length,
            cancelled: surveys.filter((s) => s.status?.toLowerCase() === 'cancelled').length,
        };
        setStats(newStats);
    }, [surveys]);

    // Load surveys when customer is available or filters change
    useEffect(() => {
        if (activeCustomer?.customer.code) {
            loadSurveysWithFilters();
        }
    }, [activeCustomer, searchTerm, statusFilter]);

    const loadSurveysWithFilters = useCallback(async () => {
        await fetchSurveys({
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
        });
    }, [searchTerm, statusFilter, fetchSurveys]);

    const handleNewSurvey = () => {
        router.visit('/create-survey-requests');
    };

    const handleRefresh = () => {
        refetch();
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
    };

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
    };

    const handleLoadMore = async () => {
        await loadMore();
    };

    // const hasActiveSurvey = useMemo(() => {
    //     return surveys.some(
    //         (s: any) => s.status?.toLowerCase() === 'waiting' || s.status?.toLowerCase() === 'approved' || s.status?.toLowerCase() === 'pending',
    //     );
    // }, [surveys]);
    const hasActiveSurvey = useMemo(() => {
        return surveys.some(
            (s: any) => s.status?.toLowerCase() === 'witing' || s.status?.toLowerCase() === 'approved' || s.status?.toLowerCase() === 'pending',
        );
    }, [surveys]);

    const showEmptyState = !loading && surveys.length === 0;
    const showResults = !loading && surveys.length > 0;

    return (
        <AuthLayout>
            <div className="min-h-screen bg-gray-50/30">
                <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900">Survey Dashboard</h1>
                                <p className="mt-2 text-gray-600">Manage your survey orders and track their progress</p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <button
                                    onClick={handleNewSurvey}
                                    disabled={hasActiveSurvey}
                                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Survey Order
                                </button>
                            </div>
                        </div>

                        {hasActiveSurvey && (
                            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <div className="flex items-center">
                                    <AlertCircle className="mr-2 h-5 w-5 text-blue-400" />
                                    <p className="text-sm text-blue-700">
                                        You have an active survey in progress. Complete or cancel it to create a new one.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DashboardStats stats={stats} />

                    {/* {!loading && (
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing <span className="font-semibold">{surveys.length}</span>
                                {total > surveys.length ? ` of ${total}` : ''} survey orders
                            </p> */}

                    {/* {surveys.length > 0 && (
                                <button
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            )} */}
                    {/* </div> */}
                    {/* )} */}

                    {/* <SurveyFilters
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                        statusFilter={statusFilter}
                        onStatusFilterChange={handleStatusFilterChange}
                        onRefresh={handleRefresh}
                        loading={loading}
                    /> */}

                    {error && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                            <div className="flex items-center">
                                <AlertCircle className="mr-3 h-5 w-5 text-red-400" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-800">Error loading surveys</p>
                                    <p className="mt-1 text-sm text-red-700">{error}</p>
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    className="ml-4 rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {loading && surveys.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-500">Loading Surveys</h3>
                            <p className="text-gray-400">Please wait while we load your survey orders...</p>
                        </div>
                    )}

                    {showEmptyState && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                            <FileText className="mb-4 h-16 w-16 text-gray-300" />
                            <h3 className="mb-2 text-lg font-semibold text-gray-500">No surveys found</h3>
                            <p className="mb-6 max-w-sm text-gray-400">
                                {searchTerm || statusFilter !== 'all'
                                    ? "Try adjusting your search or filters to find what you're looking for."
                                    : 'Get started by creating your first survey request to manage your orders.'}
                            </p>
                            {!hasActiveSurvey && (
                                <button
                                    onClick={handleNewSurvey}
                                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create Your First Survey
                                </button>
                            )}
                        </div>
                    )}

                    {showResults && (
                        <>
                            <SurveyTable surveys={surveys} onSurveyUpdate={refetch} loading={loading} />

                            {hasMore && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Load More Surveys
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {!hasMore && surveys.length > 5 && (
                                <div className="mt-8 text-center">
                                    <p className="text-sm text-gray-500">You've reached the end of the results</p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </AuthLayout>
    );
}
