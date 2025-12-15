import { cn } from '@/lib/utils';
import { Field } from '@headlessui/react';
import { router } from '@inertiajs/react';
import { Loader2, Phone } from 'lucide-react';
import { useState } from 'react';
import logo from '../../images/national_id_logo.png';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '../ui/field';
import { Input } from '../ui/input';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoadingPhone, setIsLoadingPhone] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const handlePhoneLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        setIsLoadingPhone(true);

        const validationErrors: string[] = [];

        if (!phoneNumber.trim()) {
            validationErrors.push('Please enter your mobile number');
        }

        // Accepts: +2519XXXXXXXX, 2519XXXXXXXX, 09XXXXXXXX, 9XXXXXXXX
        const ethioRegex = /^(?:\+251|251|0)?9\d{8}$/;

        if (!ethioRegex.test(phoneNumber.trim())) {
            validationErrors.push('Please enter a valid Ethiopian mobile number');
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            setIsLoadingPhone(false);
            return;
        }

        // ---- Normalize to 2519XXXXXXXX ----
        let normalized = phoneNumber.trim().replace(/^\+/, '');

        if (normalized.startsWith('0')) {
            normalized = '251' + normalized.slice(1); // 09... → 2519...
        } else if (/^9/.test(normalized)) {
            normalized = '251' + normalized; // 9... → 2519...
        }

        router.post(
            '/otp/send',
            { phone: normalized },
            {
                onError: (backendErrors: any) => {
                    const backendErrorMessages: string[] = [];
                    if (backendErrors) {
                        Object.values(backendErrors).forEach((err) => {
                            if (Array.isArray(err)) backendErrorMessages.push(...err);
                            else backendErrorMessages.push(err as string);
                        });
                    }
                    if (backendErrorMessages.length === 0) backendErrorMessages.push('Failed to send OTP. Please try again.');
                    setErrors(backendErrorMessages);
                },
                onSuccess: () => router.visit('/otp/verify'),
                onFinish: () => setIsLoadingPhone(false),
            },
        );
    };

    // return (
    //     <div className={cn('mx-auto flex w-full max-w-sm flex-col gap-6 sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl', className)} {...props}>
    //         <Card className="my-auto flex min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
    //             <CardHeader className="text-center">
    //                 <CardTitle className="text-xl">Welcome</CardTitle>

    //                 <CardDescription>Sign in with your phone number </CardDescription>

    //                 {/* <CardDescription>Sign in with your National ID</CardDescription> */}
    //             </CardHeader>
    //             <CardContent className="my-auto flex flex-col items-center justify-center text-center">
    //                 <FieldGroup>
    //                     <Field>
    //                         <form onSubmit={handlePhoneLogin}>
    //                             <FieldLabel htmlFor="phone">Mobile Number</FieldLabel>
    //                             <div className="mb-3 flex gap-1">
    //                                 <div className="flex w-12 items-center justify-center rounded-sm border bg-muted text-sm font-medium">+251</div>
    //                                 <Input
    //                                     id="phone"
    //                                     type="tel"
    //                                     placeholder="912345678"
    //                                     value={phoneNumber}
    //                                     onChange={(e) => setPhoneNumber(e.target.value)}
    //                                     className="flex-1 focus:ring-1"
    //                                     required
    //                                 />
    //                             </div>

    //                             {errors.length > 0 && (
    //                                 <div className="mb-2 space-y-1 rounded-md border p-2 text-sm text-destructive">
    //                                     {errors.map((err, i) => (
    //                                         <div key={i}>{err}</div>
    //                                     ))}
    //                                 </div>
    //                             )}

    //                             <Button type="submit" disabled={isLoadingPhone} className="mt-2 mb-2 w-full">
    //                                 {isLoadingPhone ? (
    //                                     <>
    //                                         <Loader2 className="mr-2 size-4 animate-spin" />
    //                                         Sending OTP...
    //                                     </>
    //                                 ) : (
    //                                     <>
    //                                         <Phone className="mr-2 size-4" />
    //                                         Login
    //                                     </>
    //                                 )}
    //                             </Button>
    //                         </form>
    //                         <FieldDescription className="mt-2 text-center text-sm/6 text-muted-foreground">
    //                             Enter your Ethio telecom number to receive an OTP
    //                         </FieldDescription>
    //                     </Field>

    //                     <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or continue with</FieldSeparator>

    //                     <Field>
    //                         <Button
    //                             onClick={() => (window.location.href = '/login/esignet')}
    //                             variant="outline"
    //                             type="button"
    //                             className="mb-2 flex w-full items-center justify-center gap-2"
    //                         >
    //                             <img src={logo} alt="National ID Logo" className="h-5 w-5" />
    //                             Login with National ID
    //                         </Button>
    //                     </Field>
    //                 </FieldGroup>
    //             </CardContent>
    //         </Card>
    //     </div>
    // );


    return (
        <Card>
            <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
                {/* Logo + Title */}
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img alt="National ID Logo" src={logo} className="mx-auto h-12 w-auto" />

                    <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">Sign in to your account</h2>

                    <p className="mt-2 text-center text-sm text-gray-600">Use your National ID to continue</p>
                </div>

                {/* Content */}
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <div className="space-y-6">
                        <button
                            onClick={() => (window.location.href = '/login/esignet')}
                            type="button"
                            className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            <img src={logo} alt="ID" className="mr-2 h-5 w-5" />
                            Login with National ID
                        </button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
