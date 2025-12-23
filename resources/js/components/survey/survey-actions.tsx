import { router, usePage } from '@inertiajs/react';
import { ArrowDownToLineIcon, ArrowUpToLineIcon,  X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { CancelConfirmationDialog } from './cancel-confirmation-dialog';
import DeleteConfirmationDialog from './delete-confirmation-dialog';
import SurveyDetailModal from './survey-detail-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { getServiceActionFlags } from '@/lib/service-action-rules';
import { toast } from 'sonner';

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

type Survey = {
    customer_survey_order_id?: string | number;
    status?: string | number | null;
    main_offer_id?: string;
    offering_id?: string;
    customer_code?: string | number;
    external_operid?: string;
    payment?: {
        total_amount?: number | string;
        status?: string;
    };
    [key: string]: unknown;
};

interface SurveyActionsProps {
    survey: Survey;
    onActionComplete: () => void;
    onUpdatingChange: (updating: boolean) => void;
}

export default function SurveyActions({ survey, onActionComplete, onUpdatingChange }: SurveyActionsProps) {
    const [loading, setLoading] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [error, setError] = useState('');
    const [customerData, setCustomerData] = useState<AuthUser | null>(null);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [openDetailModal, setOpenDetailModal] = useState(false);
    const [apiErrors, setApiErrors] = useState<{ [key: string]: string }>({});

    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;

    const { main_offer_id } = survey

    useEffect(() => {
        if (user) {
            setCustomerData(user);
        } else {
            setCustomerData(null);
        }
    }, [user]);

    const handleApiError = (result: unknown, context: string = '') => {
        console.error(`API Error in ${context}:`, result);

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
        setShowErrorDialog(true);

        return errorMessage;
    };

    const clearErrors = () => {
        setError('');
        setApiErrors({});
        setShowErrorDialog(false);
    };

    const handleCancel = async (cancellationReason?: string) => {
        if (!cancellationReason) {
            setError('Please provide a reason for cancellation.');
            setShowErrorDialog(true);
            return;
        }

        setLoading(true);
        onUpdatingChange(true);
        clearErrors();

        try {
            const response = await fetch('/api/v1/cancel-survey-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${user.api_token}`,
                },
                body: JSON.stringify({
                    customer_survey_order_id: String(survey.customer_survey_order_id),
                    cancel_reason: cancellationReason,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                onActionComplete();
            } else {
                handleApiError(result, 'cancellation');
            }
        } catch (err: unknown) {
            handleApiError(err, 'cancellation_network');
        } finally {
            setLoading(false);
            onUpdatingChange(false);
            setOpenCancelDialog(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        onUpdatingChange(true);
        clearErrors();

        try {
            const response = await fetch('/api/v1/survey-requests/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.api_token}`,
                },
                body: JSON.stringify({
                    customer_code: survey.customer_code,
                    customer_survey_order_id: survey.customer_survey_order_id,
                }),
            });

            const result = await response.json();

            if (result.success) {
                onActionComplete();
            } else {
                handleApiError(result, 'deletion');
            }
        } catch (err: unknown) {
            handleApiError(err, 'deletion_network');
        } finally {
            setLoading(false);
            onUpdatingChange(false);
            setOpenDeleteDialog(false);
        }
    };

    const handleSubscribe = async () => {
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
            sms_no: contactInfo.mobile,
            external_operid: survey.external_operid || '512',
            completed_date: new Date()
                .toISOString()
                .replace(/[-:T.Z]/g, '')
                .slice(0, 14),
        };
        console.log("🚀 ~ handleSubscribe ~ payload:", payload)

        const response = await fetch('/api/v1/services/subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.api_token}`,
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
            throw new Error(result?.message || `Subscriber creation failed (HTTP ${response.status})`);
        }

        return result;
    };

    const handleUpgrade = () => {
        console.log('Upgrade requested for survey:', survey.customer_survey_order_id);
        alert(`Upgrade service ${survey.customer_survey_order_id}`);
    };

    const handleDowngrade = () => {
        console.log('Downgrade requested for survey:', survey.customer_survey_order_id);
        alert(`Downgrade service ${survey.customer_survey_order_id}`);
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

    const { canPay, canSubscribe, canCancel } = getServiceActionFlags({
        status: survey.status,
        mainOfferId: main_offer_id,
        totalAmount: survey.payment?.total_amount ? Number(survey.payment.total_amount) : undefined,
    });

    const navigateToDetails = (focus?: 'payment' | 'subscribe') => {
        const id = survey?.customer_survey_order_id;
        if (!id) return;
        const q = focus ? `?focus=${focus}` : '';
        router.visit(`/services/${id}${q}`);
    };

    const onSubscribeClick = async () => {
        const id = survey?.customer_survey_order_id;
        if (!id) return;

        setLoading(true);
        onUpdatingChange(true);
        clearErrors();

        const t = toast.loading('Creating subscription...');

        try {
            await handleSubscribe();
            toast.success('Subscription created successfully!', { id: t });

            // Refresh list state if the caller stays on the page; safe even if we navigate.
            onActionComplete();

            router.visit('/services/subscription-success');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Subscription failed';
            toast.error(msg, { id: t });
            setError(msg);
            setShowErrorDialog(true);
        } finally {
            setLoading(false);
            onUpdatingChange(false);
        }
    };


    return (
        <>
            <div className="flex items-center justify-end gap-2">
                {canPay && (
                    <Button
                        onClick={() => navigateToDetails('payment')}
                        disabled={loading}
                        className="gap-1 bg-primary px-4 text-white"
                        size="sm"
                    >
                        {loading ? (
                            <>
                                <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white"></div>
                                Preparing...
                            </>
                        ) : (
                            <>Pay</>
                        )}
                    </Button>
                )}

                {canSubscribe && (
                    <Button
                        onClick={onSubscribeClick}
                        disabled={loading}
                        className="gap-1 bg-primary px-2 text-white"
                        size="sm"
                    >
                        Subscribe
                    </Button>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={loading}
                        >
                            <span className="sr-only">Open menu</span>
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                            </svg>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={handleUpgrade} className="flex items-center gap-2 cursor-pointer">
                            <ArrowUpToLineIcon className="h-4 w-4" />
                            <span>Upgrade</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDowngrade} className="flex items-center gap-2 cursor-pointer">
                            <ArrowDownToLineIcon className="h-4 w-4" />
                            <span>Downgrade</span>
                        </DropdownMenuItem>
                        {canCancel && <DropdownMenuSeparator />}
                        {canCancel && (
                            <DropdownMenuItem
                                onClick={() => setOpenCancelDialog(true)}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                                <span>Cancel Service</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* {canCancel && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOpenCancelDialog(true)}
                        disabled={loading}
                        className="gap-1 px-2"
                    >
                        Cancel
                    </Button>
                )} */}
            </div>

            <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                <X className="h-5 w-5 text-red-600" />
                            </div>
                            <AlertDialogTitle>Payment Setup Error</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            {error || 'Failed to setup payment. Please try again.'}
                            {apiErrors.payment_setup && (
                                <div className="mt-2 text-sm">
                                    <strong>Details:</strong> {apiErrors.payment_setup}
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={clearErrors}>Close</AlertDialogCancel>
                        <AlertDialogAction onClick={() => window.location.reload()}>Try Again</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CancelConfirmationDialog
                open={openCancelDialog}
                onOpenChange={setOpenCancelDialog}
                onConfirm={handleCancel}
                loading={loading}
                title="Cancel Survey Order"
                description="Are you sure you want to cancel this survey order? This action cannot be undone."
                confirmText={loading ? 'Cancelling...' : 'Yes, Cancel'}
                cancelText="No, Keep It"
            />

            <DeleteConfirmationDialog
                open={openDeleteDialog}
                onOpenChange={setOpenDeleteDialog}
                onConfirm={handleDelete}
                loading={loading}
                title="Delete Survey Order"
                description="This will permanently delete the survey order."
                confirmText={loading ? 'Deleting...' : 'Yes, Delete'}
                cancelText="No, Keep It"
            />

            <SurveyDetailModal open={openDetailModal} onOpenChange={setOpenDetailModal} survey={survey} />
        </>
    );
}
