import { LocaleProvider } from '@/contexts/locale-context';
import type { ReactNode } from 'react';

interface RootLayoutProps {
    children: ReactNode;
}

/**
 * Root layout that provides locale context to all pages.
 * This should wrap all other layouts/pages.
 */
export default function RootLayout({ children }: RootLayoutProps) {
    return <LocaleProvider>{children}</LocaleProvider>;
}
