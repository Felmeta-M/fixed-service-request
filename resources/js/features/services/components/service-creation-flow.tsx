import { Button } from '@/components/ui/button';
import { useSurveyList } from '@/features/surveys/hooks/use-surveys';
import { useResourceChecker } from '@/lib/resource-check';
import { showErrorToast, showLoadingToast, showSuccessToast } from '@/lib/toast-helpers';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CustomerCreationStep } from './steps/customer-creation-step';
import { DeviceSelectionStep } from './steps/device-selection-step';
import { LocationSetupStep } from './steps/location-setup-step';
import { ManualSurveyStep } from './steps/manual-survey-step';
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
    withDevice?: boolean;
    latitude: number;
    longitude: number;
    distance: string;
    cable_type: string;
    neid: string;
    nename: string;
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
        area_code: string;
        area_name: string;
        zone_code?: string;
    };
    bandwidthNumericValue?: number;
    resourceMessage?: string;
    termsAccepted?: boolean;
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
        withDevice: undefined,
        latitude: 0,
        longitude: 0,
        distance: '',
        cable_type: '',
        neid: '',
        nename: '',
        address: '',
        contactPerson: '',
        contactNo: '',
        contactEmail: '',
    });

    const [checkingResource, setCheckingResource] = useState(false);
    const [createdSurveyId, setCreatedSurveyId] = useState<string | null>(null);
    const [showManualStep, setShowManualStep] = useState(false);
    const [hasSeenResourceDialog, setHasSeenResourceDialog] = useState(false); // Track if user has seen the dialog
    const [isTransitioningToSubscription, setIsTransitioningToSubscription] = useState(false); // Track transition to subscription step
    const surveyListQuery = useSurveyList();
    const surveys = useMemo(() => {
        return surveyListQuery.data?.pages.flatMap((page) => page.data) ?? [];
    }, [surveyListQuery.data]);
    const { checkResourceAvailability } = useResourceChecker();

    // Load user data from authenticated user
    // Use stable dependencies (user.id, user.name, etc.) instead of the entire user object
    useEffect(() => {
        const loadUserData = () => {
            try {
                if (!user) {
                    return;
                }

                const contactPerson = user.name || 'Customer';
                const contactNo = user.phone || '';
                const contactEmail = user.email || 'customer@ethiotelecom.et';

                setFormData((prev) => {
                    // Only update if values actually changed to prevent unnecessary re-renders
                    if (prev.contactPerson === contactPerson && prev.contactNo === contactNo && prev.contactEmail === contactEmail) {
                        return prev;
                    }
                    return {
                        ...prev,
                        contactPerson,
                        contactNo,
                        contactEmail,
                    };
                });
            } catch (error) {}
        };

        loadUserData();
    }, [user?.id, user?.name, user?.phone, user?.email]);

    const hasActiveSurvey = false; //surveys?.some((s) => ['waiting', 'approved'].includes(s.status?.toLowerCase()));

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

    // When navigating to device selection step, default to "with device"
    useEffect(() => {
        if (adjustedStep === 2) {
            setFormData((prev) => {
                if (prev.withDevice === undefined) {
                    return { ...prev, withDevice: true };
                }
                return prev;
            });
        }
    }, [adjustedStep]);

    // Check if we should show manual step (when resource is not available)
    const shouldShowManualStep = showManualStep && formData.resourceAvailable === false;

    const checkResourceAndProceed = async () => {
        if (adjustedStep !== 1) {
            nextStep();
            return;
        }

        // Check resource availability for location step
        setCheckingResource(true);
        // Reset dialog state when checking a new location
        setHasSeenResourceDialog(false);
        setShowManualStep(false);
        const toastId = showLoadingToast('Checking resource availability...');

        try {
            const result = await checkResourceAvailability(
                { latitude: formData.latitude, longitude: formData.longitude },
                formData.contactPerson || 'Customer',
            );

            updateFormData({
                resourceAvailable: result.available,
                // Store resourceData even when available=false, as it contains encrypted fields (distance, cable_type, latitude, longitude, neid, nename, area_code, area_name)
                // that must be forwarded to survey/create API for both normal and manual flows
                resourceData: result.data,
                resourceMessage: result.message,

                // Preserve exact encrypted fields for survey create (used as fallback if resourceData is not available)
                distance: result.data?.distance ?? '',
                cable_type: result.data?.cable_type ?? '',
                neid: result.data?.neid ?? '',
                nename: result.data?.nename ?? '',
            });

            if (result.available) {
                showSuccessToast(result.message || 'Resource available!', { id: toastId });
                nextStep();
            } else {
                // Resource not available - dismiss toast and let location-setup-step show the dialog
                // The dialog will notify user and offer "Continue Manually" option
                toast.dismiss(toastId);
                // Don't automatically show manual step - let the dialog handle it
            }
        } catch (error) {
            // Extract error message from API error
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during resource check.';
            showErrorToast(errorMessage, { id: toastId });
            updateFormData({
                resourceAvailable: false,
                resourceMessage: errorMessage,
            });
        } finally {
            setCheckingResource(false);
        }
    };

    const nextStep = () => {
        // New step order: Service -> Location -> Device -> Review -> Payment
        // Existing customer: 5 steps (0-4), New customer: 6 steps (0-5)
        const maxSteps = isNewCustomer ? 6 : 5;
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
                // Validate service type, bandwidth (for broadband/combo), and terms acceptance
                const hasValidService =
                    formData.serviceType &&
                    (formData.serviceType === '1207609454' || // Voice doesn't need bandwidth
                        formData.bandwidth); // Broadband and Combo need bandwidth
                const hasAcceptedTerms = formData.termsAccepted === true;
                return hasValidService && hasAcceptedTerms;
            case 1: // Location Setup
                return formData.latitude !== 0 && formData.longitude !== 0 && formData.address;
            case 2: // Device Selection (handled by step's own Next button)
                return true;
            case 3: // Review
                return true;
            default:
                return false;
        }
    };

    const renderStepContent = () => {
        if (isNewCustomer && currentStep === 0) {
            return <CustomerCreationStep onNext={() => onStepChange(1)} />;
        }

        // Show manual step if resource is not available and user chose to continue manually
        if (shouldShowManualStep) {
            return (
                <ManualSurveyStep
                    formData={formData}
                    onBack={() => {
                        setShowManualStep(false);
                        // Reset dialog state so it can show again if user changes location
                        setHasSeenResourceDialog(false);
                        // Go back to location step (adjustedStep 1)
                        // For new customers: step 0=customer, step 1=service, step 2=location
                        // For existing customers: step 0=service, step 1=location
                        const locationStep = isNewCustomer ? 2 : 1;
                        onStepChange(locationStep);
                    }}
                    onUpdate={updateFormData}
                />
            );
        }

        switch (adjustedStep) {
            case 0: // Service Selection
                return <ServiceSelectionStep formData={formData} onUpdate={updateFormData} hasActiveSurvey={hasActiveSurvey} />;
            case 1: // Location Setup
                return (
                    <LocationSetupStep
                        formData={formData}
                        onUpdate={updateFormData}
                        googleMapsApiKey={googleMapsApiKey}
                        onNext={(surveyId: string) => {
                            setCreatedSurveyId(surveyId);
                            nextStep();
                        }}
                        onContinueManually={() => {
                            setShowManualStep(true);
                        }}
                        hasSeenResourceDialog={hasSeenResourceDialog}
                        onResourceDialogSeen={() => {
                            setHasSeenResourceDialog(true);
                        }}
                    />
                );
            case 2: // Device Selection (NEW STEP)
                return <DeviceSelectionStep formData={formData} onUpdate={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 3: // Review & Submit
                return (
                    <ReviewSubmitStep
                        formData={formData}
                        onBack={prevStep}
                        onNext={(surveyId: string) => {
                            setCreatedSurveyId(surveyId);
                            setIsTransitioningToSubscription(true);
                            nextStep();
                        }}
                    />
                );
            case 4: // Payment / Subscription
                return (
                    <SubscriptionPaymentStep
                        surveyId={createdSurveyId}
                        onBack={() => {
                            setIsTransitioningToSubscription(false);
                            onStepChange(isNewCustomer ? 4 : 3);
                        }}
                        onComplete={() => {
                            setIsTransitioningToSubscription(false);
                            onStepChange(0);
                        }}
                        onLoadComplete={() => setIsTransitioningToSubscription(false)}
                    />
                );
            default:
                return null;
        }
    };

    // Build step titles dynamically based on flow state
    const getStepTitles = () => {
        const baseTitles = [
            ...(isNewCustomer ? [{ title: 'Customer Information', description: 'Create your customer profile' }] : []),
            { title: 'Service Information', description: 'Choose your service type and configuration' },
            { title: 'Location Information', description: 'Select installation location and check availability' },
        ];

        if (shouldShowManualStep) {
            return [...baseTitles, { title: 'Manual Request', description: 'Submit your manual service request' }];
        }

        return [
            ...baseTitles,
            { title: 'Device Information', description: 'Choose your device option' },
            { title: 'Review & Submit', description: 'Verify details and submit your request' },
            { title: 'Payment / Subscribe', description: 'Review charges and proceed to pay or subscribe' },
        ];
    };

    const stepTitles = getStepTitles();

    const totalSteps = stepTitles.length;
    const isLastStep = currentStep === totalSteps - 1;
    // Hide navigation for CustomerCreation (0 if new), Manual Step, Device Selection (2), Review (3), and Payment (4)
    // These steps have their own navigation buttons
    const showNavigation = !(isNewCustomer && currentStep === 0) && !shouldShowManualStep && adjustedStep < 2;

    return (
        <div className="w-full space-y-6 px-4 py-2 lg:px-6">
            {/* Header - matching service detail page styling */}
            <div className="flex flex-col gap-2">
                <Link href={route('services')} className="hidden w-fit shrink-0 hover:text-[#068BCC] sm:block">
                    <Button variant="ghost" size="sm" className="h-9 gap-1 text-[#068BCC] hover:text-[#068BCC]">
                        <ArrowLeft className="h-4 w-4 shrink-0 text-[#068BCC]" />
                        <span className="hover:text-[#068BCC]">Back</span>
                    </Button>
                </Link>
                <div>
                    <h1 className="text-lg font-semibold text-foreground sm:text-xl">
                        {shouldShowManualStep ? stepTitles[stepTitles.length - 1]?.title : stepTitles[currentStep]?.title}
                    </h1>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {shouldShowManualStep ? stepTitles[stepTitles.length - 1]?.description : stepTitles[currentStep]?.description}
                    </p>
                </div>
            </div>
            <div className="relative">
                {renderStepContent()}

                {/* Loading Overlay for Step 3 to 4 Transition */}
                {isTransitioningToSubscription && (
                    <div className="absolute inset-0 z-50 flex min-h-[400px] items-center justify-center bg-white/90 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-gray-700">Loading subscription details...</p>
                            <p className="text-xs text-gray-500">Please wait while we fetch your payment information</p>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                {showNavigation && !isLastStep && (
                    <div className="mt-2 flex justify-between pt-2">
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="flex items-center space-x-2 text-[#068BCC]"
                        >
                            <ArrowLeft className="h-4 w-4 text-[#068BCC]" />
                            <span>Back</span>
                        </Button>

                        <Button
                            onClick={checkResourceAndProceed}
                            disabled={!canProceedToNextStep() || hasActiveSurvey || checkingResource}
                            className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
                        >
                            {checkingResource ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Checking Availability...</span>
                                </>
                            ) : (
                                <>
                                    <span>Next</span>
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
