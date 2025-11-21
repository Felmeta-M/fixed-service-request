import AuthLayout from '@/layouts/AuthLayout';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function CreateSubscriber() {
    const { surveyOrderId, offeringId, available_numbers } = usePage().props;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [customerData, setCustomerData] = useState(null);
    const [surveyData, setSurveyData] = useState(null);
    const [step, setStep] = useState('checkout'); // 'checkout', 'payment'
    const [selectedNumber, setSelectedNumber] = useState('');
    const [feeData, setFeeData] = useState(null);
    const [calculatedAmount, setCalculatedAmount] = useState(0);

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
        // Load data from localStorage
        const customerDataString = localStorage.getItem('activeCustomer');
        const surveyDataString = localStorage.getItem('customerSurveyData');

        if (customerDataString) {
            try {
                setCustomerData(JSON.parse(customerDataString));
            } catch (e) {
                console.error('Error parsing customer data:', e);
                setError('Invalid customer data format');
            }
        }

        if (surveyDataString) {
            try {
                setSurveyData(JSON.parse(surveyDataString));
            } catch (e) {
                console.error('Error parsing survey data:', e);
            }
        }
    }, []);

    const calculateOneOffFee = async () => {
        if (!selectedNumber) {
            setError('Please select a service number');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/v1/calc-one-off-fee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                        // service_number: selectedNumber,
                        service_number: '123457155',
                        // offering_id: offeringId || surveyData?.offering_id || customerData?.ext_params?.PrimaryOfferId || '',
                        offering_id: '1207609454',
                        network_type: 4,
                        sub_type: 0,
                    },
                }),
            });

            const result = await response.json();

            if (result.success && result.data?.fees) {
                setFeeData(result.data);
                const totalAmount = calculateTotalAmount(result.data.fees);
                setCalculatedAmount(totalAmount);
                setStep('payment');
            } else {
                setError('Failed to calculate fees');
                // set fake fee data for rolling back
                setFeeData({
                    fees: [
                        {
                            item_name: 'Fallback Fee',
                            original_fee: 10000,
                            discount_fee: 0,
                            taxes: [],
                        },
                    ],
                });
                // setFeeData([{ original_fee: 10000, discount_fee: 0, taxes: [] }]);
                setCalculatedAmount(1);
                setStep('payment');
            }
        } catch (err) {
            console.error('Calculate fee error:', err);
            setError('Failed to calculate fees');
        } finally {
            setLoading(false);
        }
    };

    const generateExternalSequence = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const calculateTotalAmount = (fees) => {
        let total = 0;

        fees.forEach((fee) => {
            // Add original fee (divide by 10000 as per requirement)
            total += parseInt(fee.original_fee) / 10000;

            // Subtract discount
            total -= parseInt(fee.discount_fee) / 10000;

            // Add taxes if any
            if (fee.taxes && fee.taxes.length > 0) {
                fee.taxes.forEach((tax) => {
                    total += parseInt(tax.fee) / 10000;
                });
            }
        });

        return total;
    };

    const handlePayment = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // title: 'Service Subscription Fee',
                    title: surveyOrderId,
                    amount: calculatedAmount,
                    customer_code: customerData?.customer?.code || '',
                }),
            });

            const result = await response.json();

            if (result.success && result.rawRequest) {
                // Redirect to Telebirr payment page
                window.location.href = result.rawRequest;
            } else {
                setError('Failed to create payment order');
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError('Failed to process payment');
        } finally {
            setLoading(false);
        }
    };

    const getAddressInfo = () => {
        if (!customerData?.addresses || customerData.addresses.length === 0) {
            return {
                region: '',
                city: '',
                zone: '',
                wereda: '',
                kebele: '',
                house_no: '',
            };
        }
        const address = customerData.addresses[0];
        return {
            region: address.address1 || '',
            city: address.address2 || '',
            zone: address.address3 || '',
            wereda: address.address4 || '',
            kebele: address.address5 || '',
            house_no: address.address6 || '',
        };
    };

    const getContactInfo = () => {
        if (!customerData?.contacts || customerData.contacts.length === 0) {
            return {
                name1: '',
                name2: '',
                mobile: '',
            };
        }
        const contact = customerData.contacts[0];
        return {
            name1: contact.name1 || '',
            name2: contact.name2 || '',
            mobile: contact.mobile || '',
        };
    };

    const getCustomerInfo = () => {
        if (!customerData?.customer) {
            return {
                first_name: '',
                middle_name: '',
                last_name: '',
                enterprise_name: '',
            };
        }
        const customer = customerData.customer;
        return {
            first_name: customer.first_name || '',
            middle_name: customer.middle_name || '',
            last_name: customer.last_name || '',
            enterprise_name: customer.enterprise_name || customer.first_name || '',
        };
    };

    // Get service type name based on offering ID
    const getServiceTypeName = (offeringId) => {
        const serviceTypes = {
            '1943913915': 'Fixed Broadband',
            '1207609454': 'Fixed Voice',
            '102647257': 'Combo Services',
        };
        return serviceTypes[offeringId] || 'Fixed Broadband';
    };

    return (
        <AuthLayout>
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
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {error && (
                                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                                    <div className="flex items-center">
                                        <svg className="mr-3 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="text-red-800">{error}</span>
                                    </div>
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                                    <div className="flex items-center">
                                        <svg className="mr-3 h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="text-primary">{success}</span>
                                    </div>
                                </div>
                            )}

                            {step === 'checkout' && (
                                <>
                                    {/* Service Information Card */}
                                    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                        <h2 className="mb-6 text-xl font-semibold text-gray-900">Service Information</h2>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <InfoField label="Order Number" value={surveyOrderId} />
                                            <InfoField label="Service" value="Fixed Broadband" />
                                            {/* {getServiceTypeName(offeringId)} /> */}
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
                                            disabled={loading || !selectedNumber}
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
                                    </div>

                                    <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
                                        <button
                                            onClick={() => setStep('checkout')}
                                            className="rounded-lg border border-gray-300 px-8 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
                                            disabled={loading}
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handlePayment}
                                            disabled={loading}
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
        </AuthLayout>
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
