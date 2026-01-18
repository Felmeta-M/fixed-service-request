import { LocaleSwitcher } from '@/components/common/locale-switcher';
import { useTranslation } from '@/hooks/use-translation';
import { useActiveCustomer } from '@/store/customer-store';
import { Link } from '@inertiajs/react';
import { LayoutDashboard, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '../../images/ethio_logo_full.png';
import { Button } from '../ui/button';

export const Header = () => {
    const { activeCustomer, clearActiveCustomer } = useActiveCustomer();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, locale } = useTranslation();

    const handleLogout = () => {
        clearActiveCustomer();
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
                                        <Link href={route('logout')} method="post" className="flex items-center">
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

                                    <LocaleSwitcher variant="compact" />
                                </nav>

                                {/* Login Button */}
                                <Link href="/otp/phone">
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
                <div className="border-t bg-white/95 backdrop-blur md:hidden">
                    <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
                        {activeCustomer ? (
                            <>
                                {/* Welcome Section */}
                                <div className="border-b pb-3">
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
                                    className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('nav.dashboard')}
                                </Link>

                                {/* Language Switcher */}
                                <div className="py-2">
                                    <LocaleSwitcher />
                                </div>

                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="block w-full py-2 text-left text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                    {t('nav.log_out')}
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Unauthenticated Mobile Links */}
                                <Link
                                    href="#services"
                                    className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('nav.services')}
                                </Link>

                                {/* Language Switcher */}
                                <div className="py-2">
                                    <LocaleSwitcher />
                                </div>

                                {/* Mobile Login Button */}
                                <Link href="/otp/phone" className="block pt-3" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="flex w-full items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:opacity-90">
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
    );
};
