/**
 * Clears all client-side footprints on logout so no user/session data remains
 * in the browser. Call this from every logout path before or when submitting
 * the logout request.
 */
export function clearBrowserFootprint(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.clear();
        sessionStorage.clear();
        clearAppCookies();
    } catch {
        // Ignore storage/cookie errors (e.g. private mode, storage disabled)
    }
}

const APP_COOKIE_NAMES = ['sidebar_state', 'appearance'] as const;

function clearAppCookies(): void {
    if (typeof document === 'undefined') return;

    const path = '; path=/';
    const expire = '; max-age=0';
    const sameSite = '; SameSite=Lax';

    for (const name of APP_COOKIE_NAMES) {
        document.cookie = `${name}=${path}${expire}${sameSite}`;
    }
}
