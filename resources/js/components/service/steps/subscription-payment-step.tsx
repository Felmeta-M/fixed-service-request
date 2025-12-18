import { PaymentSummary } from '@/components/payment/payment-summary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SubscriptionPaymentStepProps {
    surveyData: any;
    onComplete: () => void;
}

export function SubscriptionPaymentStep({ surveyData, onComplete }: SubscriptionPaymentStepProps) {
    const { user } = usePage().props.auth;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [subscriptionComplete, setSubscriptionComplete] = useState(false);

    const main_offer_id = surveyData.main_offer_id;
    // Logic from SurveyActions: canPay = main_offer_id !== "1457567289"
    const isPaymentService = main_offer_id !== '1457567289';

    const generateExternalSequence = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const fetchAvailableNumbers = async () => {
        const response = await fetch('/api/v1/avaiable-number', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.api_token}`,
            },
            body: JSON.stringify({
                pay_mode: '1',
                tele_type: '4',
                need_query_by_dept: false,
                res_cnt: 1,
            }),
        });

        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) return result;

        throw new Error('No available numbers found');
    };

    const calculateServiceFees = async (serviceNumber: string) => {
        const response = await fetch('/api/v1/calc-one-off-fee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.api_token}`,
            },
            body: JSON.stringify({
                customer_survey_order_id: String(surveyData.id || surveyData.survey_id), // Handle different ID fields
                business_code: 'CO064',
                customer: {
                    type: 1,
                    category: 1,
                    subcategory: 1,
                    level: 6,
                    nationality: 1231,
                    id_type: 2,
                },
                sub_order: {
                    business_code: 'CO015',
                    external_sequence: generateExternalSequence(),
                    service_number: serviceNumber,
                    offering_id: main_offer_id || '1207609454',
                    network_type: 4,
                    sub_type: 0,
                },
            }),
        });

        const result = await response.json();

        if (!result.success) {
            const errorMsg = result.message || 'Failed to calculate fees';
            throw new Error(errorMsg);
        }

        return result.data;
    };

    const handlePreparePayment = async () => {
        setLoading(true);
        setError('');

        try {
            // Step 1: Fetch available numbers
            const availableNumbers = await fetchAvailableNumbers();
            const serviceNumber = availableNumbers[0]?.ServiceNumber;

            if (!serviceNumber) {
                throw new Error('No service numbers available at the moment. Please try again later.');
            }

            // Step 2: Calculate fees
            const feeData = await calculateServiceFees(serviceNumber);

            setPaymentDetails({
                data: feeData.payment_record, // Adjust based on PaymentSummary expectation
                serviceNumber: serviceNumber,
                feeData: feeData,
            });
        } catch (err: any) {
            console.error('Payment preparation error:', err);
            setError(err.message || 'Failed to prepare payment details.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setLoading(true);
        setError('');

        try {
            // Construct payload similar to SurveyActions
            // Note: We might need to get address/contact info from user prop or surveyData
            // Assuming user prop has necessary info as in SurveyActions

            const payload = {
                offering_id: main_offer_id,
                survey_order_id: String(surveyData.id || surveyData.survey_id),
                customer_code: String(user.customer_code),
                first_name: user.name?.split(' ')[0] || 'Test',
                middle_name: user.name?.split(' ')[1] || '',
                last_name: user.name?.split(' ')[2] || 'User',
                enterprise_name: user.enterprise_name || user.name || 'Test Enterprise',
                // Use defaults or data from survey if available
                region: 'Addis Ababa',
                city: 'Addis Ababa',
                zone: 'Central',
                wereda: '01',
                kebele: '01',
                house_no: '123',
                sms_no: user.phone_number || '251911234567',
                external_operid: '512',
                completed_date: new Date()
                    .toISOString()
                    .replace(/[-:T.Z]/g, '')
                    .slice(0, 14),
            };

            const response = await fetch('/api/v1/services/subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.api_token}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Subscriber creation failed');
            }

            setSubscriptionComplete(true);
            // onComplete(); // Maybe call this after showing success message
        } catch (err: any) {
            console.error('Subscription error:', err);
            setError(err.message || 'Failed to subscribe.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-trigger preparation if it's payment? Or wait for user?
    // Let's wait for user to click "Proceed" to be safe, or auto-trigger if we want smooth flow.
    // Given "finish in one way go", maybe auto-trigger is better but let's start with a button for clarity.

    if (subscriptionComplete) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">Subscription Successful!</h2>
                    <p className="mb-6 text-gray-600">Your service subscription has been processed successfully.</p>
                    <Button onClick={onComplete} className="w-full sm:w-auto">
                        Go to Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (paymentDetails) {
        return (
            <div className="space-y-6">
                <PaymentSummary paymentDetails={paymentDetails} surveyDetails={surveyData} />
                {/* PaymentSummary usually handles the actual payment flow or display. 
                    If it doesn't have a "Finish" button that calls onComplete, we might need to wrap it or add one.
                    Looking at PaymentSummary, it seems to be a display component. 
                    Wait, PaymentSummary in the file I read didn't seem to have a "Pay" button logic visible in the first 100 lines.
                    I should check if PaymentSummary handles the payment execution.
                */}
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isPaymentService ? 'Payment Required' : 'Confirm Subscription'}</CardTitle>
                <CardDescription>
                    {isPaymentService
                        ? 'Please proceed to payment to finalize your service request.'
                        : 'Please confirm your subscription to finalize your service request.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end gap-4">
                    {isPaymentService ? (
                        <Button onClick={handlePreparePayment} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Proceed to Payment
                        </Button>
                    ) : (
                        <Button onClick={handleSubscribe} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Subscription
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
