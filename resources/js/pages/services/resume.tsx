import { ServiceResumeFlow } from '@/features/services/components/service-resume-flow';
import MainLayout from '@/layouts/main-layout';
import { useState } from 'react';

interface ResumeServicePageProps {
    googleMapsApiKey: string;
    customerSurveyOrderId: string;
}

export default function ResumeServicePage({ googleMapsApiKey, customerSurveyOrderId }: ResumeServicePageProps) {
    // Resume flow starts at Device Selection step (step 2 for existing customers)
    const [currentStep, setCurrentStep] = useState(2);

    return (
        <MainLayout currentStep={currentStep}>
            <div className="mx-auto w-full max-w-4xl">
                <ServiceResumeFlow
                    currentStep={currentStep}
                    onStepChange={setCurrentStep}
                    googleMapsApiKey={googleMapsApiKey}
                    surveyOrderId={customerSurveyOrderId}
                />
            </div>
        </MainLayout>
    );
}
