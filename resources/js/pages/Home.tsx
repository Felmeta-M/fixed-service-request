import React from 'react';
// import GuestLayout from '@/Layouts/GuestLayout';
import { router } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';

export default function Home() {
    function goToLogin() {
        router.get('/otp/phone');
    }

    return (
        <GuestLayout>
            <h1 className="text-2xl font-bold mb-4">Welcome to Our Service</h1>
            <button onClick={goToLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
                Client Login
            </button>
        </GuestLayout>
    );
}