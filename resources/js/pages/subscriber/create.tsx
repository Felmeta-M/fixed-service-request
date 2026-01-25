import SimpleLayout from '@/layouts/simple-layout';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface User {
    id: number;
    customer_code: string;
    name: string;
    phone: string;
}

interface FeeData {
    fees: Array<{
        item_name: string;
        original_fee: string;
        discount_fee: string;
        taxes?: Array<{
            name: string;
            fee: string;
        }>;
    }>;
    service_number?: string;
}

export default function CreateSubscriber() {
    const { surveyOrderId, offeringId, available_numbers, auth } = usePage().props;
    const { user } = usePage().props.auth

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [surveyData, setSurveyData] = useState(null);
    const [step, setStep] = useState('checkout');
    const [selectedNumber, setSelectedNumber] = useState('');
    const [feeData, setFeeData] = useState<FeeData | null>(null);
    const [calculatedAmount, setCalculatedAmount] = useState(0);
    const [apiErrors, setApiErrors] = useState<{ [key: string]: string }>({});

    const calculateFeeMutation = useCalculateOneOffFee();
    const createPaymentMutation = useCreatePaymentOrder();

    const loading = calculateFeeMutation.isPending || createPaymentMutation.isPending;

    // Enhanced error handling
    const handleApiError = (result: any, context: string = '') => {

        let errorMessage = 'An unexpected error occurred. Please try again.';

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

        return true;
    };

    const clearErrors = () => {
        setError('');
        setApiErrors({});
    };

    // Auto-assign the first available number on component mount
    useEffect(() => {
        if (available_numbers && available_numbers.length > 0) {
            const firstNumber = available_numbers[0]?.ServiceNumber;
            if (firstNumber) {
                setSelectedNumber(firstNumber);
            }
        }
    }, [available_numbers]);

    useEffect(() => {
        // Load survey data from localStorage if needed
        const surveyDataString = localStorage.getItem('customerSurveyData');
        if (surveyDataString) {
            try {
                setSurveyData(JSON.parse(surveyDataString));
            } catch (e) {
                setError('Invalid survey data format');
            }
        }
    }, []);

    const calculateOneOffFee = () => {
        if (!selectedNumber) {
            setError('Please select a service number');
            return;
        }

        if (!user?.customer_code) {
            setError('User customer code not found. Please log in again.');
            return;
        }

        clearErrors();

        calculateFeeMutation.mutate(
            {
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
                    service_number: selectedNumber,
                    offering_id: offeringId || surveyData?.offering_id || '',
                    network_type: 4,
                    sub_type: 0,
                },
            },
            {
                onSuccess: (result) => {
                    // Check for API errors first
                    if (result?.original?.success === false || result?.success === false) {
                        handleApiError(result, 'fee_calculation');
                        return;
                    }

                    if (result.success && result.data?.fees) {
                        setFeeData(result.data);
                        const totalAmount = calculateTotalAmount(result.data.fees);
                        setCalculatedAmount(totalAmount);
                        setStep('payment');
                        setSuccess('Fees calculated successfully');

                        // Clear any previous fee calculation errors
                        setApiErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.fee_calculation;
                            return newErrors;
                        });
                    } else {
                        handleApiError({ message: 'Failed to calculate fees' }, 'fee_calculation');
                    }
                },
                onError: (error: Error) => {
                    handleApiError({ message: error.message || 'Failed to calculate fees' }, 'fee_calculation');
                },
            }
        );
    };

    const generateExternalSequence = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const calculateTotalAmount = (fees: FeeData['fees']) => {
        let total = 0;

        fees.forEach((fee) => {
            total += parseInt(fee.original_fee) / 10000;
            total -= parseInt(fee.discount_fee) / 10000;

            if (fee.taxes && fee.taxes.length > 0) {
                fee.taxes.forEach((tax) => {
                    total += parseInt(tax.fee) / 10000;
                });
            }
        });

        return total;
    };

    const handlePayment = () => {
        clearErrors();

        if (!user?.customer_code) {
            setError('User customer code not found. Please log in again.');
            return;
        }

        if (calculatedAmount <= 0) {
            setError('Invalid payment amount. Please try calculating fees again.');
            return;
        }

        createPaymentMutation.mutate(
            {
                customerSurveyOrderId: surveyOrderId,
                customerCode: user.customer_code,
                amount: calculatedAmount,
            },
            {
                onSuccess: (result) => {
                    // Check for API errors first
                    if (result?.original?.success === false || result?.success === false) {
                        handleApiError(result, 'payment_creation');
                        return;
                    }

                    if (result.success && result.rawRequest) {
                        setSuccess('Payment order created successfully. Redirecting...');
                        // Small delay to show success message before redirect
                        setTimeout(() => {
                            window.location.href = result.rawRequest;
                        }, 1000);
                    } else {
                        handleApiError({ message: 'Failed to create payment order' }, 'payment_creation');
                    }
                },
                onError: (error: Error) => {
                    handleApiError({ message: error.message || 'Failed to process payment' }, 'payment_creation');
                },
            }
        );
    };

    // Get service type name based on offering ID
    const getServiceTypeName = (offeringId: string) => {
        const serviceTypes: { [key: string]: string } = {
            '1457567289': 'Fixed Broadband',
            '1207609454': 'Fixed Voice',
            '180427974': 'Combo Services',
        };
        return serviceTypes[offeringId] || 'Fixed Broadband';
    };

    // Check if we can proceed to next step (no critical errors)
    const canProceedToPayment = () => {
        return !apiErrors.fee_calculation && calculatedAmount > 0 && feeData && user?.customer_code;
    };

    return (
        <SimpleLayout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-xl">
                        {/* Header */}
                        <div className="bg-primary px-6 py-4">
                            <h1 className="text-2xl font-bold text-white">
                                {step === 'checkout' && 'Service Activation'}
                                {step === 'payment' && 'Payment Summary'}
                            </h1>
                            <p className="text-primary-100 mt-1">
                                {step === 'checkout' && 'Complete your service activation'}
                                {step === 'payment' && 'Review and complete your payment'}
                            </p>
                            {/* User Info in Header */}
                            <div className="text-primary-200 mt-2 flex items-center text-sm">
                                <span>
                                    Customer: {user?.name} ({user?.customer_code})
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Error Display */}
                            {(error || Object.keys(apiErrors).length > 0) && (
                                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                                    <div className="flex items-start">
                                        <svg className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <div className="flex-1">
                                            <span className="font-medium text-red-800">{error || 'Please fix the following errors:'}</span>
                                            {Object.keys(apiErrors).length > 0 && (
                                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                                                    {Object.entries(apiErrors).map(([key, value]) => (
                                                        <li key={key}>{value}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                                    <div className="flex items-center">
                                        <svg className="mr-3 h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="text-green-800">{success}</span>
                                    </div>
                                </div>
                            )}

                            {step === 'checkout' && (
                                <>
                                    {/* Customer Information Card */}
                                    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                        <h2 className="mb-4 text-xl font-semibold text-gray-900">Customer Information</h2>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <InfoField label="Customer Name" value={user?.name} />
                                            <InfoField label="Phone Number" value={user?.phone} />
                                            <InfoField label="Customer Code" value={user?.customer_code} highlight={true} />
                                        </div>
                                    </div>

                                    {/* Service Information Card */}
                                    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                        <h2 className="mb-6 text-xl font-semibold text-gray-900">Service Information</h2>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <InfoField label="Order Number" value={surveyOrderId} />
                                            <InfoField label="Service" value="Fixed Broadband" />
                                            <InfoField label="Service Type" value="New Connection" />
                                            <InfoField label="Assigned Service Number" value={selectedNumber || 'Loading...'} highlight={true} />
                                        </div>

                                        {!selectedNumber && (
                                            <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                                <div className="flex items-center">
                                                    <svg className="mr-2 h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span className="text-yellow-800">No service numbers available at the moment</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Show fee calculation error specifically */}
                                        {apiErrors.fee_calculation && (
                                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                                                <div className="flex items-center">
                                                    <svg className="mr-2 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span className="text-red-700">{apiErrors.fee_calculation}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
                                        <button
                                            onClick={() => router.visit('/dashboard')}
                                            className="rounded-lg border border-gray-300 px-8 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
                                            disabled={loading}
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={calculateOneOffFee}
                                            disabled={loading || !selectedNumber || !!apiErrors.fee_calculation || !user?.customer_code}
                                            className="rounded-lg bg-primary px-8 py-3 font-medium text-white transition-colors hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <span className="flex items-center">
                                                    <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        ></path>
                                                    </svg>
                                                    Calculating Fees...
                                                </span>
                                            ) : (
                                                'Continue'
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Payment Summary Step */}
                            {step === 'payment' && feeData && (
                                <>
                                    <div className="mb-8">
                                        <h2 className="mb-6 text-xl font-semibold text-gray-900">Payment Summary</h2>

                                        {/* Customer Summary Card */}
                                        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-700">Customer</h3>
                                                    <p className="text-gray-900">
                                                        {user?.name} ({user?.customer_code})
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">Phone</p>
                                                    <p className="font-medium text-gray-900">{user?.phone}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Service Summary Card */}
                                        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-blue-900">Service Number</h3>
                                                    <p className="text-2xl font-bold text-blue-900">{selectedNumber}</p>
                                                    <p className="mt-1 text-sm text-blue-600">{getServiceTypeName(offeringId)} Service</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-blue-600">Order Number</p>
                                                    <p className="font-semibold text-blue-900">{surveyOrderId}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Invoice Breakdown Card */}
                                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Invoice Breakdown</h3>
                                            <div className="space-y-3">
                                                {feeData.fees.map((fee, index) => (
                                                    <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                        <div>
                                                            <span className="font-medium text-gray-900">{fee.item_name}</span>
                                                            {fee.taxes && fee.taxes.length > 0 && (
                                                                <div className="mt-1 space-y-1">
                                                                    {fee.taxes.map((tax, taxIndex) => (
                                                                        <div key={`tax-${taxIndex}`} className="flex justify-between text-sm">
                                                                            <span className="ml-4 text-gray-500">+ {tax.name}</span>
                                                                            <span className="text-gray-500">{parseInt(tax.fee) / 10000} ETB</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="font-semibold text-gray-900">{parseInt(fee.original_fee) / 10000} ETB</span>
                                                    </div>
                                                ))}

                                                <div className="border-t border-gray-200 pt-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                                        <span className="text-2xl font-bold text-primary">{calculatedAmount} ETB</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment creation error */}
                                        {apiErrors.payment_creation && (
                                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                                                <div className="flex items-center">
                                                    <svg className="mr-2 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span className="text-red-700">{apiErrors.payment_creation}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
                                        <button
                                            onClick={() => {
                                                clearErrors();
                                                setStep('checkout');
                                            }}
                                            className="rounded-lg border border-gray-300 px-8 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
                                            disabled={loading}
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handlePayment}
                                            disabled={loading || !!apiErrors.payment_creation || !canProceedToPayment()}
                                            className="rounded-lg bg-primary px-8 py-3 font-medium text-white transition-colors hover:opacity-90 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <span className="flex items-center">
                                                    <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        ></path>
                                                    </svg>
                                                    Processing Payment...
                                                </span>
                                            ) : (
                                                'Pay Now'
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SimpleLayout>
    );
}

function InfoField({ label, value, highlight = false }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-600">{label}</label>
            <p
                className={`mt-1 rounded-md p-2 text-sm ${highlight ? 'border border-primary/20 bg-primary/10 font-semibold text-primary' : 'bg-gray-50 text-gray-900'}`}
            >
                {value || <span className="text-gray-400">Not provided</span>}
            </p>
        </div>
    );
}
