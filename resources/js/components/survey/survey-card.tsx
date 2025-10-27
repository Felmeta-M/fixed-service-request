import { Calendar } from 'lucide-react';
import SurveyActions from './survey-actions';
import SurveyStatusBadge from './survey-status-badge';

interface SurveyCardProps {
    survey: any;
    onUpdate: () => void;
    updating?: boolean;
    onUpdatingChange: (updating: boolean) => void;
}

export default function SurveyCard({ survey, onUpdate, updating, onUpdatingChange }: SurveyCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getServiceIcon = (main_offer_id: string) => {
        const serviceIcons: { [key: string]: string } = {
            Internet: '🌐',
            Voice: '📞',
            Combo: '📦',
            default: '📋',
        };

        const type = main_offer_id?.toLowerCase();
        if (type?.includes('1943913915')) return serviceIcons.Internet;
        if (type?.includes('1943913916')) return serviceIcons.Voice;
        if (type?.includes('1943913917')) return serviceIcons.Combo;
        return serviceIcons.default;
    };

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            waiting: 'from-blue-50 to-blue-100 border-blue-200',
            completed: 'from-green-50 to-green-100 border-green-200',
            subscribed: 'from-purple-50 to-purple-100 border-purple-200',
            cancelled: 'from-red-50 to-red-100 border-red-200',
            default: 'from-gray-50 to-gray-100 border-gray-200',
        };
        return colors[status?.toLowerCase()] || colors.default;
    };
    console.log('type', survey.main_offer_id);

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:shadow-lg ${getStatusColor(survey.status)} ${updating ? 'opacity-60' : ''}`}
        >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 text-2xl shadow-sm">
                        {getServiceIcon(survey.main_offer_id)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Order Number: {survey.customer_survey_order_id}</h3>
                        {/* <p className="text-sm font-medium text-gray-600">{survey.survey_type || 'New Service'}</p> */}
                        <p className="text-sm font-medium text-gray-600">{'New'}</p>
                    </div>
                </div>
                <SurveyStatusBadge status={survey.status} />
            </div>

            {/* Service Number for Subscribed Status */}
            {survey.status === 'subscribed' && survey.service_number && (
                <div className="mb-3 rounded-lg bg-white/80 p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Service Number:</span>
                        <span className="text-lg font-bold text-primary">{survey.service_number}</span>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-200/50 pt-4">
                <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Created at: {survey.created_at}</span>
                </div>
                <SurveyActions survey={survey} onActionComplete={onUpdate} onUpdatingChange={onUpdatingChange} />
            </div>
            {updating && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/50">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
            )}
        </div>
    );
}
