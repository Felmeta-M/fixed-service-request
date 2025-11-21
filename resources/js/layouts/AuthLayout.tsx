import { Header } from '@/components/layout/header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Header />
            <main>{children}</main>
        </div>
    );
}
