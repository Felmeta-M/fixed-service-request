import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCancelSurveyOrder, useChangePrimaryOffering, useCreateSubscription, useDeleteSurveyOrder } from '@/hooks/use-api-mutations';
import { useTranslation } from '@/hooks/use-translation';
import { showErrorToast, showLoadingToast, showSuccessToast } from '@/lib/toast-helpers';
import { router, usePage } from '@inertiajs/react';
import { ArrowDownToLineIcon, ArrowUpToLineIcon, ChevronRight, Eye, Loader2, MoreVertical, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BandwidthChangeDialog } from './bandwidth-change-dialog';
import { CancelConfirmationDialog } from './cancel-confirmation-dialog';
import DeleteConfirmationDialog from './delete-confirmation-dialog';
import SurveyDetailModal from './survey-detail-modal';

type Address = {
    address1?: string;
    address2?: string;
    address3?: string;
    address4?: string;
    address5?: string;
    address6?: string;
};

type Contact = {
    name1?: string;
    name2?: string;
    mobile?: string;
};
type SurveyRow = {
    customer_survey_order_id?: string;
    customer_subscription_order_id?: string | null;
    voice_service_number?: string | null;
    data_service_number?: string | null;
    main_offer_id?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
};

type AuthUser = {
    api_token: string;
    customer_code?: string | number;
    name?: string;
    phone?: string;
    email?: string;
    enterprise_name?: string;
    first_name?: string;
    addresses?: Address[];
    contacts?: Contact[];
    ext_params?: {
        PrimaryOfferId?: string;
        [key: string]: unknown;
    };
};

const INTERNET_OFFER_ID = '1457567289';
const COMBO_OFFER_ID = '102647257';

type Survey = {
    customer_survey_order_id?: string | number;
    customer_subscription_order_id?: string | null;
    status?: string | number | null;
    main_offer_id?: string;
    offering_id?: string;
    customer_code?: string | number;
    external_operid?: string;
    survey_is_manual?: boolean;
    voice_service_number?: string | null;
    data_service_number?: string | null;
    payment?: {
        total_amount?: number | string;
        status?: string;
    };
    // Backend-provided action flags (single source of truth)
    is_paid?: boolean;
    can_continue?: boolean; // For manual surveys: can proceed to device selection
    can_pay?: boolean;
    can_subscribe?: boolean;
    can_change_offer?: boolean;
    can_cancel?: boolean;
    can_terminate?: boolean;
    [key: string]: unknown;
};

interface SurveyActionsProps {
    survey: Survey;
    onActionComplete: () => void;
    onUpdatingChange: (updating: boolean) => void;
}

export default function SurveyActions({ survey, onActionComplete, onUpdatingChange }: SurveyActionsProps) {
    const { t } = useTranslation();
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openUpgradeDialog, setOpenUpgradeDialog] = useState(false);
    const [openDowngradeDialog, setOpenDowngradeDialog] = useState(false);
    const [isTerminateAction, setIsTerminateAction] = useState(false);
    const [error, setError] = useState('');
    const [customerData, setCustomerData] = useState<AuthUser | null>(null);
    const [openDetailModal, setOpenDetailModal] = useState(false);
    const [apiErrors, setApiErrors] = useState<{ [key: string]: string }>({});

    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;

    const cancelMutation = useCancelSurveyOrder();
    const deleteMutation = useDeleteSurveyOrder();
    const createSubscriptionMutation = useCreateSubscription();
    const changePrimaryOfferingMutation = useChangePrimaryOffering();

    // Track subscription submission to prevent double-clicks
    // Use state for button disabled (triggers re-render) + ref for immediate guard
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    const loading =
        cancelMutation.isPending ||
        deleteMutation.isPending ||
        createSubscriptionMutation.isPending ||
        changePrimaryOfferingMutation.isPending ||
        isSubmitting;

    const { main_offer_id } = survey;

    useEffect(() => {
        if (user) {
            setCustomerData(user);
        } else {
            setCustomerData(null);
        }
    }, [user]);

    const handleApiError = (result: unknown, context: string = '', toastId?: string | number) => {
        let errorMessage = 'An unexpected error occurred. Please try again.';

        const r = (typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : {}) as Record<string, unknown>;
        const original = typeof r.original === 'object' && r.original !== null ? (r.original as Record<string, unknown>) : null;

        if (original && original.success === false) {
            const msg = original.message;
            errorMessage = typeof msg === 'string' ? msg : 'Service subscription failed!';
        } else if (r.success === false) {
            const msg = r.message;
            errorMessage = typeof msg === 'string' ? msg : 'Operation failed!';
        } else if (typeof r.errors === 'object' && r.errors !== null) {
            const vals = Object.values(r.errors as Record<string, unknown>).filter((v): v is string => typeof v === 'string');
            errorMessage = vals.length ? vals.join(', ') : 'Validation failed!';
        } else if (typeof r.message === 'string') {
            errorMessage = r.message;
        }

        setError(errorMessage);
        setApiErrors((prev) => ({
            ...prev,
            [context]: errorMessage,
        }));

        // Show toast with bigger text
        showErrorToast(errorMessage, { id: toastId });

        return errorMessage;
    };

    const clearErrors = () => {
        setError('');
        setApiErrors({});
    };

    const handleCancel = (cancellationReason?: string) => {
        if (!cancellationReason) {
            const errorMsg = 'Please provide a reason for cancellation.';
            setError(errorMsg);
            showErrorToast(errorMsg);
            return;
        }

        onUpdatingChange(true);
        clearErrors();

        cancelMutation.mutate(
            {
                customer_survey_order_id: String(survey.customer_survey_order_id),
                cancel_reason: cancellationReason,
            },
            {
                onSuccess: () => {
                    onActionComplete();
                    setOpenCancelDialog(false);
                    onUpdatingChange(false);
                },
                onError: (error: Error) => {
                    handleApiError(error, 'cancellation');
                    onUpdatingChange(false);
                },
            },
        );
    };

    const handleDelete = () => {
        onUpdatingChange(true);
        clearErrors();

        deleteMutation.mutate(
            {
                customer_code: survey.customer_code!,
                customer_survey_order_id: survey.customer_survey_order_id!,
            },
            {
                onSuccess: () => {
                    onActionComplete();
                    setOpenDeleteDialog(false);
                    onUpdatingChange(false);
                },
                onError: (error: Error) => {
                    handleApiError(error, 'deletion');
                    onUpdatingChange(false);
                },
            },
        );
    };

    const handleUpgrade = () => {
        setOpenUpgradeDialog(true);
    };

    const handleDowngrade = () => {
        setOpenDowngradeDialog(true);
    };

    // For bandwidth change API: Combo uses data line; Voice/Data use single line
    const primaryServiceNumber = survey.main_offer_id === COMBO_OFFER_ID
        ? survey.data_service_number
        : (survey.voice_service_number ?? survey.data_service_number);

    const handleBandwidthChange = (bandwidth: string, mode: 'upgrade' | 'downgrade') => {
        const serviceNumber = primaryServiceNumber as string;
        if (!serviceNumber) {
            const errorMsg = 'Service number is required for bandwidth change';
            setError(errorMsg);
            showErrorToast(errorMsg);
            return;
        }

        onUpdatingChange(true);
        clearErrors();

        const toastId = showLoadingToast(`Processing ${mode}...`);

        changePrimaryOfferingMutation.mutate(
            {
                service_number: serviceNumber,
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
                    onActionComplete();
                    onUpdatingChange(false);
                },
                onError: (error: Error) => {
                    handleApiError(error, `${mode}_bandwidth`, toastId);
                    onUpdatingChange(false);
                },
            },
        );
    };

    const getAddressInfo = () => {
        if (!customerData?.addresses || customerData.addresses.length === 0) {
            return {
                region: 'Addis Ababa',
                city: 'Addis Ababa',
                zone: 'Central',
                wereda: '01',
                kebele: '01',
                house_no: '123',
            };
        }
        const address = customerData.addresses[0];
        return {
            region: address.address1 || 'Addis Ababa',
            city: address.address2 || 'Addis Ababa',
            zone: address.address3 || 'Central',
            wereda: address.address4 || '01',
            kebele: address.address5 || '01',
            house_no: address.address6 || '123',
        };
    };

    const getContactInfo = () => {
        if (!customerData?.contacts || customerData.contacts.length === 0) {
            return { name1: '', name2: '', mobile: '' };
        }
        const contact = customerData.contacts[0];
        return {
            name1: contact.name1 || '',
            name2: contact.name2 || '',
            mobile: contact.mobile || '',
        };
    };

    const getCustomerInfo = () => {
        if (!customerData) {
            return {
                name: '',
                // first_name: '',
                // middle_name: '',
                // last_name: 'User',
                enterprise_name: '',
            };
        }
        const customer = customerData;
        return {
            name: customer.name ?? '',
            // first_name: customer.name || 'Test',
            // middle_name: customer.name || '',
            // last_name: customer.name || 'User',
            enterprise_name: customer.enterprise_name || customer.first_name || '',
        };
    };

    // Use backend-provided action flags (single source of truth)
    // These flags are computed on the server based on business rules
    const canPay = survey.can_pay ?? false;
    const canSubscribe = survey.can_subscribe ?? false;
    const canChangeOffer = survey.can_change_offer ?? false;
    const canCancel = survey.can_cancel ?? false;
    const canTerminate = survey.can_terminate ?? false;

    // Upgrade/Downgrade is only available for Internet and Combo services
    const isInternetOrCombo = survey.main_offer_id === INTERNET_OFFER_ID || survey.main_offer_id === COMBO_OFFER_ID;
    const canUpgradeDowngrade = canChangeOffer && isInternetOrCombo;

    // Use backend's can_continue flag (single source of truth)
    // can_continue: manual survey + completed + no subscription + no device selected + no failure
    const canResume = survey.can_continue ?? false;
    const isManualSurvey = survey.survey_is_manual === true;

    const handleResume = () => {
        const surveyOrderId = survey.customer_survey_order_id;
        if (!surveyOrderId) return;
        router.visit(`/services/resume/${surveyOrderId}`);
    };

    const handleContinueManual = () => {
        if (canResume) {
            handleResume();
        } else {
            navigateToDetails();
        }
    };

    // Helper: Get primary order ID (customer_subscription_order_id for auto, customer_survey_order_id for manual)
    const getPrimaryOrderId = () => {
        return survey?.customer_subscription_order_id || survey?.customer_survey_order_id;
    };

    // Helper: Check if using subscription order ID
    const isSubscriptionOrderId = () => {
        return !!survey?.customer_subscription_order_id;
    };

    const navigateToDetails = (focus?: 'payment' | 'subscribe') => {
        const id = getPrimaryOrderId();
        if (!id) return;
        const q = focus ? `?focus=${focus}` : '';
        const orderIdParam = isSubscriptionOrderId() ? `customer_subscription_order_id=${id}` : `customer_survey_order_id=${id}`;
        router.visit(`/services/${id}?${orderIdParam}${focus ? `&focus=${focus}` : ''}`);
    };

    const onSubscribeClick = async () => {
        const id = survey?.customer_survey_order_id; // Still use customer_survey_order_id for subscription API
        if (!id) return;

        // Prevent double-click / duplicate submission using ref for immediate check
        if (isSubmittingRef.current || isSubmitting || createSubscriptionMutation.isPending || loading) {
            return;
        }

        // Set flags immediately to prevent concurrent calls (both state and ref)
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        onUpdatingChange(true);
        clearErrors();

        // Show loading toast when subscribe is clicked
        const subscribeToast = showLoadingToast('Processing subscription...');

        const addressInfo = getAddressInfo();
        const contactInfo = getContactInfo();
        const customerInfo = getCustomerInfo();

        const payload = {
            offering_id: survey.main_offer_id || survey.offering_id || customerData?.ext_params?.PrimaryOfferId || '',
            survey_order_id: String(survey.customer_survey_order_id),
            customer_code: String(survey.customer_code),
            name: customerInfo.name,
            enterprise_name: customerInfo.enterprise_name,
            region: addressInfo.region,
            city: addressInfo.city,
            zone: addressInfo.zone,
            wereda: addressInfo.wereda,
            kebele: addressInfo.kebele,
            house_no: addressInfo.house_no,
            sms_no: contactInfo.mobile, // to be confirmed
            external_operid: survey.external_operid || '512',
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
                onActionComplete();
                router.visit('/services/subscription-success');
                onUpdatingChange(false);
            },
            onError: (error: Error) => {
                isSubmittingRef.current = false;
                setIsSubmitting(false);
                // Always use English messages for toasts, ignore API response messages that might be in other languages
                setError('Subscription failed. Please try again.');
                showErrorToast('Subscription failed. Please try again.', { id: subscribeToast });
                onUpdatingChange(false);
            },
        });
    };
    const handleRowClick = (survey: SurveyRow) => {
        const id = survey?.customer_subscription_order_id || survey?.customer_survey_order_id;
        if (!id) return;
        const isSubscription = !!survey?.customer_subscription_order_id;
        const orderIdParam = isSubscription ? `customer_subscription_order_id=${id}` : `customer_survey_order_id=${id}`;
        router.visit(`/services/${id}?${orderIdParam}`);
    };

    // Determine the primary action for this row
    const getPrimaryAction = () => {
        if (canSubscribe) return 'activate';
        if (canPay) return 'pay';
        if (isManualSurvey && canResume) return 'continue';
        return null;
    };

    const primaryAction = getPrimaryAction();
    const hasDropdownActions = canUpgradeDowngrade || canCancel || canTerminate;

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                {/* Primary Action Button - Fixed width container for perfect alignment */}
                <div className="flex min-w-[120px] justify-end">
                    {primaryAction === 'activate' && (
                        <Button
                            onClick={onSubscribeClick}
                            disabled={loading || isSubmitting}
                            className="group relative h-8 w-full gap-1.5 overflow-hidden px-3 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md disabled:opacity-50"
                            size="sm"
                        >
                            {isSubmitting || createSubscriptionMutation.isPending ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>{t('buttons.subscribing')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('buttons.activate_service')}</span>
                                </>
                            )}
                        </Button>
                    )}
                    {primaryAction === 'pay' && (
                        <Button
                            onClick={() => navigateToDetails('payment')}
                            disabled={loading}
                            className="group h-8 w-full gap-1.5 px-3 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md disabled:opacity-50"
                            size="sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>{t('buttons.preparing')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('buttons.pay_now')}</span>
                                </>
                            )}
                        </Button>
                    )}
                    {primaryAction === 'continue' && (
                        <Button
                            onClick={handleContinueManual}
                            disabled={loading}
                            className="group h-8 w-full gap-1.5 px-3 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md disabled:opacity-50"
                            size="sm"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            <span>{t('buttons.continue')}</span>
                        </Button>
                    )}
                </div>

                {/* View Detail Button - Fixed width for consistent alignment */}
                <div className="flex w-[100px] justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRowClick(survey as SurveyRow)}
                        className="h-8 gap-1.5 px-3 text-xs font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{t('buttons.view_detail')}</span>
                    </Button>
                </div>

                {/* Actions Dropdown Menu - Fixed width for alignment */}
                <div className="flex w-8 justify-center">
                    {hasDropdownActions ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-1 focus-visible:ring-slate-300 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    disabled={loading}
                                >
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1">
                                {/* Upgrade/Downgrade options */}
                                {canUpgradeDowngrade && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={handleUpgrade}
                                            className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <ArrowUpToLineIcon className="h-4 w-4 text-emerald-600" />
                                            <span>{t('buttons.upgrade')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleDowngrade}
                                            className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <ArrowDownToLineIcon className="h-4 w-4 text-amber-600" />
                                            <span>{t('buttons.downgrade')}</span>
                                        </DropdownMenuItem>
                                    </>
                                )}

                                {/* Cancel/Terminate options */}
                                {canCancel && (
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setIsTerminateAction(false);
                                            setOpenCancelDialog(true);
                                        }}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50 dark:focus:bg-red-950/50"
                                    >
                                        <X className="h-4 w-4" />
                                        <span>{t('buttons.cancel_request')}</span>
                                    </DropdownMenuItem>
                                )}
                                {canTerminate && (
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setIsTerminateAction(true);
                                            setOpenCancelDialog(true);
                                        }}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50 dark:focus:bg-red-950/50"
                                    >
                                        <X className="h-4 w-4" />
                                        <span>{t('buttons.terminate_service')}</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        /* Empty placeholder to maintain alignment when no dropdown actions */
                        <div className="h-8 w-8" />
                    )}
                </div>
            </div>

            <CancelConfirmationDialog
                open={openCancelDialog}
                onOpenChange={setOpenCancelDialog}
                onConfirm={handleCancel}
                loading={loading}
                title={isTerminateAction ? 'Terminate Service' : 'Cancel Service Request'}
                description={
                    isTerminateAction
                        ? 'Are you sure you want to terminate this service? This action cannot be undone.'
                        : 'Are you sure you want to cancel this service request? This action cannot be undone.'
                }
                confirmText={
                    loading ? (isTerminateAction ? 'Terminating...' : 'Cancelling...') : isTerminateAction ? 'Yes, Terminate' : 'Yes, Cancel'
                }
                cancelText="No, Keep It"
            />

            <DeleteConfirmationDialog
                open={openDeleteDialog}
                onOpenChange={setOpenDeleteDialog}
                onConfirm={handleDelete}
                loading={loading}
                title="Delete Service Request"
                description="This will permanently delete the service request."
                confirmText={loading ? 'Deleting...' : 'Yes, Delete'}
                cancelText="No, Keep It"
            />

            <SurveyDetailModal open={openDetailModal} onOpenChange={setOpenDetailModal} survey={survey} />

            <BandwidthChangeDialog
                open={openUpgradeDialog}
                onOpenChange={setOpenUpgradeDialog}
                onConfirm={(bandwidth) => handleBandwidthChange(bandwidth, 'upgrade')}
                loading={changePrimaryOfferingMutation.isPending}
                mode="upgrade"
                currentBandwidth={(survey as { bandwidth?: string }).bandwidth}
                serviceNumber={(primaryServiceNumber ?? '') as string}
            />

            <BandwidthChangeDialog
                open={openDowngradeDialog}
                onOpenChange={setOpenDowngradeDialog}
                onConfirm={(bandwidth) => handleBandwidthChange(bandwidth, 'downgrade')}
                loading={changePrimaryOfferingMutation.isPending}
                mode="downgrade"
                currentBandwidth={(survey as { bandwidth?: string }).bandwidth}
                serviceNumber={(primaryServiceNumber ?? '') as string}
            />
        </>
    );
}
