import { ServiceCreationFlow } from '@/components/service/service-creation-flow';
import MainLayout from '@/layouts/main-layout';
import { useState } from 'react';

export default function CreateServicePage({ googleMapsApiKey }: { googleMapsApiKey: string }) {
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <MainLayout currentStep={currentStep}>
            <div className="mx-auto max-w-4xl">
                <ServiceCreationFlow currentStep={currentStep} onStepChange={setCurrentStep} googleMapsApiKey={googleMapsApiKey} />
            </div>
        </MainLayout>
    );
}
