import React, { useState } from 'react';
// import GuestLayout from '@/Layouts/GuestLayout';
import GuestLayout from '@/layouts/GuestLayout';
import { router } from '@inertiajs/react';

export default function EnterPhone() {
    const [phone, setPhone] = useState('');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        router.post('/otp/send', { phone });
    }

    return (
        <GuestLayout>
            <h1 className="mb-4 text-xl font-bold">Enter your phone number</h1>
            <form onSubmit={submit}>
                <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="mb-4 w-full border p-2"
                />
                <button type="submit" className="rounded bg-blue-500 px-4 py-2 text-white">
                    Send OTP
                </button>
            </form>
        </GuestLayout>
    );
}
