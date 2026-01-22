import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSurveyDetail } from '@/features/surveys/hooks/use-surveys';
import { Link, usePage } from '@inertiajs/react';
import { AlertCircle, Loader2, MoveLeftIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DeviceSelectionStep } from './steps/device-selection-step';
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
    withDevice?: boolean;
    selectedDevice?: any;
    selectedDeviceInternet?: any;
    selectedDeviceVoice?: any;
    deviceId?: string | null;
    deviceVoiceId?: string | null;
    latitude: number;
    longitude: number;
    address: string;
    contactPerson: string;
    contactNo: string;
    contactEmail: string;
    resourceAvailable?: boolean;
}

interface ServiceResumeFlowProps {
    currentStep: number;
    onStepChange: (step: number) => void;
    googleMapsApiKey: string;
    surveyOrderId: string;
}

export function ServiceResumeFlow({ currentStep, onStepChange, googleMapsApiKey, surveyOrderId }: ServiceResumeFlowProps) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth.user as User;

    const [formData, setFormData] = useState<ServiceFormData>({
        serviceType: '',
        bandwidth: '',
        customerType: '',
        withDevice: undefined,
        latitude: 0,
        longitude: 0,
        address: '',
        contactPerson: '',
        contactNo: '',
        contactEmail: '',
        resourceAvailable: true, // Approved surveys have resources available
    });

    const [isTransitioningToSubscription, setIsTransitioningToSubscription] = useState(false);

    // Fetch existing survey data
    const surveyDetailQuery = useSurveyDetail(surveyOrderId);
    const surveyLoading = surveyDetailQuery.isLoading;
    const surveyError = surveyDetailQuery.error?.message || null;
    const surveyData = surveyDetailQuery.data?.data;

    // Load survey data when available
    useEffect(() => {
        if (surveyData) {
            setFormData((prev) => ({
                ...prev,
                serviceType: surveyData.main_offer_id || '',
                bandwidth: surveyData.bandwidth || '',
                customerType: surveyData.customer_type || 'residential',
                withDevice: surveyData.with_device,
                contactPerson: user?.name || 'Customer',
                contactNo: user?.phone || '',
                contactEmail: user?.email || '',
            }));
        }
    }, [surveyData, user]);

    const updateFormData = (newData: Partial<ServiceFormData>) => {
        setFormData((prev) => ({ ...prev, ...newData }));
    };

    // Resume flow: Step 2 = Device Selection, Step 3 = Payment
    // We map the current step (2, 3) to internal steps (0, 1)
    const internalStep = currentStep - 2;

    const nextStep = () => {
        if (currentStep < 3) {
            onStepChange(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 2) {
            onStepChange(currentStep - 1);
        }
    };

    const getStepTitles = () => [
        { title: 'Device Selection', description: 'Choose your device option' },
        { title: 'Payment / Subscribe', description: 'Review charges and proceed to pay or subscribe' },
    ];

    const stepTitles = getStepTitles();

    if (surveyLoading) {
        return (
            <div className="w-full space-y-6 px-4 py-2 lg:px-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center gap-4 py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-700">Loading survey details...</p>
                                <p className="mt-1 text-xs text-gray-500">Please wait while we fetch your service request</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (surveyError || !surveyData) {
        return (
            <div className="w-full space-y-6 px-4 py-2 lg:px-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <div>
                                <p className="font-medium">Error loading survey</p>
                                <p className="text-sm">{surveyError || 'Unable to load survey details.'}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <Button variant="outline" onClick={() => surveyDetailQuery.refetch()}>
                                Try Again
                            </Button>
                            <Link href={route('services')}>
                                <Button variant="outline">Back to Services</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Check if survey can be resumed
    const canResume = surveyData.can_pay || surveyData.can_subscribe;
    if (!canResume) {
        return (
            <div className="w-full space-y-6 px-4 py-2 lg:px-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3 text-amber-600">
                            <AlertCircle className="h-5 w-5" />
                            <div>
                                <p className="font-medium">Cannot Resume Survey</p>
                                <p className="text-sm">
                                    This survey is not in a resumable state. It may still be pending approval or already completed.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6">
                            <Link href={route('services')}>
                                <Button variant="outline">Back to Services</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const renderStepContent = () => {
        switch (internalStep) {
            case 0: // Device Selection
                return (
                    <DeviceSelectionStep
                        formData={formData}
                        onUpdate={updateFormData}
                        onNext={() => {
                            setIsTransitioningToSubscription(true);
                            nextStep();
                        }}
                        onBack={() => {
                            // Go back to services list since there's no previous step in resume flow
                            window.location.href = route('services');
                        }}
                    />
                );
            case 1: // Payment / Subscription
                return (
                    <SubscriptionPaymentStep
                        surveyId={surveyOrderId}
                        onBack={() => {
                            setIsTransitioningToSubscription(false);
                            prevStep();
                        }}
                        onComplete={() => {
                            setIsTransitioningToSubscription(false);
                            window.location.href = route('services');
                        }}
                        onLoadComplete={() => setIsTransitioningToSubscription(false)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full space-y-6 px-4 py-2 lg:px-6">
            <div className="bg-white pb-0 pt-0">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href={route('services')} className="hidden sm:block">
                            <Button variant="link" size="icon" className="h-10 w-10">
                                <MoveLeftIcon className="h-5 w-5" /> Back
                            </Button>
                        </Link>
                        <div className="text-lg font-bold text-gray-900 lg:text-xl">
                            {stepTitles[internalStep]?.title || 'Resume Service Request'}
                        </div>
                        <div className="text-sm text-gray-500 lg:text-base">
                            {stepTitles[internalStep]?.description || 'Continue your approved service request'}
                        </div>
                    </div>

                    {/* Desktop step indicator */}
                    <div className="hidden items-center space-x-4 sm:flex">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>
                                Step {internalStep + 1} of {stepTitles.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative">
                {renderStepContent()}

                {/* Loading Overlay for Transition */}
                {isTransitioningToSubscription && (
                    <div className="absolute inset-0 z-50 flex min-h-[400px] items-center justify-center bg-white/90 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-gray-700">Loading subscription details...</p>
                            <p className="text-xs text-gray-500">Please wait while we fetch your payment information</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
