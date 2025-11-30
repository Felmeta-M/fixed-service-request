import { Footer } from '@/components/layout/footer';
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
    const { auth } = usePage().props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    return (
        <div className="mx-auto bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="sticky top-0 z-50 mx-auto w-full border-b bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
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
                                    <Link href="#services" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
                                        Services
                                    </Link>

                                    {/* <select className="rounded-md border px-2 py-1 text-sm">
                                        <option value="en">English</option>
                                        <option value="am">አማርኛ</option>
                                        <option value="or">Afaan Oromoo</option>
                                        <option value="ti">ትግርኛ</option>
                                        <option value="so">Af Somali</option>
                                    </select> */}
                                </nav>
                                {auth?.user ? (
                                    <div className="flex items-center space-x-4">
                                        <Link
                                            href={route('services')}
                                            className="flex items-center gap-2 font-medium text-muted-foreground transition-colors duration-200 hover:text-accent-foreground"
                                        >
                                            <LayoutDashboard className="h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                        <Link href={route('logout')} method="post" as="button">
                                            <Button variant="outline" type="submit">
                                                <LogOut className="h-4 w-4" />
                                                <span>Log out </span>
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    // If NOT logged in
                                    <Link href={route('otp.phone')} className="cursor-pointer">
                                        <Button className="flex cursor-pointer items-center space-x-2 bg-primary text-white hover:opacity-90">
                                            <LogIn className="h-4 w-4" />
                                            <span>Login</span>
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
                    <div className="border-t bg-white/95 backdrop-blur md:hidden">
                        <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
                            <Link
                                href="#services"
                                className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Services
                            </Link>

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
                                            <span>Dashboard</span>
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
                                            <span>Logout</span>
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {/* Login */}
                                    <Link href={route('otp.phone')} className="block cursor-pointer pt-3" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="br-primary flex w-full items-center justify-center space-x-2 text-white hover:opacity-90">
                                            <LogIn className="h-4 w-4" />
                                            <span>Login</span>
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
