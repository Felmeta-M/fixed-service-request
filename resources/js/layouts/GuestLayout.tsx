import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import React from 'react';

type Props = {
    children: React.ReactNode;
};

export default function GuestLayout({ children }: Props) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-between">
            <Header />
            <div className="w-full rounded bg-white">{children}</div>
            <Footer />
        </div>
    );
}
