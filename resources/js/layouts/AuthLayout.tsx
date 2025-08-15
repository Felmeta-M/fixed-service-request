import { Link, usePage } from '@inertiajs/react';
import React from 'react';

type Props = {
    children: React.ReactNode;
};

export default function AuthLayout({ children }: Props) {
    const { auth } = usePage().props as any;

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="flex justify-between bg-white p-4 shadow">
                <Link href="/dashboard">Dashboard</Link>
                <div>
                    {auth?.user?.name}
                    <Link href="/logout" method="post" as="button" className="ml-4 text-red-500">
                        Logout
                    </Link>
                </div>
            </nav>
            <main className="p-6">{children}</main>
        </div>
    );
}
