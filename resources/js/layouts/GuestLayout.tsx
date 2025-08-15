import { Link } from '@inertiajs/react';
import React from 'react';

type Props = {
    children: React.ReactNode;
};

export default function GuestLayout({ children }: Props) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded bg-white p-6 shadow">{children}</div>
            <footer className="mt-4">
                <Link href="/">Home</Link>
            </footer>
        </div>
    );
}
