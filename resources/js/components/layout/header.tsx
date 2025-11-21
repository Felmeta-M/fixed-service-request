import { useActiveCustomer } from '@/store/customer-store';
import { Link } from '@inertiajs/react';
import { LayoutDashboard, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '../../images/ethio_logo_full.png';
import { Button } from '../ui/button';

export const Header = () => {
    const { activeCustomer, clearActiveCustomer } = useActiveCustomer();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        clearActiveCustomer();
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-2">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-3">
                            {/* <Link href="/"> */}
                            <img src={logo} alt="EthioTelecom Logo" className="h-12 w-full transition-all duration-200 hover:scale-105" />
                            {/* </Link> */}
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    {/* {localStorage.getItem('auth') ? (
                        <Button
                            variant="outline"
                            onClick={() => {
                                localStorage.removeItem('auth');
                                router.visit('/');
                            }}
                        >
                            Logout
                        </Button>
                    ) : (
                        <Link href="/verification" className="text-gray-600 transition-colors hover:text-primary">
                            Login
                        </Link>
                    )} */}
                    <div className="hidden items-center space-x-6 md:flex">
                        {activeCustomer ? (
                            <div className="flex items-center space-x-4">
                                {/* Welcome Message */}
                                {/* <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        Welcome back, {activeCustomer.customer?.first_name} {activeCustomer.customer?.last_name}
                                    </p> */}
                                {/* <p className="text-xs text-gray-500">{activeCustomer.subscribers?.length || 0} active services</p> */}
                                {/* </div> */}

                                {/* User Menu */}
                                <div className="flex items-center space-x-2">
                                    <Link href="/dashboard">
                                        <Button variant="ghost" size="sm" className="flex items-center hover:bg-gray-100">
                                            <LayoutDashboard className="h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Button>
                                    </Link>

                                    {/* <Link href="/profile">
                                        <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-gray-100">
                                            <Settings className="h-4 w-4" />
                                            <span>Profile</span>
                                        </Button>
                                    </Link> */}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        // onClick={handleLogout}
                                        className="flex items-center space-x-2"
                                    >
                                        <Link href={route('logout')} method="post" className="flex items-center">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sign Out
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                {/* Navigation Links for Unauthenticated Users */}
                                <nav className="flex items-center space-x-6">
                                    <Link href="#services" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
                                        Services
                                    </Link>
                                    {/* <Link href="/pricing" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
                                        Pricing
                                    </Link>
                                    <Link href="/support" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
                                        Support
                                    </Link> */}

                                    {/* <select className="rounded-md border px-2 py-1 text-sm">
                                        <option value="en">English</option>
                                        <option value="am">አማርኛ</option>
                                        <option value="or">Afaan Oromoo</option>
                                        <option value="ti">ትግርኛ</option>
                                        <option value="so">Af Somali</option>
                                    </select> */}
                                </nav>

                                {/* Login Button */}
                                <Link href="/otp/phone">
                                    <Button className="flex items-center space-x-2 bg-primary text-white hover:opacity-90">
                                        <LogIn className="h-4 w-4" />
                                        <span>Login</span>
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
                                        Welcome, {activeCustomer.customer?.first_name} {activeCustomer.customer?.last_name}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {activeCustomer.contacts?.length || 0} contacts • {activeCustomer.subscribers?.length || 0} services
                                    </p>
                                </div>

                                {/* Mobile Navigation Links */}
                                <Link
                                    href="/dashboard"
                                    className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                {/* <Link
                                    href="/profile"
                                    className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Profile & Settings
                                </Link> */}
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="block w-full py-2 text-left text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                    Logout
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
                                    Services
                                </Link>
                                {/* <Link
                                    href="/pricing"
                                    className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Pricing
                                </Link>
                                <Link
                                    href="/support"
                                    className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Support
                                </Link> */}

                                {/* Mobile Login Button */}
                                <Link href="/otp/phone" className="block pt-3" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="flex w-full items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:opacity-90">
                                        <LogIn className="h-4 w-4" />
                                        <span>Login to Account</span>
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
