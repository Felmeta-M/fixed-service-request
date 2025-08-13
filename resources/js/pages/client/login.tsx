import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Phone, UserPlus } from 'lucide-react';
import { useState } from 'react';

function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
}

export default function ClientLoginPage() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // const handleSendOtp = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     setLoading(true);
    //     setError('');

    //     try {
    //         // await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sanctum/csrf-cookie`);
    //         const response = await fetch(`http://localhost:8000/client/send-otp`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    //             body: JSON.stringify({ phone }),
    //         });

    //         if (response.ok) {
    //             setStep('otp');
    //         } else {
    //             const data = await response.json();
    //             setError(data.message || 'Failed to send OTP');
    //         }
    //     } catch (err) {
    //         setError('Network error. Please try again.');
    //         console.log(err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const handleVerifyOtp = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     setLoading(true);
    //     setError('');

    //     const result = await signIn('credentials', {
    //         phone,
    //         otp,
    //         redirect: false,
    //     });

    //     if (result?.error) {
    //         console.log('Login failed:', result.error);
    //         setError(result.error);
    //         setLoading(false);
    //     } else {
    //         router.visit('dashboard');
    //     }
    // };
    // Helper to get cookie value from document.cookie
    function getCookie(name: string) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
    }

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1️⃣ First, get CSRF cookie from Laravel
            await fetch('http://localhost:8000/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'include', // important for session cookies
            });

            // 2️⃣ Now send OTP request with CSRF token
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
                credentials: 'include', // include session
            });

            if (response.ok) {
                setStep('otp');
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

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1️⃣ Get CSRF cookie
            await fetch('http://localhost:8000/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'include',
            });

            // 2️⃣ Send OTP verification request
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
                // You can redirect or store session here
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
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                        <Phone className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle>Client Login</CardTitle>
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
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <div className="mt-4 text-center">
                                <Link href={route('customers.create')} className="inline-flex items-center font-medium text-primary hover:underline">
                                    <UserPlus className="mr-1 h-4 w-4" />
                                    Create new account
                                </Link>
                            </div>
                        </form>
                    ) : (
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
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </Button>
                            <Button type="button" variant="outline" className="w-full" onClick={() => setStep('phone')}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Change Phone Number
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// resources/js/components/auth/ClientLogin.tsx

// import { router } from '@inertiajs/react';
// import axios from 'axios';
// import { useState } from 'react';

// export default function ClientLogin() {
//     const [phone, setPhone] = useState('');
//     const [otp, setOtp] = useState('');
//     const [step, setStep] = useState<'phone' | 'otp'>('phone');
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');

//     const requestOtp = async () => {
//         setLoading(true);
//         setError('');

//         try {
//             // First get CSRF cookie if using session-based auth
//             await axios.get(`http://localhost:8000/sanctum/csrf-cookie`);

//             console.log('CSRF cookie set', document.cookie);

//             await axios.post(`http://localhost:8000/client/send-otp`, {
//                 phone,
//             });

//             setStep('otp');
//         } catch (err) {
//             setError('Failed to send OTP. Please try again.');
//             console.error('OTP request error:', err);
//             console.log('Error details:', err.response?.data || err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const verifyOtp = async () => {
//         setLoading(true);
//         setError('');

//         try {
//             const response = await axios.post(`http://localhost:8000/client/verify-otp`, {
//                 phone,
//                 otp,
//             });

//             // Store the token
//             localStorage.setItem('client_token', response.data.access_token);

//             // Redirect to dashboard
//             router.visit('/client/dashboard');
//         } catch (err) {
//             setError('Invalid OTP. Please try again.');
//             console.error('OTP verification error:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="mx-auto max-w-md p-4">
//             {error && <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

//             {step === 'phone' ? (
//                 <div className="space-y-4">
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">Phone Number</label>
//                         <input
//                             type="tel"
//                             value={phone}
//                             onChange={(e) => setPhone(e.target.value)}
//                             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                             placeholder="+251911223344"
//                         />
//                     </div>
//                     <button
//                         onClick={requestOtp}
//                         disabled={loading}
//                         className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
//                     >
//                         {loading ? 'Sending OTP...' : 'Send OTP'}
//                     </button>
//                 </div>
//             ) : (
//                 <div className="space-y-4">
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">OTP Code</label>
//                         <input
//                             type="text"
//                             value={otp}
//                             onChange={(e) => setOtp(e.target.value)}
//                             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                             placeholder="123456"
//                             maxLength={6}
//                         />
//                         <p className="mt-2 text-sm text-gray-500">OTP sent to {phone}</p>
//                     </div>
//                     <button
//                         onClick={verifyOtp}
//                         disabled={loading}
//                         className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
//                     >
//                         {loading ? 'Verifying...' : 'Verify OTP'}
//                     </button>
//                     <button
//                         onClick={() => setStep('phone')}
//                         className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
//                     >
//                         Change Phone Number
//                     </button>
//                 </div>
//             )}
//         </div>
//     );
// }
