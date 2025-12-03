import { Link, usePage } from '@inertiajs/react';

export default function ErrorPage({}) {
    const { props }: any = usePage();
    const message = props?.message || props?.flash?.message || props?.error || 'An unexpected error occurred.';

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h1>

                <p className="mb-6 text-gray-700">{message}</p>

                <Link href={route('login')} className="inline-block rounded-md bg-primary px-6 py-3 text-white hover:bg-primary/70">
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
