import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getStatusInfo } from '@/lib/status-map';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    FileText,
    Gauge,
    Mail,
    Package,
    Phone,
    User,
    Wifi,
    Zap,
    Calendar,
    Hash,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { showErrorToast, showSuccessToast, showLoadingToast } from '@/lib/toast-helpers';
import { type ServiceActionFocus } from '@/lib/service-action-rules';
import { useCreateSubscription, useCreatePaymentOrder } from '@/hooks/use-api-mutations';

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
    customer_subscription_order_id?: string | null;
    main_offer_id?: string;
    service_number?: string | null;
    bandwidth?: string | null;
    cable_length?: string | number | null;
    cable_type?: string | null;
    status?: string | number | null;
    survey_type?: string | null;
    customer_type?: string | null;
    created_at?: string;
    updated_at?: string;
    is_paid?: boolean;
    can_pay?: boolean;
    can_subscribe?: boolean;
    can_cancel?: boolean;
};

type PaymentDetailsData = {
    customer_survey_order_id?: string;
    customer_subscription_order_id?: string | null;
    service_number?: string | null;
    amount?: string | number | null;
    total_amount?: string | number | null;
    status?: string;
    cable_charge?: string | number | null;
    subscription_fee?: string | number | null;
    device_price?: string | number | null;
};

type PaymentDetailsResource = { data?: PaymentDetailsData } | null;

type SurveyDetailProps = {
    paymentDetails: PaymentDetailsResource;
    surveyDetails: SurveyDetails;
    focus?: ServiceActionFocus;
};

const serviceTypeMap = {
    '1457567289': { label: 'Internet', icon: Wifi, color: 'text-blue-600' },
    '1207609454': { label: 'Voice', icon: Phone, color: 'text-violet-600' },
    '180427974': { label: 'Combo', icon: Package, color: 'text-emerald-600' },
};

const surveyTypeMap = {
    EIC08: { label: 'New Connection', description: 'New service installation' },
};

export function SurveyDetail({ paymentDetails, surveyDetails, focus }: SurveyDetailProps) {
    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;

    const createSubscriptionMutation = useCreateSubscription();
    const createPaymentOrderMutation = useCreatePaymentOrder();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    const loading = createSubscriptionMutation.isPending || createPaymentOrderMutation.isPending || isSubmitting;

    const payment = paymentDetails?.data;
    const customer_survey_order_id = payment?.customer_survey_order_id ?? surveyDetails?.customer_survey_order_id ?? '';
    const customer_subscription_order_id = payment?.customer_subscription_order_id ?? surveyDetails?.customer_subscription_order_id ?? null;
    const service_number = surveyDetails?.service_number ?? payment?.service_number ?? null;

    const amountRaw = payment?.amount ?? payment?.total_amount;
    const amount = Number(amountRaw);
    const totalAmountNumber = (amountRaw !== null && amountRaw !== undefined && Number.isFinite(amount)) ? amount : undefined;
    const totalAmount = (totalAmountNumber ?? 0).toFixed(2);
    const isFree = totalAmountNumber !== undefined && totalAmountNumber <= 0;

    const canPay = surveyDetails?.can_pay ?? false;
    const canSubscribe = surveyDetails?.can_subscribe ?? false;

    const statusInfo = getStatusInfo(surveyDetails?.status);

    const serviceType = serviceTypeMap[surveyDetails?.main_offer_id as keyof typeof serviceTypeMap] || {
        label: 'Service',
        icon: FileText,
        color: 'text-gray-600',
    };
    const ServiceIcon = serviceType.icon;

    const surveyTypeInfo = surveyTypeMap[surveyDetails?.survey_type as keyof typeof surveyTypeMap] || {
        label: surveyDetails?.survey_type || 'Request',
        description: 'Service request',
    };

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

    const hasPaymentItems = subscriptionFee > 0 || cableCharge > 0 || devicePrice > 0;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'PPp');
        } catch {
            return dateString;
        }
    };

    const formatBandwidth = (bandwidth?: string | null) => {
        if (!bandwidth) return null;
        if (bandwidth.endsWith('M')) {
            const mbps = parseInt(bandwidth);
            if (mbps >= 1000) {
                return `${(mbps / 1000).toFixed(mbps % 1000 === 0 ? 0 : 1)} Gbps`;
            }
            return `${mbps} Mbps`;
        }
        return bandwidth;
    };

    const getStatusBadgeVariant = (status?: string | number | null) => {
        const statusStr = String(status ?? '');
        if (['Survey Completed', 'Order Completed', 'Paid', 'Ready'].includes(statusStr)) {
            return 'default';
        }
        if (['Failed', 'Cancelled', 'Suspended'].includes(statusStr)) {
            return 'destructive';
        }
        return 'secondary';
    };

    const onPaymentConfirm = () => {
        if (!customer_survey_order_id || !user.customer_code || !totalAmountNumber) {
            showErrorToast('Missing required information for payment');
            return;
        }

        createPaymentOrderMutation.mutate(
            {
                customerSurveyOrderId: customer_survey_order_id,
                customerCode: user.customer_code,
                amount: totalAmountNumber,
            },
            {
                onSuccess: (result) => {
                    if ((result as any).rawRequest) {
                        window.location.href = (result as any).rawRequest;
                    } else {
                        showErrorToast('Payment order created but redirect URL not found');
                    }
                },
                onError: (error: Error) => {
                    showErrorToast(error.message || 'Failed to process payment. Please try again.');
                },
            }
        );
    };

    const onSubscribeConfirm = () => {
        if (isSubmittingRef.current || isSubmitting || createSubscriptionMutation.isPending) {
            return;
        }

        isSubmittingRef.current = true;
        setIsSubmitting(true);

        const subscribeToast = showLoadingToast('Processing subscription...');

        const payload = {
            offering_id: surveyDetails?.main_offer_id || '',
            survey_order_id: customer_survey_order_id.toString(),
            customer_code: String(user.customer_code),
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

        createSubscriptionMutation.mutate(payload, {
            onSuccess: () => {
                isSubmittingRef.current = false;
                setIsSubmitting(false);
                showSuccessToast('Subscription created successfully!', {
                    id: subscribeToast,
                    description: 'Your service subscription has been activated.',
                });
                router.visit('/services/subscription-success');
            },
            onError: () => {
                isSubmittingRef.current = false;
                setIsSubmitting(false);
                showErrorToast('Subscription failed. Please try again.', {
                    id: subscribeToast,
                });
            },
        });
    };

    const bandwidthDisplay = formatBandwidth(surveyDetails?.bandwidth);

    return (
        <div className="w-full space-y-4 px-4 py-4 lg:px-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/services">
                        <Button variant="ghost" size="sm" className="gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <p className="text-muted-foreground">
                        Survey Details
                    </p>
                </div>
            </div>

            {/* Title Card */}
            <Card className="border-none shadow-xs">
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${serviceType.label === 'Internet' ? 'from-blue-500 to-cyan-500' :
                                serviceType.label === 'Voice' ? 'from-violet-500 to-purple-500' :
                                    'from-emerald-500 to-teal-500'
                                }`}>
                                <ServiceIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">{serviceType.label} Service</CardTitle>
                                <p className="text-sm text-muted-foreground">{surveyTypeInfo.label}</p>
                            </div>
                        </div>
                        <Badge
                            variant={getStatusBadgeVariant(surveyDetails?.status) as 'default' | 'secondary' | 'destructive'}
                            className="w-fit"
                        >
                            {statusInfo.label}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                {/* Survey Information */}
                <Card className="border-none shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Hash className="h-4 w-4" />
                            Survey Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Survey Number</span>
                            <span className="font-mono font-medium">{customer_survey_order_id || 'N/A'}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Service Type</span>
                            <span className="flex items-center gap-2 font-medium">
                                <ServiceIcon className={`h-4 w-4 ${serviceType.color}`} />
                                {serviceType.label}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Request Type</span>
                            <span className="font-medium">{surveyTypeInfo.label}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Created</span>
                            <span className="font-medium">{formatDate(surveyDetails?.created_at)}</span>
                        </div>
                        {surveyDetails?.updated_at && surveyDetails.updated_at !== surveyDetails.created_at && (
                            <>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Last Updated</span>
                                    <span className="font-medium">{formatDate(surveyDetails?.updated_at)}</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Subscription Information */}
                <Card className="border-none shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Zap className="h-4 w-4" />
                            Subscription Information
                            {!customer_subscription_order_id && (
                                <Badge variant="outline" className="ml-auto text-xs">Pending</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Order Number</span>
                            <span className="font-mono font-medium">
                                {customer_subscription_order_id || <span className="text-muted-foreground">—</span>}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Service Number</span>
                            <span className="font-medium">
                                {service_number || <span className="text-muted-foreground">Awaiting</span>}
                            </span>
                        </div>
                        {bandwidthDisplay && (
                            <>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Bandwidth</span>
                                    <span className="flex items-center gap-2 font-medium">
                                        <Gauge className="h-4 w-4 text-muted-foreground" />
                                        {bandwidthDisplay}
                                    </span>
                                </div>
                            </>
                        )}
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <span className="font-medium">{statusInfo.label}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Information */}
                <Card className="border-none shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4" />
                            Customer Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Name</span>
                            <span className="font-medium">{user.name}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Phone</span>
                            <span className="flex items-center gap-2 font-medium">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {user.phone}
                            </span>
                        </div>
                        {user.email && (
                            <>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Email</span>
                                    <span className="flex items-center gap-2 font-medium">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        {user.email}
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Information - Only show if there are charges */}
                {!isFree && hasPaymentItems ? (
                    <Card className="border-none shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CreditCard className="h-4 w-4" />
                                Payment Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {subscriptionFee > 0 && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Subscription Fee</span>
                                        <span className="font-medium">{subscriptionFee.toFixed(2)} ETB</span>
                                    </div>
                                    <Separator />
                                </>
                            )}
                            {cableCharge > 0 && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Cable Installation{cableLength ? ` (${cableLength}m)` : ''}
                                        </span>
                                        <span className="font-medium">{cableCharge.toFixed(2)} ETB</span>
                                    </div>
                                    <Separator />
                                </>
                            )}
                            {devicePrice > 0 && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Device & Hardware</span>
                                        <span className="font-medium">{devicePrice.toFixed(2)} ETB</span>
                                    </div>
                                    <Separator />
                                </>
                            )}
                            <div className="flex justify-between pt-2">
                                <span className="font-semibold">Total Amount</span>
                                <span className="text-lg font-bold text-primary">{totalAmount} ETB</span>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-none shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CreditCard className="h-4 w-4" />
                                Payment Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/20">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                <div>
                                    <p className="font-medium text-emerald-800 dark:text-emerald-200">No Payment Required</p>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400">This service has no charges</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Action Section */}
            {(canPay || canSubscribe) && (
                <>
                    <div ref={actionRef} />
                    <Card className={`border-none shadow-xs ${focusFlash ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                        <CardContent className="py-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-medium">
                                        {canSubscribe && isFree
                                            ? 'Ready to activate your service?'
                                            : canPay && !isFree
                                                ? 'Complete payment to activate'
                                                : 'Next Steps'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {canSubscribe && isFree
                                            ? 'Click Subscribe to activate your service'
                                            : canPay && !isFree
                                                ? `Amount due: ${totalAmount} ETB`
                                                : 'Choose an action below'}
                                    </p>
                                </div>

                                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                                    <Link href="/services">
                                        <Button variant="outline" className="w-full sm:w-auto">Back to List</Button>
                                    </Link>

                                    {canSubscribe && isFree && (
                                        <Button
                                            onClick={onSubscribeConfirm}
                                            disabled={loading || isSubmitting || !customer_survey_order_id}
                                            className={`w-full gap-2 sm:w-auto ${focusFlash && focusSafe === 'subscribe' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    Subscribe
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {canPay && !isFree && (
                                        <Button
                                            onClick={onPaymentConfirm}
                                            disabled={loading || !customer_survey_order_id}
                                            size="lg"
                                            className={`w-full gap-2 sm:w-auto ${focusFlash && focusSafe === 'payment' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard className="h-5 w-5" />
                                                    Pay {totalAmount} ETB
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* No Actions Available */}
            {!canPay && !canSubscribe && (
                <div className="flex justify-center pt-4">
                    <Link href="/services">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Services
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default SurveyDetail;
// Backward compatibility alias
export { SurveyDetail as PaymentSummary };
