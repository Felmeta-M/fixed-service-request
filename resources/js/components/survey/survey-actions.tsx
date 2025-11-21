// import { router } from '@inertiajs/react';
// import { X } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from '../ui/alert-dialog';
// import { Button } from '../ui/button';
// import { CancelConfirmationDialog } from './cancel-confirmation-dialog';
// import DeleteConfirmationDialog from './delete-confirmation-dialog';
// import SurveyDetailModal from './survey-detail-modal';

// interface SurveyActionsProps {
//     survey: any;
//     onActionComplete: () => void;
//     onUpdatingChange: (updating: boolean) => void;
// }

// export default function SurveyActions({ survey, onActionComplete, onUpdatingChange }: SurveyActionsProps) {
//     const [loading, setLoading] = useState(false);
//     const [openCancelDialog, setOpenCancelDialog] = useState(false);
//     const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
//     const [error, setError] = useState('');
//     const [customerData, setCustomerData] = useState(null);
//     const [showErrorDialog, setShowErrorDialog] = useState(false);
//     const [openDetailModal, setOpenDetailModal] = useState(false);

//     useEffect(() => {
//         const customerDataString = localStorage.getItem('activeCustomer');
//         if (customerDataString) {
//             try {
//                 setCustomerData(JSON.parse(customerDataString));
//             } catch (e) {
//                 console.error('Error parsing customer data:', e);
//                 setError('Invalid customer data format');
//             }
//         }
//     }, []);

//     const handleCancel = async (cancellationReason?: string) => {
//         if (!cancellationReason) {
//             alert('Please provide a reason for cancellation.');
//             return;
//         }

//         setLoading(true);
//         onUpdatingChange(true);

//         try {
//             console.log('Cancelling survey order with ID:', survey.customer_survey_order_id);

//             const response = await fetch('/api/v1/cancel-survey-order', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Accept: 'application/json',
//                 },
//                 body: JSON.stringify({
//                     customer_survey_order_id: String(survey.customer_survey_order_id),
//                     cancel_reason: cancellationReason,
//                 }),
//             });

//             const result = await response.json();
//             console.log('Cancel result:', result);

//             if (response.ok && result.success) {
//                 onActionComplete();
//             } else {
//                 alert(result.message || 'Failed to cancel survey order');
//             }
//         } catch (err) {
//             console.error('Cancel error:', err);
//             alert('Failed to cancel survey order');
//         } finally {
//             setLoading(false);
//             onUpdatingChange(false);
//             setOpenCancelDialog(false);
//         }
//     };

//     const handleDelete = async () => {
//         setLoading(true);
//         onUpdatingChange(true);
//         try {
//             const response = await fetch('/api/v1/survey-requests/delete', {
//                 method: 'DELETE',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     customer_code: survey.customer_code,
//                     customer_survey_order_id: survey.customer_survey_order_id,
//                 }),
//             });

//             const result = await response.json();

//             if (result.success) {
//                 onActionComplete();
//             } else {
//                 alert(result.message || 'Failed to delete survey order');
//             }
//         } catch (err) {
//             alert('Failed to delete survey order');
//             console.error('Delete error:', err);
//         } finally {
//             setLoading(false);
//             onUpdatingChange(false);
//             setOpenDeleteDialog(false);
//         }
//     };

//     const createSubscriber = async () => {
//         const addressInfo = getAddressInfo();
//         const contactInfo = getContactInfo();
//         const customerInfo = getCustomerInfo();

//         const payload = {
//             offering_id: survey.main_offer_id || survey.offering_id || customerData?.ext_params?.PrimaryOfferId || '',
//             survey_order_id: String(survey.customer_survey_order_id),
//             customer_code: String(survey.customer_code),
//             first_name: customerInfo.first_name,
//             middle_name: customerInfo.middle_name,
//             last_name: customerInfo.last_name,
//             enterprise_name: customerInfo.enterprise_name,
//             region: addressInfo.region,
//             city: addressInfo.city,
//             zone: addressInfo.zone,
//             wereda: addressInfo.wereda,
//             kebele: addressInfo.kebele,
//             house_no: addressInfo.house_no,
//             sms_no: contactInfo.mobile,
//             external_operid: survey.external_operid || '512',
//             completed_date: new Date()
//                 .toISOString()
//                 .replace(/[-:T.Z]/g, '')
//                 .slice(0, 14),
//         };

//         try {
//             console.log('Creating subscriber with payload:', payload);
//             const response = await fetch('/api/v1/services/subscription', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(payload),
//             });

//             const result = await response.json();
//             console.log('Subscriber creation response:', result);

//             if (result.success) {
//                 return result;
//             } else {
//                 throw new Error(result.message || 'Subscriber creation failed');
//             }
//         } catch (error) {
//             console.error('Subscriber creation failed:', error);
//             throw error;
//         }
//     };

//     const fetchAvailableNumbers = async () => {
//         try {
//             const response = await fetch('/api/v1/avaiable-number', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     pay_mode: '1',
//                     tele_type: '4',
//                     need_query_by_dept: false,
//                     res_cnt: 1,
//                 }),
//             });

//             const result = await response.json();

//             if (Array.isArray(result) && result.length > 0) {
//                 return result;
//             } else {
//                 throw new Error('No available numbers found');
//             }
//         } catch (err) {
//             console.error('Failed to fetch numbers:', err);
//             throw err;
//         }
//     };

//     const calculateServiceFees = async (subscriberId: string) => {
//         try {
//             const response = await fetch('/api/v1/calc-one-off-fee', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     business_code: 'CO064',
//                     customer: {
//                         type: 1,
//                         category: 1,
//                         subcategory: 1,
//                         level: 6,
//                         nationality: 1231,
//                         id_type: 2,
//                     },
//                     sub_order: {
//                         business_code: 'CO015',
//                         external_sequence: generateExternalSequence(),
//                         service_number: '251123456789', // Will be updated with actual number
//                         offering_id: survey.main_offer_id || '1207609454',
//                         network_type: 4,
//                         sub_type: 0,
//                     },
//                 }),
//             });

//             const result = await response.json();

//             if (result.success && result.data?.fees) {
//                 return result.data;
//             } else {
//                 throw new Error('Failed to calculate fees');
//             }
//         } catch (err) {
//             console.error('Calculate fee error:', err);
//             throw err;
//         }
//     };

//     const generateExternalSequence = () => {
//         return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
//             const r = (Math.random() * 16) | 0;
//             const v = c == 'x' ? r : (r & 0x3) | 0x8;
//             return v.toString(16);
//         });
//     };

//     const handlePayNow = async () => {
//         if (!customerData) {
//             setError('No customer data found. Please complete the survey first.');
//             setShowErrorDialog(true);
//             return;
//         }

//         setLoading(true);
//         onUpdatingChange(true);
//         setError('');

//         try {
//             // Step 1: Create subscriber
//             const subscriberResult = await createSubscriber();

//             // Step 2: Get available service number
//             const availableNumbers = await fetchAvailableNumbers();
//             const serviceNumber = availableNumbers[0]?.ServiceNumber;

//             if (!serviceNumber) {
//                 throw new Error('No service numbers available');
//             }

//             // Step 3: Calculate fees
//             const feeData = await calculateServiceFees(subscriberResult.data.subscriber_id);

//             // Update fee data with actual service number
//             feeData.service_number = serviceNumber;

//             // Step 4: Redirect to payment summary
//             router.visit(
//                 route('payment.summary', {
//                     survey_id: survey.customer_survey_order_id,
//                     subscriber_data: subscriberResult.data,
//                     service_number: serviceNumber,
//                     fee_data: feeData,
//                     customer_data: customerData,
//                     survey_data: survey,
//                 }),
//             );
//         } catch (err) {
//             console.error('Payment setup error:', err);
//             setError(err.message || 'Failed to setup payment. Please try again.');
//             setShowErrorDialog(true);
//         } finally {
//             setLoading(false);
//             onUpdatingChange(false);
//         }
//     };

//     const handleContinueWithFallback = () => {
//         setShowErrorDialog(false);
//         setError('');

//         // Create fallback data for development
//         const fallbackSubscriber = {
//             subscriber_id: `dev_${Date.now()}`,
//             customer_code: survey.customer_code,
//             first_name: 'Test',
//             last_name: 'User',
//             service_type: survey.service_type || 'Internet',
//             status: 'active',
//             created_at: new Date().toISOString(),
//         };

//         const fallbackFeeData = {
//             fees: [
//                 {
//                     item_name: 'Service Activation Fee',
//                     original_fee: '1000000', // 100 ETB
//                     discount_fee: '0',
//                     taxes: [
//                         { name: 'VAT (15%)', fee: '150000' }, // 15 ETB
//                     ],
//                 },
//             ],
//             service_number: '251123456789',
//         };

//         router.visit(
//             route('payment.summary', {
//                 survey_id: survey.customer_survey_order_id,
//                 subscriber_data: fallbackSubscriber,
//                 service_number: fallbackFeeData.service_number,
//                 fee_data: fallbackFeeData,
//                 customer_data: customerData,
//                 survey_data: survey,
//                 is_fallback: true,
//             }),
//         );
//     };

//     const getAddressInfo = () => {
//         if (!customerData?.addresses || customerData.addresses.length === 0) {
//             return {
//                 region: 'Addis Ababa',
//                 city: 'Addis Ababa',
//                 zone: 'Central',
//                 wereda: '01',
//                 kebele: '01',
//                 house_no: '123',
//             };
//         }
//         const address = customerData.addresses[0];
//         return {
//             region: address.address1 || 'Addis Ababa',
//             city: address.address2 || 'Addis Ababa',
//             zone: address.address3 || 'Central',
//             wereda: address.address4 || '01',
//             kebele: address.address5 || '01',
//             house_no: address.address6 || '123',
//         };
//     };

//     const getContactInfo = () => {
//         if (!customerData?.contacts || customerData.contacts.length === 0) {
//             return {
//                 name1: 'Test',
//                 name2: 'User',
//                 mobile: '251911234567',
//             };
//         }
//         const contact = customerData.contacts[0];
//         return {
//             name1: contact.name1 || 'Test',
//             name2: contact.name2 || 'User',
//             mobile: contact.mobile || '251911234567',
//         };
//     };

//     const getCustomerInfo = () => {
//         if (!customerData?.customer) {
//             return {
//                 first_name: 'Test',
//                 middle_name: '',
//                 last_name: 'User',
//                 enterprise_name: 'Test Enterprise',
//             };
//         }
//         const customer = customerData.customer;
//         return {
//             first_name: customer.first_name || 'Test',
//             middle_name: customer.middle_name || '',
//             last_name: customer.last_name || 'User',
//             enterprise_name: customer.enterprise_name || customer.first_name || 'Test Enterprise',
//         };
//     };

//     const status = Number(survey.status);

//     const ACTION_RULES = {
//         3: { canCancel: true, canPay: false }, // Waiting Survey
//         5: { canCancel: true, canPay: true }, // Completed - Ready for payment
//         9: { canCancel: false, canPay: false }, // Cancelled
//     };

//     const rules = ACTION_RULES[status] || {};
//     const { canPay, canCancel } = rules;

//     return (
//         <>
//             <div className="flex items-center justify-end gap-2">
//                 {/* Pay Button */}
//                 {canPay && (
//                     <Button  onClick={handlePayNow} disabled={loading} className="gap-1 bg-primary px-4 text-white" size="sm">
//                         {loading ? (
//                             <>
//                                 <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white"></div>
//                                 Preparing...
//                             </>
//                         ) : (
//                             <>Pay</>
//                         )}
//                     </Button>
//                 )}

//                 {/* Cancel Button */}
//                 {canCancel && (
//                     <Button variant="outline" size="sm" onClick={() => setOpenCancelDialog(true)} disabled={loading} className="gap-1 px-2">
//                         Cancel
//                     </Button>
//                 )}

//                 {/* View Details Button */}
//                 {/* <Button variant="ghost" size="sm" onClick={() => setOpenDetailModal(true)} className="text-gray-600 hover:text-gray-800">
//                     View
//                 </Button> */}
//             </div>

//             {/* Error Dialog */}
//             {showErrorDialog && (
//                 <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
//                     <AlertDialogContent>
//                         <AlertDialogHeader>
//                             <div className="flex items-center gap-3">
//                                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
//                                     <X className="h-5 w-5 text-red-600" />
//                                 </div>
//                                 <AlertDialogTitle>Payment Setup Error</AlertDialogTitle>
//                             </div>
//                             <AlertDialogDescription>{error || 'Failed to setup payment. This might be due to:'}</AlertDialogDescription>
//                             <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-gray-600">
//                                 <li>Service temporarily unavailable</li>
//                                 <li>Network connectivity issues</li>
//                                 <li>System maintenance</li>
//                             </ul>
//                         </AlertDialogHeader>
//                         <AlertDialogFooter>
//                             <AlertDialogCancel onClick={() => setShowErrorDialog(false)}>Cancel</AlertDialogCancel>
//                             <AlertDialogAction onClick={handleContinueWithFallback}>Continue Anyway</AlertDialogAction>
//                         </AlertDialogFooter>
//                     </AlertDialogContent>
//                 </AlertDialog>
//             )}

//             {/* Cancel Confirmation Dialog */}
//             <CancelConfirmationDialog
//                 open={openCancelDialog}
//                 onOpenChange={setOpenCancelDialog}
//                 onConfirm={handleCancel}
//                 loading={loading}
//                 title="Cancel Survey Order"
//                 description="Are you sure you want to cancel this survey order? This action cannot be undone."
//                 confirmText={loading ? 'Cancelling...' : 'Yes, Cancel'}
//                 cancelText="No, Keep It"
//             />

//             {/* Delete Confirmation Dialog */}
//             <DeleteConfirmationDialog
//                 open={openDeleteDialog}
//                 onOpenChange={setOpenDeleteDialog}
//                 onConfirm={handleDelete}
//                 loading={loading}
//                 title="Delete Survey Order"
//                 description="This will permanently delete the survey order from the system. This action cannot be undone."
//                 confirmText={loading ? 'Deleting...' : 'Yes, Delete'}
//                 cancelText="No, Keep It"
//             />

//             <SurveyDetailModal open={openDetailModal} onOpenChange={setOpenDetailModal} survey={survey} />
//         </>
//     );
// }

// import { router, usePage } from '@inertiajs/react';
// import { X } from 'lucide-react';
// import { useState } from 'react';
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from '../ui/alert-dialog';
// import { Button } from '../ui/button';
// import { CancelConfirmationDialog } from './cancel-confirmation-dialog';
// import DeleteConfirmationDialog from './delete-confirmation-dialog';
// import SurveyDetailModal from './survey-detail-modal';

// interface SurveyActionsProps {
//     survey: any;
//     onActionComplete: () => void;
//     onUpdatingChange: (updating: boolean) => void;
// }

// export default function SurveyActions({ survey, onActionComplete, onUpdatingChange }: SurveyActionsProps) {
//     const { auth } = usePage().props as {
//         auth: { user: any };
//     };
//     const customerData = auth.user || null;
//     console.log('🚀 ~ customerData ~ auth:', customerData);

//     const [loading, setLoading] = useState(false);
//     const [openCancelDialog, setOpenCancelDialog] = useState(false);
//     const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
//     const [error, setError] = useState('');
//     const [showErrorDialog, setShowErrorDialog] = useState(false);
//     const [openDetailModal, setOpenDetailModal] = useState(false);

//     const handleCancel = async (cancellationReason?: string) => {
//         if (!cancellationReason) {
//             alert('Please provide a reason for cancellation.');
//             return;
//         }

//         setLoading(true);
//         onUpdatingChange(true);

//         try {
//             const response = await fetch('/api/v1/cancel-survey-order', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Accept: 'application/json',
//                 },
//                 body: JSON.stringify({
//                     customer_survey_order_id: String(survey.customer_survey_order_id),
//                     cancel_reason: cancellationReason,
//                 }),
//             });

//             const result = await response.json();

//             if (response.ok && result.success) {
//                 onActionComplete();
//             } else {
//                 alert(result.message || 'Failed to cancel survey order');
//             }
//         } catch (err) {
//             alert('Failed to cancel survey order');
//         } finally {
//             setLoading(false);
//             onUpdatingChange(false);
//             setOpenCancelDialog(false);
//         }
//     };

//     const handleDelete = async () => {
//         setLoading(true);
//         onUpdatingChange(true);
//         try {
//             const response = await fetch('/api/v1/survey-requests/delete', {
//                 method: 'DELETE',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     customer_code: survey.customer_code,
//                     customer_survey_order_id: survey.customer_survey_order_id,
//                 }),
//             });

//             const result = await response.json();

//             if (result.success) {
//                 onActionComplete();
//             } else {
//                 alert(result.message || 'Failed to delete survey order');
//             }
//         } catch (err) {
//             alert('Failed to delete survey order');
//         } finally {
//             setLoading(false);
//             onUpdatingChange(false);
//             setOpenDeleteDialog(false);
//         }
//     };

//     const handlePayNow = async () => {
//         if (!customerData) {
//             setError('No customer data found. Please complete the survey first.');
//             setShowErrorDialog(true);
//             return;
//         }

//         setLoading(true);
//         onUpdatingChange(true);
//         setError('');

//         try {
//             router.visit(
//                 route('payment.summary', {
//                     survey_id: survey.customer_survey_order_id,
//                     customer_data: customerData,
//                     survey_data: survey,
//                 }),
//             );
//         } catch (err: any) {
//             setError(err.message || 'Payment setup failed');
//             setShowErrorDialog(true);
//         } finally {
//             setLoading(false);
//             onUpdatingChange(false);
//         }
//     };

//     const handleContinueWithFallback = () => {
//         setShowErrorDialog(false);
//         setError('');

//         const fallbackData = {
//             subscriber_id: `dev_${Date.now()}`,
//             customer_code: survey.customer_code,
//             first_name: 'Test',
//             last_name: 'User',
//             created_at: new Date().toISOString(),
//         };

//         router.visit(
//             route('payment.summary', {
//                 survey_id: survey.customer_survey_order_id,
//                 subscriber_data: fallbackData,
//                 customer_data: customerData,
//                 survey_data: survey,
//                 is_fallback: true,
//             }),
//         );
//     };

//     const status = Number(survey.status);

//     const ACTION_RULES = {
//         3: { canCancel: true, canPay: false },
//         5: { canCancel: true, canPay: true },
//         9: { canCancel: false, canPay: false },
//     };

//     const rules = ACTION_RULES[status] || {};
//     const { canPay, canCancel } = rules;

//     return (
//         <>
//             <div className="flex items-center justify-end gap-2">
//                 {canPay && (
//                     <Button onClick={handlePayNow} disabled={loading} size="sm" className="gap-1 bg-primary px-4 text-white">
//                         {loading ? (
//                             <>
//                                 <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white"></div>
//                                 Preparing...
//                             </>
//                         ) : (
//                             'Pay'
//                         )}
//                     </Button>
//                 )}

//                 {canCancel && (
//                     <Button variant="outline" size="sm" onClick={() => setOpenCancelDialog(true)} disabled={loading} className="px-2">
//                         Cancel
//                     </Button>
//                 )}
//             </div>

//             {/* Error Dialog */}
//             {showErrorDialog && (
//                 <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
//                     <AlertDialogContent>
//                         <AlertDialogHeader>
//                             <div className="flex items-center gap-3">
//                                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
//                                     <X className="h-5 w-5 text-red-600" />
//                                 </div>
//                                 <AlertDialogTitle>Payment Setup Error</AlertDialogTitle>
//                             </div>
//                             <AlertDialogDescription>{error || 'Failed to setup payment. Possible reasons:'}</AlertDialogDescription>
//                             <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-gray-600">
//                                 <li>Network problem</li>
//                                 <li>Backend unavailable</li>
//                                 <li>System maintenance</li>
//                             </ul>
//                         </AlertDialogHeader>
//                         <AlertDialogFooter>
//                             <AlertDialogCancel>Cancel</AlertDialogCancel>
//                             <AlertDialogAction onClick={handleContinueWithFallback}>Continue Anyway</AlertDialogAction>
//                         </AlertDialogFooter>
//                     </AlertDialogContent>
//                 </AlertDialog>
//             )}

//             {/* Cancel Confirmation */}
//             <CancelConfirmationDialog
//                 open={openCancelDialog}
//                 onOpenChange={setOpenCancelDialog}
//                 onConfirm={handleCancel}
//                 loading={loading}
//                 title="Cancel Survey Order"
//                 description="Are you sure you want to cancel this survey order?"
//             />

//             {/* Delete Confirmation */}
//             <DeleteConfirmationDialog
//                 open={openDeleteDialog}
//                 onOpenChange={setOpenDeleteDialog}
//                 onConfirm={handleDelete}
//                 loading={loading}
//                 title="Delete Survey Order"
//                 description="This action cannot be undone."
//             />

//             <SurveyDetailModal open={openDetailModal} onOpenChange={setOpenDetailModal} survey={survey} />
//         </>
//     );
// }

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
    console.log('🚀 ~ SurveyActions ~ customerData:', customerData);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [openDetailModal, setOpenDetailModal] = useState(false);

    // ⬇️ Get authenticated user from Inertia props
    const { auth }: any = usePage().props;

    useEffect(() => {
        if (auth?.user) {
            setCustomerData(auth.user);
        } else {
            setCustomerData(null);
        }
    }, [auth]);

    const handleCancel = async (cancellationReason?: string) => {
        if (!cancellationReason) {
            alert('Please provide a reason for cancellation.');
            return;
        }

        setLoading(true);
        onUpdatingChange(true);

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
                alert(result.message || 'Failed to cancel survey order');
            }
        } catch (err) {
            alert('Failed to cancel survey order');
        } finally {
            setLoading(false);
            onUpdatingChange(false);
            setOpenCancelDialog(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        onUpdatingChange(true);
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
                alert(result.message || 'Failed to delete survey order');
            }
        } catch (err) {
            alert('Failed to delete survey order');
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

        if (result.success) return result;
        throw new Error(result.message || 'Subscriber creation failed');
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
                    // external_sequence: generateExternalSequence(),
                    external_sequence: '759d462f068f4b9ebbb34aa3418869a8',

                    service_number: serviceNumber,
                    // service_number: '123457155',
                    // offering_id: survey.main_offer_id || '1207609454',
                    offering_id: '1207609454',
                    network_type: 4,
                    sub_type: 0,
                },
            }),
        });

        const result = await response.json();

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

    console.log('🚀 ~ handlePayNow ~ customerData:', customerData);
    const handlePayNow = async () => {
        if (!customerData) {
            setError('No customer data found. Please complete the survey first.');
            setShowErrorDialog(true);
            return;
        }

        setLoading(true);
        onUpdatingChange(true);
        setError('');

        try {
            const subscriberResult = await createSubscriber();
            const availableNumbers = await fetchAvailableNumbers();
            const serviceNumber = availableNumbers[0]?.ServiceNumber;

            if (!serviceNumber) throw new Error('No service numbers available');

            const feeData = await calculateServiceFees(subscriberResult.data.subscriber_id, serviceNumber);
            feeData.service_number = serviceNumber;

            router.visit(route('payment.summary'), {
                method: 'get',
                data: {
                    survey_id: survey.customer_survey_order_id,
                    subscriber_data: subscriberResult.data,
                    service_number: serviceNumber,
                    fee_data: feeData,
                    customer_data: customerData,
                    survey_data: survey,
                },
            });
        } catch (err: any) {
            setError(err.message || 'Failed to setup payment. Please try again.');
            setShowErrorDialog(true);
        } finally {
            setLoading(false);
            onUpdatingChange(false);
        }
    };

    const handleContinueWithFallback = () => {
        setShowErrorDialog(false);
        setError('');

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
                subscriber_data: fallbackSubscriber,
                service_number: fallbackFeeData.service_number,
                fee_data: fallbackFeeData,
                customer_data: customerData,
                survey_data: survey,
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

            {showErrorDialog && (
                <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                    <X className="h-5 w-5 text-red-600" />
                                </div>
                                <AlertDialogTitle>Payment Setup Error</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription>{error || 'Failed to setup payment.'}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setShowErrorDialog(false)}>Close</AlertDialogCancel>
                            <AlertDialogAction onClick={handleContinueWithFallback}>Continue Anyway</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

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
