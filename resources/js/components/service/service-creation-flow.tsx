import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSurveyList } from '@/hooks/use-survey-list';
import { useResourceChecker } from '@/lib/resource-check';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, FileText, Loader2, MoveLeftIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CustomerCreationStep } from './steps/customer-creation-step';
import { LocationSetupStep } from './steps/location-setup-step';
import { ReviewSubmitStep } from './steps/review-submit-step';
import { ServiceSelectionStep } from './steps/service-selection-step';
import { SubscriptionPaymentStep } from './steps/subscription-payment-step';

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
    withDevice: boolean;
    latitude: number;
    longitude: number;
    distance: string;
    cable_type: string;
    address: string;
    contactPerson: string;
    contactNo: string;
    contactEmail: string;
    resourceAvailable?: boolean;
    resourceData?: {
        distance: string;
        ava_port: string;
        neid: string;
        nename: string;
        typeid: string;
        longitude: string;
        latitude: string;
        cable_type: string;
        cable_type_desc: string;
    };
    bandwidthNumericValue?: number;
    resourceMessage?: string;
}

interface ServiceCreationFlowProps {
    currentStep: number;
    onStepChange: (step: number) => void;
    googleMapsApiKey: string;
    isNewCustomer?: boolean;
}

export function ServiceCreationFlow({ currentStep, onStepChange, googleMapsApiKey, isNewCustomer = false }: ServiceCreationFlowProps) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth.user as User;

    const [formData, setFormData] = useState<ServiceFormData>({
        serviceType: '1457567289',
        bandwidth: '',
        customerType: '',
        withDevice: false,
        latitude: 0,
        longitude: 0,
        distance: '',
        cable_type: '',
        address: '',
        contactPerson: '',
        contactNo: '',
        contactEmail: '',
    });
    console.log("🚀 ~ ServiceCreationFlow ~ formData:", formData)

    const [checkingResource, setCheckingResource] = useState(false);
    const [createdSurveyId, setCreatedSurveyId] = useState<string | null>(null);
    const { surveys } = useSurveyList();
    const { checkResourceAvailability } = useResourceChecker();

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
    }, [user]);

    const hasActiveSurvey = surveys?.some((s) => ['waiting', 'approved'].includes(s.status?.toLowerCase()));

    const updateFormData = (newData: Partial<ServiceFormData>) => {
        setFormData((prev) => ({ ...prev, ...newData }));
    };

    const getAdjustedStep = () => {
        if (isNewCustomer) {
            return currentStep - 1;
        }
        return currentStep;
    };

    const adjustedStep = getAdjustedStep();

    const checkResourceAndProceed = async () => {
        if (adjustedStep !== 1) {
            nextStep();
            return;
        }

        // Check resource availability for location step
        setCheckingResource(true);

        try {
            const result = await checkResourceAvailability(
                { latitude: formData.latitude, longitude: formData.longitude},
                formData.contactPerson || 'Customer',
            );

            updateFormData({
                resourceAvailable: result.available,
                resourceData: result.data,
                resourceMessage: result.message,

                // Preserve exact encrypted fields for survey create.
                distance: result.data?.distance ?? '',
                cable_type: result.data?.cable_type ?? '',
            });

            if (result.available) {
                nextStep();
            } else {
                // No UI surface here; Location step can use `formData.resourceMessage` if needed.
            }
        } catch (error) {
            console.error('Resource check error:', error);
            updateFormData({
                resourceAvailable: false,
                resourceMessage: 'Resource check failed',
            });
        } finally {
            setCheckingResource(false);
        }
    };

    const nextStep = () => {
        const maxSteps = isNewCustomer ? 5 : 4;
        if (currentStep < maxSteps) {
            onStepChange(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            onStepChange(currentStep - 1);
        }
    };

    const canProceedToNextStep = () => {
        if (isNewCustomer && currentStep === 0) return false; // Handled by CustomerCreationStep

        switch (adjustedStep) {
            case 0: // Service Selection
                return formData.serviceType && (!formData.serviceType.includes('1457567289') || formData.bandwidth);
            case 1: // Location Setup
                return formData.latitude !== 0 && formData.longitude !== 0 && formData.address;
            case 2: // Review
                return true;
            default:
                return false;
        }
    };

    const renderStepContent = () => {
        if (isNewCustomer && currentStep === 0) {
            return <CustomerCreationStep onNext={() => onStepChange(1)} />;
        }

        switch (adjustedStep) {
            case 0:
                return <ServiceSelectionStep formData={formData} onUpdate={updateFormData} hasActiveSurvey={hasActiveSurvey} />;
            case 1:
                return <LocationSetupStep formData={formData} onUpdate={updateFormData} googleMapsApiKey={googleMapsApiKey} />;
            case 2:
                return (
                    <ReviewSubmitStep
                        formData={formData}
                        onBack={prevStep}
                        onNext={(surveyId: string) => {
                            setCreatedSurveyId(surveyId);
                            nextStep();
                        }}
                    />
                );
            case 3:
                return (
                    <SubscriptionPaymentStep
                        surveyId={createdSurveyId}
                        onBack={() => onStepChange(isNewCustomer ? 3 : 2)}
                        onComplete={() => onStepChange(0)}
                    />
                );
            default:
                return null;
        }
    };

    const stepTitles = [
        ...(isNewCustomer ? [{ title: 'Customer Profile', description: 'Create your customer profile' }] : []),
        { title: 'Service Information', description: 'Choose your service type and configuration' },
        { title: 'Location Information', description: 'Select installation location and check availability' },
        { title: 'Review & Submit', description: 'Verify details and submit your request' },
        { title: 'Payment / Subscribe', description: 'Review charges and proceed to pay or subscribe' },
    ];

    const totalSteps = stepTitles.length;
    const isLastStep = currentStep === totalSteps - 1;
    // Hide navigation for CustomerCreation (0 if new) and Review (2 adjusted)
    const showNavigation = !(isNewCustomer && currentStep === 0) && adjustedStep < 2;

    return (
            <div className="w-full space-y-6 px-4 py-2 lg:px-6">            
            <div className="bg-white pb-0 pt-0">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href={route("services")} className='hidden sm:block'>
                            <Button
                                variant="link"
                                size="icon"
                                className="h-10 w-10"
                            >
                                <MoveLeftIcon className="h-5 w-5" /> Back
                            </Button>
                        </Link>
                        <div className="text-lg font-bold text-gray-900 lg:text-xl">{stepTitles[currentStep]?.title}</div>
                        <div className="text-sm text-gray-500 lg:text-base">{stepTitles[currentStep]?.description}</div>
                    </div>

                    {/* Desktop step indicator */}
                    <div className="hidden items-center space-x-4 sm:flex">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>
                                Step {currentStep + 1} of {totalSteps}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className=" ">
                {renderStepContent()}

                {/* Navigation Buttons */}
                {showNavigation && !isLastStep && (
                    <div className="mt-2 flex justify-between pt-2">
                        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>

                        <Button
                            onClick={checkResourceAndProceed}
                            disabled={!canProceedToNextStep() || hasActiveSurvey || checkingResource}
                            className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
                        >
                            {checkingResource ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Checking Availability...
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {hasActiveSurvey && adjustedStep === 0 && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center">
                            <FileText className="mr-3 h-5 w-5 text-primary" />
                            <p className="text-sm text-primary">
                                You have an active service request. Complete or cancel it before creating a new one.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
