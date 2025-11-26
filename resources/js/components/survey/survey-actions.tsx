import { router, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
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

interface SurveyActionsProps {
    survey: any;
    onActionComplete: () => void;
    onUpdatingChange: (updating: boolean) => void;
}

export default function SurveyActions({ survey, onActionComplete, onUpdatingChange }: SurveyActionsProps) {
    const [loading, setLoading] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [error, setError] = useState('');
    const [customerData, setCustomerData] = useState<any>(null);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [openDetailModal, setOpenDetailModal] = useState(false);
    const [apiErrors, setApiErrors] = useState<{ [key: string]: string }>({});

    // ⬇️ Get authenticated user from Inertia props
    const { auth }: any = usePage().props;

    useEffect(() => {
        if (auth?.user) {
            setCustomerData(auth.user);
        } else {
            setCustomerData(null);
        }
    }, [auth]);

    // Enhanced error handling function
    const handleApiError = (result: any, context: string = '') => {
        console.error(`API Error in ${context}:`, result);

        let errorMessage = 'An unexpected error occurred. Please try again.';

        // Handle different error response structures
        if (result?.original?.success === false) {
            errorMessage = result.original.message || 'Service subscription failed!';
        } else if (result?.success === false) {
            errorMessage = result.message || 'Operation failed!';
        } else if (result?.errors) {
            errorMessage = Object.values(result.errors).join(', ') || 'Validation failed!';
        } else if (result?.message) {
            errorMessage = result.message;
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
        } catch (err: any) {
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
        } catch (err: any) {
            handleApiError(err, 'deletion_network');
        } finally {
            setLoading(false);
            onUpdatingChange(false);
            setOpenDeleteDialog(false);
        }
    };

    const createSubscriber = async () => {
        const addressInfo = getAddressInfo();
        const contactInfo = getContactInfo();
        const customerInfo = getCustomerInfo();

        const payload = {
            offering_id: survey.main_offer_id || survey.offering_id || customerData?.ext_params?.PrimaryOfferId || '',
            survey_order_id: String(survey.customer_survey_order_id),
            customer_code: String(survey.customer_code),
            first_name: customerInfo.first_name,
            middle_name: customerInfo.middle_name,
            last_name: customerInfo.last_name,
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

        const response = await fetch('/api/v1/services/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        // Check for subscription creation errors
        if (result?.data?.original?.success === false) {
            const errorMsg = result.data.original.message || 'Subscriber creation failed';
            throw new Error(errorMsg);
        }

        if (!result.success) {
            throw new Error(result.message || 'Subscriber creation failed');
        }

        return result;
    };

    const fetchAvailableNumbers = async () => {
        const response = await fetch('/api/v1/avaiable-number', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

    const calculateServiceFees = async (subscriberId: string, serviceNumber: string) => {
        const response = await fetch('/api/v1/calc-one-off-fee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_survey_order_id: String(survey.customer_survey_order_id),
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
                    offering_id: survey.main_offer_id || '1207609454',
                    network_type: 4,
                    sub_type: 0,
                },
            }),
        });

        const result = await response.json();

        // Check for fee calculation errors
        if (result?.original?.success === false || result?.success === false) {
            const errorMsg = result.original?.message || result.message || 'Failed to calculate fees';
            throw new Error(errorMsg);
        }

        if (result.success && result.data?.fees) return result.data;

        throw new Error('Failed to calculate fees');
    };

    const generateExternalSequence = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const handlePayNow = async () => {
        if (!customerData) {
            setError('No customer data found. Please complete the survey first.');
            setShowErrorDialog(true);
            return;
        }

        if (!customerData.customer_code) {
            setError('Customer code not found. Please ensure your profile is complete.');
            setShowErrorDialog(true);
            return;
        }

        setLoading(true);
        onUpdatingChange(true);
        clearErrors();

        try {
            // Step 1: Create subscriber
            const subscriberResult = await createSubscriber();
            console.log('Subscriber created:', subscriberResult);

            // Step 2: Fetch available numbers
            const availableNumbers = await fetchAvailableNumbers();
            console.log('Available numbers:', availableNumbers);

            const serviceNumber = availableNumbers[0]?.ServiceNumber;
            if (!serviceNumber) {
                throw new Error('No service numbers available at the moment. Please try again later.');
            }

            // Step 3: Calculate fees
            const feeData = await calculateServiceFees(subscriberResult.data.subscriber_id, serviceNumber);
            console.log('Fee data calculated:', feeData);

            feeData.service_number = serviceNumber;

            // All steps completed successfully - proceed to payment summary
            router.visit(route('payment.summary'), {
                method: 'get',
                data: {
                    survey_id: survey.customer_survey_order_id,
                    subscriber_data: JSON.stringify(subscriberResult.data),
                    service_number: serviceNumber,
                    fee_data: JSON.stringify(feeData),
                    customer_data: JSON.stringify(customerData),
                    survey_data: JSON.stringify(survey),
                },
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to setup payment. Please try again.';
            handleApiError({ message: errorMessage }, 'payment_setup');
        } finally {
            setLoading(false);
            onUpdatingChange(false);
        }
    };

    const handleContinueWithFallback = () => {
        if (!customerData) {
            setError('Cannot continue without customer data.');
            setShowErrorDialog(true);
            return;
        }

        const fallbackSubscriber = {
            subscriber_id: `dev_${Date.now()}`,
            customer_code: survey.customer_code,
            first_name: 'Test',
            last_name: 'User',
            service_type: survey.service_type || 'Internet',
            status: 'active',
            created_at: new Date().toISOString(),
        };

        const fallbackFeeData = {
            fees: [
                {
                    item_name: 'Service Activation Fee',
                    original_fee: '1000000',
                    discount_fee: '0',
                    taxes: [{ name: 'VAT (15%)', fee: '150000' }],
                },
            ],
            service_number: '251123456789',
        };

        router.visit(
            route('payment.summary', {
                survey_id: survey.customer_survey_order_id,
                subscriber_data: JSON.stringify(fallbackSubscriber),
                service_number: fallbackFeeData.service_number,
                fee_data: JSON.stringify(fallbackFeeData),
                customer_data: JSON.stringify(customerData),
                survey_data: JSON.stringify(survey),
                is_fallback: true,
            }),
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
            return { name1: 'Test', name2: 'User', mobile: '251911234567' };
        }
        const contact = customerData.contacts[0];
        return {
            name1: contact.name1 || 'Test',
            name2: contact.name2 || 'User',
            mobile: contact.mobile || '251911234567',
        };
    };

    const getCustomerInfo = () => {
        if (!customerData) {
            return {
                first_name: 'Test',
                middle_name: '',
                last_name: 'User',
                enterprise_name: 'Test Enterprise',
            };
        }
        const customer = customerData;
        return {
            first_name: customer.name || 'Test',
            middle_name: customer.name || '',
            last_name: customer.name || 'User',
            enterprise_name: customer.enterprise_name || customer.first_name || 'Test Enterprise',
        };
    };

    const status = Number(survey.status);

    const ACTION_RULES = {
        3: { canCancel: true, canPay: false },
        5: { canCancel: true, canPay: true },
        9: { canCancel: false, canPay: false },
    };

    const rules = ACTION_RULES[status] || {};
    const { canPay, canCancel } = rules;

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                {canPay && (
                    <Button onClick={handlePayNow} disabled={loading} className="gap-1 bg-primary px-4 text-white" size="sm">
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

                {canCancel && (
                    <Button variant="outline" size="sm" onClick={() => setOpenCancelDialog(true)} disabled={loading} className="gap-1 px-2">
                        Cancel
                    </Button>
                )}
            </div>

            {/* Error Dialog */}
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
                        <AlertDialogAction onClick={handleContinueWithFallback}>Continue Anyway</AlertDialogAction>
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
