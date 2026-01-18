import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSurveyList } from '@/features/surveys/hooks/use-surveys';
import { useResourceChecker } from '@/lib/resource-check';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, FileText, Loader2, MoveLeftIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { showErrorToast, showSuccessToast, showLoadingToast } from '@/lib/toast-helpers';
import { CustomerCreationStep } from './steps/customer-creation-step';
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
    console.log("🚀 ~ ServiceCreationFlow ~ formData:", formData)

    const [checkingResource, setCheckingResource] = useState(false);
    const [createdSurveyId, setCreatedSurveyId] = useState<string | null>(null);
    const [showManualStep, setShowManualStep] = useState(false);
    const [hasSeenResourceDialog, setHasSeenResourceDialog] = useState(false); // Track if user has seen the dialog
    const surveyListQuery = useSurveyList();
    const surveys = useMemo(() => {
        return surveyListQuery.data?.pages.flatMap(page => page.data) ?? [];
    }, [surveyListQuery.data]);
    const { checkResourceAvailability } = useResourceChecker();

    // Load user data from authenticated user
    // Use stable dependencies (user.id, user.name, etc.) instead of the entire user object
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

                setFormData((prev) => {
                    // Only update if values actually changed to prevent unnecessary re-renders
                    if (
                        prev.contactPerson === contactPerson &&
                        prev.contactNo === contactNo &&
                        prev.contactEmail === contactEmail
                    ) {
                        return prev;
                    }
                    return {
                        ...prev,
                        contactPerson,
                        contactNo,
                        contactEmail,
                    };
                });
            } catch (error) {
                console.error('Failed to load user data:', error);
            }
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
                // Check if this is a location review needed (Ethiopia but outside Addis Ababa)
                const isLocationReviewNeeded = result.message && result.message.includes('LOCATION_REVIEW_NEEDED');

                // Check if this is a validation error (e.g., geo-fencing) that should be shown as a toast
                const isValidationError = result.message && (
                    result.message.includes('Addis Ababa') ||
                    result.message.includes('available within') ||
                    result.message.includes('city limits') ||
                    result.message.includes('Invalid') ||
                    result.message.includes('required')
                );

                if (isLocationReviewNeeded) {
                    // For Ethiopia locations outside Addis Ababa, show manual step dialog
                    // Don't show error toast - let the Location Review Needed dialog handle it
                    toast.dismiss(toastId);
                    // The modal will be shown automatically via useEffect in location-setup-step when resourceAvailable is false
                } else if (isValidationError) {
                    // Show error toast for validation errors (outside Ethiopia, invalid coordinates, etc.)
                    showErrorToast(result.message, { id: toastId });
                } else {
                    // Don't show error toast here - the modal will be shown in location-setup-step
                    // Just dismiss the loading toast
                    toast.dismiss(toastId);
                    // The modal will be shown automatically via useEffect in location-setup-step when resourceAvailable is false
                }
            }
        } catch (error) {
            console.error('Resource check error:', error);
            // Extract error message from API error
            const errorMessage = error instanceof Error
                ? error.message
                : 'An unexpected error occurred during resource check.';
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
                const hasValidService = formData.serviceType && (!formData.serviceType.includes('1457567289') || formData.bandwidth);
                const hasAcceptedTerms = formData.termsAccepted === true; // Terms acceptance is required

                // Device selection validation
                let hasDeviceSelection = true; // Default to true (no device needed)

                // If device option hasn't been selected yet, disable next button
                if (formData.withDevice === undefined) {
                    hasDeviceSelection = false;
                } else if (formData.withDevice === true) {
                    // If "with device" is selected, must have selected device(s)
                    if (formData.serviceType === '180427974') {
                        // Combo service: need both internet and voice devices with IDs
                        hasDeviceSelection = !!(
                            formData.selectedDeviceInternet?.id &&
                            formData.selectedDeviceVoice?.id
                        );
                    } else {
                        // Single service (broadband or voice): need one device with ID
                        hasDeviceSelection = !!(formData.selectedDevice?.id && formData.deviceId);
                    }
                }
                // If withDevice === false, hasDeviceSelection remains true (no device needed)

                return hasValidService && hasDeviceSelection && hasAcceptedTerms;
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
            case 0:
                return <ServiceSelectionStep formData={formData} onUpdate={updateFormData} hasActiveSurvey={hasActiveSurvey} />;
            case 1:
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
            { title: 'Review & Submit', description: 'Verify details and submit your request' },
            { title: 'Payment / Subscribe', description: 'Review charges and proceed to pay or subscribe' },
        ];
    };

    const stepTitles = getStepTitles();

    const totalSteps = stepTitles.length;
    const isLastStep = currentStep === totalSteps - 1;
    // Hide navigation for CustomerCreation (0 if new), Manual Step, and Review (2 adjusted)
    const showNavigation = !(isNewCustomer && currentStep === 0) && !shouldShowManualStep && adjustedStep < 2;

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
                        <div className="text-lg font-bold text-gray-900 lg:text-xl">
                            {shouldShowManualStep
                                ? stepTitles[stepTitles.length - 1]?.title
                                : stepTitles[currentStep]?.title}
                        </div>
                        <div className="text-sm text-gray-500 lg:text-base">
                            {shouldShowManualStep
                                ? stepTitles[stepTitles.length - 1]?.description
                                : stepTitles[currentStep]?.description}
                        </div>
                    </div>

                    {/* Desktop step indicator */}
                    <div className="hidden items-center space-x-4 sm:flex">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>
                                Step {shouldShowManualStep ? totalSteps : currentStep + 1} of {totalSteps}
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
