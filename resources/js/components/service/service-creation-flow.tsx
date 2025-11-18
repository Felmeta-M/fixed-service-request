// components/services/ServiceCreationFlow.tsx
// 'use client';

// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import { ArrowLeft, ChevronRight } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import { LocationSetupStep } from './steps/location-setup-step';
// import { ReviewSubmitStep } from './steps/review-submit-step';
// import { ServiceSelectionStep } from './steps/service-selection-step';

// interface ServiceFormData {
//     serviceType: string;
//     bandwidth: string;
//     customerType: string;
//     latitude: number;
//     longitude: number;
//     address: string;
//     contactPerson: string;
//     contactNo: string;
//     contactEmail: string;
//     resourceAvailable?: boolean;
//     resourceData?: any;
//     bandwidthNumericValue?: number;
// }

// interface ServiceCreationFlowProps {
//     currentStep: number;
//     onStepChange: (step: number) => void;
// }

// export function ServiceCreationFlow({ currentStep, onStepChange }: ServiceCreationFlowProps) {
//     const [formData, setFormData] = useState<ServiceFormData>({
//         serviceType: '',
//         bandwidth: '',
//         customerType: '',
//         latitude: 0,
//         longitude: 0,
//         address: '',
//         contactPerson: '',
//         contactNo: '',
//         contactEmail: '',
//     });

//     const { surveys } = useSurveyList();

//     // Load user data from localStorage on component mount
//     useEffect(() => {
//         const loadUserData = () => {
//             try {
//                 let contactPerson = 'Customer';
//                 let contactNo = '';
//                 let contactEmail = '';

//                 const kycDataString = localStorage.getItem('kycData');
//                 if (kycDataString) {
//                     try {
//                         const kycData = JSON.parse(kycDataString);
//                         contactPerson = kycData.identity?.name?.eng || 'Customer';
//                         contactNo = kycData.identity?.phone || '';
//                         contactEmail = kycData.email || '';
//                     } catch (e) {
//                         console.error('Error parsing KYC data:', e);
//                     }
//                 }

//                 const customerDataString = localStorage.getItem('activeCustomer');
//                 if (customerDataString && (!contactNo || contactNo === 'Loading...')) {
//                     try {
//                         const customerData = JSON.parse(customerDataString);
//                         if (customerData.contacts && customerData.contacts.length > 0) {
//                             contactPerson = `${customerData.contacts[0].name1 || ''} ${customerData.contacts[0].name2 || ''}`.trim() || contactPerson;
//                             contactNo = customerData.contacts[0].mobile || contactNo;
//                             contactEmail = customerData.contacts[0].email || contactEmail;
//                         }
//                         if (customerData.customer) {
//                             const customer = customerData.customer;
//                             contactPerson =
//                                 `${customer.first_name || ''} ${customer.middle_name || ''} ${customer.last_name || ''}`.trim() || contactPerson;
//                             contactEmail = customer.email || contactEmail;
//                         }
//                     } catch (e) {
//                         console.error('Error parsing customer data:', e);
//                     }
//                 }

//                 setFormData((prev) => ({
//                     ...prev,
//                     contactPerson,
//                     contactNo,
//                     contactEmail: contactEmail || 'customer@ethiotelecom.et',
//                 }));
//             } catch (error) {
//                 console.error('Failed to load user data:', error);
//             }
//         };

//         loadUserData();
//     }, []);

//     const hasActiveSurvey = surveys.some((s) => ['waiting', 'approved'].includes(s.status?.toLowerCase()));

//     const updateFormData = (newData: Partial<ServiceFormData>) => {
//         setFormData((prev) => ({ ...prev, ...newData }));
//     };

//     const nextStep = () => {
//         if (currentStep < 2) {
//             onStepChange(currentStep + 1);
//         }
//     };

//     const prevStep = () => {
//         if (currentStep > 0) {
//             onStepChange(currentStep - 1);
//         }
//     };

//     const canProceedToNextStep = () => {
//         switch (currentStep) {
//             case 0: // Service Selection
//                 return formData.serviceType && (!formData.serviceType.includes('1943913915') || formData.bandwidth);
//             case 1: // Location Setup
//                 return formData.latitude !== 0 && formData.longitude !== 0 && formData.resourceAvailable;
//             case 2: // Review
//                 return true;
//             default:
//                 return false;
//         }
//     };

//     const renderStepContent = () => {
//         switch (currentStep) {
//             case 0:
//                 return <ServiceSelectionStep formData={formData} onUpdate={updateFormData} hasActiveSurvey={hasActiveSurvey} />;
//             case 1:
//                 return <LocationSetupStep formData={formData} onUpdate={updateFormData} />;
//             case 2:
//                 return <ReviewSubmitStep formData={formData} onBack={prevStep} />;
//             default:
//                 return null;
//         }
//     };

//     const stepTitles = [
//         { title: 'Service Selection', description: 'Choose your service type and configuration' },
//         { title: 'Location Setup', description: 'Select installation location and check availability' },
//         { title: 'Review & Submit', description: 'Verify details and submit your request' },
//     ];

//     return (
//         <Card className="border-0 shadow-xl">
//             <CardHeader className="border-b bg-white">
//                 <div className="flex items-center justify-between">
//                     <div>
//                         <CardTitle className="text-2xl font-bold text-gray-900">{stepTitles[currentStep].title}</CardTitle>
//                         <CardDescription className="mt-1 text-gray-600">{stepTitles[currentStep].description}</CardDescription>
//                     </div>
//                     <Badge variant="outline" className="bg-primary/10 text-primary">
//                         Step {currentStep + 1} of 3
//                     </Badge>
//                 </div>
//             </CardHeader>

//             <CardContent className="p-6">
//                 {renderStepContent()}

//                 {/* Navigation Buttons */}
//                 {currentStep < 2 && (
//                     <div className="mt-8 flex justify-between border-t pt-6">
//                         <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="flex items-center space-x-2">
//                             <ArrowLeft className="h-4 w-4" />
//                             Previous
//                         </Button>

//                         <Button
//                             onClick={nextStep}
//                             disabled={!canProceedToNextStep() || hasActiveSurvey}
//                             className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
//                         >
//                             {currentStep === 1 ? 'Review & Submit' : 'Continue'}
//                             <ChevronRight className="h-4 w-4" />
//                         </Button>
//                     </div>
//                 )}

//                 {hasActiveSurvey && currentStep === 0 && (
//                     <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
//                         <div className="flex items-center">
//                             <FileText className="mr-3 h-5 w-5 text-blue-400" />
//                             <p className="text-sm text-blue-700">
//                                 You have an active service request. Complete or cancel it before creating a new one.
//                             </p>
//                         </div>
//                     </div>
//                 )}
//             </CardContent>
//         </Card>
//     );
// }

// components/services/ServiceCreationFlow.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSurveyList } from '@/hooks/use-survey-list';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
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
    bandwidthNumericValue?: number;
}

interface ServiceCreationFlowProps {
    currentStep: number;
    onStepChange: (step: number) => void;
}

export function ServiceCreationFlow({ currentStep, onStepChange }: ServiceCreationFlowProps) {
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

    // Load user data from localStorage
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

    const updateFormData = (newData: Partial<ServiceFormData>) => {
        setFormData((prev) => ({ ...prev, ...newData }));
    };

    const nextStep = () => {
        if (currentStep < 2) {
            onStepChange(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            onStepChange(currentStep - 1);
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

    const stepTitles = [
        { title: 'Service Selection', description: 'Choose your service type and configuration' },
        { title: 'Location Setup', description: 'Select installation location and check availability' },
        { title: 'Review & Submit', description: 'Verify details and submit your request' },
    ];

    return (
        <Card className="border-0 shadow-xl">
            <CardHeader className="border-b bg-white">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">{stepTitles[currentStep].title}</CardTitle>
                        <CardDescription className="mt-1 text-gray-600">{stepTitles[currentStep].description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                        Step {currentStep + 1} of 3
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {renderStepContent()}

                {/* Navigation Buttons */}
                {currentStep < 2 && (
                    <div className="mt-8 flex justify-between border-t pt-6">
                        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        <Button
                            onClick={nextStep}
                            disabled={!canProceedToNextStep() || hasActiveSurvey}
                            className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
                        >
                            {currentStep === 1 ? 'Review & Submit' : 'Continue'}
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
    );
}
