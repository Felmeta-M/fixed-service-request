import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { useActiveCustomer } from '@/store/customer-store';
import { Link, usePage } from '@inertiajs/react';
import { LogOut, Network } from 'lucide-react';
import React from 'react';

type Props = {
    children: React.ReactNode;
};

export default function AuthLayout({ children }: Props) {
    const { auth } = usePage().props as any;
    console.log('auth', auth);
    const { activeCustomer } = useActiveCustomer();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="border-b bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <Network className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">EthioTelecom</h1>
                                <p className="text-xs text-gray-500">Fixed Services Requests Portal</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* <Button variant="ghost" size="sm">
                                <Bell className="h-4 w-4" />
                            </Button> */}
                            {/* <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium">
                                    {auth?.user?.first_name} {auth?.user?.last_name}
                                </span>
                            </div> */}
                            {activeCustomer && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                                    <span>Welcome:</span>
                                    <span className="font-medium text-primary">
                                        {activeCustomer?.contacts[0].name1} {activeCustomer?.contacts[0].name2}
                                    </span>
                                </div>
                            )}
                            <Button variant="outline" size="sm">
                                <Link href={route('logout')} method="post" className="flex items-center">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>
            <main>{children}</main>
            <Toaster />
        </div>
    );
}
