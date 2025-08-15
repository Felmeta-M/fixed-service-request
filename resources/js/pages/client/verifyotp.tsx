import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CustomerLayout from '@/layouts/customer-layout';
import { router } from '@inertiajs/react';
import { ArrowLeft, Phone } from 'lucide-react';
import { useState } from 'react';

function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
}

export default function VerifyOtp() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await fetch('http://localhost:8000/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'include',
            });

            const csrfToken = getCookie('XSRF-TOKEN');

            const response = await fetch('http://localhost:8000/client/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ phone, otp }),
                credentials: 'include',
            });

            if (response.ok) {
                router.visit('dashboard');
            } else {
                const data = await response.json();
                setError(data.message || 'OTP verification failed');
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
                            <div className="text-muted-foreground">Enter the OTP sent to your phone</div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert className="mb-4" variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">Enter OTP</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                    required
                                />
                                <p className="text-sm text-muted-foreground">OTP sent to {phone}</p>
                            </div>
                            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </Button>
                            <Button type="button" variant="outline" className="w-full cursor-pointer" onClick={() => router.visit('sendotp')}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Change Phone Number
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
}
