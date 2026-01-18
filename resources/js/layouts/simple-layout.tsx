import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/sonner';

export default function SimpleLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Header />
            <main>{children}</main>
            <Toaster position="top-center" />
        </div>
    );
}
