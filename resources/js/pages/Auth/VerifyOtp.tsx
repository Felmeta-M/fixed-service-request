import React, { useState } from 'react';
// import GuestLayout from '@/Layouts/GuestLayout';
import GuestLayout from '@/layouts/GuestLayout';
import { router } from '@inertiajs/react';

type Props = {
    phone: string;
};

export default function VerifyOtp() {
    const [code, setCode] = useState('');

    // console.log('phone', phone, 'code', code);
    function submit(e: React.FormEvent) {
        e.preventDefault();
        router.post('/otp/verify', { code });
    }

    return (
        <GuestLayout>
            <h1 className="mb-4 text-xl font-bold">Verify OTP</h1>
            <form onSubmit={submit}>
                {/* <input type="hidden" value={phone} /> */}
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter OTP"
                    className="mb-4 w-full border p-2"
                />
                <button type="submit" className="rounded bg-green-500 px-4 py-2 text-white">
                    Verify
                </button>
            </form>
        </GuestLayout>
    );
}
