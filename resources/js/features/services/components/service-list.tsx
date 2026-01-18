import SurveyTable from '@/features/surveys/components/survey-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { AlertCircle, FileText } from 'lucide-react';
import { useEffect } from 'react';
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
    console.log('🚀 ~ ServiceList ~ error:', error);
    console.log('🚀 ~ ServiceList ~ surveys:', surveys);

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
            <Card>
                <CardContent className="p-6 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">No services found</h3>
                    <p className="mb-4 text-gray-600">Get started by creating your first service request to manage your telecom services.</p>
                    <Link href="/services/create">
                        <Button>Create Your First Service</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
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
