import SurveyDetailPage from '@/components/survey/survey-detail-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { Head, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSurveyDetail } from '@/hooks/use-surveys';

export default function SurveyShowPage() {
    const { surveyId, auth } = usePage().props;
    
    const surveyDetailQuery = useSurveyDetail(surveyId);
    const loading = surveyDetailQuery.isLoading;
    const error = surveyDetailQuery.error?.message || null;
    
    // Transform query data to component format
    const survey = surveyDetailQuery.data?.data || null;

    const handleBack = () => {
        window.history.back();
    };

    const handleRefresh = () => {
        surveyDetailQuery.refetch();
    };

    // Handle errors
    useEffect(() => {
        if (surveyDetailQuery.error) {
            toast.error('Error', {
                description: surveyDetailQuery.error.message || 'Could not load survey details.',
            });
        }
    }, [surveyDetailQuery.error]);

    return (
        <MainLayout>
            <Head title={`Service Request #${surveyId}`} />

            <div className="w-full px-4 py-6 lg:px-6">
                {loading ? (
                    <div className="flex min-h-[400px] flex-col items-center justify-center">
                        <RefreshCw className="mb-4 h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading service request details...</p>
                    </div>
                ) : error ? (
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center space-y-4 text-center">
                                <div className="flex items-center space-x-3 text-red-600">
                                    <AlertCircle className="h-8 w-8" />
                                    <div>
                                        <p className="text-lg font-medium">Error loading service request</p>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={handleRefresh} className="gap-2">
                                        <RefreshCw className="h-4 w-4" />
                                        Try Again
                                    </Button>
                                    <Button variant="default" onClick={handleBack} className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Go Back
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : survey ? (
                    <SurveyDetailPage 
                        survey={survey} 
                        onBack={handleBack} 
                        showBackButton={true} 
                        customerData={auth.user}
                        onSurveyUpdate={handleRefresh}
                    />
                ) : null}
            </div>
        </MainLayout>
    );
}
