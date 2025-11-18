// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { router, usePage } from '@inertiajs/react';
// import { Loader2, Phone } from 'lucide-react';
// import { useEffect, useState } from 'react';

// const prefixes = [
//     { value: '+251', label: '+251' },
//     { value: '0', label: '0' },
// ];

// export function LoginForm() {
//     const { props } = usePage();
//     const initialPhone: string = typeof props.phone === 'string' ? props.phone : '';

//     const [prefix, setPrefix] = useState('+251');
//     const [phoneNumber, setPhoneNumber] = useState(initialPhone.replace('+251', ''));
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         setPhoneNumber(initialPhone.replace('+251', ''));
//     }, [initialPhone]);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         setIsLoading(true);

//         // Validate phone number
//         if (!phoneNumber) {
//             setError('Please enter your mobile number');
//             setIsLoading(false);
//             return;
//         }

//         // Basic validation for  phone numbers
//         // const phoneRegex = /^[79]\d{8}$/;
//         // if (!phoneRegex.test(phoneNumber)) {
//         //     setError('Please enter a valid mobile number');
//         //     setIsLoading(false);
//         //     return;
//         // }

//         try {
//             const cleanPhone = prefix === '+251' ? `251${phoneNumber}` : phoneNumber;

//             await router.post('/otp/send', { phone: cleanPhone });

//             // Redirect to OTP verification
//             router.visit('/otp/verify');
//         } catch (err) {
//             if (err.response?.data?.errors?.phone?.includes('wait')) {
//                 setError('Please wait 1 minute before requesting another OTP');
//             } else {
//                 setError('Failed to send OTP. Please try again.');
//             }
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//                 <Label htmlFor="phone">Mobile Number</Label>
//                 <div className="flex space-x-2">
//                     <Select value={prefix} onValueChange={setPrefix}>
//                         <SelectTrigger className="w-24">
//                             <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                             {prefixes.map((p) => (
//                                 <SelectItem key={p.value} value={p.value}>
//                                     {p.label}
//                                 </SelectItem>
//                             ))}
//                         </SelectContent>
//                     </Select>
//                     <Input
//                         id="phone"
//                         type="tel"
//                         placeholder={prefix === '+251' ? '912345678' : '912345678'}
//                         value={phoneNumber}
//                         onChange={(e) => setPhoneNumber(e.target.value)}
//                         className="flex-1"
//                     />
//                 </div>
//                 <p className="text-xs text-muted-foreground">Enter your registered mobile number to receive an OTP</p>
//             </div>

//             {error && (
//                 <Alert variant="destructive">
//                     <AlertDescription>{error}</AlertDescription>
//                 </Alert>
//             )}

//             <Button type="submit" className="w-full" disabled={isLoading}>
//                 {isLoading ? (
//                     <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         Sending OTP...
//                     </>
//                 ) : (
//                     <>
//                         <Phone className="mr-2 h-4 w-4" />
//                         Send OTP
//                     </>
//                 )}
//             </Button>
//         </form>
//     );
// }

// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
// import { Input } from '@/components/ui/input';
// import { cn } from '@/lib/utils';
// import { router } from '@inertiajs/react';
// import { Loader2, Phone } from 'lucide-react';
// import { useState } from 'react';

// const prefix = '+251';

// export function PhoneLoginForm({ className, ...props }: React.ComponentProps<'div'>) {
//     // const [prefix, setPrefix] = useState('+251');
//     const [phoneNumber, setPhoneNumber] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState('');

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         setIsLoading(true);

//         if (!phoneNumber) {
//             setError('Please enter your mobile number');
//             setIsLoading(false);
//             return;
//         }

//         try {
//             // const cleanPhone = prefix === '+251' ? `251${phoneNumber}` : phoneNumber;
//             const cleanPhone = `251${phoneNumber.replace(/^0/, '')}`; // strip leading 0 if user enters it
//             await router.post('/otp/send', { phone: cleanPhone });
//             router.visit('/otp/verify');
//         } catch (err: any) {
//             if (err.response?.data?.errors?.phone?.includes('wait')) {
//                 setError('Please wait 1 minute before requesting another OTP');
//             } else {
//                 setError('Failed to send OTP. Please try again.');
//             }
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className={cn('flex flex-col gap-6', className)} {...props}>
//             <Card>
//                 <CardHeader className="text-center">
//                     <CardTitle className="text-xl">Continue with Phone</CardTitle>
//                     <CardDescription>Enter your mobile number to receive an OTP</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     <form onSubmit={handleSubmit}>
//                         <FieldGroup>
//                             <Field>
//                                 <FieldLabel htmlFor="phone">Mobile Number</FieldLabel>
//                                 {/* <div className="flex gap-2">
//                                     <Select value={prefix} onValueChange={setPrefix}>
//                                         <SelectTrigger className="w-20">
//                                             <SelectValue />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             {prefixes.map((p) => (
//                                                 <SelectItem key={p.value} value={p.value}>
//                                                     {p.label}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>

//                                     <Input
//                                         id="phone"
//                                         type="tel"
//                                         placeholder={prefix === '+251' ? '912345678' : '0912345678'}
//                                         value={phoneNumber}
//                                         onChange={(e) => setPhoneNumber(e.target.value)}
//                                         className="flex-1"
//                                         required
//                                     />
//                                 </div> */}
//                                 <div className="flex gap-1">
//                                     <div className="flex w-12 items-center justify-center rounded-sm border text-sm font-medium">+251</div>

//                                     <Input
//                                         id="phone"
//                                         type="tel"
//                                         placeholder="912345678"
//                                         value={phoneNumber}
//                                         onChange={(e) => setPhoneNumber(e.target.value)}
//                                         className="flex-1 focus:ring-1"
//                                         required
//                                     />
//                                 </div>
//                                 <FieldDescription>Enter your registered mobile number</FieldDescription>
//                             </Field>

//                             {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

//                             <Field>
//                                 <Button type="submit" disabled={isLoading} className="w-full">
//                                     {isLoading ? (
//                                         <>
//                                             <Loader2 className="mr-2 size-4 animate-spin" />
//                                             Sending OTP...
//                                         </>
//                                     ) : (
//                                         <>
//                                             <Phone className="mr-2 size-4" />
//                                             Send OTP
//                                         </>
//                                     )}
//                                 </Button>
//                                 <FieldDescription className="text-center">
//                                     Don't have an account?{' '}
//                                     <a href="/customer/create" className="underline underline-offset-4">
//                                         Register here
//                                     </a>
//                                 </FieldDescription>
//                             </Field>
//                         </FieldGroup>
//                     </form>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, IdCard, Loader2, Phone } from 'lucide-react';
import { useState } from 'react';

interface VerificationError {
    message: string;
    ret_code?: string;
    isValidationError?: boolean;
    showNationalIdHelp?: boolean;
}

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
    // Phone login states
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoadingPhone, setIsLoadingPhone] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    // National ID states
    const [nationalId, setNationalId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoadingNationalId, setIsLoadingNationalId] = useState(false);
    const [nationalIdError, setNationalIdError] = useState<VerificationError | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [maskedContact, setMaskedContact] = useState('');

    // UI state
    const [activeMethod, setActiveMethod] = useState<'phone' | 'nationalId'>('phone');
    const [nationalIdStep, setNationalIdStep] = useState<'input' | 'verify'>('input');

    const start = async () => {
        const res = await fetch("/login/esignet");
        const data = await res.json();
        console.log("🚀 ~ start ~ data:", data)
        window.location.href = data.authUrl;
    };

    // Phone login handler
    const handlePhoneLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setPhoneError('');
        setIsLoadingPhone(true);

        if (!phoneNumber) {
            setPhoneError('Please enter your mobile number');
            setIsLoadingPhone(false);
            return;
        }

        try {
            const cleanPhone = `251${phoneNumber.replace(/^0/, '')}`;
            await router.post('/otp/send', { phone: cleanPhone });
            router.visit('/otp/verify');
        } catch (err: any) {
            if (err.response?.data?.errors?.phone?.includes('wait')) {
                setPhoneError('Please wait 1 minute before requesting another OTP');
            } else {
                setPhoneError('Failed to send OTP. Please try again.');
            }
        } finally {
            setIsLoadingPhone(false);
        }
    };

    // National ID verification handlers
    const handleVerifyNationalId = async () => {
        setIsLoadingNationalId(true);
        setNationalIdError(null);

        try {
            if (nationalId.length !== 16) {
                throw {
                    message: 'National ID must be exactly 16 digits',
                    isValidationError: true,
                    showNationalIdHelp: true,
                };
            }

            const response = await axios.post('/api/v1/nid/otp', {
                individual_id: nationalId,
            });

            const otpData = response.data?.data?.original?.data;

            if (!otpData || otpData.ret_code !== '0') {
                throw {
                    message: otpData?.ret_msg || 'Failed to send verification code',
                    ret_code: otpData?.ret_code,
                };
            }

            setTransactionId(otpData.transaction_id);

            if (otpData.masked_mobile) {
                setMaskedContact(`sent to ${otpData.masked_mobile}`);
            } else if (otpData.masked_email) {
                setMaskedContact(`sent to ${otpData.masked_email}`);
            } else {
                setMaskedContact('sent to your registered contact');
            }

            setNationalIdStep('verify');
        } catch (err: any) {
            console.error('OTP Error:', err);

            if (err.response?.data?.message) {
                setNationalIdError({
                    message: err.response.data.message,
                    ret_code: err.response.data.ret_code,
                    showNationalIdHelp: err.response.data.ret_code === '9999',
                });
            } else if (err.isValidationError) {
                setNationalIdError(err);
            } else {
                setNationalIdError({
                    message: 'Failed to verify National ID. Please try again.',
                });
            }
        } finally {
            setIsLoadingNationalId(false);
        }
    };

    const handleVerificationCode = async () => {
        setIsLoadingNationalId(true);
        setNationalIdError(null);

        try {
            if (verificationCode.length !== 6) {
                throw {
                    message: 'Verification code must be exactly 6 digits',
                    isValidationError: true,
                };
            }

            const response = await axios.post('/api/v1/nid/kyc', {
                individual_id: nationalId,
                otp_value: verificationCode,
                transaction_id: transactionId,
            });

            const kyc = response.data;

            if (!kyc.success || kyc.ret_code !== '0') {
                throw {
                    message: kyc.message || 'Verification failed',
                    ret_code: kyc.ret_code,
                };
            }

            localStorage.setItem('kycData', JSON.stringify(kyc.data));
            window.location.href = '/profile';
        } catch (err: any) {
            console.error('KYC Error:', err);

            if (err.response?.data?.message) {
                setNationalIdError({
                    message: err.response.data.message,
                    ret_code: err.response.data.ret_code,
                });
            } else if (err.isValidationError) {
                setNationalIdError(err);
            } else {
                setNationalIdError({
                    message: err.message || 'Failed to verify code. Please try again.',
                });
            }
        } finally {
            setIsLoadingNationalId(false);
        }
    };

    const resetNationalIdVerification = () => {
        setNationalId('');
        setVerificationCode('');
        setNationalIdStep('input');
        setNationalIdError(null);
    };

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome</CardTitle>
                    <CardDescription>Sign in with your phone number or National ID</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Method Selection - Only show when not in National ID verification flow */}
                    {activeMethod === 'phone' && nationalIdStep === 'input' && (
                        <FieldGroup>
                            {/* Phone Login Form (Default) */}
                            <Field>
                                <FieldLabel htmlFor="phone">Mobile Number</FieldLabel>
                                <form onSubmit={handlePhoneLogin}>
                                    <div className="mb-3 flex gap-1">
                                        <div className="flex w-12 items-center justify-center rounded-sm border bg-muted text-sm font-medium">
                                            +251
                                        </div>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="912345678"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="flex-1 focus:ring-1"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={isLoadingPhone} className="w-full">
                                        {isLoadingPhone ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Sending OTP...
                                            </>
                                        ) : (
                                            <>
                                                <Phone className="mr-2 size-4" />
                                                Send OTP
                                            </>
                                        )}
                                    </Button>
                                </form>
                                <FieldDescription>Enter your ethio telecom number to receive an OTP</FieldDescription>
                            </Field>

                            {phoneError && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{phoneError}</div>}

                            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or continue with</FieldSeparator>

                            {/* National ID Option */}
                            <Field>
                                {/* <button
                                    onClick={() => setActiveMethod('nationalId')}
                                    className="flex w-full items-center justify-between rounded-lg border-2 border-border p-2 transition-all hover:bg-accent"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-lg sm:size-5">
                                            <IdCard className="size-4 text-muted-foreground" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">National ID</p> */}
                                {/* <p className="text-sm text-muted-foreground">Use your 16-digit National ID</p> */}
                                {/* </div>
                                    </div>
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                </button> */}
                                <Button
                                    // onClick={() => setActiveMethod('nationalId')}
                                    // onClick={() => {
                                    //     window.location.href = '/login/esignet';
                                    // }}
                                    onClick={start}
                                    variant="outline"
                                    type="button"
                                >
                                    <IdCard className="" />
                                    National ID
                                </Button>
                            </Field>
                        </FieldGroup>
                    )}

                    {/* National ID Flow */}
                    {activeMethod === 'nationalId' && (
                        <div>
                            {/* Back Button */}
                            {nationalIdStep === 'input' && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setActiveMethod('phone');
                                        resetNationalIdVerification();
                                    }}
                                    className="mb-4 p-0 text-sm hover:bg-transparent"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </Button>
                            )}

                            {nationalIdStep === 'verify' && (
                                <Button variant="ghost" onClick={() => setNationalIdStep('input')} className="mb-4 p-0 text-sm hover:bg-transparent">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to National ID input
                                </Button>
                            )}

                            {/* National ID Input */}
                            {nationalIdStep === 'input' && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleVerifyNationalId();
                                    }}
                                >
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel htmlFor="nationalId">National ID Number</FieldLabel>
                                            <Input
                                                id="nationalId"
                                                type="text"
                                                placeholder="Enter 16-digit National ID"
                                                value={nationalId}
                                                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                                                maxLength={16}
                                                required
                                            />
                                            {/* <FieldDescription>Enter your 16-digit Ethiopian National ID number</FieldDescription> */}
                                        </Field>
                                        <Field>
                                            <Button type="submit" disabled={isLoadingNationalId || nationalId.length !== 16} className="w-full">
                                                {isLoadingNationalId ? (
                                                    <>
                                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                                        Verifying ID...
                                                    </>
                                                ) : (
                                                    'Verify National ID'
                                                )}
                                            </Button>
                                        </Field>
                                    </FieldGroup>
                                </form>
                            )}

                            {/* OTP Verification */}
                            {nationalIdStep === 'verify' && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleVerificationCode();
                                    }}
                                >
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel>Verification Code</FieldLabel>
                                            <div className="flex justify-center gap-2">
                                                {Array.from({ length: 6 }).map((_, index) => (
                                                    <Input
                                                        key={index}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={verificationCode[index] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            if (!val) return;
                                                            const newCode = verificationCode.split('');
                                                            newCode[index] = val;
                                                            setVerificationCode(newCode.join(''));

                                                            if (val && index < 5) {
                                                                const nextInput = document.getElementById(`otp-${index + 1}`);
                                                                nextInput?.focus();
                                                            }
                                                        }}
                                                        className="h-12 w-12 text-center text-lg font-semibold"
                                                    />
                                                ))}
                                            </div>
                                            <FieldDescription>Code {maskedContact}</FieldDescription>
                                        </Field>
                                        <Field>
                                            <Button type="submit" disabled={isLoadingNationalId || verificationCode.length !== 6} className="w-full">
                                                {isLoadingNationalId ? (
                                                    <>
                                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                                        Verifying Code...
                                                    </>
                                                ) : (
                                                    'Verify Code'
                                                )}
                                            </Button>
                                        </Field>
                                    </FieldGroup>
                                </form>
                            )}

                            {nationalIdError && (
                                <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{nationalIdError.message}</div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* <FieldDescription className="px-6 text-center">
                By continuing, you agree to our{' '}
                <a href="#" className="underline underline-offset-4">
                    Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="underline underline-offset-4">
                    Privacy Policy
                </a>
                .
            </FieldDescription> */}
        </div>
    );
}
