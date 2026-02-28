import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { Loader2, RotateCcw, Shield } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function OTPVerificationForm({ className, ...props }: React.ComponentProps<'div'>) {
    const { props: pageProps } = usePage();
    const phoneRef = useRef<string>('');
    if (!phoneRef.current && pageProps.phone) {
        const rawPhone = String(pageProps.phone);
        phoneRef.current = rawPhone.startsWith('+251') ? rawPhone : `+251${rawPhone.replace(/^0/, '')}`;
    }

    const phone = phoneRef.current;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [countdown, setCountdown] = useState(60 * 5);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (pageProps.errors) {
            const backendErrors: string[] = [];
            Object.values(pageProps.errors).forEach((e) => {
                if (Array.isArray(e)) backendErrors.push(...e);
                else backendErrors.push(String(e));
            });
            setErrors(backendErrors);
        }
    }, [pageProps.errors]);

    useEffect(() => {
        if (!canResend && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [countdown, canResend]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            if (value.length === 6 && /^\d+$/.test(value)) {
                setOtp(value.split('').slice(0, 6));
            }
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').trim();
        if (pasted.length === 6 && /^\d+$/.test(pasted)) {
            setOtp(pasted.split(''));
            const lastInput = document.getElementById(`otp-5`);
            lastInput?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors([]);

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setErrors(['Please enter the complete 6-digit OTP code']);
            setIsLoading(false);
            return;
        }

        try {
            await router.post('/otp/verify', { code: otpCode });
        } catch (err: any) {
            setErrors([err.response?.data?.message || 'Verification failed. Please try again.']);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setCanResend(false);
        setCountdown(60);
        setErrors([]);

        try {
            await router.post('/otp/send', { phone });
        } catch (err: any) {
            setErrors([err.response?.data?.message || 'Failed to resend OTP. Please try again.']);
            setCanResend(true);
            setCountdown(0);
        }
    };

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Verify Your Number</CardTitle>
                    <CardDescription>Enter the 6-digit OTP sent to your phone</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel>Verification Code</FieldLabel>
                                <div className="flex justify-center gap-2">
                                    {otp.map((digit, index) => (
                                        <Input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={handlePaste}
                                            className="h-12 w-12 text-center text-lg font-semibold focus:border-primary focus:ring-0"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </Field>

                            {errors.length > 0 && (
                                <div className="mt-2 mb-2 space-y-1 rounded-lg border p-3 text-sm text-destructive">
                                    {errors.map((err, i) => (
                                        <div key={i}>{err}</div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between text-sm">
                                {canResend ? (
                                    <Button variant="ghost" onClick={handleResendOTP} className="p-0 text-sm hover:bg-transparent">
                                        <RotateCcw className="mr-2 size-4" />
                                        Resend OTP
                                    </Button>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Resend OTP in <span className="font-semibold text-destructive">{countdown}</span> s
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('login'))}
                                    className="cursor-pointer text-sm font-medium text-primary hover:underline"
                                >
                                    Change number
                                </button>
                            </div>

                            <Field>
                                <Button type="submit" disabled={isLoading} className="mt-2 w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="mr-2 size-4" />
                                            Verify OTP
                                        </>
                                    )}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>

                    {/* Phone Display */}
                    {/* <div className="mt-4 text-center text-sm text-muted-foreground">
                        OTP sent to <span className="font-medium">{phone}</span>
                    </div> */}
                </CardContent>
            </Card>
        </div>
    );
}
