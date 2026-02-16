import { ComplaintsIcon, StepServiceIcon } from '@/components/app/app-sidebar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { useTranslation } from '@/hooks/use-translation';
import { clearBrowserFootprint } from '@/lib/clear-browser-footprint';
import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, LogIn, LogOut, Menu, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import logo from '../images/ethio_logo_full.png';

type Props = {
    children: React.ReactNode;
};

export default function GuestLayout({ children }: Props) {
    const { auth } = usePage().props as { auth?: { user?: any } };
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, locale } = useTranslation();

    // Smooth scroll to section
    const scrollToSection = useCallback((sectionId: string) => {
        setIsMobileMenuOpen(false);

        // Check if we're on the home page
        if (window.location.pathname === '/') {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // Navigate to home page with hash
            window.location.href = `/#${sectionId}`;
        }
    }, []);

    return (
        <div className="mx-auto">
            <header key={locale} className="sticky top-0 z-50 mx-auto w-full bg-gradient-to-r from-[#F5FBF6] via-[#FEFFFE] to-[#F4F7FB]">
                <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo Section */}
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-3">
                                <Link href={route('home')} className="cursor-pointer">
                                    <img src={logo} alt="Ethio Telecom Logo" className="h-12 w-full transition-all duration-200" />
                                </Link>
                            </div>
                        </div>

                        <div className="hidden items-center space-x-6 md:flex">
                            <div className="flex items-center space-x-4">
                                <nav className="flex items-center space-x-6">
                                    <button
                                        onClick={() => scrollToSection('services')}
                                        className="text-md cursor-pointer font-medium text-gray-700 transition-colors hover:text-primary"
                                    >
                                        <span>{t('nav.services')}</span>
                                    </button>
                                    {!auth?.user && (
                                        <Link
                                            href={route('complaint')}
                                            className="text-md cursor-pointer font-medium text-gray-700 transition-colors hover:text-primary"
                                        >
                                            <span>{t('nav.complaints')}</span>
                                        </Link>
                                    )}
                                    {/* <button
                                        onClick={() => scrollToSection('coverage')}
                                        className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
                                    >
                                        {t('nav.coverage')}
                                    </button> */}

                                    {/* <LocaleSwitcher variant="compact" /> */}
                                </nav>
                                {auth?.user ? (
                                    <div className="flex items-center space-x-4">
                                        <Link
                                            href={route('services')}
                                            className="flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-accent-foreground"
                                        >
                                            <LayoutDashboard className="h-4 w-4" />
                                            <span>{t('nav.dashboard')}</span>
                                        </Link>
                                        <Link href={route('logout')} method="post" as="button" onClick={() => clearBrowserFootprint()}>
                                            <Button variant="outline" type="submit">
                                                <LogOut className="h-4 w-4" />
                                                <span>{t('nav.logout')}</span>
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    // If NOT logged in
                                    <Link href={route('otp.phone')} className="cursor-pointer">
                                        <Button className="flex cursor-pointer items-center bg-primary text-white hover:opacity-90">
                                            <LogIn className="h-4 w-4" />
                                            <span>{t('nav.login')}</span>
                                        </Button>
                                    </Link>
                                )}
                            </div>
                            {/* )} */}
                        </div>

                        <div className="flex md:hidden">
                            <Button
                                variant="ghost"
                                size="default"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="h-14 w-14 shrink-0 p-0"
                            >
                                {isMobileMenuOpen ? <X className="size-8" /> : <Menu className="size-8" />}
                            </Button>
                        </div>
                    </div>
                </div>
                {isMobileMenuOpen && (
                    <div className="border-t bg-gradient-to-r from-[#F5FBF6] via-[#FEFFFE] to-[#F4F7FB]/90 backdrop-blur-md md:hidden">
                        <div className="mx-auto flex max-w-md">
                            <div className="w-full space-y-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm shadow-black/5">
                                {/* <div className="flex items-center justify-between pb-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                                        {t('nav.menu')}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full text-gray-500 hover:bg-gray-100"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div> */}

                                <div className="space-y-2">
                                    <button
                                        onClick={() => scrollToSection('services')}
                                        className="text-md flex min-h-[2.75rem] w-full items-center justify-between rounded-xl px-3 py-2 font-medium text-gray-800 transition hover:text-primary"
                                    >
                                        <span className="flex items-center">{t('nav.services')}</span>
                                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary">
                                            <StepServiceIcon className="h-8 w-8" />
                                        </span>
                                    </button>

                                    {!auth?.user && (
                                        <Link
                                            href={route('complaint')}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="text-md flex min-h-[2.75rem] w-full items-center justify-between rounded-xl px-3 py-2 font-medium text-gray-800 transition hover:text-primary"
                                        >
                                            <span className="flex items-center">{t('nav.complaints')}</span>
                                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary">
                                                <ComplaintsIcon className="h-5 w-5" />
                                            </span>
                                        </Link>
                                    )}
                                </div>

                                {auth?.user ? (
                                    <div className="border-t border-dashed border-gray-200">
                                        <Link
                                            href={route('services')}
                                            className="flex min-h-[2.75rem] w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-gray-800 transition hover:text-primary"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <span className="flex items-center">{t('nav.dashboard')}</span>
                                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary">
                                                <LayoutDashboard className="h-6 w-6" />
                                            </span>
                                        </Link>

                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            onClick={() => {
                                                clearBrowserFootprint();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="block w-full"
                                        >
                                            <Button
                                                variant="outline"
                                                className="flex w-full items-center justify-center gap-2 rounded-xl text-red-600 hover:text-red-700 hover:opacity-90"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>{t('nav.log_out')}</span>
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-2 border-t border-dashed border-gray-200 pt-3">
                                        <Link href={route('otp.phone')} className="block cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button className="text-md flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-white shadow-md shadow-primary/20 hover:opacity-90">
                                                <LogIn className="h-5 w-5" />
                                                <span>{t('nav.login_to_account')}</span>
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>
            <div>{children}</div>

            <Footer />
            <Toaster position="top-right" />
        </div>
    );
}
