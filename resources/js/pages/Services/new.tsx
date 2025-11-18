// // pages/services/new.tsx
// import { ServicesSidebar } from '@/components/service/services-sidebar';
// import ServicesLayout from '@/layouts/ServicesLayout';
// import { useState } from 'react';

// const createServiceSteps = [
//     {
//         name: 'Service Selection',
//         description: 'Choose your service type and configuration',
//         status: 'current' as const,
//     },
//     {
//         name: 'Location Setup',
//         description: 'Select installation location',
//         status: 'upcoming' as const,
//     },
//     {
//         name: 'Review & Submit',
//         description: 'Verify details and submit request',
//         status: 'upcoming' as const,
//     },
// ];

// export default function CreateServicePage() {
//     const [currentStep, setCurrentStep] = useState(0);

//     const steps = createServiceSteps.map((step, index) => ({
//         ...step,
//         status: index < currentStep ? 'complete' : index === currentStep ? 'current' : 'upcoming',
//     }));

//     const sidebarContent = <ServicesSidebar mode="create" currentStep={currentStep} steps={steps} />;

//     return (
//         <ServicesLayout sidebarContent={sidebarContent}>
//             <div className="mx-auto max-w-4xl">
//                 <ServiceCreationFlow currentStep={currentStep} onStepChange={setCurrentStep} />
//             </div>
//         </ServicesLayout>
//     );
// }

// pages/services/new.tsx
// import { ServiceCreationFlow } from '@/components/service/service-creation-flow';
// import { ServicesSidebar } from '@/components/service/services-sidebar';
// import ServicesLayout from '@/layouts/ServicesLayout';
// import { useState } from 'react';

// export default function CreateServicePage() {
//     const [currentStep, setCurrentStep] = useState(0);

//     const steps = [
//         {
//             name: 'Service Selection',
//             description: 'Choose service type and configuration',
//             status: 'current' as const,
//         },
//         {
//             name: 'Location Setup',
//             description: 'Select installation location',
//             status: 'upcoming' as const,
//         },
//         {
//             name: 'Review & Submit',
//             description: 'Verify details and submit',
//             status: 'upcoming' as const,
//         },
//     ].map((step, index) => ({
//         ...step,
//         status: index < currentStep ? 'complete' : index === currentStep ? 'current' : 'upcoming',
//     }));

//     const sidebarContent = <ServicesSidebar mode="create" currentStep={currentStep} steps={steps} />;

//     return (
//         <ServicesLayout sidebarContent={sidebarContent}>
//             <div className="mx-auto max-w-4xl">
//                 <ServiceCreationFlow currentStep={currentStep} onStepChange={setCurrentStep} />
//             </div>
//         </ServicesLayout>
//     );
// }

// pages/services/new.tsx
import { ServiceCreationFlow } from '@/components/service/service-creation-flow';
import ServicesLayout from '@/layouts/ServicesLayout';
import { useState } from 'react';

export default function CreateServicePage() {
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <ServicesLayout>
            <div className="mx-auto max-w-4xl">
                <ServiceCreationFlow currentStep={currentStep} onStepChange={setCurrentStep} />
            </div>
        </ServicesLayout>
    );
}
