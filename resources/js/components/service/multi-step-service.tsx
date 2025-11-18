// 'use client';

// import { useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { CheckCircle, ChevronRight, MapPin, Package, Phone, Wifi, FileText, ArrowLeft } from 'lucide-react';
// import { ServiceSelectionStep } from './steps/service-selection-step';
// import { LocationSetupStep } from './steps/location-setup-step';
// import { ReviewSubmitStep } from './steps/review-submit-step';

// interface ServiceFormData {
//   serviceType: string;
//   bandwidth: string;
// //   customerType: string;
//   latitude: number;
//   longitude: number;
//   address: string;
//   contactPerson: string;
//   contactNo: string;
//   contactEmail: string;
//   resourceAvailable?: boolean;
//   resourceData?: any;
// }

// interface Step {
//   id: string;
//   title: string;
//   description: string;
//   icon: React.ComponentType<any>;
//   status: 'completed' | 'current' | 'upcoming';
// }

// export function MultiStepService() {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [formData, setFormData] = useState<ServiceFormData>({
//     serviceType: '',
//     bandwidth: '',
//     // customerType: '',
//     latitude: 0,
//     longitude: 0,
//     address: '',
//     contactPerson: '',
//     contactNo: '',
//     contactEmail: '',
//   });

//   const steps: Step[] = [
//     {
//       id: 'service',
//       title: 'Service Selection',
//       description: 'Choose your service type and configuration',
//       icon: Wifi,
//       status: currentStep === 0 ? 'current' : currentStep > 0 ? 'completed' : 'upcoming'
//     },
//     {
//       id: 'location',
//       title: 'Location Setup',
//       description: 'Select installation location',
//       icon: MapPin,
//       status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'upcoming'
//     },
//     {
//       id: 'review',
//       title: 'Review & Submit',
//       description: 'Verify details and submit request',
//       icon: FileText,
//       status: currentStep === 2 ? 'current' : 'upcoming'
//     }
//   ];

//   const updateFormData = (newData: Partial<ServiceFormData>) => {
//     setFormData(prev => ({ ...prev, ...newData }));
//   };

//   const nextStep = () => {
//     if (currentStep < steps.length - 1) {
//       setCurrentStep(currentStep + 1);
//     }
//   };

//   const prevStep = () => {
//     if (currentStep > 0) {
//       setCurrentStep(currentStep - 1);
//     }
//   };

//   const canProceedToNextStep = () => {
//     switch (currentStep) {
//       case 0: // Service Selection
//         return formData.serviceType && formData.bandwidth;
//       case 1: // Location Setup
//         return formData.latitude !== 0 && formData.longitude !== 0 && formData.resourceAvailable;
//       case 2: // Review
//         return true;
//       default:
//         return false;
//     }
//   };

//   const renderStepContent = () => {
//     switch (currentStep) {
//       case 0:
//         return (
//           <ServiceSelectionStep
//             formData={formData}
//             onUpdate={updateFormData}
//           />
//         );
//       case 1:
//         return (
//           <LocationSetupStep
//             formData={formData}
//             onUpdate={updateFormData}
//           />
//         );
//       case 2:
//         return (
//           <ReviewSubmitStep
//             formData={formData}
//             onBack={prevStep}
//           />
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
//         <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
//           {/* Sidebar - Steps Navigation */}
//           <div className="lg:col-span-1">
//             <Card className="sticky top-8 border-0 shadow-lg">
//               <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
//                 <CardTitle className="text-lg font-semibold">Service Request</CardTitle>
//                 <CardDescription>Complete all steps to submit your request</CardDescription>
//               </CardHeader>
//               <CardContent className="p-6">
//                 <div className="space-y-6">
//                   {steps.map((step, index) => {
//                     const IconComponent = step.icon;
//                     const isCompleted = step.status === 'completed';
//                     const isCurrent = step.status === 'current';

//                     return (
//                       <div key={step.id} className="flex items-start space-x-4">
//                         {/* Step Number/Status */}
//                         <div className={`
//                           flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold
//                           ${isCompleted
//                             ? 'border-green-500 bg-green-500 text-white'
//                             : isCurrent
//                             ? 'border-primary bg-primary text-white'
//                             : 'border-gray-300 bg-white text-gray-400'
//                           }
//                         `}>
//                           {isCompleted ? (
//                             <CheckCircle className="h-4 w-4" />
//                           ) : (
//                             index + 1
//                           )}
//                         </div>

//                         {/* Step Content */}
//                         <div className="flex-1">
//                           <div className="flex items-center space-x-2">
//                             <IconComponent className={`
//                               h-4 w-4
//                               ${isCompleted ? 'text-green-500' :
//                                 isCurrent ? 'text-primary' :
//                                 'text-gray-400'}
//                             `} />
//                             <h3 className={`
//                               font-semibold
//                               ${isCompleted ? 'text-green-700' :
//                                 isCurrent ? 'text-primary' :
//                                 'text-gray-500'}
//                             `}>
//                               {step.title}
//                             </h3>
//                           </div>
//                           <p className="mt-1 text-sm text-gray-500">
//                             {step.description}
//                           </p>

//                           {/* Progress line */}
//                           {index < steps.length - 1 && (
//                             <div className={`
//                               ml-2 mt-3 h-6 w-0.5
//                               ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
//                             `} />
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>

//                 {/* Progress Summary */}
//                 <div className="mt-8 rounded-lg bg-gray-50 p-4">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Progress</span>
//                     <span className="font-semibold">
//                       {steps.filter(s => s.status === 'completed').length} of {steps.length} steps
//                     </span>
//                   </div>
//                   <div className="mt-2 h-2 rounded-full bg-gray-200">
//                     <div
//                       className="h-full rounded-full bg-primary transition-all duration-300"
//                       style={{
//                         width: `${((steps.filter(s => s.status === 'completed').length + (currentStep === 2 ? 1 : 0)) / steps.length) * 100}%`
//                       }}
//                     />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Main Content */}
//           <div className="lg:col-span-3">
//             <Card className="border-0 shadow-lg">
//               <CardHeader className="border-b bg-white">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <CardTitle className="text-2xl font-bold text-gray-900">
//                       {steps[currentStep].title}
//                     </CardTitle>
//                     <CardDescription className="mt-1 text-gray-600">
//                       {steps[currentStep].description}
//                     </CardDescription>
//                   </div>
//                   <Badge variant="outline" className="bg-primary/10 text-primary">
//                     Step {currentStep + 1} of {steps.length}
//                   </Badge>
//                 </div>
//               </CardHeader>

//               <CardContent className="p-6">
//                 {renderStepContent()}

//                 {/* Navigation Buttons */}
//                 {currentStep < 2 && (
//                   <div className="mt-8 flex justify-between border-t pt-6">
//                     <Button
//                       variant="outline"
//                       onClick={prevStep}
//                       disabled={currentStep === 0}
//                       className="flex items-center space-x-2"
//                     >
//                       <ArrowLeft className="h-4 w-4" />
//                       Previous
//                     </Button>

//                     <Button
//                       onClick={nextStep}
//                       disabled={!canProceedToNextStep()}
//                       className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
//                     >
//                       {currentStep === steps.length - 2 ? 'Review & Submit' : 'Next Step'}
//                       <ChevronRight className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSurveyList } from '@/hooks/use-survey-list';
import { Link } from '@inertiajs/react';
import { ArrowLeft, BarChart3, CheckCircle, ChevronRight, FileText, MapPin, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LocationSetupStep } from './steps/location-setup-step';
import { ReviewSubmitStep } from './steps/review-submit-step';
import { ServiceSelectionStep } from './steps/service-selection-step';

interface ServiceFormData {
    serviceType: string;
    bandwidth: string;
    customerType: string;
    latitude: number;
    longitude: number;
    address: string;
    contactPerson: string;
    contactNo: string;
    contactEmail: string;
    resourceAvailable?: boolean;
    resourceData?: any;
}

interface Step {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    status: 'completed' | 'current' | 'upcoming';
}

export function MultiStepService() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<ServiceFormData>({
        serviceType: '',
        bandwidth: '',
        customerType: '',
        latitude: 0,
        longitude: 0,
        address: '',
        contactPerson: '',
        contactNo: '',
        contactEmail: '',
    });

    const { surveys } = useSurveyList();

    // Load user data from localStorage on component mount
    useEffect(() => {
        const loadUserData = () => {
            try {
                let contactPerson = 'Customer';
                let contactNo = '';
                let contactEmail = '';

                const kycDataString = localStorage.getItem('kycData');
                if (kycDataString) {
                    try {
                        const kycData = JSON.parse(kycDataString);
                        contactPerson = kycData.identity?.name?.eng || 'Customer';
                        contactNo = kycData.identity?.phone || '';
                        contactEmail = kycData.email || '';
                    } catch (e) {
                        console.error('Error parsing KYC data:', e);
                    }
                }

                const customerDataString = localStorage.getItem('activeCustomer');
                if (customerDataString && (!contactNo || contactNo === 'Loading...')) {
                    try {
                        const customerData = JSON.parse(customerDataString);
                        if (customerData.contacts && customerData.contacts.length > 0) {
                            contactPerson = `${customerData.contacts[0].name1 || ''} ${customerData.contacts[0].name2 || ''}`.trim() || contactPerson;
                            contactNo = customerData.contacts[0].mobile || contactNo;
                            contactEmail = customerData.contacts[0].email || contactEmail;
                        }
                        if (customerData.customer) {
                            const customer = customerData.customer;
                            contactPerson =
                                `${customer.first_name || ''} ${customer.middle_name || ''} ${customer.last_name || ''}`.trim() || contactPerson;
                            contactEmail = customer.email || contactEmail;
                        }
                    } catch (e) {
                        console.error('Error parsing customer data:', e);
                    }
                }

                setFormData((prev) => ({
                    ...prev,
                    contactPerson,
                    contactNo,
                    contactEmail: contactEmail || 'customer@ethiotelecom.et',
                }));
            } catch (error) {
                console.error('Failed to load user data:', error);
            }
        };

        loadUserData();
    }, []);

    const hasActiveSurvey = surveys.some((s) => ['waiting', 'approved'].includes(s.status?.toLowerCase()));

    const steps: Step[] = [
        {
            id: 'service',
            title: 'Service Selection',
            description: 'Choose your service type and configuration',
            icon: Wifi,
            status: currentStep === 0 ? 'current' : currentStep > 0 ? 'completed' : 'upcoming',
        },
        {
            id: 'location',
            title: 'Location Setup',
            description: 'Select installation location and check availability',
            icon: MapPin,
            status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'upcoming',
        },
        {
            id: 'review',
            title: 'Review & Submit',
            description: 'Verify details and submit your request',
            icon: FileText,
            status: currentStep === 2 ? 'current' : 'upcoming',
        },
    ];

    const updateFormData = (newData: Partial<ServiceFormData>) => {
        setFormData((prev) => ({ ...prev, ...newData }));
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 0: // Service Selection
                return formData.serviceType && (!formData.serviceType.includes('1943913915') || formData.bandwidth);
            case 1: // Location Setup
                return formData.latitude !== 0 && formData.longitude !== 0 && formData.resourceAvailable;
            case 2: // Review
                return true;
            default:
                return false;
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <ServiceSelectionStep formData={formData} onUpdate={updateFormData} hasActiveSurvey={hasActiveSurvey} />;
            case 1:
                return <LocationSetupStep formData={formData} onUpdate={updateFormData} />;
            case 2:
                return <ReviewSubmitStep formData={formData} onBack={prevStep} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            {/* <div className="backdrop-blur-sm">
                <div className="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4"> */}
            {/* <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                                <Home className="h-5 w-5" />
                                <span className="font-medium">Home</span>
                            </Link>
                            <div className="h-6 w-px bg-gray-300"></div> */}
            {/* <div>
                                <h1 className="text-2xl font-bold text-gray-900">New Service Request</h1>
                                <p className="text-sm text-gray-600">Get started with Ethio Telecom's fixed services</p>
                            </div>
                        </div>
                        <Link href="/dashboard">
                            <Button variant="outline" className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                View Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </div> */}

            <div className="mx-auto max-w-screen-2xl px-4 py-0 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    {/* Sidebar - Steps Navigation */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8 border-0 shadow-xl">
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-semibold">New Service Request</CardTitle>
                                <CardDescription>Get started with fixed services</CardDescription>
                                {/* <CardTitle className="text-lg font-semibold">Service Setup</CardTitle>
                                <CardDescription>Follow these steps to request your service</CardDescription> */}
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {steps.map((step, index) => {
                                        const IconComponent = step.icon;
                                        const isCompleted = step.status === 'completed';
                                        const isCurrent = step.status === 'current';

                                        return (
                                            <div key={step.id} className="flex items-start space-x-4">
                                                {/* Step Number/Status */}
                                                <div
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                                                        isCompleted
                                                            ? 'border-green-500 bg-green-500 text-white'
                                                            : isCurrent
                                                              ? 'border-primary bg-primary text-white'
                                                              : 'border-gray-300 bg-white text-gray-400'
                                                    } `}
                                                >
                                                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                                                </div>

                                                {/* Step Content */}
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <IconComponent
                                                            className={`h-4 w-4 ${
                                                                isCompleted ? 'text-green-500' : isCurrent ? 'text-primary' : 'text-gray-400'
                                                            } `}
                                                        />
                                                        <h3
                                                            className={`font-semibold ${
                                                                isCompleted ? 'text-green-700' : isCurrent ? 'text-primary' : 'text-gray-500'
                                                            } `}
                                                        >
                                                            {step.title}
                                                        </h3>
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-500">{step.description}</p>

                                                    {/* Progress line */}
                                                    {index < steps.length - 1 && (
                                                        <div className={`mt-3 ml-2 h-6 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'} `} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Progress Summary */}
                                {/* <div className="mt-8 rounded-lg bg-gray-50 p-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="font-semibold">
                                            {steps.filter((s) => s.status === 'completed').length} of {steps.length} steps
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2 rounded-full bg-gray-200">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all duration-300"
                                            style={{
                                                width: `${((steps.filter((s) => s.status === 'completed').length + (currentStep === 2 ? 1 : 0)) / steps.length) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div> */}

                                {/* Quick Links */}
                                <div className="mt-6 space-y-2">
                                    <Link href="/dashboard" className="block">
                                        <Button variant="outline" className="w-full justify-start text-sm">
                                            <BarChart3 className="mr-2 h-4 w-4" />
                                            View Dashboard
                                        </Button>
                                    </Link>
                                    {/* <Link href="/create-survey-requests" className="block">
                                        <Button variant="outline" className="w-full justify-start text-sm">
                                            <FileText className="mr-2 h-4 w-4" />
                                            Classic Form
                                        </Button>
                                    </Link> */}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <Card className="border-0 shadow-xl">
                            <CardHeader className="border-b bg-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</CardTitle>
                                        <CardDescription className="mt-1 text-gray-600">{steps[currentStep].description}</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-primary/10 text-primary">
                                        Step {currentStep + 1} of {steps.length}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                {renderStepContent()}

                                {/* Navigation Buttons */}
                                {currentStep < 2 && (
                                    <div className="mt-8 flex justify-between border-t pt-6">
                                        <Button
                                            variant="outline"
                                            onClick={prevStep}
                                            disabled={currentStep === 0}
                                            className="flex items-center space-x-2"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Previous
                                        </Button>

                                        <Button
                                            onClick={nextStep}
                                            disabled={!canProceedToNextStep() || hasActiveSurvey}
                                            className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
                                        >
                                            {currentStep === steps.length - 2 ? 'Review & Submit' : 'Continue'}
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {hasActiveSurvey && currentStep === 0 && (
                                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="flex items-center">
                                            <FileText className="mr-3 h-5 w-5 text-blue-400" />
                                            <p className="text-sm text-blue-700">
                                                You have an active service request. Complete or cancel it before creating a new one.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
