import SurveyTable from '@/features/surveys/components/survey-table';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

function NoServicesIcon() {
    return (
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto text-gray-500">
            <path d="M10 16h36M10 24h36M10 32h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 44L28 36L32 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

    useEffect(() => {
        onSurveyUpdate();
    }, []);

    if (loading) {
        return (
            <Card>
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
            <Card>
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
            <Card className="rounded-lg border border-gray-200 bg-white shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <h3 className="mb-2 text-xl font-bold text-gray-900">No services found</h3>
                    <p className="mb-8 max-w-sm text-sm text-gray-600">
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
