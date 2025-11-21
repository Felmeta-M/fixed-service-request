import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSurveyList } from '@/hooks/use-survey-list';
import { usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LocationSetupStep } from './steps/location-setup-step';
import { ReviewSubmitStep } from './steps/review-submit-step';
import { ServiceSelectionStep } from './steps/service-selection-step';

interface User {
    id: number;
    customer_code: string;
    name: string;
    phone: string;
    email?: string;
}

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
    const { auth } = usePage().props;
    const user = auth.user as User;

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

    // Load user data from authenticated user
    useEffect(() => {
        const loadUserData = () => {
            try {
                if (!user) {
                    console.warn('No authenticated user found');
                    return;
                }

                const contactPerson = user.name || 'Customer';
                const contactNo = user.phone || '';
                const contactEmail = user.email || 'customer@ethiotelecom.et';

                setFormData((prev) => ({
                    ...prev,
                    contactPerson,
                    contactNo,
                    contactEmail,
                }));
            } catch (error) {
                console.error('Failed to load user data:', error);
            }
        };

        loadUserData();
    }, [user]); // Add user as dependency

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
        <Card className="border-0 shadow-none">
            <CardHeader className="bg-white pr-0 pl-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">{stepTitles[currentStep].title}</CardTitle>
                        <CardDescription className="mt-1 text-gray-600">{stepTitles[currentStep].description}</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pr-0 pl-0">
                {renderStepContent()}

                {/* Navigation Buttons */}
                {currentStep < 2 && (
                    <div className="mt-8 flex justify-between pt-6">
                        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>

                        <Button
                            onClick={nextStep}
                            disabled={!canProceedToNextStep() || hasActiveSurvey}
                            className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
                        >
                            {currentStep === 1 ? 'Next' : 'Next'}
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
