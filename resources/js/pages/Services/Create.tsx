import { ServiceCreationFlow } from '@/components/service/service-creation-flow';
import ServicesLayout from '@/layouts/services-layout';
import { useState } from 'react';

export default function CreateServicePage() {
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <ServicesLayout currentStep={currentStep} onStepChange={setCurrentStep} isCreatingService>
            <div className="mx-auto max-w-4xl">
                <ServiceCreationFlow currentStep={currentStep} onStepChange={setCurrentStep} />
            </div>
        </ServicesLayout>
    );
}
