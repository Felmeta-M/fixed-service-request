import SurveyTable from '@/features/surveys/components/survey-table';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

function NoServicesIcon() {
    return (
        <svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto" aria-hidden>
            {/* Two full lines */}
            <line x1="6" y1="9" x2="42" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400" />
            <line x1="6" y1="17" x2="42" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400" />
            {/* Two half lines and chevron arranged horizontally */}
            <line x1="6" y1="25" x2="20" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400" />
            <line x1="6" y1="33" x2="20" y2="33" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400" />
            {/* Upward chevron (^) to the right of the half lines */}
            <path d="M30 34L36 24L42 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="text-gray-800" />
        </svg>
    );
}
interface ServiceListProps {
    surveys: any[];
    loading: boolean;
    error: string | null;
    onSurveyUpdate: () => void;
    globalFilter: string;
    typeFilter: string;
    statusFilter: string;
}

export function ServiceList({ surveys, loading, error, onSurveyUpdate, globalFilter, typeFilter, statusFilter }: ServiceListProps) {
    // Note: Initial data fetch happens automatically via useSurveyList() in parent.
    // Do NOT call onSurveyUpdate() on mount - it causes TDZ errors with TanStack Query context.

    if (loading) {
        return (
            <Card className="overflow-hidden rounded-xl border border-gray-400 bg-white py-8 shadow-none">
                <CardContent className="p-6">
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="overflow-hidden rounded-xl border border-gray-400 bg-white py-8 shadow-none">
                <CardContent className="p-6">
                    <div className="flex items-center space-x-3 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <div>
                            <p className="font-medium">Error loading services</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (surveys.length === 0) {
        return (
            <Card className="overflow-hidden rounded-xl border border-gray-400 bg-white py-8 shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <h3 className="mb-2 text-lg font-bold text-gray-900">No services found</h3>
                    <p className="mb-6 text-sm text-gray-500">
                        Get started by creating your first service request to manage your telecom services.
                    </p>
                    <NoServicesIcon />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 w-full max-w-full overflow-x-hidden">
            <SurveyTable
                surveys={surveys}
                loading={loading}
                onSurveyUpdate={onSurveyUpdate}
                globalFilter={globalFilter}
                typeFilter={typeFilter}
                statusFilter={statusFilter}
            />
        </div>
    );
}
