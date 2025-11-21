// import PaymentSummary from '@/components/payment/payment-summary';
// import MainLayout from '@/layouts/main-layout';
// import { usePage } from '@inertiajs/react';
// import { useState } from 'react';

// export default function PaymentSummaryPage() {
//     const { props } = usePage();
//     const { survey_id, subscriber_data, service_number, fee_data, customer_data, survey_data } = props;

//     console.log('Summary Props:', {
//         survey_id,
//         subscriber_data,
//         service_number,
//         fee_data,
//         customer_data,
//         survey_data,
//     });
//     const [loading, setLoading] = useState(false);

//     const handlePaymentConfirm = async () => {
//         setLoading(true);
//         try {
//             // Call your payment API
//             const response = await fetch('/api/v1/create-order', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     title: survey_id,
//                     amount: fee_data.totalAmount,
//                     customer_code: customer_data?.customer?.code || '',
//                     service_number: service_number,
//                     subscriber_id: subscriber_data.subscriber_id,
//                 }),
//             });

//             const result = await response.json();

//             if (result.success && result.rawRequest) {
//                 // Redirect to payment gateway
//                 window.location.href = result.rawRequest;
//             } else {
//                 throw new Error('Failed to create payment order');
//             }
//         } catch (error) {
//             console.error('Payment error:', error);
//             alert('Failed to process payment. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <MainLayout>
//             <PaymentSummary
//                 surveyData={survey_data}
//                 subscriberData={subscriber_data}
//                 serviceNumber={service_number}
//                 feeData={fee_data}
//                 customerData={customer_data}
//                 onPaymentConfirm={handlePaymentConfirm}
//                 loading={loading}
//             />
//         </MainLayout>
//     );
// }

// resources/js/Pages/Subscriber/PaymentSummary.tsx
import PaymentSummary from '@/components/payment/payment-summary';
import MainLayout from '@/layouts/main-layout';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function PaymentSummaryPage() {
    const { props } = usePage();

    const { survey_id, subscriber_data, service_number, fee_data, customer_data, survey_data } = props;

    console.log('Summary Props:', {
        survey_id,
        subscriber_data,
        service_number,
        fee_data,
        customer_data,
        survey_data,
    });

    console.log('🚀 ~ PaymentSummaryPage ~ fee_data:', fee_data);
    if (!survey_data || !subscriber_data) {
        return <div>Loading...</div>;
    }
    const [loading, setLoading] = useState(false);

    const handlePaymentConfirm = async () => {
        setLoading(true);

        try {
            const response = await fetch('/api/v1/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerSurveyOrderId: survey_id,
                    amount: fee_data.totalAmount,
                    customerCode: customer_data?.customer_code || '',
                    service_number: service_number,
                    subscriber_id: subscriber_data.subscriber_id,
                }),
            });

            const result = await response.json();

            if (result.success && result.rawRequest) {
                window.location.href = result.rawRequest;
            } else {
                throw new Error('Failed to create payment order');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to process payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <PaymentSummary
                surveyData={survey_data}
                subscriberData={subscriber_data}
                serviceNumber={service_number}
                feeData={fee_data}
                customerData={customer_data}
                onPaymentConfirm={handlePaymentConfirm}
                loading={loading}
            />
        </MainLayout>
    );
}
