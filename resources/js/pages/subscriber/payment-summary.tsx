import SurveyDetail from '@/features/surveys/components/survey-detail';
import MainLayout from '@/layouts/main-layout';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function PaymentSummaryPage() {
    const { props } = usePage();
    const { user } = props.auth

    const { payment_details, survey_details } = props;

    const [loading, setLoading] = useState(false);
    // const [survey_data, setsurvey_data] useState({})

    // useEffect(() => {
    //     if (customerSurveyOrderId) {
    //         handleFetchPayment()
    //     }
    // }, [customerSurveyOrderId]);


    // const handleFetchPayment = async () => {
    //     setLoading(true);

    //     try {
    //         const response = await fetch('/api/v1/payment', {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 Authorization: `Bearer ${user.api_token}`,

    //             },
    //             body: JSON.stringify({
    //                 customerSurveyOrderId,
    //             }),
    //         });

    //         const result = await response.json();
    //         // if (result.success && result.rawRequest) {
    //         //     window.location.href = result.rawRequest;
    //         // } else {
    //         //     throw new Error(result.message || 'Failed to create payment order');
    //         // }
    //     } catch (error) {
    //         alert('Failed to process payment. Please try again.');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    return (
        <MainLayout>
            <SurveyDetail paymentDetails={payment_details} surveyDetails ={survey_details} />
        </MainLayout>
    );
}

