import { BroadbandIcon, ComboIcon } from '@/components/icons/service-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCancelSurveyOrder, useChangePrimaryOffering, useCreatePaymentOrder, useCreateSubscription } from '@/hooks/use-api-mutations';
import { formatBandwidthLabel } from '@/hooks/use-bandwidth-options';
import { useTranslation } from '@/hooks/use-translation';
import { type ServiceActionFocus } from '@/lib/service-action-rules';
import { getStatusInfo } from '@/lib/status-map';
import { showErrorToast, showLoadingToast, showSuccessToast } from '@/lib/toast-helpers';
import { useDialogStore } from '@/store/dialog-store';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertTriangle,
    ArrowDownToLineIcon,
    ArrowLeft,
    ArrowUpToLineIcon,
    Cable,
    CheckCircle2,
    CreditCard,
    FileText,
    Gauge,
    HandHelping,
    Hash,
    Mail,
    Package,
    Phone,
    User,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BandwidthChangeDialog } from './bandwidth-change-dialog';
import { CancelConfirmationDialog } from './cancel-confirmation-dialog';
import { ManualSurveyDeviceSelection } from './manual-survey-device-selection';

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
    voice_service_number?: string | null;
    data_service_number?: string | null;
    internet_account?: string | null;
    internet_password?: string | null;
    bandwidth?: string | null;
    cable_length?: string | number | null; // Total meters (BSS 2147)
    cable_length_chargeable?: number | null; // Meters over 500 (customer pays only for this)
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

type DeviceItem = {
    name: string;
    price: number;
    type: 'data' | 'voice';
};

type PaymentDetailsData = {
    customer_survey_order_id?: string;
    customer_subscription_order_id?: string | null;
    amount?: string | number | null;
    total_amount?: string | number | null;
    status?: string;
    cable_charge?: string | number | null;
    other_related_cost?: string | number | null; // Labour & material (BSS 1924)
    subscription_fee?: string | number | null;
    device_fee?: string | number | null;
    device_items?: DeviceItem[];
    payment_order_id?: string | null;
    merch_order_id?: string | null;
};

type PaymentDetailsResource = { data?: PaymentDetailsData } | null;

type SurveyDetailProps = {
    paymentDetails: PaymentDetailsResource;
    surveyDetails: SurveyDetails;
    focus?: ServiceActionFocus;
    /** If true, hides the header and back button (used when embedded in flow) */
    isInFlow?: boolean;
    /** Custom back handler for flow context */
    onBack?: () => void;
};

const INTERNET_OFFER_ID = '1457567289';
const COMBO_OFFER_ID = '102647257';

const serviceTypeMap = {
    [INTERNET_OFFER_ID]: { label: 'Internet', icon: BroadbandIcon, color: 'text-blue-600' },
    '1207609454': { label: 'Voice', icon: Phone, color: 'text-violet-600' },
    [COMBO_OFFER_ID]: { label: 'Combo', icon: ComboIcon, color: 'text-emerald-600' },
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
    5: { label: 'Pre-approved', description: 'No site assessment required' },
};

// Media type mapping from BSS param 50005
const mediaTypeMap: Record<string, { label: string; description: string }> = {
    PON: { label: 'Fiber (PON)', description: 'Passive Optical Network - Fiber devices' },
    COPPER: { label: 'Copper', description: 'Copper cable - Copper devices' },
};

export function SurveyDetail({ paymentDetails, surveyDetails, focus, isInFlow = false, onBack }: SurveyDetailProps) {
    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;
    const { t } = useTranslation();

    const createSubscriptionMutation = useCreateSubscription();
    const createPaymentOrderMutation = useCreatePaymentOrder();
    const cancelMutation = useCancelSurveyOrder();
    const changePrimaryOfferingMutation = useChangePrimaryOffering();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    // ── Zustand dialog store ──────────────────────────────────────────────
    const activeDialog = useDialogStore((s) => s.activeDialog);
    const openDialogAction = useDialogStore((s) => s.openDialog);
    const closeDialog = useDialogStore((s) => s.closeDialog);
    const isTerminateAction = useDialogStore((s) => s.isTerminateAction);
    const setIsTerminateAction = useDialogStore((s) => s.setIsTerminateAction);

    const openUpgradeDialog = activeDialog === 'upgrade';
    const openDowngradeDialog = activeDialog === 'downgrade';
    const openCancelDialog = activeDialog === 'cancel';

    const setOpenUpgradeDialog = (v: boolean) => v ? openDialogAction('upgrade') : closeDialog();
    const setOpenDowngradeDialog = (v: boolean) => v ? openDialogAction('downgrade') : closeDialog();
    const setOpenCancelDialog = (v: boolean) => v ? openDialogAction('cancel') : closeDialog();

    const [showDeviceSelection, setShowDeviceSelection] = useState(false);

    const loading =
        createSubscriptionMutation.isPending ||
        createPaymentOrderMutation.isPending ||
        cancelMutation.isPending ||
        changePrimaryOfferingMutation.isPending ||
        isSubmitting;

    const payment = paymentDetails?.data;
    const customer_survey_order_id = payment?.customer_survey_order_id ?? surveyDetails?.customer_survey_order_id ?? '';
    const customer_subscription_order_id = payment?.customer_subscription_order_id ?? surveyDetails?.customer_subscription_order_id ?? null;
    const voiceNumber = surveyDetails?.voice_service_number ?? null;
    const dataNumber = surveyDetails?.data_service_number ?? null;
    // Primary service number for API calls: Combo uses data line; Voice/Data use single line
    const primaryServiceNumber = surveyDetails?.main_offer_id === COMBO_OFFER_ID ? (dataNumber ?? voiceNumber) : (voiceNumber ?? dataNumber);

    const amountRaw = payment?.amount ?? payment?.total_amount;
    const amount = Number(amountRaw);
    const totalAmountNumber = amountRaw !== null && amountRaw !== undefined && Number.isFinite(amount) ? amount : undefined;
    const totalAmount = (totalAmountNumber ?? 0).toFixed(2);
    const isFree = totalAmountNumber !== undefined && totalAmountNumber <= 0;

    const isPaid = surveyDetails?.is_paid ?? false;
    const canPay = surveyDetails?.can_pay ?? false;
    const canSubscribe = surveyDetails?.can_subscribe ?? false;
    const canChangeOffer = surveyDetails?.can_change_offer ?? false;
    // Cancel button disabled on frontend per product requirement
    const canCancel = false;
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
    const otherRelatedCost = toNumber(payment?.other_related_cost);
    const deviceFee = toNumber(payment?.device_fee);
    // Chargeable length: meters over 500 (customer pays only for this); backend sends cable_length_chargeable
    const cableLengthChargeableRaw = surveyDetails?.cable_length_chargeable;
    const cableLengthChargeable =
        cableLengthChargeableRaw !== null && cableLengthChargeableRaw !== undefined && cableLengthChargeableRaw !== ''
            ? Number(cableLengthChargeableRaw)
            : (() => {
                  const total = surveyDetails?.cable_length != null ? Number(surveyDetails.cable_length) : NaN;
                  return Number.isFinite(total) && total > 500 ? Math.round((total - 500) * 100) / 100 : 0;
              })();

    const hasPaymentItems = subscriptionFee > 0 || cableCharge > 0 || otherRelatedCost > 0 || deviceFee > 0;

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
            },
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
        if (!primaryServiceNumber) {
            showErrorToast('Service number is required for bandwidth change');
            return;
        }

        const toastId = showLoadingToast(`Processing ${mode}...`);

        changePrimaryOfferingMutation.mutate(
            {
                service_number: primaryServiceNumber,
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

    const handleContinueClick = () => {
        if (!surveyDetails?.media_type) {
            showErrorToast('Infrastructure details missing. Please contact support.');
            return;
        }
        setShowDeviceSelection(true);
    };

    const bandwidthDisplay = formatBandwidth(surveyDetails?.bandwidth);

    // Show device selection screen for manual surveys
    if (showDeviceSelection && surveyDetails?.media_type && surveyDetails?.main_offer_id) {
        return (
            <div className="w-full space-y-4 px-4 py-4 lg:px-6">
                {/* Header with back button */}
                <div className="mb-6 flex items-center gap-4 text-[#068BCC]">
                    <Button variant="ghost" size="icon" onClick={() => setShowDeviceSelection(false)} className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4 text-[#068BCC]" />
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
        <div className="w-full max-w-full space-y-4 overflow-x-hidden px-2 py-2 sm:px-4 sm:py-4 lg:px-6">
            {/* Header - Only show when NOT in flow context */}
            {!isInFlow && (
                <div className="flex flex-col gap-2">
                    <Link href="/services" className="w-fit shrink-0 hover:text-[#068BCC]">
                        <Button variant="ghost" size="sm" className="h-9 gap-1 text-[#068BCC] hover:text-[#068BCC]">
                            <ArrowLeft className="h-4 w-4 shrink-0 text-[#068BCC]" />
                            <span className="hover:text-[#068BCC]">{t('common.back')}</span>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground sm:text-xl">Request Details</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">Review your service request information</p>
                    </div>
                </div>
            )}

            {/* Title Card */}
            <div className="w-full">
                <div className="">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                    serviceType.label === 'Internet' ? 'bg-primary' : serviceType.label === 'Voice' ? 'bg-primary' : 'bg-primary'
                                }`}
                            >
                                <HandHelping className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-lg sm:text-xl">{serviceType.label} Service</div>
                                <p className="truncate text-xs text-muted-foreground sm:text-sm">{surveyTypeInfo.label}</p>
                            </div>
                        </div>
                        <span
                            className={`inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-semibold sm:text-sm ${statusInfo.bg} ${statusInfo.text}`}
                        >
                            {statusInfo.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Request Failed Alert - Show when assessment failed (50005 = -1) */}
            {surveyDetails?.survey_failure_reason && (
                <div className="w-full">
                    <div className="sm:p-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="shrink-0 rounded-full bg-red-100 p-2 sm:p-3">
                                <AlertTriangle className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="mb-2 text-base font-semibold text-red-800 sm:text-lg">Request Could Not Be Processed</h4>
                                <p className="mb-3 text-sm break-words text-red-700">{surveyDetails.survey_failure_reason}</p>
                                <p className="text-xs text-gray-600 sm:text-sm">Please contact our support team or submit a new service request.</p>
                                <p className="mt-3 text-xs break-all text-gray-500">Reference: {customer_survey_order_id}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Ready - Device Selection Required Card */}
            {/* This is only for MANUAL surveys that completed successfully and need device selection */}
            {canContinue && (
                <div className="w-full">
                    <div className="sm:p-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="shrink-0 rounded-full bg-green-100 p-2 sm:p-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="mb-2 text-base font-semibold text-green-800 sm:text-lg">Assessment Complete</h4>
                                <p className="mb-1 text-sm text-green-700">
                                    Your location supports <strong>{surveyDetails?.media_type === 'PON' ? 'Fiber' : 'Copper'}</strong> connection.
                                </p>
                                <p className="mb-4 text-xs text-gray-600 sm:text-sm">Please select a device to continue with your order.</p>
                                <Button
                                    onClick={handleContinueClick}
                                    className="h-9 w-full bg-primary text-white hover:bg-primary/90 sm:h-10 sm:w-auto"
                                >
                                    <span>Continue</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                {/* Request Information */}
                <div className="w-full">
                    <div className="sm:p-4">
                        <div className="flex items-center gap-2 text-base sm:text-lg">
                            <Hash className="h-4 w-4 shrink-0 text-primary" />
                            <span>Request Information</span>
                        </div>
                    </div>
                    <div className="space-y-3 p-4 pt-0 sm:p-6">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground sm:text-sm">Request Number</span>
                            <span className="font-mono text-xs font-medium break-all sm:text-sm sm:break-normal">
                                {customer_survey_order_id || 'N/A'}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground sm:text-sm">Service Type</span>
                            <span className="flex items-center gap-2 text-xs font-medium sm:text-sm">
                                <ServiceIcon className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${serviceType.color}`} />
                                <span>{serviceType.label}</span>
                            </span>
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground sm:text-sm">Request Type</span>
                            <span className="text-xs font-medium sm:text-sm">{surveyTypeInfo.label}</span>
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground sm:text-sm">Processing Mode</span>
                            <Badge
                                variant="outline"
                                className={`w-fit text-xs ${
                                    isManualSurvey ? 'border-et-blue bg-et-blue/10 text-et-blue' : 'border-primary bg-primary/10 text-primary'
                                }`}
                            >
                                {isManualSurvey ? 'Manual' : 'Auto'}
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground sm:text-sm">Created</span>
                            <span className="text-xs font-medium break-words sm:text-sm">{formatDate(surveyDetails?.created_at)}</span>
                        </div>
                        {surveyDetails?.updated_at && surveyDetails.updated_at !== surveyDetails.created_at && (
                            <>
                                <Separator />
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-xs text-muted-foreground sm:text-sm">Last Updated</span>
                                    <span className="text-xs font-medium break-words sm:text-sm">{formatDate(surveyDetails?.updated_at)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Subscription Information */}
                <div className="w-full">
                    <div className="sm:p-4">
                        <div className="flex items-center gap-2 text-base sm:text-lg">
                            <Zap className="h-4 w-4 shrink-0 text-primary" />
                            <span>Subscription Information</span>
                        </div>
                    </div>
                    <div className="space-y-3 sm:p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground sm:text-sm">Order Number</span>
                            <span className="font-mono text-xs font-medium break-all sm:text-sm sm:break-normal">
                                {customer_subscription_order_id || <span className="text-muted-foreground">—</span>}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground sm:text-sm">Voice Service Number</span>
                            <span className="flex items-center gap-2 text-xs font-medium sm:text-sm">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-violet-500 sm:h-4 sm:w-4" />
                                <span className="break-all sm:break-normal">{voiceNumber || <span className="text-muted-foreground">—</span>}</span>
                            </span>
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground sm:text-sm">Data Service Number</span>
                            <span className="flex items-center gap-2 text-xs font-medium sm:text-sm">
                                <BroadbandIcon className="h-3.5 w-3.5 shrink-0 text-blue-500 sm:h-4 sm:w-4" />
                                <span className="break-all sm:break-normal">{dataNumber || <span className="text-muted-foreground">—</span>}</span>
                            </span>
                        </div>
                        {/* Only show bandwidth for Internet and Combo services (not Voice) */}
                        {(surveyDetails?.main_offer_id === INTERNET_OFFER_ID || surveyDetails?.main_offer_id === COMBO_OFFER_ID) && (
                            <>
                                <Separator />
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-xs text-muted-foreground sm:text-sm">Bandwidth</span>
                                    <span className="flex items-center gap-2 text-xs font-medium sm:text-sm">
                                        <Gauge className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                                        <span>{bandwidthDisplay || <span className="text-muted-foreground">Not available</span>}</span>
                                    </span>
                                </div>
                            </>
                        )}
                        <Separator />
                        {surveyDetails?.with_device !== undefined && (
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-xs text-muted-foreground sm:text-sm">Device</span>
                                <span
                                    className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ${
                                        surveyDetails?.with_device ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    {surveyDetails?.with_device ? (
                                        <>
                                            <Package className="h-3 w-3 shrink-0" />
                                            <span>With Device</span>
                                        </>
                                    ) : (
                                        <span>Without Device</span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Infrastructure Info Card - Show media type and cable type */}
                {(surveyDetails?.media_type || surveyDetails?.cable_type !== null) && !surveyDetails?.survey_failure_reason && (
                    <div className={`w-full ${canContinue ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : ''}`}>
                        <div className="sm:p-4">
                            <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                                <Cable className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span>Infrastructure Details</span>
                                {canContinue && <Badge className="ml-auto border-green-200 bg-green-100 text-xs text-green-700 sm:ml-2">Ready</Badge>}
                            </div>
                        </div>
                        <div className="space-y-3 sm:p-4">
                            {surveyDetails?.media_type && (
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-xs text-muted-foreground sm:text-sm">Media Type</span>
                                    <Badge
                                        variant="outline"
                                        className={`w-fit text-xs ${surveyDetails.media_type === 'PON' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
                                    >
                                        {mediaTypeMap[surveyDetails.media_type]?.label || surveyDetails.media_type}
                                    </Badge>
                                </div>
                            )}
                            {surveyDetails?.media_type && surveyDetails.cable_type !== null && surveyDetails.cable_type !== undefined && (
                                <Separator />
                            )}
                            {surveyDetails.cable_type !== null && surveyDetails.cable_type !== undefined && (
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-xs text-muted-foreground sm:text-sm">Cable Type</span>
                                    <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                                        {cableTypeMap[Number(surveyDetails.cable_type)]?.label || `Type ${surveyDetails.cable_type}`}
                                    </Badge>
                                </div>
                            )}
                            {surveyDetails.line_indicator !== null && surveyDetails.line_indicator !== undefined && (
                                <>
                                    <Separator />
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <span className="text-xs text-muted-foreground sm:text-sm">Installation</span>
                                        <Badge variant="outline" className="w-fit border-gray-200 bg-gray-50 text-xs text-gray-700">
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
                                        <p className="mb-3 text-xs text-muted-foreground sm:text-sm">Select a device to continue with your order.</p>
                                        <Button
                                            onClick={handleContinueClick}
                                            className="h-9 w-full bg-primary text-white hover:bg-primary/90 sm:h-10"
                                        >
                                            <span>Continue</span>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Internet Credentials Card - Only for Data and Combo services after subscription */}
                {(surveyDetails?.main_offer_id === INTERNET_OFFER_ID || surveyDetails?.main_offer_id === COMBO_OFFER_ID) &&
                    surveyDetails?.internet_account && (
                        <div className="w-full bg-et-light-blue/10">
                            <div className="sm:p-4">
                                <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                                    <BroadbandIcon className="h-4 w-4 shrink-0 text-et-blue" />
                                    <span>Default Internet Credentials</span>
                                    <Badge variant="outline" className="ml-auto bg-white text-xs sm:ml-2">
                                        For Device Config
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-3 sm:p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-xs text-muted-foreground sm:text-sm">Username</span>
                                    <span className="rounded bg-white px-2 py-1 font-mono text-xs font-medium break-all text-blue-700 sm:text-sm sm:break-normal">
                                        {surveyDetails.internet_account}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-xs text-muted-foreground sm:text-sm">Password</span>
                                    <span className="rounded bg-white px-2 py-1 font-mono text-xs font-medium break-all text-blue-700 sm:text-sm sm:break-normal">
                                        {surveyDetails.internet_password || '••••••••'}
                                    </span>
                                </div>
                                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-xs break-words text-amber-800">
                                        <strong>Important:</strong> Use these credentials to configure your internet device/router. Keep them secure
                                        and do not share with others.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                {/* Customer Information */}
                <div className="w-full">
                    <div className="sm:p-4">
                        <div className="flex items-center gap-2 text-base sm:text-lg">
                            <User className="h-4 w-4 shrink-0 text-primary" />
                            <span>Customer Information</span>
                        </div>
                    </div>
                    <div className="space-y-3 sm:p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground sm:text-sm">Name</span>
                            <span className="text-xs font-medium break-words sm:text-sm">{user.name}</span>
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground sm:text-sm">Phone</span>
                            <span className="flex items-center gap-2 text-xs font-medium sm:text-sm">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                                <span className="break-all sm:break-normal">{user.phone}</span>
                            </span>
                        </div>
                        {user.email && (
                            <>
                                <Separator />
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-xs text-muted-foreground sm:text-sm">Email</span>
                                    <span className="flex items-center gap-2 text-xs font-medium sm:text-sm">
                                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                                        <span className="break-all sm:break-normal">{user.email}</span>
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Payment Information - Invoice Style (only show if there's payment info) */}
                {hasPaymentItems && (
                    <div className="w-full">
                        <div className="sm:p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 text-base sm:text-lg">
                                    <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                                    <span>Payment Summary</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold sm:px-3 sm:text-sm ${payment?.status === 'Paid' ? 'bg-et-green text-white' : 'bg-et-yellow text-gray-900'}`}
                                    >
                                        {payment?.status || (isPaid ? 'Paid' : 'Pending')}
                                    </span>
                                    {payment?.merch_order_id && (
                                        <span className="rounded bg-muted px-2 py-1 text-xs font-medium break-all sm:break-normal">
                                            Invoice #{payment.merch_order_id}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="sm:p-4">
                            {/* Invoice Table */}
                            <div className="overflow-x-auto rounded-lg border bg-muted/30">
                                <table className="w-full min-w-[300px]">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:px-4 sm:py-3">
                                                Description
                                            </th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:px-4 sm:py-3">
                                                Amount (ETB)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {subscriptionFee > 0 && (
                                            <tr>
                                                <td className="px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm">Subscription Fee</td>
                                                <td className="px-3 py-2 text-right text-xs font-medium tabular-nums sm:px-4 sm:py-3 sm:text-sm">
                                                    {subscriptionFee.toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                        {cableCharge > 0 && (
                                            <tr>
                                                <td className="px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm">
                                                    Cable Charge
                                                    {cableLengthChargeable > 0 && (
                                                        <span className="ml-1 text-muted-foreground">({cableLengthChargeable}m over 500m)</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right text-xs font-medium tabular-nums sm:px-4 sm:py-3 sm:text-sm">
                                                    {cableCharge.toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                        {otherRelatedCost > 0 && (
                                            <tr>
                                                <td className="px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm">Labour &amp; Material</td>
                                                <td className="px-3 py-2 text-right text-xs font-medium tabular-nums sm:px-4 sm:py-3 sm:text-sm">
                                                    {otherRelatedCost.toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                        {(() => {
                                            const deviceItems = payment?.device_items ?? [];
                                            if (deviceItems.length > 0) {
                                                return (
                                                    <>
                                                        {deviceItems.map((item, index) => (
                                                            <tr key={index}>
                                                                <td className="px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm">
                                                                    {item.type === 'voice' ? 'Voice device' : 'Data device'}
                                                                    {item.name ? ` — ${item.name}` : ''}
                                                                </td>
                                                                <td className="px-3 py-2 text-right text-xs font-medium tabular-nums sm:px-4 sm:py-3 sm:text-sm">
                                                                    {Number(item.price).toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr>
                                                            <td colSpan={2} className="px-3 py-1.5 text-xs text-muted-foreground sm:px-4">
                                                                Device prices include 15% VAT (VAS tax).
                                                            </td>
                                                        </tr>
                                                    </>
                                                );
                                            }
                                            if (deviceFee > 0) {
                                                return (
                                                    <>
                                                        <tr>
                                                            <td className="px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm">Device Fee</td>
                                                            <td className="px-3 py-2 text-right text-xs font-medium tabular-nums sm:px-4 sm:py-3 sm:text-sm">
                                                                {deviceFee.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan={2} className="px-3 py-1.5 text-xs text-muted-foreground sm:px-4">
                                                                Device prices include 15% VAT (VAS tax).
                                                            </td>
                                                        </tr>
                                                    </>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 bg-muted/50">
                                            <td className="px-3 py-3 text-xs font-semibold sm:px-4 sm:py-4 sm:text-sm">Total Amount</td>
                                            <td className="px-3 py-3 text-right text-base font-bold text-primary tabular-nums sm:px-4 sm:py-4 sm:text-lg">
                                                {totalAmount}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {payment?.payment_order_id && (
                                <p className="mt-3 text-center text-xs break-all text-muted-foreground">
                                    Payment Reference: {payment.payment_order_id}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Section */}
            {(canPay || canSubscribe || canUpgradeDowngrade || canCancel || canTerminate) && (
                <>
                    <div ref={actionRef} />
                    <div className={`border-none shadow-xs ${focusFlash ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                        <div className="sm:py-5">
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
                                    {!isInFlow ? (
                                        <Link href="/services">
                                            <Button variant="outline" className="flex items-center space-x-2 text-[#068BCC]">
                                                <ArrowLeft className="h-4 w-4 text-[#068BCC]" />
                                                <span>{t('common.back')}</span>
                                            </Button>
                                        </Link>
                                    ) : onBack ? (
                                        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2 text-[#068BCC]">
                                            <ArrowLeft className="h-4 w-4 text-[#068BCC]" />
                                            <span>{t('common.back')}</span>
                                        </Button>
                                    ) : null}

                                    {canSubscribe && (
                                        <Button
                                            onClick={onSubscribeConfirm}
                                            disabled={loading || isSubmitting || !customer_survey_order_id}
                                            className={`h-9 w-full gap-2 sm:h-10 sm:w-auto ${focusFlash && focusSafe === 'subscribe' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                        >
                                            {loading && createSubscriptionMutation.isPending ? (
                                                <>
                                                    <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    <span>{t('buttons.processing')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                    <span>{t('buttons.activate_service')}</span>
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {canPay && (
                                        <Button
                                            onClick={onPaymentConfirm}
                                            disabled={loading || !customer_survey_order_id}
                                            className={`h-9 w-full gap-2 sm:h-10 sm:w-auto ${focusFlash && focusSafe === 'payment' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                        >
                                            {loading && createPaymentOrderMutation.isPending ? (
                                                <>
                                                    <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    <span>{t('buttons.processing')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard className="h-4 w-4 shrink-0" />
                                                    <span>
                                                        {t('buttons.pay_now')} {totalAmount} ETB
                                                    </span>
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
                                                className="h-9 w-full gap-2 sm:h-10 sm:w-auto"
                                            >
                                                <ArrowUpToLineIcon className="h-4 w-4 shrink-0" />
                                                <span>{t('buttons.upgrade')}</span>
                                            </Button>
                                            <Button
                                                onClick={() => setOpenDowngradeDialog(true)}
                                                disabled={loading}
                                                variant="outline"
                                                className="h-9 w-full gap-2 sm:h-10 sm:w-auto"
                                            >
                                                <ArrowDownToLineIcon className="h-4 w-4 shrink-0" />
                                                <span>{t('buttons.downgrade')}</span>
                                            </Button>
                                        </>
                                    )}

                                    {canCancel && (
                                        <Button
                                            onClick={() => {
                                                setIsTerminateAction(false);
                                                setOpenCancelDialog(true);
                                            }}
                                            disabled={loading}
                                            variant="destructive"
                                            className="h-9 w-full gap-2 sm:h-10 sm:w-auto"
                                        >
                                            <X className="h-4 w-4 shrink-0" />
                                            <span>{t('common.cancel')}</span>
                                        </Button>
                                    )}

                                    {canTerminate && (
                                        <Button
                                            onClick={() => {
                                                setIsTerminateAction(true);
                                                setOpenCancelDialog(true);
                                            }}
                                            disabled={loading}
                                            variant="destructive"
                                            className="h-9 w-full gap-2 sm:h-10 sm:w-auto"
                                        >
                                            <X className="h-4 w-4 shrink-0" />
                                            <span>{t('buttons.terminate_service')}</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* No Actions Available */}
            {!canPay && !canSubscribe && !canUpgradeDowngrade && !canCancel && !canTerminate && (
                <div className="flex justify-center pt-4">
                    {!isInFlow ? (
                        <Link href="/services" className="w-full sm:w-auto">
                            <Button variant="outline" className="h-9 w-full gap-2 text-[#068BCC] sm:h-10 sm:w-auto">
                                <ArrowLeft className="h-4 w-4 shrink-0 text-[#068BCC]" />
                                <span>{t('common.back')}</span>
                            </Button>
                        </Link>
                    ) : onBack ? (
                        <Button variant="outline" onClick={onBack} className="h-9 w-full gap-2 text-[#068BCC] sm:h-10 sm:w-auto">
                            <ArrowLeft className="h-4 w-4 shrink-0 text-[#068BCC]" />
                            <span>{t('common.back')}</span>
                        </Button>
                    ) : null}
                </div>
            )}

            {/* Dialogs */}
            <CancelConfirmationDialog
                open={openCancelDialog}
                onOpenChange={setOpenCancelDialog}
                onConfirm={handleCancel}
                loading={cancelMutation.isPending}
                title={isTerminateAction ? 'Terminate Service' : 'Cancel Service Request'}
                description={
                    isTerminateAction
                        ? 'Are you sure you want to terminate this service? This action cannot be undone.'
                        : 'Are you sure you want to cancel this service request? This action cannot be undone.'
                }
                confirmText={
                    cancelMutation.isPending
                        ? isTerminateAction
                            ? 'Terminating...'
                            : 'Cancelling...'
                        : isTerminateAction
                          ? 'Yes, Terminate'
                          : 'Yes, Cancel'
                }
                cancelText="No, Keep It"
            />

            <BandwidthChangeDialog
                open={openUpgradeDialog}
                onOpenChange={setOpenUpgradeDialog}
                onConfirm={(bandwidth) => handleBandwidthChange(bandwidth, 'upgrade')}
                loading={changePrimaryOfferingMutation.isPending}
                mode="upgrade"
                currentBandwidth={surveyDetails?.bandwidth ?? undefined}
                serviceNumber={primaryServiceNumber ?? ''}
                customerType={surveyDetails?.customer_type === '1' || surveyDetails?.customer_type === 'enterprise' ? 'enterprise' : 'residential'}
            />

            <BandwidthChangeDialog
                open={openDowngradeDialog}
                onOpenChange={setOpenDowngradeDialog}
                onConfirm={(bandwidth) => handleBandwidthChange(bandwidth, 'downgrade')}
                loading={changePrimaryOfferingMutation.isPending}
                mode="downgrade"
                currentBandwidth={surveyDetails?.bandwidth ?? undefined}
                serviceNumber={primaryServiceNumber ?? ''}
                customerType={surveyDetails?.customer_type === '1' || surveyDetails?.customer_type === 'enterprise' ? 'enterprise' : 'residential'}
            />
        </div>
    );
}

export default SurveyDetail;
// Backward compatibility alias
export { SurveyDetail as PaymentSummary };
