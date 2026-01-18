/**
 * Standardized toast notification helpers
 * Uses default sonner styling with higher durations for better visibility
 */
import { toast } from 'sonner';

// Higher durations for better user visibility
const DEFAULT_DURATION = 5000;

/**
 * Show an error toast
 */
export function showErrorToast(message: string, options?: { id?: string | number; duration?: number }) {
    return toast.error(message, {
        duration: options?.duration ?? DEFAULT_DURATION,
        id: options?.id,
    });
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string, options?: { id?: string | number; description?: string; duration?: number }) {
    return toast.success(message, {
        duration: options?.duration ?? DEFAULT_DURATION,
        id: options?.id,
        description: options?.description,
    });
}

/**
 * Show a warning toast
 */
export function showWarningToast(message: string, options?: { id?: string | number; description?: string; duration?: number }) {
    return toast.warning(message, {
        duration: options?.duration ?? DEFAULT_DURATION,
        id: options?.id,
        description: options?.description,
    });
}

/**
 * Show an info toast
 */
export function showInfoToast(message: string, options?: { id?: string | number; description?: string; duration?: number }) {
    return toast.info(message, {
        duration: options?.duration ?? DEFAULT_DURATION,
        id: options?.id,
        description: options?.description,
    });
}

/**
 * Show a loading toast
 */
export function showLoadingToast(message: string, options?: { id?: string | number; duration?: number }) {
    return toast.loading(message, {
        duration: options?.duration ?? Infinity,
        id: options?.id,
    });
}
