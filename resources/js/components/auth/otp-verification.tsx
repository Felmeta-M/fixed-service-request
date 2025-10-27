import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { router, usePage } from '@inertiajs/react';
import { Loader2, RotateCcw, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OTPVerification() {
    const { props } = usePage();
    const serverErrors = props.errors || {};
    const initialPhone: string = typeof props.phone === 'string' ? props.phone : '';
    console.log('🚀 ~ OTPVerification ~ initialPhone:', initialPhone);

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(60 * 5);
    const [canResend, setCanResend] = useState(false);

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
                const newOtp = value.split('').slice(0, 6);
                setOtp(newOtp);

                const lastInput = document.getElementById(`otp-5`);
                lastInput?.focus();
                return;
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
        const pastedData = e.clipboardData.getData('text/plain').trim();

        if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split('').slice(0, 6);
            setOtp(newOtp);

            const lastInput = document.getElementById(`otp-5`);
            lastInput?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit OTP code');
            setIsLoading(false);
            return;
        }

        try {
            await router.post('/otp/verify', { code: otpCode });
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setCanResend(false);
        setCountdown(60);
        setError('');

        try {
            await router.post('/otp/send', { phone: initialPhone });
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
            setCanResend(true);
            setCountdown(0);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                {canResend ? (
                    <Button variant="ghost" onClick={handleResendOTP} className="text-sm">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Resend OTP
                    </Button>
                ) : (
                    <p className="text-sm font-bold text-muted-foreground">
                        Resend OTP in <span className="text-primary">{countdown}</span> seconds
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-center space-x-2">
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
                                onPaste={index === 0 ? handlePaste : undefined}
                                className="h-12 w-12 border-primary text-center text-lg font-semibold hover:text-primary focus:border-primary focus:ring-2 focus:ring-primary"
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>
                </div>

                {(error || serverErrors.code) && (
                    <Alert variant="destructive">
                        <AlertDescription>{error || serverErrors.code}</AlertDescription>
                    </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        <>
                            <Shield className="mr-2 h-4 w-4" />
                            Verify OTP
                        </>
                    )}
                </Button>
            </form>

            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    OTP sent to <span className="font-medium text-foreground">+{initialPhone}</span>
                </p>
            </div>

            <div className="text-center">
                <Button variant="ghost" onClick={() => router.visit('/otp/phone')} className="text-sm">
                    Change phone number
                </Button>
            </div>
        </div>
    );
}
