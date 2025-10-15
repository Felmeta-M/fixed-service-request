import { AlertCircle, CheckCircle, CheckCircle2, FileText, XCircle } from 'lucide-react';

interface SurveyStatusBadgeProps {
    status: string;
    size?: 'sm' | 'md' | 'lg';
}

export function SurveyStatusBadge({ status, size = 'md' }: SurveyStatusBadgeProps) {
    const statusConfig = {
        // pending: {
        //     color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        //     text: 'Pending',
        //     icon: Clock,
        // },
        waiting: {
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            text: 'Waiting',
            icon: AlertCircle,
        },
        // approved: {
        //     color: 'bg-purple-100 text-purple-800 border-purple-200',
        //     text: 'Approved',
        //     icon: CheckCircle,
        // },
        completed: {
            color: 'bg-green-100 text-green-800 border-green-200',
            text: 'Completed',
            icon: CheckCircle,
        },
        subscribed: {
            color: 'bg-purple-100 text-purple-800 border-purple-200',
            text: 'Subscribed',
            icon: CheckCircle2,
        },
        cancelled: {
            color: 'bg-red-100 text-red-800 border-red-200',
            text: 'Cancelled',
            icon: XCircle,
        },
        default: {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            text: 'Unknown',
            icon: FileText,
        },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.default;
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}>
            <Icon className="h-3 w-3" />
            {config.text}
        </span>
    );
}

export default SurveyStatusBadge;
