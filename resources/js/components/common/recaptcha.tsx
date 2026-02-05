import { Alert, AlertDescription } from '@/components/ui/alert';
import { isRecaptchaEnabled, useRecaptcha } from '@/hooks/use-recaptcha';
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
export function Recaptcha({ onVerify, theme = 'light', size = 'normal', className = '', error: externalError }: RecaptchaProps) {
    const { containerRef, isLoading, isVerified, token, error: internalError, siteKey } = useRecaptcha({ theme, size });

    // Notify parent when token changes
    useEffect(() => {
        onVerify(token);
    }, [token, onVerify]);

    // If reCAPTCHA is not configured, don't render anything
    if (!isRecaptchaEnabled()) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                    <ShieldAlert className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                        reCAPTCHA is not configured. Set VITE_RECAPTCHA_SITE_KEY in your .env file.
                    </AlertDescription>
                </Alert>
            );
        }
        return null;
    }

    const displayError = externalError || internalError;

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Loading state */}
            {isLoading && (
                <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-600">Loading security check...</span>
                </div>
            )}

            {/* reCAPTCHA container */}
            <div ref={containerRef} className={isLoading ? 'hidden' : ''} data-sitekey={siteKey} />

            {/* Verification status indicator */}
            {!isLoading && isVerified && (
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
export { isRecaptchaEnabled };
