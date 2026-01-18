import SurveyDetail from '@/features/surveys/components/survey-detail';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { Link, usePage } from '@inertiajs/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { showSuccessToast } from '@/lib/toast-helpers';
import { useSurveyDetail } from '@/features/surveys/hooks/use-surveys';

type SurveyDetails = {
    customer_survey_order_id: string;
    customer_subscription_order_id?: string | null;
    customer_type?: string | null;
    survey_type?: string | null;
    main_offer_id: string;
    bandwidth?: string | null;
    status?: string | number | null;
    service_number?: string | null;
    created_at?: string;
    updated_at?: string;
    // Backend-provided action flags (single source of truth)
    is_paid?: boolean;
    can_pay?: boolean;
    can_subscribe?: boolean;
    can_change_offer?: boolean;
    can_cancel?: boolean;
};

type PaymentDetailsData = {
    status?: string;
    cable_charge?: string | number | null;
    subscription_fee?: string | number | null;
    device_price?: string | number | null;
    total_amount?: string | number | null;
    amount?: string | number | null;
    service_number?: string | null;
    customer_survey_order_id?: string;
    customer_subscription_order_id?: string | null;
};

type PaymentDetailsResource = { data: PaymentDetailsData } | null;

type ServiceShowProps = {
    customerSurveyOrderId: string;
};

export default function ServiceShowPage() {
    const { props, url } = usePage<ServiceShowProps>();
    const { customerSurveyOrderId } = props;

    // Extract order ID from URL query params if present, otherwise use route param
    const urlParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const subscriptionOrderId = urlParams.get('customer_subscription_order_id');
    const surveyOrderIdFromUrl = urlParams.get('customer_survey_order_id');
    
    // Priority: customer_subscription_order_id (from URL) > customer_survey_order_id (from URL) > route param
    const orderId = subscriptionOrderId || surveyOrderIdFromUrl || customerSurveyOrderId;
    const isSubscriptionOrderId = !!subscriptionOrderId;

    const surveyDetailQuery = useSurveyDetail(orderId, isSubscriptionOrderId);
    const loading = surveyDetailQuery.isLoading;
    const error = surveyDetailQuery.error?.message || null;

    const showSuccessToastsFromUrl = (rawUrl: string) => {
        const query = rawUrl.includes('?') ? rawUrl.split('?')[1] : '';
        const params = new URLSearchParams(query);

        if (params.get('created') === '1') {
            showSuccessToast('Service request created successfully');
        }

        if (params.get('subscribed') === '1') {
            showSuccessToast('Subscription completed successfully');
        }
    };

    useEffect(() => {
        showSuccessToastsFromUrl(url);
    }, [url]);

    const focus = (() => {
        const query = url.includes('?') ? url.split('?')[1] : '';
        const params = new URLSearchParams(query);
        const raw = params.get('focus');
        if (raw === 'payment' || raw === 'subscribe') return raw;
        return null;
    })();

    // Transform query data to component format
    const surveyDetails: SurveyDetails | null = surveyDetailQuery.data?.data
        ? {
            customer_survey_order_id: surveyDetailQuery.data.data.customer_survey_order_id,
            customer_subscription_order_id: surveyDetailQuery.data.data.customer_subscription_order_id,
            customer_type: surveyDetailQuery.data.data.customer_type,
            survey_type: surveyDetailQuery.data.data.survey_type,
            main_offer_id: surveyDetailQuery.data.data.main_offer_id,
            bandwidth: surveyDetailQuery.data.data.bandwidth,
            status: surveyDetailQuery.data.data.status,
            service_number: surveyDetailQuery.data.data.service_number,
            created_at: surveyDetailQuery.data.data.created_at,
            updated_at: surveyDetailQuery.data.data.updated_at,
            // Backend-provided action flags (single source of truth)
            is_paid: surveyDetailQuery.data.data.is_paid,
            can_pay: surveyDetailQuery.data.data.can_pay,
            can_subscribe: surveyDetailQuery.data.data.can_subscribe,
            can_change_offer: surveyDetailQuery.data.data.can_change_offer,
            can_cancel: surveyDetailQuery.data.data.can_cancel,
        }
        : null;

    // Normalize nested payment resource
    const paymentDetails: PaymentDetailsResource = surveyDetailQuery.data?.data?.payment
        ? { data: surveyDetailQuery.data.data.payment as PaymentDetailsData }
        : null;

    const fetchDetails = () => {
        surveyDetailQuery.refetch();
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="w-full px-4 py-6 lg:px-6">
                    <div className="flex min-h-[400px] flex-col items-center justify-center">
                        <RefreshCw className="mb-4 h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading service summary...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (error || !surveyDetails) {
        return (
            <MainLayout>
                <div className="w-full space-y-6 px-4 lg:px-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                <div>
                                    <p className="font-medium">Unable to load service</p>
                                    <p className="text-sm">{error || 'Service request not found.'}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Button variant="outline" onClick={fetchDetails} disabled={loading} className="gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Try Again
                                </Button>
                                <Link href="/services">
                                    <Button>Back to Services</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <SurveyDetail paymentDetails={paymentDetails} surveyDetails={surveyDetails} focus={focus ?? undefined} />
        </MainLayout>
    );
}
