import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        grecaptcha: {
            ready: (callback: () => void) => void;
            render: (
                container: string | HTMLElement,
                parameters: {
                    sitekey: string;
                    callback?: (token: string) => void;
                    'expired-callback'?: () => void;
                    'error-callback'?: () => void;
                    theme?: 'light' | 'dark';
                    size?: 'normal' | 'compact';
                },
            ) => number;
            reset: (widgetId?: number) => void;
            getResponse: (widgetId?: number) => string;
            execute: (widgetId?: number) => void;
        };
        onRecaptchaLoad?: () => void;
    }
}

const RECAPTCHA_SCRIPT_ID = 'recaptcha-script';
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

interface UseRecaptchaOptions {
    /** Theme of the reCAPTCHA widget */
    theme?: 'light' | 'dark';
    /** Size of the reCAPTCHA widget */
    size?: 'normal' | 'compact';
    /** Called when token expires */
    onExpired?: () => void;
    /** Called on error */
    onError?: () => void;
}

interface UseRecaptchaReturn {
    /** Ref to attach to the container element */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Whether reCAPTCHA script is loaded and ready */
    isReady: boolean;
    /** Whether the reCAPTCHA is loading */
    isLoading: boolean;
    /** Current reCAPTCHA token (null if not verified) */
    token: string | null;
    /** Error message if any */
    error: string | null;
    /** Reset the reCAPTCHA widget */
    reset: () => void;
    /** Check if reCAPTCHA is verified */
    isVerified: boolean;
    /** Site key being used */
    siteKey: string;
}

/**
 * Custom hook for Google reCAPTCHA v2 integration
 *
 * @example
 * ```tsx
 * const { containerRef, token, isVerified, reset, isLoading } = useRecaptcha();
 *
 * return (
 *   <form onSubmit={handleSubmit}>
 *     <div ref={containerRef} />
 *     <button disabled={!isVerified}>Submit</button>
 *   </form>
 * );
 * ```
 */
export function useRecaptcha(options: UseRecaptchaOptions = {}): UseRecaptchaReturn {
    const { theme = 'light', size = 'normal', onExpired, onError } = options;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<number | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load the reCAPTCHA script
    useEffect(() => {
        if (!RECAPTCHA_SITE_KEY) {
            setError('reCAPTCHA site key is not configured');
            setIsLoading(false);
            return;
        }

        // Check if script is already loaded
        if (document.getElementById(RECAPTCHA_SCRIPT_ID)) {
            if (window.grecaptcha) {
                window.grecaptcha.ready(() => {
                    setIsReady(true);
                    setIsLoading(false);
                });
            }
            return;
        }

        // Create and load the script
        const script = document.createElement('script');
        script.id = RECAPTCHA_SCRIPT_ID;
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;

        // Set up the callback
        window.onRecaptchaLoad = () => {
            setIsReady(true);
            setIsLoading(false);
        };

        script.onerror = () => {
            setError('Failed to load reCAPTCHA script');
            setIsLoading(false);
        };

        document.head.appendChild(script);

        return () => {
            // Cleanup callback
            delete window.onRecaptchaLoad;
        };
    }, []);

    // Render the widget when ready
    useEffect(() => {
        if (!isReady || !containerRef.current || widgetIdRef.current !== null) {
            return;
        }

        try {
            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
                sitekey: RECAPTCHA_SITE_KEY,
                callback: (responseToken: string) => {
                    setToken(responseToken);
                    setError(null);
                },
                'expired-callback': () => {
                    setToken(null);
                    onExpired?.();
                },
                'error-callback': () => {
                    setToken(null);
                    setError('reCAPTCHA error occurred');
                    onError?.();
                },
                theme,
                size,
            });
        } catch (err) {
            // Widget might already be rendered
            console.warn('reCAPTCHA widget render warning:', err);
        }
    }, [isReady, theme, size, onExpired, onError]);

    const reset = useCallback(() => {
        if (window.grecaptcha && widgetIdRef.current !== null) {
            window.grecaptcha.reset(widgetIdRef.current);
            setToken(null);
        }
    }, []);

    return {
        containerRef,
        isReady,
        isLoading,
        token,
        error,
        reset,
        isVerified: token !== null,
        siteKey: RECAPTCHA_SITE_KEY,
    };
}

/**
 * Check if reCAPTCHA is enabled (site key is configured)
 */
export function isRecaptchaEnabled(): boolean {
    return Boolean(RECAPTCHA_SITE_KEY);
}
