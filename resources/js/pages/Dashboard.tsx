// import SurveyTable from '@/components/survey-table';
// import DashboardStats from '@/components/survey/dashboard-stats';
// // import SurveyTable from '@/components/survey/survey-table';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import AuthLayout from '@/layouts/AuthLayout';
// import { useActiveCustomer } from '@/store/customer-store';
// import { router, usePage } from '@inertiajs/react';
// import { AlertCircle, FileText, Plus, RefreshCw } from 'lucide-react';
// import { useCallback, useEffect, useMemo, useState } from 'react';

// interface DashboardStatsData {
//     total: number;
//     // pending: number;
//     waiting: number;
//     completed: number;
//     subscribed: number;
//     cancelled: number;
// }

// export default function Dashboard() {
//     const [searchTerm, setSearchTerm] = useState('');
//     const [statusFilter, setStatusFilter] = useState('all');
//     const [stats, setStats] = useState<DashboardStatsData>({
//         total: 0,
//         // pending: 0,
//         waiting: 0,
//         completed: 0,
//         subscribed: 0,
//         cancelled: 0,
//     });

//     const { surveys, loading, error, fetchSurveys, refetch, hasMore, loadMore, total } = useSurveyList();

//     const page = usePage();
//     const serverCustomer = (page.props as any)?.customer;
//     const { activeCustomer } = useActiveCustomer();

//     useEffect(() => {
//         const newStats = {
//             total: surveys.length,
//             // pending: surveys.filter((s) => s.status?.toLowerCase() === 'pending').length,
//             waiting: surveys.filter((s) => s.status?.toLowerCase() === 'waiting').length,
//             completed: surveys.filter((s) => s.status?.toLowerCase() === 'completed').length,
//             subscribed: surveys.filter((s) => s.status?.toLowerCase() === 'subscribed').length,
//             cancelled: surveys.filter((s) => s.status?.toLowerCase() === 'cancelled').length,
//         };
//         setStats(newStats);
//     }, [surveys]);

//     // Load surveys when customer is available or filters change
//     useEffect(() => {
//         if (activeCustomer?.customer.code) {
//             loadSurveysWithFilters();
//         }
//     }, [activeCustomer, searchTerm, statusFilter]);

//     const loadSurveysWithFilters = useCallback(async () => {
//         await fetchSurveys({
//             search: searchTerm || undefined,
//             status: statusFilter !== 'all' ? statusFilter : undefined,
//         });
//     }, [searchTerm, statusFilter, fetchSurveys]);

//     const handleNewSurvey = () => {
//         router.visit('/create-survey-requests');
//     };

//     const handleRefresh = () => {
//         refetch();
//     };

//     const handleSearchChange = (value: string) => {
//         setSearchTerm(value);
//     };

//     const handleStatusFilterChange = (value: string) => {
//         setStatusFilter(value);
//     };

//     const handleLoadMore = async () => {
//         await loadMore();
//     };

//     // const hasActiveSurvey = useMemo(() => {
//     //     return surveys.some(
//     //         (s: any) => s.status?.toLowerCase() === 'waiting' || s.status?.toLowerCase() === 'approved' || s.status?.toLowerCase() === 'pending',
//     //     );
//     // }, [surveys]);
//     const hasActiveSurvey = useMemo(() => {
//         return surveys.some(
//             (s: any) => s.status?.toLowerCase() === 'witing' || s.status?.toLowerCase() === 'approved' || s.status?.toLowerCase() === 'pending',
//         );
//     }, [surveys]);

//     const showEmptyState = !loading && surveys.length === 0;
//     const showResults = !loading && surveys.length > 0;

//     return (
//         <AuthLayout>
//             <div className="min-h-screen bg-gray-50/30">
//                 <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
//                     <div className="mb-8">
//                         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                             <div className="flex-1">
//                                 <h1 className="text-2xl font-bold text-gray-900">Survey Dashboard</h1>
//                                 <p className="mt-2 text-gray-600">Manage your survey orders and track their progress</p>
//                             </div>

//                             <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//                                 <button
//                                     onClick={handleNewSurvey}
//                                     disabled={hasActiveSurvey}
//                                     className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
//                                 >
//                                     <Plus className="h-4 w-4" />
//                                     New Survey Order
//                                 </button>
//                             </div>
//                         </div>

//                         {hasActiveSurvey && (
//                             <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
//                                 <div className="flex items-center">
//                                     <AlertCircle className="mr-2 h-5 w-5 text-blue-400" />
//                                     <p className="text-sm text-blue-700">
//                                         You have an active survey in progress. Complete or cancel it to create a new one.
//                                     </p>
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     <DashboardStats stats={stats} />

//                     {/* {!loading && (
//                         <div className="mb-4 flex items-center justify-between">
//                             <p className="text-sm text-gray-600">
//                                 Showing <span className="font-semibold">{surveys.length}</span>
//                                 {total > surveys.length ? ` of ${total}` : ''} survey orders
//                             </p> */}

//                     {/* {surveys.length > 0 && (
//                                 <button
//                                     onClick={handleRefresh}
//                                     disabled={loading}
//                                     className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
//                                 >
//                                     <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
//                                     Refresh
//                                 </button>
//                             )} */}
//                     {/* </div> */}
//                     {/* )} */}

//                     {/* <SurveyFilters
//                         searchTerm={searchTerm}
//                         onSearchChange={handleSearchChange}
//                         statusFilter={statusFilter}
//                         onStatusFilterChange={handleStatusFilterChange}
//                         onRefresh={handleRefresh}
//                         loading={loading}
//                     /> */}

//                     {error && (
//                         <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
//                             <div className="flex items-center">
//                                 <AlertCircle className="mr-3 h-5 w-5 text-red-400" />
//                                 <div className="flex-1">
//                                     <p className="text-sm font-medium text-red-800">Error loading surveys</p>
//                                     <p className="mt-1 text-sm text-red-700">{error}</p>
//                                 </div>
//                                 <button
//                                     onClick={handleRefresh}
//                                     className="ml-4 rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
//                                 >
//                                     Try Again
//                                 </button>
//                             </div>
//                         </div>
//                     )}

//                     {loading && surveys.length === 0 && (
//                         <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
//                             <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
//                             <h3 className="mb-2 text-lg font-semibold text-gray-500">Loading Surveys</h3>
//                             <p className="text-gray-400">Please wait while we load your survey orders...</p>
//                         </div>
//                     )}

//                     {showEmptyState && (
//                         <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
//                             <FileText className="mb-4 h-16 w-16 text-gray-300" />
//                             <h3 className="mb-2 text-lg font-semibold text-gray-500">No surveys found</h3>
//                             <p className="mb-6 max-w-sm text-gray-400">
//                                 {searchTerm || statusFilter !== 'all'
//                                     ? "Try adjusting your search or filters to find what you're looking for."
//                                     : 'Get started by creating your first survey request to manage your orders.'}
//                             </p>
//                             {!hasActiveSurvey && (
//                                 <button
//                                     onClick={handleNewSurvey}
//                                     className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
//                                 >
//                                     <Plus className="h-4 w-4" />
//                                     Create Your First Survey
//                                 </button>
//                             )}
//                         </div>
//                     )}

//                     {showResults && (
//                         <>
//                             <SurveyTable surveys={surveys} onSurveyUpdate={refetch} loading={loading} />

//                             {hasMore && (
//                                 <div className="mt-8 flex justify-center">
//                                     <button
//                                         onClick={handleLoadMore}
//                                         disabled={loading}
//                                         className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
//                                     >
//                                         {loading ? (
//                                             <>
//                                                 <RefreshCw className="h-4 w-4 animate-spin" />
//                                                 Loading...
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <Plus className="h-4 w-4" />
//                                                 Load More Surveys
//                                             </>
//                                         )}
//                                     </button>
//                                 </div>
//                             )}
//                             {/*
//                             {!hasMore && surveys.length > 5 && (
//                                 <div className="mt-8 text-center">
//                                     <p className="text-sm text-gray-500">You've reached the end of the results</p>
//                                 </div>
//                             )} */}
//                         </>
//                     )}
//                 </main>
//             </div>
//         </AuthLayout>
//     );
// }

// import SurveyTable from '@/components/survey-table';
// import DashboardStats from '@/components/survey/dashboard-stats';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import AuthLayout from '@/layouts/AuthLayout';
// import { useActiveCustomer } from '@/store/customer-store';
// import { Link, router, usePage } from '@inertiajs/react';
// import { AlertCircle, ArrowLeft, BarChart3, FileText, Plus, RefreshCw, TrendingUp } from 'lucide-react';
// import { useCallback, useEffect, useMemo, useState } from 'react';

// interface DashboardStatsData {
//     total: number;
//     waiting: number;
//     completed: number;
//     subscribed: number;
//     cancelled: number;
// }

// export default function Dashboard() {
//     const [searchTerm, setSearchTerm] = useState('');
//     const [statusFilter, setStatusFilter] = useState('all');
//     const [stats, setStats] = useState<DashboardStatsData>({
//         total: 0,
//         waiting: 0,
//         completed: 0,
//         subscribed: 0,
//         cancelled: 0,
//     });

//     const { surveys, loading, error, fetchSurveys, refetch, hasMore, loadMore, total } = useSurveyList();

//     const page = usePage();
//     const serverCustomer = (page.props as any)?.customer;
//     const { activeCustomer } = useActiveCustomer();

//     useEffect(() => {
//         const newStats = {
//             total: surveys.length,
//             waiting: surveys.filter((s) => s.status?.toLowerCase() === 'waiting').length,
//             completed: surveys.filter((s) => s.status?.toLowerCase() === 'completed').length,
//             subscribed: surveys.filter((s) => s.status?.toLowerCase() === 'subscribed').length,
//             cancelled: surveys.filter((s) => s.status?.toLowerCase() === 'cancelled').length,
//         };
//         setStats(newStats);
//     }, [surveys]);

//     useEffect(() => {
//         if (activeCustomer?.customer.code) {
//             loadSurveysWithFilters();
//         }
//     }, [activeCustomer, searchTerm, statusFilter]);

//     const loadSurveysWithFilters = useCallback(async () => {
//         await fetchSurveys({
//             search: searchTerm || undefined,
//             status: statusFilter !== 'all' ? statusFilter : undefined,
//         });
//     }, [searchTerm, statusFilter, fetchSurveys]);

//     const handleNewSurvey = () => {
//         router.visit('/create-survey-requests');
//     };

//     const handleRefresh = () => {
//         refetch();
//     };

//     const hasActiveSurvey = useMemo(() => {
//         return surveys.some((s: any) => s.status?.toLowerCase() === 'waiting' || s.status?.toLowerCase() === 'approved');
//     }, [surveys]);

//     const showEmptyState = !loading && surveys.length === 0;
//     const showResults = !loading && surveys.length > 0;

//     return (
//         <AuthLayout>
//             <div className="min-h-screen bg-gray-50/30">
//                 <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
//                     {/* Header */}
//                     <div className="mb-8">
//                         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                             <div className="flex items-center gap-4">
//                                 <Link href="/services">
//                                     <Button variant="outline" className="flex items-center gap-2">
//                                         <ArrowLeft className="h-4 w-4" />
//                                         Back to Services
//                                     </Button>
//                                 </Link>
//                                 <div className="flex-1">
//                                     <h1 className="text-2xl font-bold text-gray-900">Service Analytics Dashboard</h1>
//                                     <p className="mt-2 text-gray-600">Detailed analytics and management for your service requests</p>
//                                 </div>
//                             </div>

//                             <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//                                 <button
//                                     onClick={handleNewSurvey}
//                                     disabled={hasActiveSurvey}
//                                     className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
//                                 >
//                                     <Plus className="h-4 w-4" />
//                                     New Service Request
//                                 </button>
//                             </div>
//                         </div>

//                         {hasActiveSurvey && (
//                             <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
//                                 <div className="flex items-center">
//                                     <AlertCircle className="mr-2 h-5 w-5 text-blue-400" />
//                                     <p className="text-sm text-blue-700">
//                                         You have an active service request. Complete or cancel it to create a new one.
//                                     </p>
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {/* Enhanced Stats */}
//                     <DashboardStats stats={stats} />

//                     {/* Analytics Overview */}
//                     <Card className="mb-8 border-0 shadow-lg">
//                         <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
//                             <CardTitle className="flex items-center gap-2 text-xl font-bold">
//                                 <TrendingUp className="h-5 w-5 text-primary" />
//                                 Analytics Overview
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent className="p-6">
//                             <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
//                                 <div className="text-center">
//                                     <div className="text-2xl font-bold text-primary">{((stats.completed / stats.total) * 100 || 0).toFixed(1)}%</div>
//                                     <div className="text-sm text-gray-600">Completion Rate</div>
//                                 </div>
//                                 <div className="text-center">
//                                     <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
//                                     <div className="text-sm text-gray-600">Ready for Service</div>
//                                 </div>
//                                 <div className="text-center">
//                                     <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
//                                     <div className="text-sm text-gray-600">In Progress</div>
//                                 </div>
//                                 <div className="text-center">
//                                     <div className="text-2xl font-bold text-blue-600">{stats.subscribed}</div>
//                                     <div className="text-sm text-gray-600">Active Services</div>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Survey Table Section */}
//                     <Card className="border-0 shadow-lg">
//                         <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
//                             <CardTitle className="flex items-center justify-between text-xl font-bold">
//                                 <span className="flex items-center gap-2">
//                                     <BarChart3 className="h-5 w-5" />
//                                     Service Request History
//                                 </span>
//                                 <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
//                                     <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
//                                     Refresh
//                                 </Button>
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent className="p-6">
//                             {error && (
//                                 <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
//                                     <div className="flex items-center">
//                                         <AlertCircle className="mr-3 h-5 w-5 text-red-400" />
//                                         <div className="flex-1">
//                                             <p className="text-sm font-medium text-red-800">Error loading service requests</p>
//                                             <p className="mt-1 text-sm text-red-700">{error}</p>
//                                         </div>
//                                         <button
//                                             onClick={handleRefresh}
//                                             className="ml-4 rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
//                                         >
//                                             Try Again
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}

//                             {loading && surveys.length === 0 && (
//                                 <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
//                                     <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
//                                     <h3 className="mb-2 text-lg font-semibold text-gray-500">Loading Service Requests</h3>
//                                     <p className="text-gray-400">Please wait while we load your service history...</p>
//                                 </div>
//                             )}

//                             {showEmptyState && (
//                                 <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
//                                     <FileText className="mb-4 h-16 w-16 text-gray-300" />
//                                     <h3 className="mb-2 text-lg font-semibold text-gray-500">No service requests found</h3>
//                                     <p className="mb-6 max-w-sm text-gray-400">
//                                         Get started by creating your first service request to manage your telecom services.
//                                     </p>
//                                     {!hasActiveSurvey && (
//                                         <button
//                                             onClick={handleNewSurvey}
//                                             className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
//                                         >
//                                             <Plus className="h-4 w-4" />
//                                             Create Your First Service Request
//                                         </button>
//                                     )}
//                                 </div>
//                             )}

//                             {showResults && (
//                                 <>
//                                     <SurveyTable surveys={surveys} onSurveyUpdate={refetch} loading={loading} />

//                                     {hasMore && (
//                                         <div className="mt-8 flex justify-center">
//                                             <button
//                                                 onClick={handleLoadMore}
//                                                 disabled={loading}
//                                                 className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
//                                             >
//                                                 {loading ? (
//                                                     <>
//                                                         <RefreshCw className="h-4 w-4 animate-spin" />
//                                                         Loading...
//                                                     </>
//                                                 ) : (
//                                                     <>
//                                                         <Plus className="h-4 w-4" />
//                                                         Load More Requests
//                                                     </>
//                                                 )}
//                                             </button>
//                                         </div>
//                                     )}
//                                 </>
//                             )}
//                         </CardContent>
//                     </Card>
//                 </main>
//             </div>
//         </AuthLayout>
//     );
// }

// pages/dashboard.tsx
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import AuthLayout from '@/layouts/AuthLayout';
// import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// export default function Dashboard() {
//     const { surveys } = useSurveyList();

//     // Analytics data
//     const statusData = surveys.reduce(
//         (acc, survey) => {
//             const status = survey.status?.toLowerCase() || 'unknown';
//             acc[status] = (acc[status] || 0) + 1;
//             return acc;
//         },
//         {} as Record<string, number>,
//     );

//     const chartData = Object.entries(statusData).map(([name, value]) => ({
//         name: name.charAt(0).toUpperCase() + name.slice(1),
//         value,
//     }));

//     const monthlyData = [
//         { month: 'Jan', requests: 12, completed: 8 },
//         { month: 'Feb', requests: 19, completed: 12 },
//         { month: 'Mar', requests: 15, completed: 9 },
//         { month: 'Apr', requests: 22, completed: 16 },
//         { month: 'May', requests: 18, completed: 14 },
//         { month: 'Jun', requests: 25, completed: 18 },
//     ];

//     const totalServices = surveys.length;
//     const activeServices = surveys.filter((s) => ['completed', 'subscribed'].includes(s.status?.toLowerCase())).length;
//     const pendingRequests = surveys.filter((s) => s.status?.toLowerCase() === 'waiting').length;

//     return (
//         <AuthLayout>
//             <div className="min-h-screen bg-gray-50/30 p-6">
//                 <div className="mx-auto max-w-7xl">
//                     {/* Header */}
//                     <div className="mb-8">
//                         <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
//                         <p className="mt-2 text-gray-600">Overview of your services and requests</p>
//                     </div>

//                     {/* Stats Cards */}
//                     <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
//                         <Card>
//                             <CardHeader className="pb-2">
//                                 <CardTitle className="text-sm font-medium">Total Services</CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 <div className="text-2xl font-bold">{totalServices}</div>
//                                 <p className="text-xs text-gray-600">All time service requests</p>
//                             </CardContent>
//                         </Card>

//                         <Card>
//                             <CardHeader className="pb-2">
//                                 <CardTitle className="text-sm font-medium">Active Services</CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 <div className="text-2xl font-bold text-green-600">{activeServices}</div>
//                                 <p className="text-xs text-gray-600">Currently active services</p>
//                             </CardContent>
//                         </Card>

//                         <Card>
//                             <CardHeader className="pb-2">
//                                 <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
//                                 <p className="text-xs text-gray-600">Awaiting processing</p>
//                             </CardContent>
//                         </Card>
//                     </div>

//                     {/* Charts */}
//                     <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//                         {/* Service Status Distribution */}
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle>Service Status Distribution</CardTitle>
//                                 <CardDescription>Overview of all service requests by status</CardDescription>
//                             </CardHeader>
//                             <CardContent>
//                                 <ResponsiveContainer width="100%" height={300}>
//                                     <PieChart>
//                                         <Pie
//                                             data={chartData}
//                                             cx="50%"
//                                             cy="50%"
//                                             labelLine={false}
//                                             label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
//                                             outerRadius={80}
//                                             fill="#8884d8"
//                                             dataKey="value"
//                                         >
//                                             {chartData.map((entry, index) => (
//                                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                             ))}
//                                         </Pie>
//                                         <Tooltip />
//                                     </PieChart>
//                                 </ResponsiveContainer>
//                             </CardContent>
//                         </Card>

//                         {/* Monthly Requests Trend */}
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle>Monthly Service Trends</CardTitle>
//                                 <CardDescription>Service requests and completions over time</CardDescription>
//                             </CardHeader>
//                             <CardContent>
//                                 <ResponsiveContainer width="100%" height={300}>
//                                     <BarChart data={monthlyData}>
//                                         <CartesianGrid strokeDasharray="3 3" />
//                                         <XAxis dataKey="month" />
//                                         <YAxis />
//                                         <Tooltip />
//                                         <Bar dataKey="requests" fill="#0088FE" name="Total Requests" />
//                                         <Bar dataKey="completed" fill="#00C49F" name="Completed" />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </CardContent>
//                         </Card>
//                     </div>

//                     {/* Recent Activity */}
//                     <Card className="mt-6">
//                         <CardHeader>
//                             <CardTitle>Recent Service Requests</CardTitle>
//                             <CardDescription>Latest service activities</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="space-y-4">
//                                 {surveys.slice(0, 5).map((service) => (
//                                     <div key={service.customer_survey_order_id} className="flex items-center justify-between rounded-lg border p-3">
//                                         <div>
//                                             <div className="font-medium">
//                                                 {service.main_offer_id?.includes('1943913915')
//                                                     ? 'Fixed Broadband'
//                                                     : service.main_offer_id?.includes('1207609454')
//                                                       ? 'Fixed Voice'
//                                                       : 'Combo Service'}
//                                             </div>
//                                             <div className="text-sm text-gray-600">Order #{service.customer_survey_order_id}</div>
//                                         </div>
//                                         <div className="text-right">
//                                             <div
//                                                 className={`rounded-full px-2 py-1 text-xs font-medium ${
//                                                     service.status?.toLowerCase() === 'completed'
//                                                         ? 'bg-green-100 text-green-800'
//                                                         : service.status?.toLowerCase() === 'waiting'
//                                                           ? 'bg-yellow-100 text-yellow-800'
//                                                           : 'bg-gray-100 text-gray-800'
//                                                 }`}
//                                             >
//                                                 {service.status}
//                                             </div>
//                                             <div className="mt-1 text-xs text-gray-500">{new Date(service.created_at).toLocaleDateString()}</div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>
//             </div>
//         </AuthLayout>
//     );
// }

// pages/dashboard.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSurveyList } from '@/hooks/use-survey-list';
import AuthLayout from '@/layouts/AuthLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft, BarChart3, Package, Phone, RefreshCw, TrendingUp, Users, Wifi } from 'lucide-react';
import { useMemo } from 'react';

// Mock chart components - replace with actual chart library
const ServiceStatusChart = ({ data }: { data: any[] }) => (
    <div className="flex h-64 items-end justify-between space-x-2">
        {data.map((item, index) => (
            <div key={index} className="flex flex-1 flex-col items-center">
                <div
                    className="w-full rounded-t bg-blue-500 transition-all duration-500"
                    style={{ height: `${(item.value / Math.max(...data.map((d) => d.value))) * 80}%` }}
                />
                <span className="mt-2 text-xs text-gray-600">{item.name}</span>
                <span className="text-sm font-semibold">{item.value}</span>
            </div>
        ))}
    </div>
);

const MonthlyTrendChart = ({ data }: { data: any[] }) => (
    <div className="flex h-64 items-end justify-between space-x-1">
        {data.map((item, index) => (
            <div key={index} className="flex flex-1 flex-col items-center">
                <div className="flex h-48 items-end space-x-1">
                    <div className="w-3 rounded-t bg-blue-500 transition-all duration-500" style={{ height: `${(item.requests / 30) * 100}%` }} />
                    <div className="w-3 rounded-t bg-green-500 transition-all duration-500" style={{ height: `${(item.completed / 30) * 100}%` }} />
                </div>
                <span className="mt-2 text-xs text-gray-600">{item.month}</span>
            </div>
        ))}
    </div>
);

export default function Dashboard() {
    const { surveys, loading, refetch } = useSurveyList();

    const stats = useMemo(() => {
        const statusCounts = surveys.reduce(
            (acc, survey) => {
                const status = survey.status?.toLowerCase() || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );

        const serviceTypeCounts = surveys.reduce(
            (acc, survey) => {
                const type = survey.main_offer_id?.includes('1943913915')
                    ? 'broadband'
                    : survey.main_offer_id?.includes('1207609454')
                      ? 'voice'
                      : 'combo';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );

        return {
            total: surveys.length,
            waiting: statusCounts.waiting || 0,
            completed: statusCounts.completed || 0,
            subscribed: statusCounts.subscribed || 0,
            cancelled: statusCounts.cancelled || 0,
            broadband: serviceTypeCounts.broadband || 0,
            voice: serviceTypeCounts.voice || 0,
            combo: serviceTypeCounts.combo || 0,
        };
    }, [surveys]);

    const chartData = [
        { name: 'Waiting', value: stats.waiting, color: '#f59e0b' },
        { name: 'Completed', value: stats.completed, color: '#10b981' },
        { name: 'Subscribed', value: stats.subscribed, color: '#3b82f6' },
        { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
    ];

    const monthlyData = [
        { month: 'Jan', requests: 12, completed: 8 },
        { month: 'Feb', requests: 19, completed: 12 },
        { month: 'Mar', requests: 15, completed: 9 },
        { month: 'Apr', requests: 22, completed: 16 },
        { month: 'May', requests: 18, completed: 14 },
        { month: 'Jun', requests: 25, completed: 18 },
    ];

    const serviceTypeData = [
        { name: 'Broadband', value: stats.broadband, icon: Wifi, color: 'text-blue-600' },
        { name: 'Voice', value: stats.voice, icon: Phone, color: 'text-green-600' },
        { name: 'Combo', value: stats.combo, icon: Package, color: 'text-purple-600' },
    ];

    return (
        <AuthLayout>
            <div className="min-h-screen bg-gray-50/30 p-6">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/services">
                                <Button variant="outline" className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Services
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Service Analytics Dashboard</h1>
                                <p className="mt-2 text-gray-600">Comprehensive overview of your service requests and performance</p>
                            </div>
                        </div>
                        <Button onClick={refetch} disabled={loading} variant="outline">
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Main Stats */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <Users className="h-4 w-4" />
                                    Total Services
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <p className="text-xs text-gray-600">All service requests</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    Active Services
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.completed + stats.subscribed}</div>
                                <p className="text-xs text-gray-600">Ready or subscribed</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <BarChart3 className="h-4 w-4 text-yellow-600" />
                                    In Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
                                <p className="text-xs text-gray-600">Awaiting processing</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <Wifi className="h-4 w-4 text-blue-600" />
                                    Success Rate
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {stats.total > 0 ? (((stats.completed + stats.subscribed) / stats.total) * 100).toFixed(1) : 0}%
                                </div>
                                <p className="text-xs text-gray-600">Service completion rate</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Grid */}
                    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Service Status Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Service Status Distribution</CardTitle>
                                <CardDescription>Overview of service requests by status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ServiceStatusChart data={chartData} />
                                <div className="mt-4 flex justify-center space-x-4">
                                    {chartData.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-sm text-gray-600">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Monthly Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Service Trends</CardTitle>
                                <CardDescription>Requests and completions over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <MonthlyTrendChart data={monthlyData} />
                                <div className="mt-4 flex justify-center space-x-6">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-3 w-3 rounded bg-blue-500" />
                                        <span className="text-sm text-gray-600">Requests</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="h-3 w-3 rounded bg-green-500" />
                                        <span className="text-sm text-gray-600">Completed</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Service Type Breakdown */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Service Type Breakdown</CardTitle>
                            <CardDescription>Distribution of services by type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {serviceTypeData.map((service, index) => {
                                    const IconComponent = service.icon;
                                    return (
                                        <div key={index} className="flex items-center rounded-lg border p-4">
                                            <div className={`rounded-lg p-3 ${service.color} bg-opacity-10`}>
                                                <IconComponent className={`h-6 w-6 ${service.color}`} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-2xl font-bold">{service.value}</div>
                                                <div className="text-sm text-gray-600">{service.name}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance Metrics */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Average Processing Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">2.3 days</div>
                                <p className="text-xs text-gray-600">From request to completion</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">94%</div>
                                <p className="text-xs text-gray-600">Based on service ratings</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">78%</div>
                                <p className="text-xs text-gray-600">Network capacity usage</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}

// pages/dashboard.tsx
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import ServicesLayout from '@/layouts/ServicesLayout';
// import { BarChart3, RefreshCw, TrendingUp, Users, Wifi } from 'lucide-react';
// import { useMemo } from 'react';

// // Mock chart components
// const ServiceStatusChart = ({ data }: { data: any[] }) => (
//     <div className="flex h-64 items-end justify-between space-x-2">
//         {data.map((item, index) => (
//             <div key={index} className="flex flex-1 flex-col items-center">
//                 <div
//                     className="w-full rounded-t bg-blue-500 transition-all duration-500"
//                     style={{ height: `${(item.value / Math.max(...data.map((d) => d.value))) * 80}%` }}
//                 />
//                 <span className="mt-2 text-xs text-gray-600">{item.name}</span>
//                 <span className="text-sm font-semibold">{item.value}</span>
//             </div>
//         ))}
//     </div>
// );

// export default function Dashboard() {
//     const { surveys, loading, refetch } = useSurveyList();

//     const stats = useMemo(() => {
//         const statusCounts = surveys.reduce(
//             (acc, survey) => {
//                 const status = survey.status?.toLowerCase() || 'unknown';
//                 acc[status] = (acc[status] || 0) + 1;
//                 return acc;
//             },
//             {} as Record<string, number>,
//         );

//         return {
//             total: surveys.length,
//             waiting: statusCounts.waiting || 0,
//             completed: statusCounts.completed || 0,
//             subscribed: statusCounts.subscribed || 0,
//             cancelled: statusCounts.cancelled || 0,
//         };
//     }, [surveys]);

//     const chartData = [
//         { name: 'Waiting', value: stats.waiting, color: '#f59e0b' },
//         { name: 'Completed', value: stats.completed, color: '#10b981' },
//         { name: 'Subscribed', value: stats.subscribed, color: '#3b82f6' },
//         { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
//     ];

//     return (
//         <ServicesLayout>
//             <div className="mx-auto max-w-7xl">
//                 {/* Header */}
//                 <div className="mb-8 flex items-center justify-between">
//                     <div>
//                         <h1 className="text-3xl font-bold text-gray-900">Service Analytics Dashboard</h1>
//                         <p className="mt-2 text-gray-600">Comprehensive overview of your service requests and performance</p>
//                     </div>
//                     <Button onClick={refetch} disabled={loading} variant="outline">
//                         <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
//                         Refresh
//                     </Button>
//                 </div>

//                 {/* Main Stats */}
//                 <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="flex items-center gap-2 text-sm font-medium">
//                                 <Users className="h-4 w-4" />
//                                 Total Services
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold">{stats.total}</div>
//                             <p className="text-xs text-gray-600">All service requests</p>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="flex items-center gap-2 text-sm font-medium">
//                                 <TrendingUp className="h-4 w-4 text-green-600" />
//                                 Active Services
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold text-green-600">{stats.completed + stats.subscribed}</div>
//                             <p className="text-xs text-gray-600">Ready or subscribed</p>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="flex items-center gap-2 text-sm font-medium">
//                                 <BarChart3 className="h-4 w-4 text-yellow-600" />
//                                 In Progress
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
//                             <p className="text-xs text-gray-600">Awaiting processing</p>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="flex items-center gap-2 text-sm font-medium">
//                                 <Wifi className="h-4 w-4 text-blue-600" />
//                                 Success Rate
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold text-blue-600">
//                                 {stats.total > 0 ? (((stats.completed + stats.subscribed) / stats.total) * 100).toFixed(1) : 0}%
//                             </div>
//                             <p className="text-xs text-gray-600">Service completion rate</p>
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Charts */}
//                 <Card className="mb-8">
//                     <CardHeader>
//                         <CardTitle>Service Status Distribution</CardTitle>
//                         <CardDescription>Overview of service requests by status</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         <ServiceStatusChart data={chartData} />
//                         <div className="mt-4 flex justify-center space-x-4">
//                             {chartData.map((item, index) => (
//                                 <div key={index} className="flex items-center space-x-2">
//                                     <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
//                                     <span className="text-sm text-gray-600">{item.name}</span>
//                                 </div>
//                             ))}
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>
//         </ServicesLayout>
//     );
// }
