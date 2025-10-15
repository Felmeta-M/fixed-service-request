import AuthLayout from '@/layouts/AuthLayout';
import { usePage } from '@inertiajs/react';
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
                    title: 'Service Subscription Fee',
                    amount: calculatedAmount,
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

    return (
        <AuthLayout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-xl">
                        {/* Header */}
                        <div className="bg-primary px-6 py-4">
                            <h1 className="text-2xl font-bold text-white">
                                {step === 'checkout' && 'Service Details'}
                                {step === 'payment' && 'Payment Summary'}
                            </h1>
                            <p className="text-primary-100 mt-1">
                                {step === 'checkout' && 'Your service details'}
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
                                    <div className="mb-8">
                                        <div className="mb-8">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <InfoField label="Order Number" value={surveyOrderId} />
                                                <InfoField label="Service" value={surveyData?.survey_type || 'EIC08'} />
                                                {/* <InfoField label="Customer Code" value={customerCode} /> */}
                                                {/* <InfoField label="Offering ID" value={offeringId} /> */}
                                                <InfoField label="Service" value={offeringId} />
                                            </div>
                                        </div>
                                        {/* <h2 className="mb-4 text-lg font-semibold text-gray-900">Available Service Numbers</h2> */}
                                        <h2 className="mb-4 text-gray-600">Your service number: </h2>
                                        {/* <p className="mb-4 text-gray-600">Choose your preferred service number:</p> */}

                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                            {available_numbers.map((number, index) => (
                                                <div
                                                    key={index}
                                                    className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                                                        selectedNumber === number.ServiceNumber
                                                            ? 'border-primary bg-primary text-white'
                                                            : 'border-gray-200 hover:border-primary'
                                                    }`}
                                                    onClick={() => setSelectedNumber(number.ServiceNumber)}
                                                >
                                                    <div className="text-lg font-semibold">{number.ServiceNumber}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
                                        <button
                                            onClick={() => setStep('subscriber')}
                                            className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
                                            disabled={loading}
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={calculateOneOffFee}
                                            disabled={loading || !selectedNumber}
                                            className="hover:bg-primary-dark rounded-md bg-primary px-6 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <span className="flex items-center">
                                                    <svg className="mr-2 -ml-1 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
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
                                                    Calculating...
                                                </span>
                                            ) : (
                                                'Calculate Fees'
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Step 3: Payment Summary */}
                            {step === 'payment' && feeData && (
                                <>
                                    <div className="mb-8">
                                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Summary</h2>

                                        <div className="mb-6 rounded-lg border border-gray-200 p-4">
                                            <div className="mb-4">
                                                <h3 className="font-semibold text-gray-900">Your Service Number</h3>
                                                <p className="text-2xl font-bold text-primary">{selectedNumber}</p>
                                            </div>

                                            <div className="border-t border-gray-200 pt-4">
                                                <h3 className="mb-3 font-semibold text-gray-900">Fee Breakdown</h3>
                                                <div className="space-y-2">
                                                    {feeData.fees.map((fee, index) => (
                                                        <div key={index} className="flex justify-between">
                                                            <span className="text-gray-600">{fee.item_name}</span>
                                                            <span className="font-medium">{parseInt(fee.original_fee) / 10000} ETB</span>
                                                        </div>
                                                    ))}
                                                    {feeData.fees.some((fee) => fee.taxes && fee.taxes.length > 0) &&
                                                        feeData.fees.map((fee) =>
                                                            fee.taxes?.map((tax, taxIndex) => (
                                                                <div key={`tax-${taxIndex}`} className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">{tax.name}</span>
                                                                    <span className="text-gray-500">{parseInt(tax.fee) / 10000} ETB</span>
                                                                </div>
                                                            )),
                                                        )}

                                                    {/* {1200} */}
                                                    <div className="border-t border-gray-200 pt-2">
                                                        <div className="flex justify-between font-semibold">
                                                            <span>Total Amount</span>
                                                            <span className="text-lg text-primary">{calculatedAmount} ETB</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
                                        <button
                                            onClick={() => setStep('checkout')}
                                            className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
                                            disabled={loading}
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handlePayment}
                                            disabled={loading}
                                            className="hover:bg-primary-dark rounded-md bg-primary px-6 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <span className="flex items-center">
                                                    <svg className="mr-2 -ml-1 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
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
                                                    Processing...
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

function InfoField({ label, value }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-600">{label}</label>
            <p className="mt-1 rounded-md bg-gray-50 p-2 text-sm text-gray-900">{value || <span className="text-gray-400">Not provided</span>}</p>
        </div>
    );
}
