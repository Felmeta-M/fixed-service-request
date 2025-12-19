import { PaymentSummary } from '@/components/payment/payment-summary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { delay } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { CheckCircle, Loader2, Wifi } from 'lucide-react';
import { useState } from 'react';

interface ReviewSubmitStepProps {
    formData: any;
    onBack: () => void;
    onNext?: (survey: any) => void;
}

const serviceTypes = {
    '1457567289': { name: 'Fixed Broadband', icon: Wifi, color: 'blue' },
    '1207609454': { name: 'Fixed Voice', icon: Wifi, color: 'green' },
    '180427974': { name: 'Combo Services', icon: Wifi, color: 'purple' },
};

export function ReviewSubmitStep({ formData, onBack, onNext }: ReviewSubmitStepProps) {
    const { user } = usePage().props.auth;
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [surveyData, setSurveyData] = useState<any>(null);

    const serviceInfo = serviceTypes[formData.serviceType as keyof typeof serviceTypes];
    const isPaymentService = formData.serviceType !== '1457567289';

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

    const calculateServiceFees = async (serviceNumber: string, surveyId: string) => {
        const response = await fetch('/api/v1/calc-one-off-fee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.api_token}`,
            },
            body: JSON.stringify({
                customer_survey_order_id: String(surveyId),
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
                    offering_id: formData.serviceType || '1207609454',
                    network_type: 4,
                    sub_type: 0,
                },
            }),
        });

        const result = await response.json();
        console.log('calc-one-off-fee result', result);

        if (!result.success) {
            const errorMsg = result.message || 'Failed to calculate fees';
            throw new Error(errorMsg);
        }

        return result.data;
    };

    const handleSurveyRequest = async () => {
        const submitData = {
            customer_code: user.customer_code.toString(),
            survey_type: 'EIC08',
            telecom_region: '104',
            oper_type: 'A',
            main_offer_id: formData.serviceType,
            survey_address_info: {
                region_city: '2',
                subcity_zone: '11',
                wereda_town: '141',
                kebele: '',
                latitude: formData.latitude,
                longitude: formData.longitude,
                address: formData.address || '',
            },
            bandwidth: formData.bandwidth,
            contact_person: formData.contactPerson,
            contact_no: formData.contactNo || user.phone_number,
            contact_email: formData.contactEmail || user.email,
            completed_date: new Date()
                .toISOString()
                .replace(/[-:T.Z]/g, '')
                .slice(0, 14),
            external_operid: '512',
            customer_type: formData.customerType || 'residential',
        };
        const response = await axios.post('/api/v1/survey/create', submitData, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.api_token}`,
            },
        });

        const isSurveySuccess = response.data.success && response.data.data?.original?.success !== false;

        if (!isSurveySuccess) {
            const errorMsg = response.data.data?.original?.message || response.data.message || 'Failed to create service request';
            throw new Error(errorMsg);
        }

        return response;
    };
    
    const handleSubscribe = async (surveyId: string) => {
        const [first_name, middle_name, last_name] = (user?.name ?? '').split(' ');

        const payload = {
            offering_id: formData.serviceType,
            survey_order_id: surveyId,
            customer_code: user.customer_code,
            first_name,
            middle_name,
            last_name,
            enterprise_name: user.enterprise_name ?? 'Test Enterprise',
            region: 'Addis Ababa', //TODO: replaced by actual data
            city: 'Addis Ababa',
            zone: 'Central',
            wereda: '01',
            kebele: '01',
            house_no: '123',
            sms_no: "251911234567",
            external_operid: '512', //Todo: figure it out
            completed_date: new Date()
                .toISOString()
                .replace(/[-:T.Z]/g, '')
                .slice(0, 14),
        };
        console.log("🚀 ~ handleSubscribe ~ payload:", payload)

        const response = await axios.post('/api/v1/services/subscription', payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.api_token}`,
            },
        });

        const result = response.data;
        console.log('subscription result', result);

        if (!result.success) {
            throw new Error(result.message || 'Subscriber creation failed');
        }

        return result;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');

        try {
            // 1. Create Survey
            const response = await handleSurveyRequest();
            console.log('🚀 ~ handleSubmit ~ response:', response);

            const responseData = response.data.data;

            const { customer_survey_order_id: surveyId } = responseData;

            const newSurvey = {
                id: surveyId,
                type: serviceInfo?.name || 'Service Request',
                status: 'waiting',
                createdAt: new Date().toISOString(),
                // customerCode,
                main_offer_id: formData.serviceType,
            };

            // Save to local storage
            const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
            existingSurveys.push(newSurvey);
            localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));

            setSurveyData(newSurvey);

            // 2. Proceed to Subscription or Payment
            if (isPaymentService) {
                // Payment Flow
                try {
                    const availableNumbers = await fetchAvailableNumbers();
                    const serviceNumber = availableNumbers[0]?.ServiceNumber;
                    if (!serviceNumber) throw new Error('No service numbers available at the moment. Please try again later.');

                    const feeData = await calculateServiceFees(serviceNumber, surveyId);

                    setPaymentDetails({
                        data: feeData.payment_record,
                        serviceNumber,
                        feeData,
                    });

                    setSubmitting(false);
                    return;
                } catch (payErr: any) {
                    console.error('Payment setup failed:', payErr);
                    setError(payErr.message || 'Failed to setup payment. Please try again.');
                    setSubmitting(false);
                    return;
                }
            } else {
                // Subscription Flow
                try {
                    await delay(15000)
                    await handleSubscribe(surveyId);

                    router.visit('/services');
                } catch (subError: any) {
                    console.error('Subscription failed:', subError, subError?.response?.data);
                    setError(
                        subError.response?.data?.message ||
                        subError.message ||
                        'Survey created, but subscription failed. Please try again from the dashboard.',
                    );
                    setSubmitting(false);
                }
            }
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to submit service request');
            setSubmitting(false);
        }
    };

    if (paymentDetails) {
        return (
            <div className="space-y-6">
                <PaymentSummary paymentDetails={paymentDetails} surveyDetails={surveyData} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Review Summary */}
            <div className="3xl:grid-cols-3 grid grid-cols-1 gap-6 lg:grid-cols-1">
                {/* Service Details (match Resource Details layout) */}
                <Card>
                    <CardContent>
                        <h3 className="mb-4 font-semibold text-gray-900">Service Details</h3>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                                <span className="text-sm text-gray-600">Service Type</span>
                                <p className="font-semibold">{serviceInfo?.name}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Bandwidth</span>
                                <p className="font-semibold">{formData.bandwidth || '-'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Customer Type</span>
                                <p className="font-semibold capitalize">{formData.customerType || 'residential'}</p>
                            </div>
                            {/*<div>*/}
                            {/*    <span className="text-sm text-gray-600">Main Offer ID</span>*/}
                            {/*    <p className="font-semibold">{formData.serviceType || '-'}</p>*/}
                            {/*</div>*/}
                        </div>
                    </CardContent>
                </Card>

                {/* Location Details (match Resource Details layout) */}
                <Card>
                    <CardContent>
                        <h3 className="mb-4 font-semibold text-gray-900">Location</h3>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {/*<div>*/}
                            {/*    <span className="text-sm text-gray-600">Latitude</span>*/}
                            {/*    <p className="font-mono font-semibold">{formData.latitude.toFixed(6)}</p>*/}
                            {/*</div>*/}
                            {/*<div>*/}
                            {/*    <span className="text-sm text-gray-600">Longitude</span>*/}
                            {/*    <p className="font-mono font-semibold">{formData.longitude.toFixed(6)}</p>*/}
                            {/*</div>*/}
                            <div>
                                <span className="text-sm text-gray-600">Resource</span>
                                <p className="font-semibold">
                                    <Badge className={formData.resourceAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {formData.resourceAvailable ? 'Available' : 'Not Available'}
                                    </Badge>
                                </p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Address</span>
                                {/*<p className="font-semibold">{formData.address || '-'}</p>*/}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Details (match Resource Details layout) */}
                <Card>
                    <CardContent>
                        <h3 className="mb-4 font-semibold text-gray-900">Contact</h3>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                                <span className="text-sm text-gray-600">Contact Person</span>
                                <p className="font-semibold">{formData.contactPerson || 'Customer'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Phone</span>
                                <p className="font-semibold">{formData.contactNo || '-'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Email</span>
                                <p className="font-semibold">{formData.contactEmail || '-'}</p>
                            </div>
                            {/*<div>*/}
                            {/*    <span className="text-sm text-gray-600">Preferred</span>*/}
                            {/*    <p className="font-semibold">{formData.contactPreferred || '-'}</p>*/}
                            {/*</div>*/}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resource Details */}
            {/*{formData.resourceData && (*/}
            {/*    <Card>*/}
            {/*        <CardContent>*/}
            {/*            <h3 className="mb-4 font-semibold text-gray-900">Resource Details</h3>*/}
            {/*            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">*/}
            {/*                <div>*/}
            {/*                    <span className="text-sm text-gray-600">Available Ports</span>*/}
            {/*                    <p className="font-semibold">{formData.resourceData.ava_port}</p>*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <span className="text-sm text-gray-600">Distance</span>*/}
            {/*                    <p className="font-semibold">{formData.resourceData.distance}m</p>*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <span className="text-sm text-gray-600">Node ID</span>*/}
            {/*                    <p className="font-semibold">{formData.resourceData.neid}</p>*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <span className="text-sm text-gray-600">Technology</span>*/}
            {/*                    <p className="font-semibold">{formData.resourceData.cable_type_desc}</p>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}
            {/*)}*/}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Submit Actions */}
            <div className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={onBack} disabled={submitting}>
                    Back
                </Button>

                <Button onClick={handleSubmit} disabled={submitting || !formData.resourceAvailable} className="bg-primary hover:bg-primary/80">
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {formData.serviceType === '1457567289' ? 'Subscribe' : 'Pay'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
