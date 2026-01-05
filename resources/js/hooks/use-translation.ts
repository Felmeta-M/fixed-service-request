import { useLocale, type Locale } from '@/contexts/locale-context';

interface UseTranslationReturn {
    t: (key: string, replacements?: Record<string, string | number>) => string;
    locale: Locale;
    setLocale: (locale: Locale) => void;
    availableLocales: Record<Locale, string>;
}

/**
 * Hook for accessing translation functionality.
 * 
 * @example
 * ```tsx
 * const { t, locale, setLocale } = useTranslation();
 * 
 * // Basic usage
 * <h1>{t('home.hero.title')}</h1>
 * 
 * // With replacements
 * <p>{t('footer.copyright', { year: 2024 })}</p>
 * 
 * // Change locale
 * <button onClick={() => setLocale('am')}>አማርኛ</button>
 * ```
 */
export function useTranslation(): UseTranslationReturn {
    const { t, locale, setLocale, availableLocales } = useLocale();
    
    return {
        t,
        locale,
        setLocale,
        availableLocales,
    };
}

