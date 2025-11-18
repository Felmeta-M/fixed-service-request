// // components/services/ServicesSidebar.tsx
// 'use client';

// import { usePage } from '@inertiajs/react';

// interface ServicesSidebarProps {
//     currentStep?: number;
//     steps?: Array<{
//         name: string;
//         description: string;
//         status: 'complete' | 'current' | 'upcoming';
//     }>;
//     mode: 'list' | 'create';
// }

// export function ServicesSidebar({ currentStep = 0, steps = [], mode }: ServicesSidebarProps) {
//     const { url } = usePage();

//     if (mode === 'create') {
//         return (
//             <div className="p-6">
//                 <h2 className="mb-6 text-lg font-semibold text-gray-900">Service Setup</h2>
//                 <nav aria-label="Progress">
//                     <ol role="list" className="overflow-hidden">
//                         {steps.map((step, stepIdx) => (
//                             <li key={step.name} className={stepIdx !== steps.length - 1 ? 'pb-10' : ''}>
//                                 {step.status === 'complete' ? (
//                                     <>
//                                         {stepIdx !== steps.length - 1 && (
//                                             <div className="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-indigo-600" />
//                                         )}
//                                         <div className="group relative flex items-start">
//                                             <span className="flex h-9 items-center">
//                                                 <span className="relative z-10 flex size-8 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
//                                                     <CheckIcon className="size-5 text-white" />
//                                                 </span>
//                                             </span>
//                                             <span className="ml-4 flex min-w-0 flex-col">
//                                                 <span className="text-sm font-medium text-gray-900">{step.name}</span>
//                                                 <span className="text-sm text-gray-500">{step.description}</span>
//                                             </span>
//                                         </div>
//                                     </>
//                                 ) : step.status === 'current' ? (
//                                     <>
//                                         {stepIdx !== steps.length - 1 && (
//                                             <div className="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-gray-300" />
//                                         )}
//                                         <div className="group relative flex items-start" aria-current="step">
//                                             <span className="flex h-9 items-center">
//                                                 <span className="relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
//                                                     <span className="size-2.5 rounded-full bg-indigo-600" />
//                                                 </span>
//                                             </span>
//                                             <span className="ml-4 flex min-w-0 flex-col">
//                                                 <span className="text-sm font-medium text-indigo-600">{step.name}</span>
//                                                 <span className="text-sm text-gray-500">{step.description}</span>
//                                             </span>
//                                         </div>
//                                     </>
//                                 ) : (
//                                     <>
//                                         {stepIdx !== steps.length - 1 && (
//                                             <div className="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-gray-300" />
//                                         )}
//                                         <div className="group relative flex items-start">
//                                             <span className="flex h-9 items-center">
//                                                 <span className="relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
//                                                     <span className="size-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
//                                                 </span>
//                                             </span>
//                                             <span className="ml-4 flex min-w-0 flex-col">
//                                                 <span className="text-sm font-medium text-gray-500">{step.name}</span>
//                                                 <span className="text-sm text-gray-500">{step.description}</span>
//                                             </span>
//                                         </div>
//                                     </>
//                                 )}
//                             </li>
//                         ))}
//                     </ol>
//                 </nav>
//             </div>
//         );
//     }

//     // List mode sidebar
//     return (
//         <div className="p-6">
//             <h2 className="mb-6 text-lg font-semibold text-gray-900">Services</h2>
//             <div className="space-y-4">
//                 <div className="rounded-lg bg-blue-50 p-4">
//                     <h3 className="font-medium text-blue-900">Quick Actions</h3>
//                     <p className="mt-1 text-sm text-blue-700">Manage your services efficiently</p>
//                 </div>

//                 <div className="space-y-2">
//                     <div className="flex cursor-pointer items-center rounded-lg p-3 hover:bg-gray-100">
//                         <div className="mr-3 h-2 w-2 rounded-full bg-green-500"></div>
//                         <span className="text-sm font-medium">Active Services</span>
//                     </div>
//                     <div className="flex cursor-pointer items-center rounded-lg p-3 hover:bg-gray-100">
//                         <div className="mr-3 h-2 w-2 rounded-full bg-yellow-500"></div>
//                         <span className="text-sm font-medium">Pending Requests</span>
//                     </div>
//                     <div className="flex cursor-pointer items-center rounded-lg p-3 hover:bg-gray-100">
//                         <div className="mr-3 h-2 w-2 rounded-full bg-blue-500"></div>
//                         <span className="text-sm font-medium">Service History</span>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
//     return (
//         <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//         </svg>
//     );
// }

// components/services/ServicesSidebar.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { BarChart3, CheckCircle, Home } from 'lucide-react';

interface ServicesSidebarProps {
    currentStep?: number;
    steps?: Array<{
        name: string;
        description: string;
        status: 'complete' | 'current' | 'upcoming';
    }>;
    mode: 'list' | 'create';
}

const createServiceSteps = [
    {
        name: 'Service Selection',
        description: 'Choose service type and configuration',
    },
    {
        name: 'Location Setup',
        description: 'Select installation location',
    },
    {
        name: 'Review & Submit',
        description: 'Verify details and submit',
    },
];

export function ServicesSidebar({ currentStep = 0, steps, mode }: ServicesSidebarProps) {
    if (mode === 'create') {
        const displaySteps =
            steps ||
            createServiceSteps.map((step, index) => ({
                ...step,
                status: index < currentStep ? 'complete' : index === currentStep ? 'current' : 'upcoming',
            }));

        return (
            <div className="p-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">New Service Request</CardTitle>
                        <CardDescription>Get started with fixed services</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <nav aria-label="Progress">
                            <ol role="list" className="overflow-hidden">
                                {displaySteps.map((step, stepIdx) => (
                                    <li key={step.name} className={stepIdx !== displaySteps.length - 1 ? 'pb-8' : ''}>
                                        {step.status === 'complete' ? (
                                            <>
                                                {stepIdx !== displaySteps.length - 1 && (
                                                    <div
                                                        className="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-indigo-600"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <div className="group relative flex items-start">
                                                    <span className="flex h-9 items-center">
                                                        <span className="relative z-10 flex size-8 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                                                            <CheckCircle className="size-5 text-white" />
                                                        </span>
                                                    </span>
                                                    <span className="ml-4 flex min-w-0 flex-col">
                                                        <span className="text-sm font-medium text-gray-900">{step.name}</span>
                                                        <span className="text-sm text-gray-500">{step.description}</span>
                                                    </span>
                                                </div>
                                            </>
                                        ) : step.status === 'current' ? (
                                            <>
                                                {stepIdx !== displaySteps.length - 1 && (
                                                    <div
                                                        className="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-gray-300"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <div className="group relative flex items-start" aria-current="step">
                                                    <span className="flex h-9 items-center">
                                                        <span className="relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
                                                            <span className="size-2.5 rounded-full bg-indigo-600" />
                                                        </span>
                                                    </span>
                                                    <span className="ml-4 flex min-w-0 flex-col">
                                                        <span className="text-sm font-medium text-indigo-600">{step.name}</span>
                                                        <span className="text-sm text-gray-500">{step.description}</span>
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {stepIdx !== displaySteps.length - 1 && (
                                                    <div
                                                        className="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-gray-300"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <div className="group relative flex items-start">
                                                    <span className="flex h-9 items-center">
                                                        <span className="relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                                                            <span className="size-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                                                        </span>
                                                    </span>
                                                    <span className="ml-4 flex min-w-0 flex-col">
                                                        <span className="text-sm font-medium text-gray-500">{step.name}</span>
                                                        <span className="text-sm text-gray-500">{step.description}</span>
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </nav>

                        <div className="border-t pt-4">
                            <Link href="/dashboard" className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    View Dashboard
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // List mode sidebar
    return (
        <div className="p-6">
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Services</CardTitle>
                    <CardDescription>Manage your telecom services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <h3 className="font-medium text-blue-900">Quick Actions</h3>
                        <p className="mt-1 text-sm text-blue-700">Manage your services efficiently</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex cursor-pointer items-center rounded-lg border p-3 hover:bg-gray-100">
                            <div className="mr-3 h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-medium">Active Services</span>
                        </div>
                        <div className="flex cursor-pointer items-center rounded-lg border p-3 hover:bg-gray-100">
                            <div className="mr-3 h-2 w-2 rounded-full bg-yellow-500"></div>
                            <span className="text-sm font-medium">Pending Requests</span>
                        </div>
                        <div className="flex cursor-pointer items-center rounded-lg border p-3 hover:bg-gray-100">
                            <div className="mr-3 h-2 w-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-medium">Service History</span>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <Link href="/" className="mb-2 block">
                            <Button variant="outline" className="w-full justify-start">
                                <Home className="mr-2 h-4 w-4" />
                                Back to Home
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button variant="outline" className="w-full justify-start">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                View Analytics
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
