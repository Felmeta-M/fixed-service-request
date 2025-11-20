// 'use client';

// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
// import { Input } from '@/components/ui/input';
// import logo from '@/images/national_id_logo.png';
// import { cn } from '@/lib/utils';
// import axios from 'axios';
// import { ArrowLeft, Loader2, Phone } from 'lucide-react';
// import { useState } from 'react';
// import { router } from '@inertiajs/react';

// interface VerificationError {
//     message: string;
//     ret_code?: string;
//     isValidationError?: boolean;
//     showNationalIdHelp?: boolean;
// }

// export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
//     // Phone login states
//     const [phoneNumber, setPhoneNumber] = useState('');
//     const [isLoadingPhone, setIsLoadingPhone] = useState(false);
//     const [phoneError, setPhoneError] = useState('');

//     // National ID states
//     const [nationalId, setNationalId] = useState('');
//     const [verificationCode, setVerificationCode] = useState('');
//     const [isLoadingNationalId, setIsLoadingNationalId] = useState(false);
//     const [nationalIdError, setNationalIdError] = useState<VerificationError | null>(null);
//     const [transactionId, setTransactionId] = useState('');
//     const [maskedContact, setMaskedContact] = useState('');

//     // UI state
//     const [activeMethod, setActiveMethod] = useState<'phone' | 'nationalId'>('phone');
//     const [nationalIdStep, setNationalIdStep] = useState<'input' | 'verify'>('input');

//     // ESIGNET login start
//     const start = async () => {
//         try {
//             const res = await fetch('/login/esignet');
//             const data = await res.json();
//             if (data.authUrl) {
//                 window.location.href = data.authUrl;
//             } else {
//                 setPhoneError('Failed to start ESIGNET login.');
//             }
//         } catch (err) {
//             console.error(err);
//             setPhoneError('Failed to start ESIGNET login.');
//         }
//     };

//     // Phone login handler
//     const handlePhoneLogin = (e: React.FormEvent) => {
//         e.preventDefault();
//         setPhoneError('');
//         setIsLoadingPhone(true);

//         if (!phoneNumber) {
//             setPhoneError('Please enter your mobile number');
//             setIsLoadingPhone(false);
//             return;
//         }

//         const ethioRegex = /^(9\d{8})$/; // Ethio Telecom 9XXXXXXXX
//         const cleanPhone = phoneNumber.replace(/^0/, ''); // normalize
//         if (!ethioRegex.test(cleanPhone)) {
//             setPhoneError('Please enter a valid Ethio Telecom number (e.g., 09...)');
//             setIsLoadingPhone(false);
//             return;
//         }

//         router.post(
//             '/otp/send',
//             { phone: cleanPhone },
//             {
//                 onError: (errors: any) => {
//                     if (errors.phone) setPhoneError(errors.phone[0]);
//                     else setPhoneError('Failed to send OTP. Please try again.');
//                 },
//                 onSuccess: () => router.visit('/otp/verify'),
//                 onFinish: () => setIsLoadingPhone(false),
//             },
//         );
//     };

//     // National ID verification handlers
//     const handleVerifyNationalId = async () => {
//         setIsLoadingNationalId(true);
//         setNationalIdError(null);

//         try {
//             if (nationalId.length !== 16) {
//                 throw {
//                     message: 'National ID must be exactly 16 digits',
//                     isValidationError: true,
//                     showNationalIdHelp: true,
//                 };
//             }

//             const response = await axios.post('/api/v1/nid/otp', { individual_id: nationalId });
//             const otpData = response.data?.data?.original?.data;

//             if (!otpData || otpData.ret_code !== '0') {
//                 throw {
//                     message: otpData?.ret_msg || 'Failed to send verification code',
//                     ret_code: otpData?.ret_code,
//                 };
//             }

//             setTransactionId(otpData.transaction_id);
//             if (otpData.masked_mobile) setMaskedContact(`sent to ${otpData.masked_mobile}`);
//             else if (otpData.masked_email) setMaskedContact(`sent to ${otpData.masked_email}`);
//             else setMaskedContact('sent to your registered contact');

//             setNationalIdStep('verify');
//         } catch (err: any) {
//             console.error('OTP Error:', err);
//             if (err.response?.data?.message) {
//                 setNationalIdError({
//                     message: err.response.data.message,
//                     ret_code: err.response.data.ret_code,
//                     showNationalIdHelp: err.response.data.ret_code === '9999',
//                 });
//             } else if (err.isValidationError) {
//                 setNationalIdError(err);
//             } else {
//                 setNationalIdError({ message: 'Failed to verify National ID. Please try again.' });
//             }
//         } finally {
//             setIsLoadingNationalId(false);
//         }
//     };

//     const handleVerificationCode = async () => {
//         setIsLoadingNationalId(true);
//         setNationalIdError(null);

//         try {
//             if (verificationCode.length !== 6) {
//                 throw { message: 'Verification code must be exactly 6 digits', isValidationError: true };
//             }

//             const response = await axios.post('/api/v1/nid/kyc', {
//                 individual_id: nationalId,
//                 otp_value: verificationCode,
//                 transaction_id: transactionId,
//             });

//             const kyc = response.data;
//             if (!kyc.success || kyc.ret_code !== '0') {
//                 throw { message: kyc.message || 'Verification failed', ret_code: kyc.ret_code };
//             }

//             localStorage.setItem('kycData', JSON.stringify(kyc.data));
//             window.location.href = '/profile';
//         } catch (err: any) {
//             console.error('KYC Error:', err);
//             if (err.response?.data?.message) {
//                 setNationalIdError({ message: err.response.data.message, ret_code: err.response.data.ret_code });
//             } else if (err.isValidationError) {
//                 setNationalIdError(err);
//             } else {
//                 setNationalIdError({ message: err.message || 'Failed to verify code. Please try again.' });
//             }
//         } finally {
//             setIsLoadingNationalId(false);
//         }
//     };

//     const resetNationalIdVerification = () => {
//         setNationalId('');
//         setVerificationCode('');
//         setNationalIdStep('input');
//         setNationalIdError(null);
//     };

//     return (
//         <div className={cn('flex flex-col gap-6', className)} {...props}>
//             <Card>
//                 <CardHeader className="text-center">
//                     <CardTitle className="text-xl">Welcome</CardTitle>
//                     <CardDescription>Sign in with your phone number or National ID</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     {activeMethod === 'phone' && nationalIdStep === 'input' && (
//                         <FieldGroup>
//                             {/* Phone Login */}
//                             <Field>
//                                 <FieldLabel htmlFor="phone">Mobile Number</FieldLabel>
//                                 <form onSubmit={handlePhoneLogin}>
//                                     <div className="mb-3 flex gap-1">
//                                         <div className="flex w-12 items-center justify-center rounded-sm border bg-muted text-sm font-medium">
//                                             +251
//                                         </div>
//                                         <Input
//                                             id="phone"
//                                             type="tel"
//                                             placeholder="912345678"
//                                             value={phoneNumber}
//                                             onChange={(e) => setPhoneNumber(e.target.value)}
//                                             className="flex-1 focus:ring-1"
//                                             required
//                                         />
//                                     </div>
//                                     {phoneError && <div className="mb-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{phoneError}</div>}
//                                     <Button type="submit" disabled={isLoadingPhone} className="mt-2 w-full">
//                                         {isLoadingPhone ? (
//                                             <>
//                                                 <Loader2 className="mr-2 size-4 animate-spin" />
//                                                 Sending OTP...
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <Phone className="mr-2 size-4" />
//                                                 Login
//                                             </>
//                                         )}
//                                     </Button>
//                                 </form>
//                                 <FieldDescription className="w-[80%]">Enter your Ethio Telecom number to receive an OTP</FieldDescription>
//                             </Field>

//                             <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or continue with</FieldSeparator>

//                             {/* National ID Option */}
//                             <Field>
//                                 <Button onClick={() => setActiveMethod('nationalId')} variant="outline" type="button" className="mb-2">
//                                     <img src={logo} alt="National ID Logo" className="ml-2 h-5 w-5" />
//                                     Login with National ID
//                                 </Button>
//                             </Field>
//                         </FieldGroup>
//                     )}

//                     {/* National ID Flow */}
//                     {activeMethod === 'nationalId' && (
//                         <div>
//                             {/* Back Button */}
//                             <Button
//                                 variant="ghost"
//                                 onClick={() => {
//                                     setActiveMethod('phone');
//                                     resetNationalIdVerification();
//                                 }}
//                                 className="mb-4 p-0 text-sm hover:bg-transparent"
//                             >
//                                 <ArrowLeft className="h-4 w-4" />
//                                 Back
//                             </Button>

//                             {/* National ID Input */}
//                             {nationalIdStep === 'input' && (
//                                 <form
//                                     onSubmit={(e) => {
//                                         e.preventDefault();
//                                         handleVerifyNationalId();
//                                     }}
//                                 >
//                                     <FieldGroup>
//                                         <Field>
//                                             <FieldLabel htmlFor="nationalId">National ID Number</FieldLabel>
//                                             <Input
//                                                 id="nationalId"
//                                                 type="text"
//                                                 placeholder="Enter 16-digit National ID"
//                                                 value={nationalId}
//                                                 onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
//                                                 maxLength={16}
//                                                 required
//                                             />
//                                         </Field>
//                                         <Field>
//                                             <Button type="submit" disabled={isLoadingNationalId || nationalId.length !== 16} className="w-full">
//                                                 {isLoadingNationalId ? (
//                                                     <>
//                                                         <Loader2 className="mr-2 size-4 animate-spin" />
//                                                         Verifying ID...
//                                                     </>
//                                                 ) : (
//                                                     'Verify National ID'
//                                                 )}
//                                             </Button>
//                                         </Field>
//                                     </FieldGroup>
//                                 </form>
//                             )}

//                             {/* OTP Verification */}
//                             {nationalIdStep === 'verify' && (
//                                 <form
//                                     onSubmit={(e) => {
//                                         e.preventDefault();
//                                         handleVerificationCode();
//                                     }}
//                                 >
//                                     <FieldGroup>
//                                         <Field>
//                                             <FieldLabel>Verification Code</FieldLabel>
//                                             <div className="flex justify-center gap-2">
//                                                 {Array.from({ length: 6 }).map((_, index) => (
//                                                     <Input
//                                                         key={index}
//                                                         type="text"
//                                                         inputMode="numeric"
//                                                         maxLength={1}
//                                                         value={verificationCode[index] || ''}
//                                                         onChange={(e) => {
//                                                             const val = e.target.value.replace(/\D/g, '');
//                                                             if (!val) return;
//                                                             const newCode = verificationCode.split('');
//                                                             newCode[index] = val;
//                                                             setVerificationCode(newCode.join(''));
//                                                             if (val && index < 5) {
//                                                                 const nextInput = document.getElementById(`otp-${index + 1}`);
//                                                                 nextInput?.focus();
//                                                             }
//                                                         }}
//                                                         className="h-12 w-12 text-center text-lg font-semibold"
//                                                     />
//                                                 ))}
//                                             </div>
//                                             <FieldDescription>Code {maskedContact}</FieldDescription>
//                                         </Field>
//                                         <Field>
//                                             <Button type="submit" disabled={isLoadingNationalId || verificationCode.length !== 6} className="w-full">
//                                                 {isLoadingNationalId ? (
//                                                     <>
//                                                         <Loader2 className="mr-2 size-4 animate-spin" />
//                                                         Verifying Code...
//                                                     </>
//                                                 ) : (
//                                                     'Verify Code'
//                                                 )}
//                                             </Button>
//                                         </Field>
//                                     </FieldGroup>
//                                 </form>
//                             )}

//                             {nationalIdError && (
//                                 <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{nationalIdError.message}</div>
//                             )}
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }

// 'use client';

// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
// import { Input } from '@/components/ui/input';
// import logo from '@/images/national_id_logo.png';
// import { cn } from '@/lib/utils';
// import { router } from '@inertiajs/react';
// import { Loader2, Phone } from 'lucide-react';
// import { useState } from 'react';

// export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
//     const [phoneNumber, setPhoneNumber] = useState('');
//     const [isLoadingPhone, setIsLoadingPhone] = useState(false);
//     const [phoneError, setPhoneError] = useState('');

//     const handlePhoneLogin = (e: React.FormEvent) => {
//         e.preventDefault();
//         setPhoneError('');
//         setIsLoadingPhone(true);

//         if (!phoneNumber) {
//             setPhoneError('Please enter your mobile number');
//             setIsLoadingPhone(false);
//             return;
//         }

//         const ethioRegex = /^(9\d{8})$/; // Ethio Telecom 9XXXXXXXX
//         const cleanPhone = phoneNumber.replace(/^0/, ''); // normalize
//         if (!ethioRegex.test(cleanPhone)) {
//             setPhoneError('Please enter a valid Ethio Telecom number (e.g., 09...)');
//             setIsLoadingPhone(false);
//             return;
//         }

//         router.post(
//             '/otp/send',
//             { phone: cleanPhone },
//             {
//                 onError: (errors: any) => {
//                     if (errors.phone) setPhoneError(errors.phone[0]);
//                     else setPhoneError('Failed to send OTP. Please try again.');
//                 },
//                 onSuccess: () => router.visit('/otp/verify'),
//                 onFinish: () => setIsLoadingPhone(false),
//             },
//         );
//     };

//     return (
//         <div className={cn('flex flex-col gap-6', className)} {...props}>
//             <Card>
//                 <CardHeader className="text-center">
//                     <CardTitle className="text-xl">Welcome</CardTitle>
//                     <CardDescription>Sign in with your phone number or National ID</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     <FieldGroup>
//                         {/* Phone Login */}
//                         <Field>
//                             <FieldLabel htmlFor="phone">Mobile Number</FieldLabel>
//                             <form onSubmit={handlePhoneLogin}>
//                                 <div className="mb-3 flex gap-1">
//                                     <div className="flex w-12 items-center justify-center rounded-sm border bg-muted text-sm font-medium">+251</div>
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
//                                 {phoneError && <div className="mb-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{phoneError}</div>}
//                                 <Button type="submit" disabled={isLoadingPhone} className="mt-2 w-full">
//                                     {isLoadingPhone ? (
//                                         <>
//                                             <Loader2 className="mr-2 size-4 animate-spin" />
//                                             Sending OTP...
//                                         </>
//                                     ) : (
//                                         <>
//                                             <Phone className="mr-2 size-4" />
//                                             Login
//                                         </>
//                                     )}
//                                 </Button>
//                             </form>
//                             <FieldDescription className="w-[80%]">Enter your Ethio Telecom number to receive an OTP</FieldDescription>
//                         </Field>

//                         <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or continue with</FieldSeparator>

//                         {/* National ID Button */}
//                         <Field>
//                             <Button
//                                 onClick={() => (window.location.href = '/login/esignet')}
//                                 variant="outline"
//                                 type="button"
//                                 className="mb-2 flex items-center justify-center gap-2"
//                             >
//                                 <img src={logo} alt="National ID Logo" className="h-5 w-5" />
//                                 Login with National ID
//                             </Button>
//                         </Field>
//                     </FieldGroup>
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
import logo from '@/images/national_id_logo.png';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Loader2, Phone } from 'lucide-react';
import { useState } from 'react';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoadingPhone, setIsLoadingPhone] = useState(false);
    const [errors, setErrors] = useState<string[]>([]); // Multiple errors

    const handlePhoneLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        setIsLoadingPhone(true);

        const validationErrors: string[] = [];

        if (!phoneNumber) {
            validationErrors.push('Please enter your mobile number');
        }

        const ethioRegex = /^(9\d{8})$/; // Ethio Telecom 9XXXXXXXX
        const cleanPhone = phoneNumber.replace(/^0/, '');
        if (!ethioRegex.test(cleanPhone)) {
            validationErrors.push('Please enter a valid Ethio Telecom number');
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            setIsLoadingPhone(false);
            return;
        }

        router.post(
            '/otp/send',
            { phone: cleanPhone },
            {
                onError: (backendErrors: any) => {
                    const backendErrorMessages: string[] = [];
                    if (backendErrors) {
                        // Collect all backend errors
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

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome</CardTitle>
                    <CardDescription>Sign in with your phone number or National ID</CardDescription>
                </CardHeader>
                <CardContent>
                    <FieldGroup>
                        {/* Phone Login */}
                        <Field>
                            <FieldLabel htmlFor="phone">Mobile Number</FieldLabel>
                            <form onSubmit={handlePhoneLogin}>
                                <div className="mb-3 flex gap-1">
                                    <div className="flex w-12 items-center justify-center rounded-sm border bg-muted text-sm font-medium">+251</div>
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

                                {/* Show all errors */}
                                {errors.length > 0 && (
                                    <div className="mb-2 space-y-1 rounded-md border p-2 text-sm text-destructive">
                                        {errors.map((err, i) => (
                                            <div key={i}>{err}</div>
                                        ))}
                                    </div>
                                )}

                                <Button type="submit" disabled={isLoadingPhone} className="mt-2 w-full">
                                    {isLoadingPhone ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        <>
                                            <Phone className="mr-2 size-4" />
                                            Login
                                        </>
                                    )}
                                </Button>
                            </form>
                            <FieldDescription className="w-[80%]">Enter your Ethio Telecom number to receive an OTP</FieldDescription>
                        </Field>

                        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or continue with</FieldSeparator>

                        {/* National ID Button */}
                        <Field>
                            <Button
                                onClick={() => (window.location.href = '/login/esignet')}
                                variant="outline"
                                type="button"
                                className="mb-2 flex items-center justify-center gap-2"
                            >
                                <img src={logo} alt="National ID Logo" className="h-5 w-5" />
                                Login with National ID
                            </Button>
                        </Field>
                    </FieldGroup>
                </CardContent>
            </Card>
        </div>
    );
}
