import { AvailableDevice } from '@/hooks/use-available-devices';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceFormData {
    serviceType: string;
    bandwidth: string;
    customerType: string;
    withDevice?: boolean;
    selectedDevice?: AvailableDevice | null;
    selectedDeviceInternet?: AvailableDevice | null;
    selectedDeviceVoice?: AvailableDevice | null;
    deviceId?: string | null;
    deviceVoiceId?: string | null;
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
    locationAccuracy?: {
        meters: number;
        level: string;
        timestamp?: number;
    };
}

interface ServiceFormStore {
    // ── State ──────────────────────────────────────────────────────────────
    formData: ServiceFormData;
    currentStep: number;
    checkingResource: boolean;
    createdSurveyId: string | null;
    showManualStep: boolean;
    hasSeenResourceDialog: boolean;
    isTransitioningToSubscription: boolean;
    isNewCustomer: boolean;

    // ── Actions ─────────────────────────────────────────────────────────────
    updateFormData: (updates: Partial<ServiceFormData>) => void;
    setCurrentStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    setCheckingResource: (val: boolean) => void;
    setCreatedSurveyId: (id: string | null) => void;
    setShowManualStep: (val: boolean) => void;
    setHasSeenResourceDialog: (val: boolean) => void;
    setIsTransitioningToSubscription: (val: boolean) => void;
    setIsNewCustomer: (val: boolean) => void;
    reset: () => void;
}

// ─── Initial State ───────────────────────────────────────────────────────────

const initialFormData: ServiceFormData = {
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
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useServiceFormStore = create<ServiceFormStore>()(
    devtools(
        (set, get) => ({
            // State
            formData: { ...initialFormData },
            currentStep: 0,
            checkingResource: false,
            createdSurveyId: null,
            showManualStep: false,
            hasSeenResourceDialog: false,
            isTransitioningToSubscription: false,
            isNewCustomer: false,

            // Actions
            updateFormData: (updates) =>
                set(
                    (state) => ({
                        formData: { ...state.formData, ...updates },
                    }),
                    undefined,
                    'updateFormData',
                ),

            setCurrentStep: (step) => set({ currentStep: step }, undefined, 'setCurrentStep'),

            nextStep: () => {
                const { currentStep, isNewCustomer } = get();
                const maxSteps = isNewCustomer ? 6 : 5;
                if (currentStep < maxSteps) {
                    set({ currentStep: currentStep + 1 }, undefined, 'nextStep');
                }
            },

            prevStep: () => {
                const { currentStep } = get();
                if (currentStep > 0) {
                    set({ currentStep: currentStep - 1 }, undefined, 'prevStep');
                }
            },

            setCheckingResource: (val) => set({ checkingResource: val }, undefined, 'setCheckingResource'),

            setCreatedSurveyId: (id) => set({ createdSurveyId: id }, undefined, 'setCreatedSurveyId'),

            setShowManualStep: (val) => set({ showManualStep: val }, undefined, 'setShowManualStep'),

            setHasSeenResourceDialog: (val) => set({ hasSeenResourceDialog: val }, undefined, 'setHasSeenResourceDialog'),

            setIsTransitioningToSubscription: (val) =>
                set({ isTransitioningToSubscription: val }, undefined, 'setIsTransitioningToSubscription'),

            setIsNewCustomer: (val) => set({ isNewCustomer: val }, undefined, 'setIsNewCustomer'),

            reset: () =>
                set(
                    {
                        formData: { ...initialFormData },
                        currentStep: 0,
                        checkingResource: false,
                        createdSurveyId: null,
                        showManualStep: false,
                        hasSeenResourceDialog: false,
                        isTransitioningToSubscription: false,
                    },
                    undefined,
                    'reset',
                ),
        }),
        { name: 'ServiceFormStore' },
    ),
);
