import FormInput from '@/components/form-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GuestLayout from '@/layouts/GuestLayout';
import { Link, router } from '@inertiajs/react';
import { ArrowRight, Phone, UserPlus } from 'lucide-react';
import React, { useState } from 'react';

export default function EnterPhone() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSendOtp(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await router.post('/otp/send', { phone });
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <GuestLayout>
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                            <Phone className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle>Welcome</CardTitle>
                        <CardDescription>
                            <div className="text-muted-foreground">Enter your phone number to receive an OTP</div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert className="mb-4" variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <FormInput
                                label="Phone number"
                                id="phone"
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Phone number"
                                required
                                autoFocus
                            />
                            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <div className="mt-4 text-center">
                                <Link href={route('landing')} className="inline-flex items-center font-medium text-primary hover:underline">
                                    <UserPlus className="mr-1 h-4 w-4" />
                                    Create new account
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </GuestLayout>
    );
}
