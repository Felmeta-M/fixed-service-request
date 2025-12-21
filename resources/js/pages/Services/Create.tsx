import { ServiceCreationFlow } from '@/components/service/service-creation-flow';
import MainLayout from '@/layouts/main-layout';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function CreateServicePage({ googleMapsApiKey }: { googleMapsApiKey: string }) {
    const [currentStep, setCurrentStep] = useState(0);
    const { auth } = usePage().props;
    console.log("🚀 ~ CreateServicePage ~ auth:", auth)
    const isNewCustomer = !auth.user?.customer_code;
    const { user } = auth;
    console.log("🚀 ~ User :", user)

    return (
        <MainLayout currentStep={currentStep} isNewCustomer={isNewCustomer}>
            <div className="mx-auto max-w-4xl">
                <ServiceCreationFlow
                    currentStep={currentStep}
                    onStepChange={setCurrentStep}
                    googleMapsApiKey={googleMapsApiKey}
                    isNewCustomer={isNewCustomer}
                />
            </div>
        </MainLayout>
    );
}
