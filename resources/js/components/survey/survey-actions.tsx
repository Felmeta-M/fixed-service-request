// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// import { router } from '@inertiajs/react';
// import { MoreVertical, Play, X } from 'lucide-react';
// import { useEffect, useState } from 'react';
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
//         // Load data from localStorage
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

//     // const handleViewDetails = () => {
//     //     router.visit(`/survey-requests/detail/${survey.customer_survey_order_id}?customer_code=${survey.customer_code}`);
//     // };
//     const handleViewDetails = () => {
//         setOpenDetailModal(true);
//     };

//     // const handleCancel = async (cancellationReason?: string) => {
//     //     setLoading(true);
//     //     onUpdatingChange(true);
//     //     try {
//     //         console.log('Cancelling survey order with ID:', survey.customer_survey_order_id);
//     //         const response = await fetch('/api/v1/cancel-survey-order', {
//     //             method: 'POST',
//     //             headers: {
//     //                 'Content-Type': 'application/json',
//     //             },
//     //             body: JSON.stringify({
//     //                 // customer_code: survey.customer_code,
//     //                 customer_survey_order_id: survey.customer_survey_order_id,
//     //                 // cancellation_reason: cancellationReason,
//     //             }),
//     //         });
//     //         console.log('Cancel response:', response);
//     //         console.log('Response status:', response.status);

//     //         // const result = await response.json();
//     //         // console.log('Cancel result:', result);

//     //         if (response.status == 200) {
//     //             onActionComplete();
//     //         } else {
//     //             alert(response.message || 'Failed to cancel survey order');
//     //         }
//     //     } catch (err) {
//     //         alert('Failed to cancel survey order');
//     //         console.error('Cancel error:', err);
//     //     } finally {
//     //         setLoading(false);
//     //         onUpdatingChange(false);
//     //         setOpenCancelDialog(false);
//     //     }
//     // };

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

//     const createFallbackSubscriber = () => {
//         const addressInfo = getAddressInfo();
//         const contactInfo = getContactInfo();
//         const customerInfo = getCustomerInfo();

//         return {
//             success: true,
//             data: {
//                 subscriber_id: `dev_${Date.now()}`,
//                 customer_code: survey.customer_code,
//                 first_name: customerInfo.first_name,
//                 last_name: customerInfo.last_name,
//                 service_type: survey.service_type || 'Internet',
//                 status: 'active',
//                 created_at: new Date().toISOString(),
//                 address: addressInfo,
//                 contact: contactInfo,
//                 customer: customerInfo,
//             },
//             message: 'Subscriber created successfully (Development Mode)',
//             isFallback: true,
//         };
//     };

//     const fetchAvailableNumbersWithFallback = async () => {
//         try {
//             const numbersResponse = await fetch('/api/v1/avaiable-number', {
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

//             const numbersResult = await numbersResponse.json();

//             if (Array.isArray(numbersResult) && numbersResult.length > 0) {
//                 return numbersResult;
//             } else {
//                 console.warn('Using fallback numbers for development');
//                 return [
//                     { ServiceNumber: '251123456789', Level: '1' },
//                     { ServiceNumber: '251123456790', Level: '1' },
//                     { ServiceNumber: '251123456791', Level: '2' },
//                 ];
//             }
//         } catch (err) {
//             console.error('Failed to fetch numbers, using fallback:', err);
//             return [
//                 { ServiceNumber: '251123456789', Level: '1' },
//                 { ServiceNumber: '251123456790', Level: '1' },
//             ];
//         }
//     };

//     const handleContinueToService = async () => {
//         if (!customerData) {
//             setError('No customer data found. Please complete the survey first.');
//             setShowErrorDialog(true);
//             return;
//         }

//         console.log('Customer Data:', customerData);
//         console.log('Survey Data:', survey);

//         setLoading(true);
//         onUpdatingChange(true);
//         setError('');

//         try {
//             const addressInfo = getAddressInfo();
//             const contactInfo = getContactInfo();
//             const customerInfo = getCustomerInfo();

//             // Create subscriber immediately
//             const payload = {
//                 offering_id: survey.main_offer_id || survey.offering_id || customerData?.ext_params?.PrimaryOfferId || '',
//                 survey_order_id: String(survey.customer_survey_order_id),
//                 customer_code: String(survey.customer_code),
//                 first_name: customerInfo.first_name,
//                 middle_name: customerInfo.middle_name,
//                 last_name: customerInfo.last_name,
//                 enterprise_name: customerInfo.enterprise_name,
//                 region: addressInfo.region,
//                 city: addressInfo.city,
//                 zone: addressInfo.zone,
//                 wereda: addressInfo.wereda,
//                 kebele: addressInfo.kebele,
//                 house_no: addressInfo.house_no,
//                 sms_no: contactInfo.mobile,
//                 external_operid: survey.external_operid || '512',
//                 completed_date: new Date()
//                     .toISOString()
//                     .replace(/[-:T.Z]/g, '')
//                     .slice(0, 14),
//             };

//             // Validate required fields
//             const requiredFields = ['offering_id', 'first_name', 'last_name', 'sms_no'];
//             const missingFields = requiredFields.filter((field) => !payload[field]);

//             if (missingFields.length > 0) {
//                 setError(`Missing required fields: ${missingFields.join(', ')}`);
//                 setShowErrorDialog(true);
//                 setLoading(false);
//                 return;
//             }

//             let subscriberResult;
//             let availableNumbers;

//             try {
//                 // Attempt to create real subscriber
//                 console.log('Creating subscriber with payload:', payload);
//                 const response = await fetch('/api/v1/services/subscription', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify(payload),
//                 });

//                 subscriberResult = await response.json();
//                 console.log('Subscriber creation response:', subscriberResult);

//                 if (!subscriberResult.success) {
//                     console.warn('Real subscriber creation failed, using fallback:', subscriberResult.message);
//                     subscriberResult = createFallbackSubscriber();
//                 }
//             } catch (err) {
//                 console.warn('Network error, using fallback subscriber:', err);
//                 subscriberResult = createFallbackSubscriber();
//             }

//             // Query available numbers (with fallback)
//             availableNumbers = await fetchAvailableNumbersWithFallback();
//             console.log('Available numbers:', availableNumbers);

//             // Navigate to subscriber create page with all data
//             router.visit(
//                 route('subscriber.create', {
//                     id: survey.customer_survey_order_id,
//                     customer_code: survey.customer_code,
//                     offering_id: survey.main_offer_id || survey.offering_id,
//                     available_numbers: availableNumbers,
//                 }),
//             );
//         } catch (err) {
//             console.error('Unexpected error in continue to service:', err);
//             setError('An unexpected error occurred. Please try again.');
//             setShowErrorDialog(true);
//         } finally {
//             setLoading(false);
//             onUpdatingChange(false);
//         }
//     };

//     const handleContinueWithFallback = () => {
//         setShowErrorDialog(false);
//         setError('');

//         // Use fallback data and continue
//         const fallbackSubscriber = createFallbackSubscriber();
//         const fallbackNumbers = [
//             { ServiceNumber: '251123456789', Level: '1' },
//             { ServiceNumber: '251123456790', Level: '1' },
//         ];

//         router.visit(
//             route('subscriber.create', {
//                 id: survey.customer_survey_order_id,
//                 customer_code: survey.customer_code,
//                 offering_id: survey.main_offer_id || survey.offering_id,
//                 subscriber_data: fallbackSubscriber.data,
//                 available_numbers: fallbackNumbers,
//                 survey_data: survey,
//                 is_fallback: true,
//                 subscriber_created: true,
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

//     const canCancel = ['waiting', 'completed'].includes(survey.status?.toLowerCase());
//     const canDelete = ['cancelled', 'completed'].includes(survey.status?.toLowerCase());
//     const canViewDetail = ['cancelled', 'rejected', 'subscribed'].includes(survey.status?.toLowerCase());
//     const canContinue = survey.status?.toLowerCase() === 'completed';

//     return (
//         <>
//             <div className="flex items-center gap-2">
//                 {/* Primary Actions */}
//                 <div className="flex gap-2">
//                     {canContinue && (
//                         <button
//                             onClick={handleContinueToService}
//                             disabled={loading}
//                             className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
//                         >
//                             {loading ? (
//                                 <>
//                                     <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white"></div>
//                                     Processing...
//                                 </>
//                             ) : (
//                                 <>
//                                     <Play className="h-3 w-3" />
//                                     Continue
//                                 </>
//                             )}
//                         </button>
//                     )}
//                 </div>

//                 {/* Dropdown for additional actions */}
//                 <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                         <button disabled={loading} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50">
//                             <MoreVertical className="h-4 w-4" />
//                         </button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end" className="w-48">
//                         {/* {canViewDetail && (
//                             <DropdownMenuItem onClick={handleViewDetails}>
//                                 <Eye className="mr-2 h-4 w-4" />
//                                 View Details
//                             </DropdownMenuItem>
//                         )} */}

//                         {canCancel && (
//                             <DropdownMenuItem onClick={() => setOpenCancelDialog(true)} className="text-orange-600">
//                                 <X className="mr-2 h-4 w-4" />
//                                 Cancel Survey
//                             </DropdownMenuItem>
//                         )}

//                         {/* {canDelete && (
//                             <>
//                                 <DropdownMenuSeparator />
//                                 <DropdownMenuItem onClick={() => setOpenDeleteDialog(true)} className="text-red-600">
//                                     <Trash2 className="mr-2 h-4 w-4" />
//                                     Delete Survey
//                                 </DropdownMenuItem>
//                             </>
//                         )} */}
//                     </DropdownMenuContent>
//                 </DropdownMenu>
//             </div>

//             {/* Error Dialog */}
//             {showErrorDialog && (
//                 <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
//                     <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
//                         <div className="mb-4 flex items-center">
//                             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
//                                 <X className="h-5 w-5 text-red-600" />
//                             </div>
//                             <h3 className="ml-3 text-lg font-medium text-gray-900">Subscription Error</h3>
//                         </div>

//                         <div className="mb-4">
//                             <p className="mb-2 text-sm text-gray-600">{error || 'Failed to create subscriber. This might be due to:'}</p>
//                             <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
//                                 <li>API service temporarily unavailable</li>
//                                 <li>Network connectivity issues</li>
//                                 <li>Service maintenance</li>
//                             </ul>
//                         </div>

//                         <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
//                             <button
//                                 onClick={() => setShowErrorDialog(false)}
//                                 className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={handleContinueWithFallback}
//                                 className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:outline-none"
//                             >
//                                 Continue in Development Mode
//                             </button>
//                         </div>
//                     </div>
//                 </div>
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

import { router } from '@inertiajs/react';
import { Play, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    const [customerData, setCustomerData] = useState(null);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [openDetailModal, setOpenDetailModal] = useState(false);

    useEffect(() => {
        // Load data from localStorage
        const customerDataString = localStorage.getItem('activeCustomer');

        if (customerDataString) {
            try {
                setCustomerData(JSON.parse(customerDataString));
            } catch (e) {
                console.error('Error parsing customer data:', e);
                setError('Invalid customer data format');
            }
        }
    }, []);

    // const handleViewDetails = () => {
    //     router.visit(`/survey-requests/detail/${survey.customer_survey_order_id}?customer_code=${survey.customer_code}`);
    // };
    const handleViewDetails = () => {
        setOpenDetailModal(true);
    };

    // const handleCancel = async (cancellationReason?: string) => {
    //     setLoading(true);
    //     onUpdatingChange(true);
    //     try {
    //         console.log('Cancelling survey order with ID:', survey.customer_survey_order_id);
    //         const response = await fetch('/api/v1/cancel-survey-order', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 // customer_code: survey.customer_code,
    //                 customer_survey_order_id: survey.customer_survey_order_id,
    //                 // cancellation_reason: cancellationReason,
    //             }),
    //         });
    //         console.log('Cancel response:', response);
    //         console.log('Response status:', response.status);

    //         // const result = await response.json();
    //         // console.log('Cancel result:', result);

    //         if (response.status == 200) {
    //             onActionComplete();
    //         } else {
    //             alert(response.message || 'Failed to cancel survey order');
    //         }
    //     } catch (err) {
    //         alert('Failed to cancel survey order');
    //         console.error('Cancel error:', err);
    //     } finally {
    //         setLoading(false);
    //         onUpdatingChange(false);
    //         setOpenCancelDialog(false);
    //     }
    // };

    const handleCancel = async (cancellationReason?: string) => {
        if (!cancellationReason) {
            alert('Please provide a reason for cancellation.');
            return;
        }

        setLoading(true);
        onUpdatingChange(true);

        try {
            console.log('Cancelling survey order with ID:', survey.customer_survey_order_id);

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

            console.log('Cancel result:', result);

            if (response.ok && result.success) {
                onActionComplete();
            } else {
                alert(result.message || 'Failed to cancel survey order');
            }
        } catch (err) {
            console.error('Cancel error:', err);
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
            console.error('Delete error:', err);
        } finally {
            setLoading(false);
            onUpdatingChange(false);
            setOpenDeleteDialog(false);
        }
    };

    const createFallbackSubscriber = () => {
        const addressInfo = getAddressInfo();
        const contactInfo = getContactInfo();
        const customerInfo = getCustomerInfo();

        return {
            success: true,
            data: {
                subscriber_id: `dev_${Date.now()}`,
                customer_code: survey.customer_code,
                first_name: customerInfo.first_name,
                last_name: customerInfo.last_name,
                service_type: survey.service_type || 'Internet',
                status: 'active',
                created_at: new Date().toISOString(),
                address: addressInfo,
                contact: contactInfo,
                customer: customerInfo,
            },
            message: 'Subscriber created successfully (Development Mode)',
            isFallback: true,
        };
    };

    const fetchAvailableNumbersWithFallback = async () => {
        try {
            const numbersResponse = await fetch('/api/v1/avaiable-number', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pay_mode: '1',
                    tele_type: '4',
                    need_query_by_dept: false,
                    res_cnt: 1,
                }),
            });

            const numbersResult = await numbersResponse.json();

            if (Array.isArray(numbersResult) && numbersResult.length > 0) {
                return numbersResult;
            } else {
                console.warn('Using fallback numbers for development');
                return [
                    { ServiceNumber: '251123456789', Level: '1' },
                    { ServiceNumber: '251123456790', Level: '1' },
                    { ServiceNumber: '251123456791', Level: '2' },
                ];
            }
        } catch (err) {
            console.error('Failed to fetch numbers, using fallback:', err);
            return [
                { ServiceNumber: '251123456789', Level: '1' },
                { ServiceNumber: '251123456790', Level: '1' },
            ];
        }
    };

    const handleContinueToService = async () => {
        if (!customerData) {
            setError('No customer data found. Please complete the survey first.');
            setShowErrorDialog(true);
            return;
        }

        console.log('Customer Data:', customerData);
        console.log('Survey Data:', survey);

        setLoading(true);
        onUpdatingChange(true);
        setError('');

        try {
            const addressInfo = getAddressInfo();
            const contactInfo = getContactInfo();
            const customerInfo = getCustomerInfo();

            // Create subscriber immediately
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

            // Validate required fields
            const requiredFields = ['offering_id', 'first_name', 'last_name', 'sms_no'];
            const missingFields = requiredFields.filter((field) => !payload[field]);

            if (missingFields.length > 0) {
                setError(`Missing required fields: ${missingFields.join(', ')}`);
                setShowErrorDialog(true);
                setLoading(false);
                return;
            }

            let subscriberResult;
            let availableNumbers;

            try {
                // Attempt to create real subscriber
                console.log('Creating subscriber with payload:', payload);
                const response = await fetch('/api/v1/services/subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                // subscriberResult = await response.json();
                // console.log('Subscriber creation response:', subscriberResult);

                // if (!subscriberResult.success) {
                //     console.warn('Real subscriber creation failed, using fallback:', subscriberResult.message);
                //     subscriberResult = createFallbackSubscriber();
                // }
                subscriberResult = await response.json();
                console.log('Subscriber creation response:', subscriberResult);
                // console.log(subscriberResult.data.original.success);

                if (subscriberResult.data.original.success === false) {
                    console.log(subscriberResult.data.original.message);
                    console.log('Subscriber creation failed, falling back to development mode.');
                    console.warn('Real subscriber creation failed, using fallback:', subscriberResult.data.original.message);
                    setError(`Subscriber creation failed: ${subscriberResult.data.original.message}`);
                    setShowErrorDialog(true);
                    subscriberResult = createFallbackSubscriber();
                }
            } catch (err) {
                console.warn('Network error, using fallback subscriber:', err);
                subscriberResult = createFallbackSubscriber();
            }

            // Query available numbers (with fallback)
            availableNumbers = await fetchAvailableNumbersWithFallback();
            console.log('Available numbers:', availableNumbers);

            // Navigate to subscriber create page with all data
            // router.visit(
            //     route('subscriber.create', {
            //         id: survey.customer_survey_order_id,
            //         customer_code: survey.customer_code,
            //         offering_id: survey.main_offer_id || survey.offering_id,
            //         available_numbers: availableNumbers,
            //     }),
            // );
            setTimeout(() => {
                // Navigate to subscriber create page with all data
                router.visit(
                    route('subscriber.create', {
                        id: survey.customer_survey_order_id,
                        customer_code: survey.customer_code,
                        offering_id: survey.main_offer_id || survey.offering_id,
                        available_numbers: availableNumbers,
                    }),
                );
            }, 5000); // 5000ms = 5 seconds
        } catch (err) {
            console.error('Unexpected error in continue to service:', err);
            setError('An unexpected error occurred. Please try again.');
            setShowErrorDialog(true);
        } finally {
            setLoading(false);
            onUpdatingChange(false);
        }
    };

    const handleContinueWithFallback = () => {
        setShowErrorDialog(false);
        setError('');

        // Use fallback data and continue
        const fallbackSubscriber = createFallbackSubscriber();
        const fallbackNumbers = [
            { ServiceNumber: '251123456789', Level: '1' },
            { ServiceNumber: '251123456790', Level: '1' },
        ];

        router.visit(
            route('subscriber.create', {
                id: survey.customer_survey_order_id,
                customer_code: survey.customer_code,
                offering_id: survey.main_offer_id || survey.offering_id,
                subscriber_data: fallbackSubscriber.data,
                available_numbers: fallbackNumbers,
                survey_data: survey,
                is_fallback: true,
                subscriber_created: true,
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
            return {
                name1: 'Test',
                name2: 'User',
                mobile: '251911234567',
            };
        }
        const contact = customerData.contacts[0];
        return {
            name1: contact.name1 || 'Test',
            name2: contact.name2 || 'User',
            mobile: contact.mobile || '251911234567',
        };
    };

    const getCustomerInfo = () => {
        if (!customerData?.customer) {
            return {
                first_name: 'Test',
                middle_name: '',
                last_name: 'User',
                enterprise_name: 'Test Enterprise',
            };
        }
        const customer = customerData.customer;
        return {
            first_name: customer.first_name || 'Test',
            middle_name: customer.middle_name || '',
            last_name: customer.last_name || 'User',
            enterprise_name: customer.enterprise_name || customer.first_name || 'Test Enterprise',
        };
    };

    const canCancel = ['waiting', 'completed'].includes(survey.status?.toLowerCase());
    const canDelete = ['cancelled', 'completed'].includes(survey.status?.toLowerCase());
    const canViewDetail = ['cancelled', 'rejected', 'subscribed'].includes(survey.status?.toLowerCase());
    const canContinue = survey.status?.toLowerCase() === 'completed';

    return (
        <>
            <div className="flex items-center gap-2">
                {/* Primary Actions */}
                <div className="flex gap-2">
                    {canContinue && (
                        <button
                            onClick={handleContinueToService}
                            disabled={loading}
                            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Play className="h-3 w-3" />
                                    Convert
                                </>
                            )}
                        </button>
                    )}
                </div>
                <div>
                    {canCancel && (
                        <Button size="sm" variant="destructive" onClick={() => setOpenCancelDialog(true)}>
                            Cancel
                        </Button>
                    )}
                </div>

                {/* Dropdown for additional actions */}
                {/* <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button disabled={loading} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48"> */}
                {/* {canViewDetail && (
                            <DropdownMenuItem onClick={handleViewDetails}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                        )} */}

                {/* {canCancel && (
                            <DropdownMenuItem onClick={() => setOpenCancelDialog(true)} className="text-orange-600">
                                <X className="mr-2 h-4 w-4" />
                                Cancel Survey
                            </DropdownMenuItem>
                        )} */}

                {/* {canDelete && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setOpenDeleteDialog(true)} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Survey
                                </DropdownMenuItem>
                            </>
                        )} */}
                {/* </DropdownMenuContent>
                </DropdownMenu> */}
            </div>

            {/* Error Dialog */}
            {showErrorDialog && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                <X className="h-5 w-5 text-red-600" />
                            </div>
                            <h3 className="ml-3 text-lg font-medium text-gray-900">Subscription Error</h3>
                        </div>

                        <div className="mb-4">
                            <p className="mb-2 text-sm text-gray-600">{error || 'Failed to create subscriber. This might be due to:'}</p>
                            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                                <li>API service temporarily unavailable</li>
                                <li>Network connectivity issues</li>
                                <li>Service maintenance</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => setShowErrorDialog(false)}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleContinueWithFallback}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                Continue in Development Mode
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Dialog */}
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

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={openDeleteDialog}
                onOpenChange={setOpenDeleteDialog}
                onConfirm={handleDelete}
                loading={loading}
                title="Delete Survey Order"
                description="This will permanently delete the survey order from the system. This action cannot be undone."
                confirmText={loading ? 'Deleting...' : 'Yes, Delete'}
                cancelText="No, Keep It"
            />

            <SurveyDetailModal open={openDetailModal} onOpenChange={setOpenDetailModal} survey={survey} />
        </>
    );
}
