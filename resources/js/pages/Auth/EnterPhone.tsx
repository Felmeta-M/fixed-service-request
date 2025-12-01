import { LoginForm } from '@/components/auth/login-form';
import { Link } from '@inertiajs/react';
import logo from '../../images/ethio_logo_full.png';

export default function LoginPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-2">
                <Link href={route('home')} className="cursor-pointer">
                    <img src={logo} alt="Ethio Telecom Logo" className="mx-auto mb-4 h-12 w-auto" />
                </Link>
                <LoginForm />
            </div>
        </div>
    );
}
