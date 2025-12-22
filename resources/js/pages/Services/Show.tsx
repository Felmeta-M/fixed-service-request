import PaymentSummary from '@/components/payment/payment-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { Link, usePage } from '@inertiajs/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type SurveyDetails = {
    customer_survey_order_id: string;
    customer_type?: string | null;
    survey_type?: string | null;
    main_offer_id: string;
    bandwidth?: string | null;
    status?: string | number | null;
    service_number?: string | null;
    created_at?: string;
    updated_at?: string;
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
};

type PaymentDetailsResource = { data: PaymentDetailsData } | null;

type ServiceShowProps = {
    customerSurveyOrderId: string;
};

export default function ServiceShowPage() {
    const { props, url } = usePage<ServiceShowProps>();
    const { user } = usePage<{ auth: { user: { api_token: string } } }>().props.auth;
    const { customerSurveyOrderId } = props;

    const [surveyDetails, setSurveyDetails] = useState<SurveyDetails | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsResource>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const showSuccessToastsFromUrl = (rawUrl: string) => {
        const query = rawUrl.includes('?') ? rawUrl.split('?')[1] : '';
        const params = new URLSearchParams(query);

        if (params.get('created') === '1') {
            toast.success('Service request created successfully');
        }

        if (params.get('subscribed') === '1') {
            toast.success('Subscription completed successfully');
        }
    };

    useEffect(() => {
        showSuccessToastsFromUrl(url);

        fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerSurveyOrderId]);

    const focus = (() => {
        const query = url.includes('?') ? url.split('?')[1] : '';
        const params = new URLSearchParams(query);
        const raw = params.get('focus');
        if (raw === 'payment' || raw === 'subscribe') return raw;
        return null;
    })();

    const fetchDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/v1/survey-requests/show?customer_survey_order_id=${customerSurveyOrderId}`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.api_token}`,
                },
            });

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.data) {
                throw new Error(result?.message || `Failed to load service (HTTP ${response.status})`);
            }

            setSurveyDetails(result.data as SurveyDetails);

            // Normalize nested payment resource: API returns payment as plain object
            const payment = result.data?.payment ?? null;
            setPaymentDetails(payment ? { data: payment as PaymentDetailsData } : null);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to load service';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        showSuccessToastsFromUrl(url);
    }, [url]);

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
                                <Button variant="outline" onClick={fetchDetails} className="gap-2">
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
            <PaymentSummary paymentDetails={paymentDetails} surveyDetails={surveyDetails} focus={focus ?? undefined} />
        </MainLayout>
    );
}
