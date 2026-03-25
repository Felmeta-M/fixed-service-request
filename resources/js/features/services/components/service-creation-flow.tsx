import { Button } from '@/components/ui/button';
import { useSurveyList } from '@/features/surveys/hooks/use-surveys';
import { useResourceChecker } from '@/lib/resource-check';
import { showErrorToast, showLoadingToast, showSuccessToast } from '@/lib/toast-helpers';
import { useServiceFormStore } from '@/store/service-form-store';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { LocationConfirmationDialog } from './location-confirmation-dialog';
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
    /** When true, manual step shows only bandwidth 7M + lat/long (from require_manual_survey API response) */
    isMinimalManualSurvey?: boolean;
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

    // ── Zustand store ─────────────────────────────────────────────────────
    const formData = useServiceFormStore((s) => s.formData);
    const updateFormData = useServiceFormStore((s) => s.updateFormData);
    const checkingResource = useServiceFormStore((s) => s.checkingResource);
    const setCheckingResource = useServiceFormStore((s) => s.setCheckingResource);
    const createdSurveyId = useServiceFormStore((s) => s.createdSurveyId);
    const setCreatedSurveyId = useServiceFormStore((s) => s.setCreatedSurveyId);
    const showManualStep = useServiceFormStore((s) => s.showManualStep);
    const setShowManualStep = useServiceFormStore((s) => s.setShowManualStep);
    const hasSeenResourceDialog = useServiceFormStore((s) => s.hasSeenResourceDialog);
    const setHasSeenResourceDialog = useServiceFormStore((s) => s.setHasSeenResourceDialog);
    const isTransitioningToSubscription = useServiceFormStore((s) => s.isTransitioningToSubscription);
    const setIsTransitioningToSubscription = useServiceFormStore((s) => s.setIsTransitioningToSubscription);
    const setIsNewCustomer = useServiceFormStore((s) => s.setIsNewCustomer);
    const resetStore = useServiceFormStore((s) => s.reset);

    const [showLocationConfirmDialog, setShowLocationConfirmDialog] = useState(false);

    // Sync isNewCustomer into the store so nextStep() knows the max
    useEffect(() => {
        setIsNewCustomer(isNewCustomer);
    }, [isNewCustomer, setIsNewCustomer]);

    const surveyListQuery = useSurveyList();
    const surveys = useMemo(() => {
        return surveyListQuery.data?.pages.flatMap((page) => page.data) ?? [];
    }, [surveyListQuery.data]);
    const { checkResourceAvailability } = useResourceChecker();

    // Load user data from authenticated user
    useEffect(() => {
        const loadUserData = () => {
            try {
                if (!user) {
                    return;
                }

                const contactPerson = user.name || 'Customer';
                const contactNo = user.phone || '';
                const contactEmail = user.email || 'customer@ethiotelecom.et';

                // Only update if values actually changed to prevent unnecessary re-renders
                if (
                    formData.contactPerson !== contactPerson ||
                    formData.contactNo !== contactNo ||
                    formData.contactEmail !== contactEmail
                ) {
                    updateFormData({ contactPerson, contactNo, contactEmail });
                }
            } catch (error) {}
        };

        loadUserData();
    }, [user?.id, user?.name, user?.phone, user?.email]);

    const hasActiveSurvey = false;

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
            if (formData.withDevice === undefined) {
                updateFormData({ withDevice: true });
            }
        }
    }, [adjustedStep]);

    // Check if we should show manual step (when resource is not available)
    const shouldShowManualStep = showManualStep && formData.resourceAvailable === false;

    const nextStep = () => {
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

    const checkResourceAndProceed = async () => {
        if (adjustedStep !== 1) {
            nextStep();
            return;
        }

        // Show location confirmation dialog before running the resource check
        setShowLocationConfirmDialog(true);
    };

    const handleLocationConfirmed = async () => {
        setShowLocationConfirmDialog(false);

        setCheckingResource(true);
        setHasSeenResourceDialog(false);
        setShowManualStep(false);
        const toastId = showLoadingToast('Checking resource availability...');

        try {
            const result = await checkResourceAvailability(
                { latitude: formData.latitude, longitude: formData.longitude },
                formData.contactPerson || 'Customer',
            );

            const updates: Partial<ServiceFormData> = {
                resourceAvailable: result.available,
                resourceData: result.data,
                resourceMessage: result.message,
                distance: result.data?.distance ?? '',
                cable_type: result.data?.cable_type ?? '',
                neid: result.data?.neid ?? '',
                nename: result.data?.nename ?? '',
            };
            if (result.requireManualSurvey) {
                updates.isMinimalManualSurvey = true;
                if (result.latitude != null) updates.latitude = parseFloat(result.latitude);
                if (result.longitude != null) updates.longitude = parseFloat(result.longitude);
                if (!formData.bandwidth) {
                    updates.bandwidth = '7M';
                    updates.bandwidthNumericValue = 7;
                }
            }
            updateFormData(updates);

            if (result.available) {
                showSuccessToast(result.message || 'Resource available!', { id: toastId });
                nextStep();
            } else {
                toast.dismiss(toastId);
            }
        } catch (error) {
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

    const canProceedFromDeviceStep = () => {
        if (formData.withDevice === undefined) return false;
        // Without device disabled for now — only "with device" allowed
        // if (formData.withDevice === false) return true;
        if (formData.withDevice === false) return false;
        const isCombo = formData.serviceType === '102647257';
        const isVoiceOnly = formData.serviceType === '1207609454';
        if (isCombo) {
            const hasInternet = !!(formData.selectedDeviceInternet?.id && formData.deviceId);
            const hasVoice = !!(formData.selectedDeviceVoice?.id && formData.deviceVoiceId);
            return hasInternet || hasVoice;
        }
        if (isVoiceOnly) {
            return !!(formData.selectedDeviceVoice?.id && formData.deviceVoiceId);
        }
        return !!(formData.selectedDevice?.id && formData.deviceId);
    };

    const canProceedToNextStep = () => {
        if (isNewCustomer && currentStep === 0) return false;

        switch (adjustedStep) {
            case 0: {
                const hasValidService =
                    formData.serviceType &&
                    (formData.serviceType === '1207609454' || formData.bandwidth);
                const hasAcceptedTerms = formData.termsAccepted === true;
                return hasValidService && hasAcceptedTerms;
            }
            case 1:
                return formData.latitude !== 0 && formData.longitude !== 0 && formData.address;
            case 2:
                // return true;
                return canProceedFromDeviceStep();
            case 3:
                return true;
            default:
                return false;
        }
    };

    const renderStepContent = () => {
        if (isNewCustomer && currentStep === 0) {
            return <CustomerCreationStep onNext={() => onStepChange(1)} />;
        }

        if (shouldShowManualStep) {
            return (
                <ManualSurveyStep
                    onBack={() => {
                        setShowManualStep(false);
                        setHasSeenResourceDialog(false);
                        const locationStep = isNewCustomer ? 2 : 1;
                        onStepChange(locationStep);
                    }}
                />
            );
        }

        switch (adjustedStep) {
            case 0:
                return <ServiceSelectionStep hasActiveSurvey={hasActiveSurvey} />;
            case 1:
                return (
                    <LocationSetupStep
                        googleMapsApiKey={googleMapsApiKey}
                        onNext={(surveyId: string) => {
                            setCreatedSurveyId(surveyId);
                            nextStep();
                        }}
                        onContinueManually={() => {
                            if (!formData.bandwidth) {
                                updateFormData({ bandwidth: '7M', bandwidthNumericValue: 7, customerType: 'residential' });
                            }
                            setShowManualStep(true);
                        }}
                    />
                );
            case 2:
                return <DeviceSelectionStep onNext={nextStep} onBack={prevStep} />;
            case 3:
                return (
                    <ReviewSubmitStep
                        onBack={prevStep}
                        onNext={(surveyId: string) => {
                            setCreatedSurveyId(surveyId);
                            setIsTransitioningToSubscription(true);
                            nextStep();
                        }}
                    />
                );
            case 4:
                return (
                    <SubscriptionPaymentStep
                        surveyId={createdSurveyId}
                        onBack={() => {
                            setIsTransitioningToSubscription(false);
                            onStepChange(isNewCustomer ? 4 : 3);
                        }}
                        onComplete={() => {
                            setIsTransitioningToSubscription(false);
                            resetStore();
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
    const showNavigation = !(isNewCustomer && currentStep === 0) && !shouldShowManualStep && adjustedStep < 2;

    return (
        <div className="w-full space-y-6 px-4 py-2 lg:px-6">
            {/* Header - matching service detail page styling, hidden on desktop where SiteHeader shows it */}
            <div className="flex flex-col gap-2 md:hidden">
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

            <LocationConfirmationDialog
                open={showLocationConfirmDialog}
                onOpenChange={setShowLocationConfirmDialog}
                onConfirm={handleLocationConfirmed}
                onAdjust={() => setShowLocationConfirmDialog(false)}
                latitude={formData.latitude}
                longitude={formData.longitude}
                address={formData.address}
                addressComponents={formData.addressComponents}
                locationAccuracy={formData.locationAccuracy}
            />
        </div>
    );
}
