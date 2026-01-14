import { Footer } from '@/components/layout/footer';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, LogIn, LogOut, Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import logo from '../images/ethio_logo_full.png';

type Props = {
    children: React.ReactNode;
};

export default function GuestLayout({ children }: Props) {
    const { auth } = usePage().props as { auth?: { user?: any } };
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, locale } = useTranslation();
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
                                    {/* <Link href="#services" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
                                        Services
                                    </Link> */}
                                    {/* <Link
                                        href={route('terms')}
                                        className="cursor-pointer text-sm transition-all duration-200 hover:text-primary hover:underline"
                                    >
                                        Terms and Conditions
                                    </Link> */}

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
                        <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
                            <Link
                                href="#services"
                                className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {t('nav.services')}
                            </Link>
                            <Link
                                href={route('terms')}
                                className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {t('footer.terms')}
                            </Link>

                            {/* Language Switcher */}
                            <div className="py-2">
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
