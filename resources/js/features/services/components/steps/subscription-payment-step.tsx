import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SurveyDetail } from '@/features/surveys/components/survey-detail';
import { usePage } from '@inertiajs/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSurveyDetail } from '@/features/surveys/hooks/use-surveys';

interface SubscriptionPaymentStepProps {
    surveyId: string | null;
    onBack: () => void;
    onComplete: () => void;
}

export function SubscriptionPaymentStep({ surveyId, onBack, onComplete }: SubscriptionPaymentStepProps) {
    type AuthUser = {
        api_token: string;
    };

    type PaymentDetails = {
        status?: string;
        cable_charge?: string | number | null;
        subscription_fee?: string | number | null;
        device_price?: string | number | null;
        total_amount?: string | number | null;
        amount?: string | number | null;
        customer_survey_order_id?: string;
        service_number?: string | null;
    };

    type SurveyDetails = {
        customer_survey_order_id?: string;
        main_offer_id?: string;
        service_number?: string | null;
        cable_length?: string | number | null;
        cable_type?: string | null;
        lat?: string | number | null;
        long?: string | number | null;
        status?: string | number | null;
        payment?: PaymentDetails | null;
    };

    type SurveyApiResponse = {
        data?: SurveyDetails;
        message?: string;
    };

    const surveyDetailQuery = useSurveyDetail(surveyId || '');
    const loading = surveyDetailQuery.isLoading;
    const error = surveyDetailQuery.error?.message || null;

    // Transform query data to component format
    const surveyDetails: SurveyDetails | null = surveyDetailQuery.data?.data
        ? {
              customer_survey_order_id: surveyDetailQuery.data.data.customer_survey_order_id,
              main_offer_id: surveyDetailQuery.data.data.main_offer_id,
              service_number: surveyDetailQuery.data.data.service_number,
              cable_length: null,
              cable_type: null,
              lat: null,
              long: null,
              status: surveyDetailQuery.data.data.status,
              payment: surveyDetailQuery.data.data.payment || null,
          }
        : null;

    const paymentDetails: { data: PaymentDetails } | null = surveyDetailQuery.data?.data?.payment
        ? { data: surveyDetailQuery.data.data.payment as PaymentDetails }
        : null;

    const fetchDetails = () => {
        surveyDetailQuery.refetch();
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !surveyDetails) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center space-x-3 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <div>
                            <p className="font-medium">Error loading payment summary</p>
                            <p className="text-sm">{error || 'Unable to load summary.'}</p>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button variant="outline" onClick={fetchDetails} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                        <Button variant="outline" onClick={onBack}>
                            Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <SurveyDetail paymentDetails={paymentDetails} surveyDetails={surveyDetails} />
        </div>
    );
}
