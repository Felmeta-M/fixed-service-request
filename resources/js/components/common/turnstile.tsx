import { Alert, AlertDescription } from '@/components/ui/alert';
import { isTurnstileEnabled, useTurnstile } from '@/hooks/use-turnstile';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface TurnstileHandle {
    /** Reset the widget so the user can complete a new challenge (e.g. after token expired or duplicate) */
    reset: () => void;
}

interface TurnstileProps {
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
 * Cloudflare Turnstile widget for security verification on public forms.
 *
 * @example
 * ```tsx
 * const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
 *
 * <Turnstile
 *   onVerify={setTurnstileToken}
 *   error={errors.turnstile}
 * />
 *
 * <button disabled={!turnstileToken}>Submit</button>
 * ```
 */
export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
    { onVerify, className = '', error: externalError },
    ref,
) {
    const turnstileEnabled = isTurnstileEnabled();
    const {
        containerRef: turnstileContainerRef,
        isLoading: turnstileLoading,
        token: turnstileToken,
        error: turnstileInternalError,
        isVerified: isTurnstileVerified,
        reset: turnstileReset,
    } = useTurnstile();

    const resetRef = useRef(turnstileReset);
    resetRef.current = turnstileReset;
    useImperativeHandle(ref, () => ({
        reset: () => resetRef.current?.(),
    }), []);

    useEffect(() => {
        onVerify(turnstileToken);
    }, [turnstileToken, onVerify]);

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
            {isLoading && (
                <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-600">Loading security check...</span>
                </div>
            )}

            <div ref={turnstileContainerRef} className={turnstileLoading ? 'hidden' : ''} data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY} />

            {!isLoading && isTurnstileVerified && (
                <div className="flex items-center gap-2 text-sm text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verification complete</span>
                </div>
            )}

            {displayError && <p className="text-sm text-red-600">{displayError}</p>}
        </div>
    );
});
