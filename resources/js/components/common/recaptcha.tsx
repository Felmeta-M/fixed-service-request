import { Alert, AlertDescription } from '@/components/ui/alert';
// import { isRecaptchaEnabled, useRecaptcha } from '@/hooks/use-recaptcha'; // reCAPTCHA removed
import { isTurnstileEnabled, useTurnstile } from '@/hooks/use-turnstile';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';

interface RecaptchaProps {
    /** Called when token changes (null when expired/reset, string when verified) */
    onVerify: (token: string | null) => void;
    /** Theme of the widget */
    theme?: 'light' | 'dark';
    /** Size of the widget */
    size?: 'normal' | 'compact';
    /** Additional class name for the container */
    className?: string;
    /** Error message from parent (e.g., validation error) */
    error?: string;
}

/**
 * Google reCAPTCHA v2 component
 *
 * This component renders a reCAPTCHA checkbox widget and communicates
 * the verification status back to the parent form via the `onVerify` callback.
 *
 * @example
 * ```tsx
 * const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
 *
 * <Recaptcha
 *   onVerify={setRecaptchaToken}
 *   error={errors.recaptcha}
 * />
 *
 * <button disabled={!recaptchaToken}>Submit</button>
 * ```
 */
export function Recaptcha({ onVerify, className = '', error: externalError }: RecaptchaProps) {
    const turnstileEnabled = isTurnstileEnabled();
    const {
        containerRef: turnstileContainerRef,
        isLoading: turnstileLoading,
        token: turnstileToken,
        error: turnstileInternalError,
        isVerified: isTurnstileVerified,
    } = useTurnstile();

    // Notify parent when token changes (choose provider)
    useEffect(() => {
        onVerify(turnstileToken);
    }, [turnstileToken, onVerify]);

    // If neither Turnstile nor reCAPTCHA is configured, don't render anything
    if (!turnstileEnabled) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                    <ShieldAlert className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                        Turnstile is not configured. Set VITE_TURNSTILE_SITE_KEY in your .env file.
                    </AlertDescription>
                </Alert>
            );
        }
        return null;
    }

    const displayError = externalError || turnstileInternalError;
    const isLoading = turnstileLoading;

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Loading state */}
            {isLoading && (
                <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-600">Loading security check...</span>
                </div>
            )}

            {/* Turnstile container */}
            <div
                ref={turnstileContainerRef}
                className={turnstileLoading ? 'hidden' : ''}
                data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            />

            {/* Verification status indicator */}
            {!isLoading && isTurnstileVerified && (
                <div className="flex items-center gap-2 text-sm text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verification complete</span>
                </div>
            )}

            {/* Error message */}
            {displayError && <p className="text-sm text-red-600">{displayError}</p>}
        </div>
    );
}

/**
 * Export the utility function for checking if reCAPTCHA is enabled
 */
// export { isRecaptchaEnabled }; // reCAPTCHA removed
