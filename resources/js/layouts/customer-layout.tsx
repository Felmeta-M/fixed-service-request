import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/sonner';
import { type ReactNode } from 'react';

interface CustomerLayoutProps {
    children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />
            <div className="w-full px-4">{children}</div>
            <Footer />
            <Toaster />
        </div>
    );
}
