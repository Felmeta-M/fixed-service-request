import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

type Props = {
    children: React.ReactNode;
};

export default function GuestLayout({ children }: Props) {
    return (
        <div className="container mx-auto min-h-screen max-w-screen-2xl bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />
            <div className="w-full rounded bg-white">{children}</div>
            <Footer />
            <Toaster />
        </div>
    );
}
