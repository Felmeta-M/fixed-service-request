import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePage } from '@inertiajs/react';
import { Clock, CreditCard, MapPin, Package, Phone, Shield, User, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

// interface PaymentSummaryProps {
//     customerSurveyOrderId: string;
//     surveyData: any;
//     subscriberData: any;
//     serviceNumber: string;
//     feeData: any;
//     customerData: any;
//     onPaymentConfirm: () => void;
//     loading?: boolean;
// }

const serviceTypeMap = {
    '1943913918': { label: 'Internet Service', icon: Wifi, color: 'text-blue-600' },
    '1207609454': { label: 'Voice Service', icon: Phone, color: 'text-purple-600' },
    '180427974': { label: 'Combo Service', icon: Package, color: 'text-green-600' },
};

export function PaymentSummary({
    paymentDetails,
    surveyDetails,
}: any) {
    const { user } = usePage().props.auth;

    const [loading, setLoading] = useState(false)

    const { main_offer_id } = surveyDetails

    const serviceType = serviceTypeMap[main_offer_id]

    const ServiceIcon = serviceType.icon;

    const { customer_survey_order_id, service_number, amount } = paymentDetails.data ?? 0;
    const totalAmount = Number(amount).toFixed(2);
    const baseAmount = 0;
    const cableCost = 0;

    // const getCustomerInfo = () => {
    //     if (!customerData) return { name: 'N/A', phone: 'N/A' };

    //     const customer = customerData;
    //     const contact = customerData.phone;
    //     const customer_code = customerData.customer_code;

    //     return {
    //         name: `${customer.name || ''} ${customer.name || ''} ${customer.name || ''}`.trim(),
    //         phone: contact || 'N/A',
    //         email: contact?.email || 'N/A',
    //         customer_code: customer_code || 'N/A',
    //     };
    // };

    // const getAddressInfo = () => {
    //     if (!customerData?.addresses?.[0]) return 'N/A';

    //     const address = customerData.addresses[0];
    //     return `${address.address1 || ''} ${address.address2 || ''} ${address.address3 || ''} ${address.address4 || ''}`.trim();
    // };

    // const customerInfo = getCustomerInfo();
    // const addressInfo = getAddressInfo();

    // useEffect(() => {
    //     if (customerSurveyOrderId) {
    //         handleFetchPayment()
    //     }
    // }, [customerSurveyOrderId]);


    // const handleFetchPayment = async () => {
    //     setLoading(true);

    //     try {
    //         const response = await fetch('/api/v1/payment', {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 Authorization: `Bearer ${user.api_token}`,

    //             },
    //             body: JSON.stringify({
    //                 customerSurveyOrderId,
    //             }),
    //         });

    //         const result = await response.json();
    //         console.log(result);
    //         if (result.success && result.rawRequest) {
    //             window.location.href = result.rawRequest;
    //         } else {
    //             throw new Error(result.message || 'Failed to create payment order');
    //         }
    //     } catch (error) {
    //         console.error('Payment error:', error);
    //         alert('Failed to process payment. Please try again.');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const handleFetchPayment = async () => {

    // };

    const onPaymentConfirm = async () => {
        setLoading(true);

        try {
            const response = await fetch('/api/v1/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.api_token}`,
                },
                body: JSON.stringify({
                    customerSurveyOrderId: customer_survey_order_id,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.rawRequest) {
                window.location.href = result.rawRequest;
            } else {
                throw new Error(result.message || 'Failed to create payment order');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to process payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen py-6">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-4">
                {/* Header */}
                <div className="mb-2 text-start">
                    <h1 className="text-2xl font-bold text-gray-800">Complete Your Payment</h1>
                    <p className="text-lg text-gray-500">Review your order details and proceed to payment</p>
                </div>

                <div className="space-y-6">
                    {/* Customer Information Card */}
                    <Card className="border-none shadow-none">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Customer Information</CardTitle>
                                    <CardDescription>Your account details</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <DetailItem label="Full Name" value={user.name} />
                                <DetailItem label="Phone Number" value={user.phone} />
                                {/* <DetailItem label="Email" value={user.email} /> */}
                            </div>
                            {/* <div className="pt-2">
                                <DetailItem label="Installation Address" value={addressInfo} icon={<MapPin className="h-4 w-4" />} fullWidth />
                            </div> */}
                        </CardContent>
                    </Card>

                    {/* Service Details Card */}

                    <Card className="border-none shadow-none">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className={`rounded-lg bg-primary/10 p-2 ${serviceType.color}`}>
                                    <ServiceIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Service Details</CardTitle>
                                    <CardDescription>Your selected service configuration</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-3">
                                    <DetailItem label="Service Type" value={serviceType.label} icon={<ServiceIcon className="h-4 w-4" />} />
                                    <DetailItem label="Service Number" value={service_number} />
                                </div>
                                <div className="space-y-3">
                                    <DetailItem label="Subscription Type" value="New Connection" badge={{ variant: 'default', text: 'New' }} />
                                    <DetailItem label="Service request number" value={customer_survey_order_id} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Summary Card */}
                    <Card className="border-none shadow-none">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <CreditCard className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Payment Summary</CardTitle>
                                    <CardDescription>Breakdown of charges and fees</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Service Fees */}
                                {/* {feeData?.fees?.map((fee, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="font-medium text-gray-900">{fee.item_name}</span>
                                                <p className="text-sm text-gray-500">Service fee</p>
                                            </div>
                                            <span className="font-semibold text-gray-900">{parseInt(fee.calculated_fee) / 10000} ETB</span>
                                        </div>

                                        {parseInt(fee.discount_fee) > 0 && (
                                            <div className="ml-4 flex justify-between text-sm">
                                                <span className="text-green-600">Discount</span>
                                                <span className="text-green-600">-{parseInt(fee.discount_fee) / 10000} ETB</span>
                                            </div>
                                        )}

                                        {fee.taxes?.map((tax, taxIndex) => (
                                            <div key={taxIndex} className="ml-4 flex justify-between text-sm">
                                                <span className="text-gray-500">+ {tax.name}</span>
                                                <span className="text-gray-500">{parseInt(tax.amount) / 10000} ETB</span>
                                            </div>
                                        ))}
                                    </div>
                                ))} */}

                                {/* Cable Cost (if applicable) */}
                                {cableCost > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="font-medium text-gray-900">Cable Installation</span>
                                                <p className="text-sm text-gray-500">Physical cable installation cost</p>
                                            </div>
                                            <span className="font-semibold text-gray-900">{cableCost} ETB</span>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Total Amount */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                        <span className="text-2xl font-bold text-primary">{totalAmount} ETB</span>
                                    </div>

                                    {/* Breakdown summary */}
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Includes:</span>
                                        <span>
                                            Service fees: {baseAmount} ETB
                                            {cableCost > 0 ? ` + Cable: ${cableCost} ETB` : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Action */}
                    <div className="flex flex-col items-end gap-4 pt-4">
                        <Button
                            onClick={onPaymentConfirm}
                            disabled={loading}
                            className="w-fit bg-primary px-8 text-lg font-semibold hover:opacity-90"
                            size="lg"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Processing...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Pay {totalAmount} ETB with Telebirr
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({
    label,
    value,
    icon,
    highlight = false,
    fullWidth = false,
    badge,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    highlight?: boolean;
    fullWidth?: boolean;
    badge?: { variant: string; text: string };
}) {
    return (
        <div className={fullWidth ? 'col-span-full' : ''}>
            <label className="mb-1 block text-sm font-medium text-gray-600">{label}</label>
            <div className={`flex items-center gap-2 rounded-lg p-3 ${highlight ? 'border-2 border-primary/20 bg-primary/10' : 'bg-gray-50'}`}>
                {icon && <div className="text-gray-400">{icon}</div>}
                <span className={`flex-1 ${highlight ? 'font-semibold text-primary' : 'text-gray-900'}`}>{value}</span>
                {badge && (
                    <Badge variant={badge.variant as any} className="ml-2">
                        {badge.text}
                    </Badge>
                )}
            </div>
        </div>
    );
}

export default PaymentSummary;
