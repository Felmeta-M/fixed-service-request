import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LocationCoords {
    lat: number;
    lng: number;
}

export interface LocationAccuracyInfo {
    meters: number;
    level: string;
    timestamp?: number;
}

interface LocationStore {
    // ── State ──────────────────────────────────────────────────────────────
    selectedLocation: LocationCoords | null;
    address: string;
    locationAccuracy: LocationAccuracyInfo | null;
    isGeocoding: boolean;
    locationError: string | null;
    isAutoDetecting: boolean;

    // Resource check state (shared between location step and survey requests)
    resourceAvailable: boolean | undefined;
    checkingResource: boolean;
    resourceMessage: string;
    resourceData: Record<string, any> | null;

    // ── Actions ─────────────────────────────────────────────────────────────
    setLocation: (loc: LocationCoords, address?: string) => void;
    setAddress: (address: string) => void;
    setAccuracy: (accuracy: LocationAccuracyInfo | null) => void;
    setIsGeocoding: (val: boolean) => void;
    setLocationError: (error: string | null) => void;
    setIsAutoDetecting: (val: boolean) => void;
    setResourceAvailable: (val: boolean | undefined) => void;
    setCheckingResource: (val: boolean) => void;
    setResourceMessage: (msg: string) => void;
    setResourceData: (data: Record<string, any> | null) => void;
    resetLocation: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useLocationStore = create<LocationStore>()(
    devtools(
        (set) => ({
            selectedLocation: null,
            address: '',
            locationAccuracy: null,
            isGeocoding: false,
            locationError: null,
            isAutoDetecting: false,
            resourceAvailable: undefined,
            checkingResource: false,
            resourceMessage: '',
            resourceData: null,

            setLocation: (loc, address) =>
                set(
                    { selectedLocation: loc, ...(address !== undefined ? { address } : {}) },
                    undefined,
                    'setLocation',
                ),

            setAddress: (address) =>
                set({ address }, undefined, 'setAddress'),

            setAccuracy: (accuracy) =>
                set({ locationAccuracy: accuracy }, undefined, 'setAccuracy'),

            setIsGeocoding: (val) =>
                set({ isGeocoding: val }, undefined, 'setIsGeocoding'),

            setLocationError: (error) =>
                set({ locationError: error }, undefined, 'setLocationError'),

            setIsAutoDetecting: (val) =>
                set({ isAutoDetecting: val }, undefined, 'setIsAutoDetecting'),

            setResourceAvailable: (val) =>
                set({ resourceAvailable: val }, undefined, 'setResourceAvailable'),

            setCheckingResource: (val) =>
                set({ checkingResource: val }, undefined, 'setCheckingResource'),

            setResourceMessage: (msg) =>
                set({ resourceMessage: msg }, undefined, 'setResourceMessage'),

            setResourceData: (data) =>
                set({ resourceData: data }, undefined, 'setResourceData'),

            resetLocation: () =>
                set(
                    {
                        selectedLocation: null,
                        address: '',
                        locationAccuracy: null,
                        isGeocoding: false,
                        locationError: null,
                        isAutoDetecting: false,
                        resourceAvailable: undefined,
                        checkingResource: false,
                        resourceMessage: '',
                        resourceData: null,
                    },
                    undefined,
                    'resetLocation',
                ),
        }),
        { name: 'LocationStore' },
    ),
);
