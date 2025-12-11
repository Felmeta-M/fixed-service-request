import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSurveyList } from '@/hooks/use-survey-list';
import MainLayout from '@/layouts/main-layout';
import { usePage } from '@inertiajs/react';
import { BarChart3, Package, Phone, RefreshCw, TrendingUp, Users, Wifi } from 'lucide-react';
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
    const { auth } = usePage().props;
    const { user } = auth;
    console.log(user);

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
                const type = survey.main_offer_id?.includes('1457567289')
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
        <MainLayout>
            <div className="min-h-screen bg-gray-50/30 p-6">
                <div className="mx-auto max-w-screen-2xl">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
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
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Active Services
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">{stats.completed + stats.subscribed}</div>
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
                    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2"></div>
                </div>
            </div>
        </MainLayout>
    );
}
