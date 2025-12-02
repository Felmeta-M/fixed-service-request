import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Loader2, Phone } from 'lucide-react';
import { useState } from 'react';
import logo from '../../images/national_id_logo.png';

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

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome</CardTitle>
                    <CardDescription>Sign in with your phone number </CardDescription>
                    {/* <CardDescription>or National ID</CardDescription> */}
                </CardHeader>
                <CardContent>
                    <FieldGroup>
                        <Field>
                            <form onSubmit={handlePhoneLogin}>
                                <FieldLabel htmlFor="phone">Mobile Number</FieldLabel>
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
                            <FieldDescription className="w-[80%] text-center text-sm/6 text-muted-foreground">
                                Enter your Ethio telecom number to receive an OTP
                            </FieldDescription>
                        </Field>

                        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or continue with</FieldSeparator>

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
