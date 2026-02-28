import { ComplaintsIcon, StepServiceIcon } from '@/components/app/app-sidebar';
import { LocaleSwitcher } from '@/components/common/locale-switcher';
import { useTranslation } from '@/hooks/use-translation';
import { clearBrowserFootprint } from '@/lib/clear-browser-footprint';
import { useActiveCustomer } from '@/store/customer-store';
import { Link, router } from '@inertiajs/react';
import { ArrowRight, LayoutDashboard, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '../../images/ethio_logo_full.png';
import { Button } from '../ui/button';

export const Header = () => {
    const { activeCustomer, clearActiveCustomer } = useActiveCustomer();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, locale } = useTranslation();

    const handleLogout = () => {
        clearBrowserFootprint();
        clearActiveCustomer();
    };

    const submitLogout = () => {
        handleLogout();
        router.post(route('logout'));
    };

    return (
        <header key={locale} className="sticky top-0 z-50 w-full border-b bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-2">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-3">
                            <img src={logo} alt="EthioTelecom Logo" className="h-12 w-full" />
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center space-x-6 md:flex">
                        {activeCustomer ? (
                            <div className="flex items-center space-x-4">
                                {/* User Menu */}
                                <div className="flex items-center space-x-2">
                                    <Link href="/Services">
                                        <Button variant="ghost" size="sm" className="flex items-center hover:bg-gray-100">
                                            <LayoutDashboard className="h-4 w-4" />
                                            <span>{t('nav.dashboard')}</span>
                                        </Button>
                                    </Link>

                                    <LocaleSwitcher variant="compact" />

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center space-x-2"
                                    >
                                        <Link href={route('logout')} method="post" className="flex items-center" onClick={handleLogout}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            {t('nav.logout')}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                {/* Navigation Links for Unauthenticated Users */}
                                <nav className="flex items-center space-x-6">
                                    <Link href="#services" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
                                        {t('nav.services')}
                                    </Link>
                                    <Link href={route('complaints.create')} className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
                                        {t('nav.complaints')}
                                    </Link>

                                    <LocaleSwitcher variant="compact" />
                                </nav>

                                {/* Login Button */}
                                <Link href={route('login')}>
                                    <Button className="flex items-center space-x-2 bg-primary text-white hover:opacity-90">
                                        {/* <LogIn className="h-4 w-4" /> */}
                                        <span>{t('nav.login')}</span>
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="border-t bg-white/90 backdrop-blur-md md:hidden">
                    <div className="mx-auto flex max-w-md px-4 py-4">
                        <div className="w-full space-y-4 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-lg shadow-black/5">
                            {activeCustomer ? (
                                <>
                                    {/* Welcome Section */}
                                    <div className="border-b border-dashed pb-3">
                                        <p className="text-sm font-medium text-gray-900">
                                            {t('common.welcome')}, {activeCustomer.customer?.first_name} {activeCustomer.customer?.last_name}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {activeCustomer.contacts?.length || 0} contacts • {activeCustomer.subscribers?.length || 0} services
                                        </p>
                                    </div>

                                    {/* Mobile Navigation Links */}
                                    <Link
                                        href="/services"
                                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-primary/5 hover:text-primary"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <span className="flex items-center gap-2">
                                            <LayoutDashboard className="h-4 w-4" />
                                            {t('nav.dashboard')}
                                        </span>
                                        <ArrowRight className="h-4 w-4 text-primary/80" />
                                    </Link>

                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            submitLogout();
                                        }}
                                        className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                                    >
                                        {t('nav.log_out')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Unauthenticated Mobile Links */}
                                    <Link
                                        href="#services"
                                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-primary/5 hover:text-primary"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <span>{t('nav.services')}</span>
                                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                                            <StepServiceIcon className="h-5 w-5" />
                                        </span>
                                    </Link>
                                    <Link
                                        href={route('complaints.create')}
                                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-primary/5 hover:text-primary"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <span>{t('nav.complaints')}</span>
                                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                                            <ComplaintsIcon className="h-5 w-5" />
                                        </span>
                                    </Link>

                                    {/* Mobile Login Button */}
                                    <Link href={route('login')} className="block pt-2" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md shadow-emerald-500/30 hover:opacity-90">
                                            <LogIn className="h-4 w-4" />
                                            <span>{t('nav.login_to_account')}</span>
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
