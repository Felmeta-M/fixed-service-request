/**
 * Standardized toast notification helpers
 * Provides consistent styling and behavior across the application
 */
import { toast } from 'sonner';

const TOAST_STYLES = {
    className: 'text-lg [&>div]:text-lg [&>div>div]:text-lg',
    style: {
        fontSize: '18px',
    },
} as const;

const DURATIONS = {
    error: 8000,
    success: 5000,
    warning: 6000,
    info: 4000,
    loading: Infinity,
} as const;

/**
 * Show an error toast with consistent styling
 */
export function showErrorToast(message: string, options?: { id?: string | number; duration?: number }) {
    return toast.error(message, {
        ...TOAST_STYLES,
        duration: options?.duration ?? DURATIONS.error,
        id: options?.id,
    });
}

/**
 * Show a success toast with consistent styling
 */
export function showSuccessToast(message: string, options?: { id?: string | number; description?: string; duration?: number }) {
    return toast.success(message, {
        ...TOAST_STYLES,
        duration: options?.duration ?? DURATIONS.success,
        id: options?.id,
        description: options?.description,
    });
}

/**
 * Show a warning toast with consistent styling
 */
export function showWarningToast(message: string, options?: { id?: string | number; description?: string; duration?: number }) {
    return toast.warning(message, {
        ...TOAST_STYLES,
        duration: options?.duration ?? DURATIONS.warning,
        id: options?.id,
        description: options?.description,
    });
}

/**
 * Show an info toast with consistent styling
 */
export function showInfoToast(message: string, options?: { id?: string | number; description?: string; duration?: number }) {
    return toast.info(message, {
        ...TOAST_STYLES,
        duration: options?.duration ?? DURATIONS.info,
        id: options?.id,
        description: options?.description,
    });
}

/**
 * Show a loading toast with consistent styling
 */
export function showLoadingToast(message: string, options?: { id?: string | number; duration?: number }) {
    return toast.loading(message, {
        ...TOAST_STYLES,
        duration: options?.duration ?? DURATIONS.loading,
        id: options?.id,
    });
}
