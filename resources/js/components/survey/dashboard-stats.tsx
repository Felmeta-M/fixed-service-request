import { AlertCircle, CheckCircle, FileText, XCircle } from 'lucide-react';

interface DashboardStatsProps {
    stats: {
        total: number;
        // pending: number;
        waiting: number;
        completed: number;
        cancelled: number;
        subscribed: number;
    };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
    const statCards = [
        {
            label: 'Total Surveys',
            value: stats.total,
            icon: FileText,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
        },
        // {
        //     label: 'Pending',
        //     value: stats.pending,
        //     icon: Clock,
        //     color: 'bg-yellow-500',
        //     bgColor: 'bg-yellow-50',
        //     textColor: 'text-yellow-700',
        // },
        {
            label: 'Waiting',
            value: stats.waiting,
            icon: AlertCircle,
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700',
        },
        {
            label: 'Completed',
            value: stats.completed,
            icon: CheckCircle,
            color: 'bg-primary',
            bgColor: 'bg-primary/10',
            textColor: 'text-primary',
        },
        // {
        //     label: 'Subscribed',
        //     value: stats.subscribed,
        //     icon: CheckCircle,
        //     color: 'bg-emerald-500',
        //     bgColor: 'bg-emerald-50',
        //     textColor: 'text-emerald-700',
        // },
        {
            label: 'Cancelled',
            value: stats.cancelled,
            icon: XCircle,
            color: 'bg-red-500',
            bgColor: 'bg-red-50',
            textColor: 'text-red-700',
        },
    ];

    return (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center">
                        <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
