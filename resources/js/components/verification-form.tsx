'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, IdCard, Loader2, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useNidOtp, useNidKyc } from '@/hooks/use-api-mutations';

interface VerificationError {
    message: string;
    ret_code?: string;
    isValidationError?: boolean;
    showNationalIdHelp?: boolean;
}

export function VerificationForm({ className, ...props }: React.ComponentProps<'div'>) {
    const [option, setOption] = useState('existing');
    const [nationalId, setNationalId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState('option');
    const [transactionId, setTransactionId] = useState('');
    const [maskedContact, setMaskedContact] = useState('');
    const [error, setError] = useState<VerificationError | null>(null);

    const nidOtpMutation = useNidOtp();
    const nidKycMutation = useNidKyc();

    const handleVerifyNationalId = async () => {
        setError(null);

        if (nationalId.length !== 16) {
            setError({
                message: 'National ID must be exactly 16 digits',
                isValidationError: true,
                showNationalIdHelp: true,
            });
            return;
        }

        nidOtpMutation.mutate(
            { individual_id: nationalId },
            {
                onSuccess: (otpData) => {
                    setTransactionId(otpData.transaction_id);

                    if (otpData.masked_mobile) {
                        setMaskedContact(`sent to ${otpData.masked_mobile}`);
                    } else if (otpData.masked_email) {
                        setMaskedContact(`sent to ${otpData.masked_email}`);
                    } else {
                        setMaskedContact('sent to your registered contact');
                    }

                    setStep('verify');
                },
                onError: (err: Error & { ret_code?: string }) => {
                    setError({
                        message: err.message || 'Failed to verify National ID. Please try again.',
                        ret_code: err.ret_code,
                        showNationalIdHelp: err.ret_code === '9999',
                    });
                },
            }
        );
    };

    const handleVerificationCode = async () => {
        setError(null);

        if (verificationCode.length !== 6) {
            setError({
                message: 'Verification code must be exactly 6 digits',
                isValidationError: true,
            });
            return;
        }

        nidKycMutation.mutate(
            {
                individual_id: nationalId,
                otp_value: verificationCode,
                transaction_id: transactionId,
            },
            {
                onError: (err: Error & { ret_code?: string }) => {
                    setError({
                        message: err.message || 'Failed to verify code. Please try again.',
                        ret_code: err.ret_code,
                    });
                },
            }
        );
    };

    const resetVerification = () => {
        setNationalId('');
        setVerificationCode('');
        setStep('option');
        setError(null);
    };

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome</CardTitle>
                    <CardDescription>Login with your National Id or Phone Number</CardDescription>
                </CardHeader>
                <CardContent>
                    {step !== 'option' && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                if (step === 'verify') {
                                    setStep('nationalId');
                                } else {
                                    setStep('option');
                                }
                            }}
                            className="mb-4 p-0 text-sm hover:bg-transparent"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    )}

                    {step === 'option' && (
                        <FieldGroup>
                            <Field>
                                <button
                                    onClick={() => setStep('nationalId')}
                                    className="border-gray flex w-full items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-accent hover:opacity-90"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-lg sm:size-12">
                                            <IdCard className="size-full" />
                                        </div>
                                        <div className="text-left">
                                            <p className="sm:text-md text-sm sm:font-medium">National ID</p>
                                            <p className="text-xs text-muted-foreground sm:text-sm">Use your 16-digit National ID</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                </button>
                            </Field>

                            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or</FieldSeparator>

                            <Field>
                                <Link href="/otp/phone" className="block w-full">
                                    <button className="flex w-full items-center justify-between rounded-lg border-2 border-border p-4 transition-all hover:bg-accent hover:opacity-90">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-lg sm:size-12">
                                                <Smartphone className="size-full" />
                                            </div>
                                            <div className="text-left">
                                                <p className="sm:text-md text-sm sm:font-medium">Phone Number</p>
                                                <p className="text-xs text-muted-foreground sm:text-sm">Use your Ethio Telecom number</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="size-4 text-muted-foreground" />
                                    </button>
                                </Link>
                            </Field>
                        </FieldGroup>
                    )}

                    {step === 'nationalId' && (
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
                                    <FieldDescription>Enter your 16-digit Ethiopian National ID number</FieldDescription>
                                </Field>
                                <Field>
                                    <Button type="submit" disabled={nidOtpMutation.isPending || nationalId.length !== 16} className="w-full">
                                        {nidOtpMutation.isPending ? (
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

                    {step === 'verify' && (
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
                                    <Button type="submit" disabled={nidKycMutation.isPending || verificationCode.length !== 6} className="w-full">
                                        {nidKycMutation.isPending ? (
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

                    {error && <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error.message}</div>}
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
