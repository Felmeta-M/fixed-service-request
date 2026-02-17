import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        turnstile?: any;
    }
}

const TURNSTILE_SCRIPT_ID = 'turnstile-script';
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const TURNSTILE_LOAD_TIMEOUT_MS = 12000;
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

interface UseTurnstileReturn {
    containerRef: React.RefObject<HTMLDivElement | null>;
    isReady: boolean;
    isLoading: boolean;
    token: string | null;
    error: string | null;
    reset: () => void;
    isVerified: boolean;
}

export function useTurnstile(): UseTurnstileReturn {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY) {
            setError('Turnstile site key is not configured');
            setIsLoading(false);
            return;
        }

        // Debug: print environment and origin to help diagnose 400/110200 errors
        try {
            // eslint-disable-next-line no-console
            console.debug('[use-turnstile] init', {
                origin: typeof window !== 'undefined' ? window.location?.origin : undefined,
                siteKey: TURNSTILE_SITE_KEY,
            });
        } catch (e) {
            // ignore
        }

        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            if (cancelled) return;
            if (!window.turnstile) {
                setError('Security check could not load. Check your network or ad blockers.');
                setIsLoading(false);
            }
        }, TURNSTILE_LOAD_TIMEOUT_MS);

        const done = () => {
            if (cancelled) return;
            window.clearTimeout(timeoutId);
            setIsReady(true);
            setIsLoading(false);
        };

        const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

        if (existingScript) {
            // If the Turnstile global is already available, we're ready.
            if ((window as any).turnstile) {
                // eslint-disable-next-line no-console
                console.debug('[use-turnstile] script already present and turnstile ready');
                done();
                return () => {
                    cancelled = true;
                    window.clearTimeout(timeoutId);
                };
            }

            // If script tag exists but `turnstile` is not yet available, attach onload to it.
            const onLoadHandler = () => {
                if (cancelled) return;
                // eslint-disable-next-line no-console
                console.debug('[use-turnstile] existing script loaded');
                done();
            };
            existingScript.addEventListener('load', onLoadHandler);

            return () => {
                cancelled = true;
                window.clearTimeout(timeoutId);
                existingScript.removeEventListener('load', onLoadHandler);
            };
        }

        // Create script tag only if it doesn't exist. Do NOT remove the script on cleanup
        // to avoid issues during HMR or multiple component mounts.
        const script = document.createElement('script');
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = TURNSTILE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            // eslint-disable-next-line no-console
            console.debug('[use-turnstile] script loaded');
            done();
        };
        script.onerror = (ev) => {
            if (cancelled) return;
            // eslint-disable-next-line no-console
            console.error('[use-turnstile] script failed to load', ev);
            setError('Security check could not load. Check your network or ad blockers.');
            setIsLoading(false);
        };
        document.head.appendChild(script);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
            // Intentionally do not remove the script element here. Leaving it avoids
            // reloading the library during HMR or when multiple components mount.
        };
    }, []);

    useEffect(() => {
        if (!isReady || !containerRef.current) return;

        try {
            // Avoid rendering twice for the same widget
            if (widgetIdRef.current == null) {
                // eslint-disable-next-line no-console
                console.debug('[use-turnstile] rendering widget', { container: containerRef.current });
                widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
                    sitekey: TURNSTILE_SITE_KEY,
                    callback: (responseToken: string) => {
                        // eslint-disable-next-line no-console
                        console.debug('[use-turnstile] token received', { token: responseToken });
                        setToken(responseToken);
                        setError(null);
                    },
                    'expired-callback': () => {
                        // eslint-disable-next-line no-console
                        console.warn('[use-turnstile] token expired');
                        setToken(null);
                    },
                    'error-callback': (errData?: any) => {
                        // Log the error details Cloudflare may provide in callbacks
                        // eslint-disable-next-line no-console
                        console.error('[use-turnstile] widget error-callback', errData);
                        setToken(null);
                        setError('Turnstile error occurred');
                    },
                });
                // eslint-disable-next-line no-console
                console.debug('[use-turnstile] widgetId', widgetIdRef.current);
            }
        } catch (err: any) {
            const msg = String(err?.message || err);
            // Suppress 'already loaded' warning from Turnstile script which can occur
            // during HMR or multiple render attempts. Still log other unexpected errors.
            if (!/already has been loaded/i.test(msg)) {
                // eslint-disable-next-line no-console
                console.error('Turnstile render warning:', err);
            }
        }
    }, [isReady]);

    const reset = useCallback(() => {
        if (window.turnstile && widgetIdRef.current) {
            try {
                window.turnstile.reset(widgetIdRef.current);
                setToken(null);
            } catch (e) {
                // ignore
            }
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
    };
}

export function isTurnstileEnabled(): boolean {
    return Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
}
