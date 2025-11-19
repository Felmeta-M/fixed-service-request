
'use client';

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from '@/components/ui/sidebar';
import { usePage } from '@inertiajs/react';
import { CheckCircle, FileText, MapPin, Wifi } from 'lucide-react';

// Steps for service creation
const createServiceSteps = [
    {
        name: 'Service Selection',
        // description: 'Choose service type and configuration',
        icon: Wifi,
    },
    {
        name: 'Location Setup',
        // description: 'Select installation location',
        icon: MapPin,
    },
    {
        name: 'Review & Submit',
        // description: 'Verify details and submit',
        icon: FileText,
    },
];

interface AppSidebarProps {
    currentStep?: number;
    mode?: 'list' | 'create';
}
export function MultistepSidebar({ currentStep = 0, mode = 'list' }: AppSidebarProps) {
    const { url } = usePage();
    const displayMode = mode === 'create' || url.includes('/services/new') ? 'create' : 'list';

    if (displayMode === 'create') {
        const steps = createServiceSteps.map((step, index) => ({
            ...step,
            status: index < currentStep ? 'complete' : index === currentStep ? 'current' : 'upcoming',
        }));

        return (
            <Sidebar className="mt-16">
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel className="mb-4 text-lg font-semibold">Service Setup Progress</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <ol role="list" className="relative">
                                {steps.map((step, idx) => {
                                    const isCompleted = step.status === 'complete';
                                    const isCurrent = step.status === 'current';

                                    return (
                                        <li key={step.name} className="relative pb-10">
                                            {/* Connector line - placed on the li itself */}
                                            {idx < steps.length - 1 && (
                                                <div
                                                    className={`absolute top-10 left-5 h-full w-0.5 ${isCompleted ? 'bg-primary' : 'bg-gray-300'}`}
                                                    aria-hidden="true"
                                                />
                                            )}

                                            {/* Circle + Content */}
                                            <div className="relative flex items-center">
                                                {/* Step circle */}
                                                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-lg font-bold">
                                                    {isCompleted ? (
                                                        <CheckCircle className="h-5 w-5 text-primary" />
                                                    ) : (
                                                        <span className={isCurrent ? 'text-primary' : 'text-gray-400'}>{idx + 1}</span>
                                                    )}
                                                </div>

                                                {/* Step content */}
                                                <div className="ml-4 flex min-w-0 flex-col">
                                                    <span
                                                        className={`text-base font-medium ${
                                                            isCompleted ? 'font-bold text-primary' : isCurrent ? 'text-primary' : 'text-gray-600'
                                                        }`}
                                                    >
                                                        {step.name}
                                                    </span>
                                                    {/* {step.description && <span className="text-sm text-gray-500">{step.description}</span>} */}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        );
    }

    return <Sidebar className="mt-14">{/* Existing list sidebar here */}</Sidebar>;
}
