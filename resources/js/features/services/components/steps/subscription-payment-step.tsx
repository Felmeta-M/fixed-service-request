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
        device_fee?: string | number | null;
        device_price?: string | number | null;
        total_amount?: string | number | null;
        amount?: string | number | null;
        customer_survey_order_id?: string;
        customer_subscription_order_id?: string | null;
        service_number?: string | null;
        payment_order_id?: string | null;
        merch_order_id?: string | null;
    };

    type SurveyDetails = {
        customer_survey_order_id?: string;
        customer_subscription_order_id?: string | null;
        customer_type?: string | null;
        survey_type?: string | null;
        main_offer_id?: string;
        bandwidth?: string | null;
        service_number?: string | null;
        cable_length?: string | number | null;
        cable_type?: string | null;
        lat?: string | number | null;
        long?: string | number | null;
        status?: string | number | null;
        created_at?: string;
        updated_at?: string;
        payment?: PaymentDetails | null;
        // Backend-provided action flags
        is_paid?: boolean;
        can_pay?: boolean;
        can_subscribe?: boolean;
        can_change_offer?: boolean;
        can_cancel?: boolean;
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
              customer_subscription_order_id: surveyDetailQuery.data.data.customer_subscription_order_id,
              customer_type: surveyDetailQuery.data.data.customer_type,
              survey_type: surveyDetailQuery.data.data.survey_type,
              main_offer_id: surveyDetailQuery.data.data.main_offer_id,
              bandwidth: surveyDetailQuery.data.data.bandwidth,
              service_number: surveyDetailQuery.data.data.service_number,
              cable_length: surveyDetailQuery.data.data.cable_length,
              cable_type: null,
              lat: null,
              long: null,
              status: surveyDetailQuery.data.data.status,
              created_at: surveyDetailQuery.data.data.created_at,
              updated_at: surveyDetailQuery.data.data.updated_at,
              payment: surveyDetailQuery.data.data.payment || null,
              // Backend-provided action flags
              is_paid: surveyDetailQuery.data.data.is_paid,
              can_pay: surveyDetailQuery.data.data.can_pay,
              can_subscribe: surveyDetailQuery.data.data.can_subscribe,
              can_change_offer: false, // Not applicable during creation flow
              can_cancel: false, // Cancel should be done from services list, not during creation
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
