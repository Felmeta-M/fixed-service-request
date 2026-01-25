import { useTranslation } from '@/hooks/use-translation';
import type { Locale } from '@/types/index.d';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface LocaleSwitcherProps {
    variant?: 'default' | 'compact';
    className?: string;
}

export function LocaleSwitcher({ variant = 'default', className }: LocaleSwitcherProps) {
    const { locale, availableLocales, setLocale, t } = useTranslation();

    const currentLocaleName = availableLocales[locale] || 'English';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={variant === 'compact' ? 'icon' : 'default'} className={className}>
                    <Globe className="h-4 w-4" />
                    {variant === 'default' && <span className="ml-2">{currentLocaleName}</span>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {(Object.entries(availableLocales) as [Locale, string][]).map(([code, name]) => (
                    <DropdownMenuItem
                        key={code}
                        onClick={() => setLocale(code)}
                        className={locale === code ? 'bg-accent font-medium' : ''}
                    >
                        {name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Simple select-based locale switcher for forms or compact spaces
 */
export function LocaleSelect({ className }: { className?: string }) {
    const { locale, availableLocales, setLocale } = useTranslation();

    return (
        <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className={`rounded-md border px-2 py-1 text-sm ${className || ''}`}
        >
            {(Object.entries(availableLocales) as [Locale, string][]).map(([code, name]) => (
                <option key={code} value={code}>
                    {name}
                </option>
            ))}
        </select>
    );
}

