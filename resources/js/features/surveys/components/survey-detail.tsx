import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getStatusInfo } from '@/lib/status-map';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertTriangle,
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
    Cable,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { showErrorToast, showSuccessToast, showLoadingToast } from '@/lib/toast-helpers';
import { type ServiceActionFocus } from '@/lib/service-action-rules';
import { useCreateSubscription, useCreatePaymentOrder, useCancelSurveyOrder, useChangePrimaryOffering } from '@/hooks/use-api-mutations';
import { BandwidthChangeDialog } from './bandwidth-change-dialog';
import { CancelConfirmationDialog } from './cancel-confirmation-dialog';
import { ManualSurveyDeviceSelection } from './manual-survey-device-selection';
import { ArrowUpToLineIcon, ArrowDownToLineIcon, X, ChevronRight } from 'lucide-react';
import { formatBandwidthLabel } from '@/hooks/use-bandwidth-options';

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
    fbb_service_number?: string | null;
    internet_account?: string | null;
    internet_password?: string | null;
    bandwidth?: string | null;
    cable_length?: string | number | null;
    cable_type?: number | string | null; // BSS param 50056: 0=copper, 1=fiber, 2=EPON, 3=GPON, 5=without survey
    media_type?: string | null; // BSS param 50005: PON (fiber) or COPPER, null if failed
    line_indicator?: number | null; // BSS param 50112: 0=same line, 1=separate line
    survey_failure_reason?: string | null; // Reason when survey failed (50005 = -1)
    survey_is_manual?: boolean; // True for manual surveys, false for auto surveys
    with_device?: boolean | null; // null for manual surveys before device selection
    status?: string | number | null;
    survey_type?: string | null;
    customer_type?: string | null;
    created_at?: string;
    updated_at?: string;
    is_paid?: boolean;
    can_continue?: boolean; // For manual surveys: can proceed to device selection
    can_pay?: boolean;
    can_subscribe?: boolean;
    can_change_offer?: boolean;
    can_cancel?: boolean;
    can_terminate?: boolean;
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
    device_fee?: string | number | null;
    payment_order_id?: string | null;
    merch_order_id?: string | null;
};

type PaymentDetailsResource = { data?: PaymentDetailsData } | null;

type SurveyDetailProps = {
    paymentDetails: PaymentDetailsResource;
    surveyDetails: SurveyDetails;
    focus?: ServiceActionFocus;
};

const INTERNET_OFFER_ID = '1457567289';
const COMBO_OFFER_ID = '180427974';

const serviceTypeMap = {
    [INTERNET_OFFER_ID]: { label: 'Internet', icon: Wifi, color: 'text-blue-600' },
    '1207609454': { label: 'Voice', icon: Phone, color: 'text-violet-600' },
    [COMBO_OFFER_ID]: { label: 'Combo', icon: Package, color: 'text-emerald-600' },
};

const surveyTypeMap = {
    EIC08: { label: 'New Connection', description: 'New service installation' },
};

// Cable type mapping from BSS param 50056
const cableTypeMap: Record<number, { label: string; description: string }> = {
    0: { label: 'Copper', description: 'Copper cable infrastructure' },
    1: { label: 'Fiber', description: 'Fiber optic cable' },
    2: { label: 'EPON', description: 'Ethernet Passive Optical Network' },
    3: { label: 'GPON', description: 'Gigabit Passive Optical Network' },
    5: { label: 'Without Survey', description: 'No physical survey required' },
};

// Media type mapping from BSS param 50005
const mediaTypeMap: Record<string, { label: string; description: string }> = {
    PON: { label: 'Fiber (PON)', description: 'Passive Optical Network - Fiber devices' },
    COPPER: { label: 'Copper', description: 'Copper cable - Copper devices' },
};

export function SurveyDetail({ paymentDetails, surveyDetails, focus }: SurveyDetailProps) {
    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;

    const createSubscriptionMutation = useCreateSubscription();
    const createPaymentOrderMutation = useCreatePaymentOrder();
    const cancelMutation = useCancelSurveyOrder();
    const changePrimaryOfferingMutation = useChangePrimaryOffering();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);
    const [openUpgradeDialog, setOpenUpgradeDialog] = useState(false);
    const [openDowngradeDialog, setOpenDowngradeDialog] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [isTerminateAction, setIsTerminateAction] = useState(false);
    const [showDeviceSelection, setShowDeviceSelection] = useState(false);

    const loading = createSubscriptionMutation.isPending || createPaymentOrderMutation.isPending || cancelMutation.isPending || changePrimaryOfferingMutation.isPending || isSubmitting;

    const payment = paymentDetails?.data;
    const customer_survey_order_id = payment?.customer_survey_order_id ?? surveyDetails?.customer_survey_order_id ?? '';
    const customer_subscription_order_id = payment?.customer_subscription_order_id ?? surveyDetails?.customer_subscription_order_id ?? null;
    const service_number = surveyDetails?.service_number ?? payment?.service_number ?? null;

    const amountRaw = payment?.amount ?? payment?.total_amount;
    const amount = Number(amountRaw);
    const totalAmountNumber = (amountRaw !== null && amountRaw !== undefined && Number.isFinite(amount)) ? amount : undefined;
    const totalAmount = (totalAmountNumber ?? 0).toFixed(2);
    const isFree = totalAmountNumber !== undefined && totalAmountNumber <= 0;

    const isPaid = surveyDetails?.is_paid ?? false;
    const canPay = surveyDetails?.can_pay ?? false;
    const canSubscribe = surveyDetails?.can_subscribe ?? false;
    const canChangeOffer = surveyDetails?.can_change_offer ?? false;
    const canCancel = surveyDetails?.can_cancel ?? false;
    const canTerminate = surveyDetails?.can_terminate ?? false;
    const isInternetOrCombo = surveyDetails?.main_offer_id === INTERNET_OFFER_ID || surveyDetails?.main_offer_id === COMBO_OFFER_ID;
    const canUpgradeDowngrade = canChangeOffer && isInternetOrCombo;

    // Manual survey completed - needs device selection before payment
    // Show "Continue" button when:
    // 1. It's a manual survey (survey_is_manual = true)
    // 2. Survey is completed (has media_type, no failure reason)
    // 3. No subscription order yet
    // 4. Device not selected yet (with_device is undefined/null)
    const isManualSurvey = surveyDetails?.survey_is_manual === true;
    // Use backend permission check for device selection (single source of truth)
    // can_continue: manual survey + completed + no subscription + no device selected + no failure
    const canContinue = surveyDetails?.can_continue ?? false;

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
    const deviceFee = toNumber(payment?.device_fee);
    const cableLengthRaw = surveyDetails?.cable_length;
    const cableLength = cableLengthRaw === null || cableLengthRaw === undefined || cableLengthRaw === '' ? null : String(cableLengthRaw);

    const hasPaymentItems = subscriptionFee > 0 || cableCharge > 0 || deviceFee > 0;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'PPp');
        } catch {
            return dateString;
        }
    };

    // Backend is single source of truth - bandwidth comes pre-formatted from API
    // However, we use formatBandwidthLabel as a safety layer for any legacy data
    const formatBandwidth = (bandwidth?: string | null) => {
        if (!bandwidth) return null;
        return formatBandwidthLabel(bandwidth);
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
            onError: (error: Error) => {
                isSubmittingRef.current = false;
                setIsSubmitting(false);
                showErrorToast(error.message || 'Subscription failed. Please try again.', {
                    id: subscribeToast,
                });
            },
        });
    };

    const handleCancel = (cancellationReason?: string) => {
        if (!cancellationReason) {
            showErrorToast('Please provide a reason for cancellation.');
            return;
        }

        const toastId = showLoadingToast('Processing cancellation...');

        cancelMutation.mutate(
            {
                customer_survey_order_id: customer_survey_order_id,
                cancel_reason: cancellationReason,
            },
            {
                onSuccess: () => {
                    showSuccessToast('Order cancelled successfully!', { id: toastId });
                    setOpenCancelDialog(false);
                    router.visit('/services');
                },
                onError: (error: Error) => {
                    // Show backend error message
                    showErrorToast(error.message || 'Cancellation failed. Please try again.', { id: toastId });
                },
            },
        );
    };

    const handleBandwidthChange = (bandwidth: string, mode: 'upgrade' | 'downgrade') => {
        if (!service_number) {
            showErrorToast('Service number is required for bandwidth change');
            return;
        }

        const toastId = showLoadingToast(`Processing ${mode}...`);

        changePrimaryOfferingMutation.mutate(
            {
                service_number: service_number,
                bandwidth: bandwidth,
            },
            {
                onSuccess: () => {
                    showSuccessToast(`Service ${mode} successful!`, {
                        id: toastId,
                        description: `Bandwidth changed to ${bandwidth}`,
                    });
                    if (mode === 'upgrade') {
                        setOpenUpgradeDialog(false);
                    } else {
                        setOpenDowngradeDialog(false);
                    }
                    router.reload();
                },
                onError: (error: Error) => {
                    showErrorToast(error.message || `${mode} failed. Please try again.`, { id: toastId });
                },
            },
        );
    };

    const bandwidthDisplay = formatBandwidth(surveyDetails?.bandwidth);

    // Show device selection screen for manual surveys
    if (showDeviceSelection && surveyDetails?.media_type && surveyDetails?.main_offer_id) {
        return (
            <div className="w-full space-y-4 px-4 py-4 lg:px-6">
                {/* Header with back button */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDeviceSelection(false)}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-semibold">Select Device</h2>
                        <p className="text-sm text-muted-foreground">
                            Choose a compatible device based on your {surveyDetails.media_type === 'PON' ? 'Fiber' : 'Copper'} infrastructure
                        </p>
                    </div>
                </div>

                <ManualSurveyDeviceSelection
                    surveyOrderId={customer_survey_order_id}
                    mainOfferId={surveyDetails.main_offer_id}
                    mediaType={surveyDetails.media_type}
                    onBack={() => setShowDeviceSelection(false)}
                    onSuccess={() => setShowDeviceSelection(false)}
                />
            </div>
        );
    }

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
                        <span className={`inline-flex items-center rounded-lg px-4 py-1.5 text-sm font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                        </span>
                    </div>
                </CardHeader>
            </Card>

            {/* Survey Failed Alert - Show when survey failed (50005 = -1) */}
            {surveyDetails?.survey_failure_reason && (
                <Card className="border-none shadow-md border-l-4 border-l-red-500 bg-red-50">
                    <CardContent className="py-5">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-red-100 p-3 shrink-0">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-lg text-red-800 mb-2">
                                    Survey Could Not Be Completed
                                </h4>
                                <p className="text-sm text-red-700 mb-3">
                                    {surveyDetails.survey_failure_reason}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Please contact our support team or submit a new service request.
                                </p>
                                <p className="text-xs text-gray-500 mt-3">
                                    Reference: {customer_survey_order_id}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Manual Survey Success - Device Selection Required Card */}
            {/* This is only for MANUAL surveys that completed successfully and need device selection */}
            {canContinue && (
                <Card className="border-none shadow-md bg-green-50 border-l-4 border-l-green-500">
                    <CardContent className="py-5">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-green-100 p-3 shrink-0">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-lg text-green-800 mb-2">
                                    Survey Completed
                                </h4>
                                <p className="text-sm text-green-700 mb-1">
                                    Your location supports <strong>{surveyDetails?.media_type === 'PON' ? 'Fiber' : 'Copper'}</strong> connection.
                                </p>
                                <p className="text-sm text-gray-600 mb-4">
                                    Please select a device to continue with your order.
                                </p>
                                <Button
                                    onClick={() => setShowDeviceSelection(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Package className="mr-2 h-4 w-4" />
                                    Continue
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                        {/* For Combo services, show both Voice and FBB numbers */}
                        {surveyDetails?.main_offer_id === COMBO_OFFER_ID ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Voice Number</span>
                                    <span className="flex items-center gap-2 font-medium">
                                        <Phone className="h-4 w-4 text-violet-500" />
                                        {service_number || <span className="text-muted-foreground">Awaiting</span>}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">FBB/Data Number</span>
                                    <span className="flex items-center gap-2 font-medium">
                                        <Wifi className="h-4 w-4 text-blue-500" />
                                        {surveyDetails?.fbb_service_number || <span className="text-muted-foreground">Awaiting</span>}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Service Number</span>
                                <span className="font-medium">
                                    {service_number || <span className="text-muted-foreground">Awaiting</span>}
                                </span>
                            </div>
                        )}
                        {/* Only show bandwidth for Internet and Combo services (not Voice) */}
                        {(surveyDetails?.main_offer_id === INTERNET_OFFER_ID || surveyDetails?.main_offer_id === COMBO_OFFER_ID) && (
                            <>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Bandwidth</span>
                                    <span className="flex items-center gap-2 font-medium">
                                        <Gauge className="h-4 w-4 text-muted-foreground" />
                                        {bandwidthDisplay || <span className="text-muted-foreground">Not available</span>}
                                    </span>
                                </div>
                            </>
                        )}
                        <Separator />
                        {surveyDetails?.with_device && (


                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Device</span>
                                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ${surveyDetails?.with_device
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {surveyDetails?.with_device ? (
                                        <>
                                            <Package className="h-3 w-3" />
                                            With Device
                                        </>
                                    ) : (
                                        'Without Device'
                                    )}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Infrastructure Info Card - Show media type and cable type */}
                {(surveyDetails?.media_type || surveyDetails?.cable_type !== null) && !surveyDetails?.survey_failure_reason && (
                    <Card className={`border-none shadow-xs ${canContinue ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Cable className="h-4 w-4 text-emerald-600" />
                                Infrastructure Details
                                {canContinue && (
                                    <Badge className="ml-2 bg-green-100 text-green-700 border-green-200">Survey Complete</Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {surveyDetails?.media_type && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Media Type</span>
                                    <Badge variant="outline" className={`${surveyDetails.media_type === 'PON' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {mediaTypeMap[surveyDetails.media_type]?.label || surveyDetails.media_type}
                                    </Badge>
                                </div>
                            )}
                            {surveyDetails?.media_type && surveyDetails.cable_type !== null && surveyDetails.cable_type !== undefined && (
                                <Separator />
                            )}
                            {surveyDetails.cable_type !== null && surveyDetails.cable_type !== undefined && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Cable Type</span>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                        {cableTypeMap[Number(surveyDetails.cable_type)]?.label || `Type ${surveyDetails.cable_type}`}
                                    </Badge>
                                </div>
                            )}
                            {surveyDetails.line_indicator !== null && surveyDetails.line_indicator !== undefined && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Installation</span>
                                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                            {surveyDetails.line_indicator === 0 ? 'Same Line' : 'Separate Line'}
                                        </Badge>
                                    </div>
                                </>
                            )}

                            {/* Continue button for manual surveys */}
                            {canContinue && (
                                <>
                                    <Separator className="my-4" />
                                    <div className="pt-2">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Select a device to continue with your order.
                                        </p>
                                        <Button
                                            onClick={() => setShowDeviceSelection(true)}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Package className="mr-2 h-4 w-4" />
                                            Continue
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Internet Credentials Card - Only for Data and Combo services after subscription */}
                {(surveyDetails?.main_offer_id === INTERNET_OFFER_ID || surveyDetails?.main_offer_id === COMBO_OFFER_ID) &&
                    surveyDetails?.internet_account && (
                        <Card className="border-none shadow-xs bg-gradient-to-br from-blue-50 to-cyan-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Wifi className="h-4 w-4 text-blue-600" />
                                    Default Internet Credentials
                                    <Badge variant="outline" className="ml-2 text-xs bg-white">For Device Config</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Username</span>
                                    <span className="font-mono font-medium text-blue-700 bg-white px-2 py-1 rounded">
                                        {surveyDetails.internet_account}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Password</span>
                                    <span className="font-mono font-medium text-blue-700 bg-white px-2 py-1 rounded">
                                        {surveyDetails.internet_password || '••••••••'}
                                    </span>
                                </div>
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs text-amber-800">
                                        <strong>Important:</strong> Use these credentials to configure your internet device/router.
                                        Keep them secure and do not share with others.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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

                {/* Payment Information - Invoice Style (only show if there's payment info) */}
                {hasPaymentItems && (
                    <Card className="border-none shadow-xs">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CreditCard className="h-4 w-4" />
                                    Payment Summary
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold ${payment?.status === 'Paid' ? 'bg-et-green text-white' : 'bg-et-yellow text-gray-900'}`}>
                                        {payment?.status || (isPaid ? 'Paid' : 'Pending')}
                                    </span>
                                    {payment?.merch_order_id && (
                                        <span className="rounded bg-muted px-2 py-1 text-xs font-medium">
                                            Invoice #{payment.merch_order_id}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Invoice Table */}
                            <div className="rounded-lg border bg-muted/30">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount (ETB)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {subscriptionFee > 0 && (
                                            <tr>
                                                <td className="px-4 py-3 text-sm">Subscription Fee</td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums">{subscriptionFee.toFixed(2)}</td>
                                            </tr>
                                        )}
                                        {cableCharge > 0 && (
                                            <tr>
                                                <td className="px-4 py-3 text-sm">
                                                    Cable Charge
                                                    {cableLength && <span className="ml-1 text-muted-foreground">({cableLength}m)</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums">{cableCharge.toFixed(2)}</td>
                                            </tr>
                                        )}
                                        {deviceFee > 0 && (
                                            <tr>
                                                <td className="px-4 py-3 text-sm">Device Fee</td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums">{deviceFee.toFixed(2)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 bg-muted/50">
                                            <td className="px-4 py-4 text-sm font-semibold">Total Amount</td>
                                            <td className="px-4 py-4 text-right text-lg font-bold text-primary tabular-nums">{totalAmount}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {payment?.payment_order_id && (
                                <p className="mt-3 text-center text-xs text-muted-foreground">
                                    Payment Reference: {payment.payment_order_id}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Action Section */}
            {(canPay || canSubscribe || canUpgradeDowngrade || canCancel || canTerminate) && (
                <>
                    <div ref={actionRef} />
                    <Card className={`border-none shadow-xs ${focusFlash ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                        <CardContent className="py-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-medium">
                                        {canSubscribe
                                            ? 'Ready to activate your service?'
                                            : canPay
                                                ? 'Complete payment to activate'
                                                : canUpgradeDowngrade
                                                    ? 'Manage your service'
                                                    : 'Actions'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {canSubscribe
                                            ? 'Click Subscribe to activate your service'
                                            : canPay
                                                ? `Amount due: ${totalAmount} ETB`
                                                : canUpgradeDowngrade
                                                    ? 'Upgrade or downgrade your bandwidth'
                                                    : 'Choose an action below'}
                                    </p>
                                </div>

                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                                    <Link href="/services">
                                        <Button variant="outline" className="w-full sm:w-auto">Back</Button>
                                    </Link>

                                    {canSubscribe && (
                                        <Button
                                            onClick={onSubscribeConfirm}
                                            disabled={loading || isSubmitting || !customer_survey_order_id}
                                            className={`w-full gap-2 sm:w-auto ${focusFlash && focusSafe === 'subscribe' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                        >
                                            {loading && createSubscriptionMutation.isPending ? (
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

                                    {canPay && (
                                        <Button
                                            onClick={onPaymentConfirm}
                                            disabled={loading || !customer_survey_order_id}
                                            size="lg"
                                            className={`w-full gap-2 sm:w-auto ${focusFlash && focusSafe === 'payment' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                        >
                                            {loading && createPaymentOrderMutation.isPending ? (
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

                                    {canUpgradeDowngrade && (
                                        <>
                                            <Button
                                                onClick={() => setOpenUpgradeDialog(true)}
                                                disabled={loading}
                                                variant="outline"
                                                className="w-full gap-2 sm:w-auto"
                                            >
                                                <ArrowUpToLineIcon className="h-4 w-4" />
                                                Upgrade
                                            </Button>
                                            <Button
                                                onClick={() => setOpenDowngradeDialog(true)}
                                                disabled={loading}
                                                variant="outline"
                                                className="w-full gap-2 sm:w-auto"
                                            >
                                                <ArrowDownToLineIcon className="h-4 w-4" />
                                                Downgrade
                                            </Button>
                                        </>
                                    )}

                                    {canCancel && (
                                        <Button
                                            onClick={() => { setIsTerminateAction(false); setOpenCancelDialog(true); }}
                                            disabled={loading}
                                            variant="destructive"
                                            className="w-full gap-2 sm:w-auto"
                                        >
                                            <X className="h-4 w-4" />
                                            Cancel
                                        </Button>
                                    )}

                                    {canTerminate && (
                                        <Button
                                            onClick={() => { setIsTerminateAction(true); setOpenCancelDialog(true); }}
                                            disabled={loading}
                                            variant="destructive"
                                            className="w-full gap-2 sm:w-auto"
                                        >
                                            <X className="h-4 w-4" />
                                            Terminate
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* No Actions Available */}
            {!canPay && !canSubscribe && !canUpgradeDowngrade && !canCancel && !canTerminate && (
                <div className="flex justify-center pt-4">
                    <Link href="/services">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                </div>
            )}

            {/* Dialogs */}
            <CancelConfirmationDialog
                open={openCancelDialog}
                onOpenChange={setOpenCancelDialog}
                onConfirm={handleCancel}
                loading={cancelMutation.isPending}
                title={isTerminateAction ? "Terminate Service" : "Cancel Survey Order"}
                description={isTerminateAction
                    ? "Are you sure you want to terminate this service? This action cannot be undone."
                    : "Are you sure you want to cancel this survey order? This action cannot be undone."
                }
                confirmText={cancelMutation.isPending ? (isTerminateAction ? 'Terminating...' : 'Cancelling...') : (isTerminateAction ? 'Yes, Terminate' : 'Yes, Cancel')}
                cancelText="No, Keep It"
            />

            <BandwidthChangeDialog
                open={openUpgradeDialog}
                onOpenChange={setOpenUpgradeDialog}
                onConfirm={(bandwidth) => handleBandwidthChange(bandwidth, 'upgrade')}
                loading={changePrimaryOfferingMutation.isPending}
                mode="upgrade"
                currentBandwidth={surveyDetails?.bandwidth ?? undefined}
                serviceNumber={service_number ?? ''}
            />

            <BandwidthChangeDialog
                open={openDowngradeDialog}
                onOpenChange={setOpenDowngradeDialog}
                onConfirm={(bandwidth) => handleBandwidthChange(bandwidth, 'downgrade')}
                loading={changePrimaryOfferingMutation.isPending}
                mode="downgrade"
                currentBandwidth={surveyDetails?.bandwidth ?? undefined}
                serviceNumber={service_number ?? ''}
            />
        </div>
    );
}

export default SurveyDetail;
// Backward compatibility alias
export { SurveyDetail as PaymentSummary };
