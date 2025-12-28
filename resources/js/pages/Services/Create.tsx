import { ServiceCreationFlow } from '@/components/service/service-creation-flow';
import MainLayout from '@/layouts/main-layout';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function CreateServicePage({ googleMapsApiKey }: { googleMapsApiKey: string }) {
    const [currentStep, setCurrentStep] = useState(0);
    const { auth } = usePage().props;
    console.log("🚀 ~ CreateServicePage ~ auth:", auth)
    
    // Safety check: ensure auth.user exists
    const isNewCustomer = !auth?.user?.customer_code;
    const { user } = auth || {};
    console.log("🚀 ~ User :", user)

    // Track previous isNewCustomer value using ref to avoid infinite loops
    const prevIsNewCustomerRef = useRef(isNewCustomer);
    const hasAdjustedStepRef = useRef(false);
    
    useEffect(() => {
        // Only adjust step when isNewCustomer changes from true to false (customer was just created)
        const wasNewCustomer = prevIsNewCustomerRef.current;
        const isNowExisting = !isNewCustomer && wasNewCustomer;
        
        if (isNowExisting && !hasAdjustedStepRef.current) {
            // Customer was just created, adjust step if needed
            if (currentStep === 1) {
                // We were on step 1 (Service Selection when customer creation was step 0)
                // Now step 1 is Location, so we need to go to step 0 (Service Selection)
                setCurrentStep(0);
                hasAdjustedStepRef.current = true;
            }
        }
        
        // Update ref only when value actually changes
        if (prevIsNewCustomerRef.current !== isNewCustomer) {
            prevIsNewCustomerRef.current = isNewCustomer;
            // Reset adjustment flag when isNewCustomer changes
            if (isNewCustomer) {
                hasAdjustedStepRef.current = false;
            }
        }
    }, [isNewCustomer, currentStep]);

    return (
        <MainLayout currentStep={currentStep} isNewCustomer={isNewCustomer}>
            <div className="w-full mx-auto max-w-4xl">
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
