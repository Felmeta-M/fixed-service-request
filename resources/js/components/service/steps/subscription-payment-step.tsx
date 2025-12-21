import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentSummary } from '@/components/payment/payment-summary';
import { usePage } from '@inertiajs/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SubscriptionPaymentStepProps {
    surveyId: string | null;
    onBack: () => void;
    onComplete: () => void;
}

export function SubscriptionPaymentStep({ surveyId, onBack, onComplete }: SubscriptionPaymentStepProps) {
    type AuthUser = {
        api_token: string;
    };

    type SurveyApiResponse = {
        data?: {
            customer_survey_order_id?: string;
            main_offer_id?: string;
            service_number?: string | null;
            payment?: {
                status?: string;
                cable_charge?: string | number | null;
                subscription_fee?: string | number | null;
                device_price?: string | number | null;
                total_amount?: string | number | null;
            } | null;
        };
        message?: string;
    };

    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [surveyDetails, setSurveyDetails] = useState<any>(null);
    const [paymentDetails, setPaymentDetails] = useState<any>(null);

    const fetchDetails = async () => {
        if (!surveyId) {
            setError('Missing survey id. Please go back and try again.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/v1/survey-requests/show?customer_survey_order_id=${surveyId}`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.api_token}`,
                },
            });

            const result: SurveyApiResponse = await response.json().catch(() => ({} as SurveyApiResponse));

            if (!response.ok || !result.data) {
                throw new Error(result.message || `Failed to load summary (HTTP ${response.status})`);
            }

            setSurveyDetails(result.data);
            setPaymentDetails(result.data.payment ? { data: result.data.payment } : null);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to load summary';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [surveyId]);

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
            <PaymentSummary paymentDetails={paymentDetails} surveyDetails={surveyDetails} />
            <div className="flex justify-end">
                <Button variant="outline" onClick={onComplete}>
                    Done
                </Button>
            </div>
        </div>
    );
}
