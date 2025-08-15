import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CustomerLayout from '@/layouts/customer-layout';
import { Link, router } from '@inertiajs/react';
import { ArrowRight, Phone, UserPlus } from 'lucide-react';
import { useState } from 'react';

function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
}

export default function SendOtp() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await fetch('http://localhost:8000/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'include',
            });

            const csrfToken = getCookie('XSRF-TOKEN');
            console.log('🚀 ~ handleSendOtp ~ csrfToken:', csrfToken);

            const response = await fetch('http://localhost:8000/client/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ phone }),
                credentials: 'include',
            });

            if (response.ok) {
                router.visit('verifyotp');
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <CustomerLayout>
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
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+251911234567 or 0911234567"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <div className="mt-4 text-center">
                                <Link href={route('customers.create')} className="inline-flex items-center font-medium text-primary hover:underline">
                                    <UserPlus className="mr-1 h-4 w-4" />
                                    Create new account
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
}
