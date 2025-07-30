'use client';

import { Link, router } from '@inertiajs/react';
import { Menu, Network, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm sm:px-8">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo and Brand */}
                    <Link href="/" className="flex items-center space-x-3">
                        <div className="flex items-center">
                            <Network className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-md font-bold text-gray-900 lg:text-xl">Ethio Telecom Fixed Services</h1>
                            <p className="text-xs text-gray-500">The Right to Connect</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center space-x-8 md:flex">
                        <Link href="/" className="text-gray-600 transition-colors hover:text-primary">
                            Home
                        </Link>
                        {localStorage.getItem('auth') && (
                            <Link href="/portal" className="text-gray-600 transition-colors hover:text-primary">
                                Customer Portal
                            </Link>
                        )}
                        {localStorage.getItem('auth') ? (
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
                            <Link href="/login" className="text-gray-600 transition-colors hover:text-primary">
                                Login
                            </Link>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button className="p-2 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="border-t py-4 md:hidden">
                        <nav className="flex flex-col space-y-4">
                            <Link href="/" className="text-gray-600 transition-colors hover:text-green-600" onClick={() => setIsMenuOpen(false)}>
                                Home
                            </Link>
                            <Link
                                href="/portal"
                                className="text-gray-600 transition-colors hover:text-green-600"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Customer Portal
                            </Link>
                            <Link href="/admin" className="text-gray-600 transition-colors hover:text-green-600" onClick={() => setIsMenuOpen(false)}>
                                Admin
                            </Link>
                            {/* <div className="flex items-center space-x-2 border-t pt-2 text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span className="text-sm">+251-11-123-4567</span>
                            </div> */}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
