import { Footer } from '@/components/layout/footer';
import { LocaleSwitcher } from '@/components/common/locale-switcher';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
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
        <div className="mx-auto ">
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
                                        className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
                                    >
                                        {t('nav.services')}
                                    </button>
                                    {/* <button
                                        onClick={() => scrollToSection('coverage')}
                                        className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
                                    >
                                        {t('nav.coverage')}
                                    </button> */}

                                    <LocaleSwitcher variant="compact" />
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
                                        <Link href={route('logout')} method="post" as="button">
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
                            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </div>
                {isMobileMenuOpen && (
                    <div className="border-t bg-gradient-to-r from-[#F5FBF6] via-[#FEFFFE] to-[#F4F7FB] backdrop-blur-sm md:hidden">
                        <div className="mx-auto max-w-7xl space-y-2 px-4 py-4">
                            <button
                                onClick={() => scrollToSection('services')}
                                className="block w-full py-2 text-left text-sm font-medium text-gray-700 hover:text-primary"
                            >
                                {t('nav.services')}
                            </button>
                            {/* <button
                                onClick={() => scrollToSection('coverage')}
                                className="block w-full py-2 text-left text-sm font-medium text-gray-700 hover:text-primary"
                            >
                                {t('nav.coverage')}
                            </button> */}

                            {/* Language Switcher */}
                            <div className="py-2 border-t border-gray-100">
                                <LocaleSwitcher />
                            </div>

                            {auth?.user ? (
                                <>
                                    {/* Dashboard */}
                                    <Link
                                        href={route('services')}
                                        className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <LayoutDashboard className="h-4 w-4" />
                                            <span>{t('nav.dashboard')}</span>
                                        </div>
                                    </Link>

                                    {/* Logout */}
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full"
                                    >
                                        <Button variant="outline" className="flex w-full items-center justify-center gap-2">
                                            <LogOut className="h-4 w-4" />
                                            <span>{t('nav.log_out')}</span>
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {/* Login */}
                                    <Link href={route('otp.phone')} className="block cursor-pointer pt-3" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="br-primary flex w-full items-center justify-center space-x-2 text-white hover:opacity-90">
                                            <LogIn className="h-4 w-4" />
                                            <span>{t('nav.login_to_account')}</span>
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>
            <div>{children}</div>

            <Footer />
            <Toaster />
        </div>
    );
}
