import { usePage } from '@inertiajs/react';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

export type Locale = 'en' | 'am' | 'om' | 'so' | 'ti' | 'aa';

export interface LocaleContextType {
    locale: Locale;
    availableLocales: Record<Locale, string>;
    translations: Record<string, string>;
    setLocale: (locale: Locale) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const defaultLocales: Record<Locale, string> = {
    en: 'English',
    am: 'አማርኛ',
    om: 'Afaan Oromoo',
    so: 'Af Soomaali',
    ti: 'ትግርኛ',
    aa: 'Qafar',
};

interface LocaleProviderProps {
    children: ReactNode;
}

/**
 * Locale provider that reads directly from Inertia page props.
 * This ensures translations update automatically when locale changes.
 */
export function LocaleProvider({ children }: LocaleProviderProps) {
    const pageProps = usePage().props as Record<string, unknown>;

    // Read locale data from page props (from Laravel)
    const locale = (pageProps.locale as Locale) ?? 'en';
    const availableLocales = (pageProps.availableLocales as Record<Locale, string>) ?? defaultLocales;
    const translations = (pageProps.translations as Record<string, string>) ?? {};

    const setLocale = useCallback((newLocale: Locale) => {

        // Get CSRF token from meta tag or cookie
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            || document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];

        // Use fetch API directly for more reliable POST
        fetch('/locale', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
                'X-XSRF-TOKEN': decodeURIComponent(csrfToken || ''),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ locale: newLocale }),
            credentials: 'same-origin',
        })
            .then((response) => {
                // Force full page reload to get new translations
                window.location.reload();
            })
            .catch((error) => {
                // Try reload anyway
                window.location.reload();
            });
    }, []);

    const t = useCallback(
        (key: string, replacements?: Record<string, string | number>): string => {
            let translation = translations[key] || key;

            // Handle replacements like {variable}
            if (replacements) {
                Object.entries(replacements).forEach(([placeholder, value]) => {
                    translation = translation.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
                });
            }

            return translation;
        },
        [translations],
    );

    const value = useMemo(
        () => ({
            locale,
            availableLocales,
            translations,
            setLocale,
            t,
        }),
        [locale, availableLocales, translations, setLocale, t],
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Hook to access locale context.
 * Must be used within LocaleProvider.
 */
export function useLocale(): LocaleContextType {
    const context = useContext(LocaleContext);
    if (context === undefined) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
}
