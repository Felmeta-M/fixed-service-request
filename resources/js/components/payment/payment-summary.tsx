import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, User, FileText, Phone, Mail, Calendar, Hash } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getServiceActionFlags, type ServiceActionFocus } from '@/lib/service-action-rules';


// type BadgeVariant = 'default' | 'success' | 'destructive' | 'outline';

type AuthUser = {
    api_token: string;
    customer_code: string | number;
    name: string;
    phone: string;
    email?: string;
    enterprise_name?: string;
};

type SurveyDetails = {
    customer_survey_order_id?: string;
    main_offer_id?: string;
    service_number?: string | null;
    cable_length?: string | number | null;
    cable_type?: string | null;
    status?: string | number | null;
};

type PaymentDetailsData = {
    customer_survey_order_id?: string;
    service_number?: string | null;
    amount?: string | number | null;
    total_amount?: string | number | null;
    status?: string;
    cable_charge?: string | number | null;
    subscription_fee?: string | number | null;
    device_price?: string | number | null;
};

type PaymentDetailsResource = { data?: PaymentDetailsData } | null;

type PaymentSummaryProps = {
    paymentDetails: PaymentDetailsResource;
    surveyDetails: SurveyDetails;
    focus?: ServiceActionFocus;
};

export function PaymentSummary({ paymentDetails, surveyDetails, focus }: PaymentSummaryProps) {
    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;

    const [loading, setLoading] = useState(false);

    const payment = paymentDetails?.data;
    const customer_survey_order_id = payment?.customer_survey_order_id ?? surveyDetails?.customer_survey_order_id ?? '';
    const service_number = surveyDetails?.service_number ?? payment?.service_number ?? '-';

    const amountRaw = payment?.amount ?? payment?.total_amount;
    const amount = Number(amountRaw);
    const totalAmountNumber = (amountRaw !== null && amountRaw !== undefined && Number.isFinite(amount)) ? amount : undefined;
    const totalAmount = (totalAmountNumber ?? 0).toFixed(2);
    const isFree = totalAmountNumber !== undefined && totalAmountNumber <= 0;

    const { canPay, canSubscribe } = getServiceActionFlags({
        status: surveyDetails?.status,
        mainOfferId: surveyDetails?.main_offer_id,
        totalAmount: totalAmountNumber,
    });

    const focusSafe = useMemo<ServiceActionFocus | null>(() => {
        if (focus === 'payment' || focus === 'subscribe') return focus;
        return null;
    }, [focus]);

    const actionRef = useRef<HTMLDivElement | null>(null);
    const [focusFlash, setFocusFlash] = useState(false);

    useEffect(() => {
        if (!focusSafe) return;

        setFocusFlash(true);
        const raf = requestAnimationFrame(() => {
            actionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        const t = window.setTimeout(() => setFocusFlash(false), 3000);

        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(t);
        };
    }, [focusSafe]);

    const toNumber = (value: unknown) => {
        const num = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(num) ? num : 0;
    };

    const subscriptionFee = toNumber(payment?.subscription_fee);
    const cableCharge = toNumber(payment?.cable_charge);
    const devicePrice = toNumber(payment?.device_price);
    const cableLengthRaw = surveyDetails?.cable_length;
    const cableLength = cableLengthRaw === null || cableLengthRaw === undefined || cableLengthRaw === '' ? null : String(cableLengthRaw);

    const onPaymentConfirm = async () => {
        setLoading(true);
        const t = toast.loading('Creating payment order...');

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
                toast.dismiss(t);
                window.location.href = result.rawRequest;
            } else {
                throw new Error(result.message || 'Failed to create payment order');
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to process payment. Please try again.', { id: t });
        } finally {
            setLoading(false);
            toast.dismiss(t);
        }
    };

    const onSubscribeConfirm = async () => {
        setLoading(true);
        const t = toast.loading('Creating subscription...');

        try {
            // const nameParts = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);
            // const first_name = nameParts[0] ?? '';
            // const middle_name = nameParts[1] ?? '';
            // const last_name = nameParts.slice(2).join(' ') ?? '';

            const payload = {
                offering_id: surveyDetails?.main_offer_id,
                survey_order_id: customer_survey_order_id.toString(),
                customer_code: user.customer_code,
                name: user.name ?? '',
                enterprise_name: user.enterprise_name ?? 'Test Enterprise',
                region: '',
                city: '',
                zone: '',
                wereda: '',
                kebele: '',
                house_no: '',
                sms_no: '',
                external_operid: '',
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

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(result?.message || `Subscription failed (HTTP ${response.status})`);
            }

            if (!result?.success) {
                throw new Error(result?.message || 'Subscription failed');
            }

            toast.success('Subscription created successfully!', { id: t });
            router.visit('/services/subscription-success');
        } catch (error) {
            console.error('Subscription error:', error);
            toast.error(error instanceof Error ? error.message : 'Subscription failed. Please try again.', { id: t });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4">
            <div className="mx-auto bg-white max-w-4xl px-4">
                {/* Invoice Header */}
                <div className="mb-2 rounded-lg bg-white pt-4 shadow-xs">
                    <div className="flex flex-col justify-between md:flex-row md:items-start">
                        <div>
                            <div className="mb-2 flex items-center gap-2">

                                <div>
                                    {/* <h1 className="text-2xl font-bold text-gray-900">Service and Payment Details</h1> */}
                                    <p className="text-lg font-bold">Order Summary & Payment Details</p>
                                </div>
                            </div>
                            {/* <div className="mt-4 space-y-2"> */}
                            {/* <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Date: {formattedDate}</span>
                                </div> */}
                            {/* <div className="flex items-center gap-2 text-sm">
                                    <Hash className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Order Id: {customer_survey_order_id || 'Pending'}</span>
                                </div> */}
                            {/* </div> */}
                        </div>
                        {/* <div className="mt-4 md:mt-0 md:text-right">
                            <Badge variant={isFree ? "outline" : "default"} className="mb-1">
                                {isFree ? "No Payment Required" : "Payment Required"}
                            </Badge>
                            <div className="text-3xl font-bold text-primary">{totalAmount} ETB</div>
                            <p className="text-sm text-gray-500">Total Amount</p>
                        </div> */}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Customer & Service Information */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Customer Information */}
                        <div className="border-none shadow-none pt-0">
                            <div className="">
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-gray-500" />
                                    <div className="text-lg">Customer Information</div>
                                </div>
                            </div>
                            <div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Name</p>
                                        <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-700">{user.phone}</span>
                                    </div>
                                    {user.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-700">{user.email}</span>
                                        </div>
                                    )}
                                    {/* <div>
                                        <p className="text-sm font-medium text-gray-500">Customer Code</p>
                                        <p className="font-mono text-gray-900">{user.customer_code}</p>
                                    </div> */}
                                </div>
                            </div>
                        </div>

                        {/* Service Information */}
                        <div className="border-none shadow-none pt-0">
                            <div className="">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    <div className="text-lg">Service Details</div>
                                </div>
                            </div>
                            <div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Service Number</p>
                                        <p className="text-lg font-semibold text-gray-900">{service_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Order Reference</p>
                                        <p className="font-mono text-gray-900">{customer_survey_order_id}</p>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                        <span className="text-sm text-gray-600">Service Type</span>
                                        <Badge variant="outline">New Connection</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Items Table */}
                    <div className="border-none shadow-none pt-0">
                        <div>
                            <div>Payment Details</div>
                            <div>Breakdown of charges and fees</div>
                        </div>
                        <div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="px-2  py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">FEE </th>
                                            <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">DESCRIPTION</th>
                                            <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">AMOUNT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {subscriptionFee > 0 && (
                                            <tr>
                                                <td className="px-4 py-4 text-xs sm:text-sm font-medium text-gray-900">Subscription</td>
                                                <td className="px-4 py-4 text-xs sm:text-sm text-gray-600">
                                                    Service subscription fee
                                                </td>
                                                <td className="px-4 py-4 text-xs sm:text-sm font-semibold text-gray-900">{subscriptionFee.toFixed(2)} ETB</td>
                                            </tr>
                                        )}
                                        {cableCharge > 0 && (
                                            <tr>
                                                <td className="px-4 py-4 text-xs sm:text-sm font-medium text-gray-900">Cable Installation</td>
                                                <td className="px-4 py-4 text-xs sm:text-sm text-gray-600">
                                                    Physical cable installation{cableLength ? ` (${cableLength} meters)` : ''}
                                                </td>
                                                <td className="px-4 py-4 text-xs sm:text-sm font-semibold text-gray-900">{cableCharge.toFixed(2)} ETB</td>
                                            </tr>
                                        )}
                                        {devicePrice > 0 && (
                                            <tr>
                                                <td className="px-4 py-4 text-xs sm:text-sm font-medium text-gray-900">Device</td>
                                                <td className="px-4 py-4 text-xs sm:text-sm text-gray-600">
                                                    Required device and hardware
                                                </td>
                                                <td className="px-4 py-4 text-xs sm:text-sm font-semibold text-gray-900">{devicePrice.toFixed(2)} ETB</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals Section */}
                            <div className=" space-y-3">
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                                    <span className="text-lg font-semibold text-gray-900">{totalAmount} ETB</span>
                                </div>

                                {/* {!isFree && (
                                    <>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Includes:</span>
                                            <span>
                                                {[
                                                    subscriptionFee > 0 && 'Subscription',
                                                    cableCharge > 0 && 'Cable Installation',
                                                    devicePrice > 0 && 'Device'
                                                ].filter(Boolean).join(', ')}
                                            </span>
                                        </div> */}
                                {/* <div className="rounded-lg bg-primary/5 p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900">Total Amount Due</p>
                                                    <p className="text-sm text-gray-600">Payment is required to activate service</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-primary">{totalAmount} ETB</div>
                                                    <p className="text-sm text-gray-500">Includes all applicable charges</p>
                                                </div>
                                            </div>
                                        </div> */}
                                {/* </>
                                )} */}
                            </div>
                        </div>
                    </div>

                    {/* Payment Action */}
                    <div ref={actionRef} />
                    <div className={`pt-0 border-none shadow-none ${focusFlash ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                        <div className="">
                            <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
                                {/* <div>
                                    <h3 className="font-semibold text-gray-900">Ready to proceed?</h3>
                                    <p className="text-sm text-gray-600">
                                        {isFree 
                                            ? 'Click subscribe to activate your service at no cost'
                                            : 'Complete payment to activate your service'}
                                    </p>
                                </div> */}
                                <div>
                                    <Link href="/services" className="text-sm text-gray-600 underline hover:text-gray-800">
                                        <Button variant="outline" className="gap-2">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>

                                <div className="flex gap-3">
                                    {/* {canSubscribe && isFree ? ( */}
                                    {canSubscribe ? (
                                        <Button
                                            onClick={onSubscribeConfirm}
                                            disabled={loading || !customer_survey_order_id}
                                            className={`hover:opacity-90 ${focusFlash && focusSafe === 'subscribe' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Processing...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    Subscribe
                                                </div>
                                            )}
                                        </Button>
                                    ) : null}

                                    {/* {canPay && !isFree ? ( */}
                                    {canPay ? (
                                        <Button
                                            onClick={onPaymentConfirm}
                                            disabled={loading || !customer_survey_order_id}
                                            className={`min-w-[220px] bg-primary px-8 font-semibold hover:opacity-90 ${focusFlash && focusSafe === 'payment' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                            size="lg"
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Processing...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {/* <img src={logo} alt="ID" className="mr-2 h-5 w-10" /> */}
                                                    Pay {totalAmount} ETB
                                                </div>
                                            )}
                                        </Button>
                                    ) : null}

                                    {!canPay && !canSubscribe ? (
                                        <div className="text-sm text-gray-600">No action required.</div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentSummary;