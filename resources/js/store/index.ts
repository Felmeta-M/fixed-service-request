// ─── Zustand Store Barrel Exports ────────────────────────────────────────────
//
// Central re-export for all Zustand stores in the application.
// Import from '@/store' for convenience:
//   import { useServiceFormStore, useFilterStore } from '@/store';
//

export { useServiceFormStore } from './service-form-store';
export type { ServiceFormData } from './service-form-store';

export { useCustomerStore, useActiveCustomer, useHydrateCustomerStore } from './customer-store';
export type { ActiveCustomerPayload } from './customer-store';

export { useFilterStore } from './filter-store';

export { useDialogStore } from './dialog-store';

export { useLocationStore } from './location-store';
export type { LocationCoords, LocationAccuracyInfo } from './location-store';

export { useUIStore } from './ui-store';
