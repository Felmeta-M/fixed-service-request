import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import CustomerLayout from '@/layouts/customer-layout';
import { Link, router, usePage } from '@inertiajs/react';
import { Loader2, Phone, Shield, UserPlus } from 'lucide-react';
import React, { useState } from 'react';

const OTPLogin: React.FC = () => {
    const { flash, errors } = usePage().props;
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const { login, sendOTP, isLoading } = useAuth();

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!phone.trim()) {
            setError('Please enter your phone number');
            return;
        }

        // Prepend +251 if not already included
        const fullPhoneNumber = phone.startsWith('+251') ? phone : `+251${phone}`;

        const success = await sendOTP(fullPhoneNumber);
        if (success) {
            setStep('otp');
        } else {
            setError('Failed to send OTP. Please try again.');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!otp.trim()) {
            setError('Please enter the OTP');
            return;
        }

        const fullPhoneNumber = phone.startsWith('+251') ? phone : `+251${phone}`;
        const success = await login(fullPhoneNumber, otp);
        if (success) {
            // redirect to dashboard
            router.visit(route('survey-requests.create'));
            return;
        } else {
            setError('Invalid OTP. Please try again.');
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Remove any non-digit characters
        value = value.replace(/\D/g, '');
        // Remove +251 if user tries to type it
        if (value.startsWith('251')) {
            value = value.substring(3);
        }
        setPhone(value);
    };

    return (
        <CustomerLayout>
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
                <Card className="w-full max-w-md border-none shadow-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                            <Phone className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
                        <CardDescription>
                            {step === 'phone' ? 'Enter your phone number to receive an OTP' : 'Enter the OTP sent to your phone'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert className="mb-4" variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {step === 'phone' ? (
                            <form onSubmit={handleSendOTP} className="space-y-4">
                                <div>
                                    <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                                        Phone Number
                                    </label>
                                    <div className="flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                                            +251
                                        </span>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="911123456"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            className="w-full rounded-l-none"
                                            maxLength={9}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Enter your phone number</p>
                                </div>

                                <Button type="submit" className="w-full cursor-pointer bg-primary hover:opacity-90" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        'Send OTP'
                                    )}
                                </Button>

                                <div className="mt-4 text-center">
                                    <Link
                                        href={route('customers.create')}
                                        className="inline-flex items-center font-medium text-primary hover:underline"
                                    >
                                        <UserPlus className="mr-1 h-4 w-4" />
                                        Create new account
                                    </Link>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label htmlFor="otp" className="mb-1 block text-sm font-medium text-gray-700">
                                        Enter OTP
                                    </label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full text-center text-lg tracking-widest"
                                        maxLength={6}
                                    />
                                </div>
                                <div className="flex space-x-2">
                                    <Button type="button" variant="outline" onClick={() => setStep('phone')} className="flex-1 cursor-pointer">
                                        Back
                                    </Button>
                                    <Button type="submit" className="flex-1 cursor-pointer bg-primary hover:opacity-90" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="mr-2 h-4 w-4" />
                                                Verify
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="mt-6 text-center text-sm text-gray-500">
                            By continuing, you agree to Ethio Telecom's Terms of Service and Privacy Policy
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
};

export default OTPLogin;
