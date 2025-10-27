import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Link } from '@inertiajs/react';
import { LogIn, Network } from 'lucide-react';
import React from 'react';

type Props = {
    children: React.ReactNode;
};

export default function GuestLayout({ children }: Props) {
    return (
        <div className="container mx-auto min-h-screen max-w-screen-2xl bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* <Header /> */}
            <header className="border-b bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                    <Network className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">EthioTelecom</h1>
                                    <p className="text-xs text-gray-500">Fixed Line Services</p>
                                </div>
                            </div>
                        </Link>
                        <div className="flex items-center space-x-3">
                            {/* <select className="rounded-md border px-2 py-1 text-sm">
                                <option value="en">English</option>
                                <option value="am">አማርኛ</option>
                                <option value="or">Afaan Oromoo</option>
                                <option value="ti">ትግርኛ</option>
                                <option value="so">Af Somali</option>
                            </select> */}
                            <Link href={route('verification')}>
                                <Button size="sm">
                                    Sign In
                                    <LogIn className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
            <div>{children}</div>
            {/* <Footer /> */}
            <footer className="bg-gray-900 py-12 text-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-4">
                        <div>
                            <div className="mb-4 flex items-center space-x-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                                    <Network className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-bold">EthioTelecom</span>
                            </div>
                            <p className="text-sm text-gray-400">Ethiopia's leading telecommunications service provider</p>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold">Services</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Fixed Voice
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Fixed Broadband
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Combo Packages
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold">Support</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Help Center
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Contact Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Service Centers
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Terms of Service
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                        <p>&copy; 2025 EthioTelecom. All rights reserved.</p>
                    </div>
                </div>
            </footer>
            <Toaster />
        </div>
    );
}
