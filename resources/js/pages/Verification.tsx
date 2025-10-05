import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '@/images/national_id_logo.png';
import AuthLayout from '@/layouts/AuthLayout';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, ArrowLeft, CheckCircle, ChevronRight, Info, Loader2, LogIn, Network, Phone, Shield } from 'lucide-react';
import { useState } from 'react';

interface OtpResponse {
    data: {
        transaction_id: string;
        response_time: string;
        ret_code: string;
        ret_msg: string;
        masked_mobile?: string;
        masked_email?: string;
    };
    ret_code?: string;
    ret_msg?: string;
    masked_mobile?: string;
    masked_email?: string;
}

interface KycResponse {
    success: boolean;
    ret_code: string;
    message: string;
    data: {
        headers: {};
        original: {
            success: boolean;
            message: string;
            data: {
                transaction_id: string;
                provider: string;
                response_time: string;
                kyc_status: boolean;
                auth_token: string;
                identity: {
                    name: {
                        eng: string;
                        amh: string;
                    };
                    dob: string;
                    gender: {
                        eng: string;
                        amh: string;
                    };
                    phone: string;
                    email: string;
                    address: {
                        eng: string;
                        amh: string;
                    };
                    nationality: {
                        eng: string;
                        amh: string;
                    };
                    photo_base64: string;
                };
            };
        };
        exception: null;
    };
}

interface VerificationError {
    message: string;
    ret_code?: string;
    isValidationError?: boolean;
    showNationalIdHelp?: boolean;
}

// National ID validation function
const validateEthiopianNationalId = (id: string): boolean => {
    // Basic validation for National ID
    if (id.length !== 16) return false;

    // Check if it contains only digits
    if (!/^\d+$/.test(id)) return false;

    return true;
};

export default function VerificationPage() {
    const [option, setOption] = useState('existing');
    const [nationalId, setNationalId] = useState('');
    const [serviceNumber, setServiceNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState('option');
    const [loading, setLoading] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [timestamp, setTimestamp] = useState('');
    const [maskedContact, setMaskedContact] = useState('');
    const [error, setError] = useState<VerificationError | null>(null);
    const [kycData, setKycData] = useState<any>(null);

    const handleVerifyNationalId = async () => {
        setLoading(true);
        setError(null);

        try {
            // Validate National ID format
            if (nationalId.length !== 16) {
                throw {
                    message: 'National ID must be exactly 16 digits',
                    isValidationError: true,
                    showNationalIdHelp: true,
                };
            }

            // Validate National ID format
            if (!validateEthiopianNationalId(nationalId)) {
                throw {
                    message: 'Invalid National ID format. Please check your ID number.',
                    isValidationError: true,
                    showNationalIdHelp: true,
                };
            }

            // Call the OTP endpoint
            const response = await axios.post('/api/v1/nid/otp', {
                individual_id: nationalId,
            });

            const otpData = (response.data as OtpResponse).data as OtpResponse['data'];
            console.log('OTP Response:', otpData);

            if (otpData.ret_code !== '0') {
                // Handle specific error codes
                if (otpData.ret_code === '9999') {
                    throw {
                        message: 'Invalid National ID. Please check your ID number and try again.',
                        ret_code: otpData.ret_code,
                        showNationalIdHelp: true,
                    };
                }

                throw {
                    message: (response.data as any).ret_msg || 'Failed to send verification code',
                    ret_code: (response.data as any).ret_code,
                };
            }

            // Store transaction ID and timestamp for the next step
            setTransactionId(otpData.transaction_id);
            setTimestamp(otpData.response_time);

            // Show masked contact info to the user
            if ((response.data as any).masked_mobile || otpData.masked_mobile) {
                setMaskedContact(`sent to ${(response.data as any).masked_mobile || otpData.masked_mobile}`);
            } else if ((response.data as any).masked_email || otpData.masked_email) {
                setMaskedContact(`sent to ${(response.data as any).masked_email || otpData.masked_email}`);
            } else {
                setMaskedContact('sent to your registered contact');
            }

            setStep('verify');
        } catch (err: any) {
            console.error('OTP Error:', err);
            console.log('err.response?.data?.message', err.response?.data?.message);

            if (err.response?.data?.message) {
                setError({
                    message: err.response.data.message,
                    ret_code: err.response.data.ret_code,
                    showNationalIdHelp: err.response.data.ret_code === '9999',
                });
            } else if (err.isValidationError) {
                setError(err);
            } else {
                setError({
                    message: 'Failed to verify National ID. Please try again.',
                });
            }

            setStep('error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerificationCode = async () => {
        setLoading(true);
        setError(null);

        try {
            // Validate verification code
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
                timestamp: timestamp,
            });

            const kyc = response.data as KycResponse;
            console.log('KYC Response:', kyc);

            // Check if the main response is successful
            if (!kyc.success || kyc.ret_code !== '0') {
                throw {
                    message: kyc.message || 'Verification failed',
                    ret_code: kyc.ret_code,
                };
            }

            // CORRECTED: Access the actual KYC data from response.data.data.original
            // const kycResponseData = kyc.data.original;

            // // Check if the KYC data is successful
            // if (!kycResponseData.success || !kycResponseData.data.kyc_status) {
            //     throw {
            //         message: 'KYC verification failed',
            //         ret_code: kyc.ret_code,
            //     };
            // }

            // Store KYC data and proceed to success - use the corrected path
            // setKycData(kycResponseData.data);
            setKycData(kyc.data);
            setStep('success');

            setTimeout(() => {
                // Store KYC data in localStorage - use the corrected path
                // localStorage.setItem('kycData', JSON.stringify(kycResponseData.data));
                localStorage.setItem('kycData', JSON.stringify(kyc.data));
                // router.visit('/survey-requests');
                window.location.href = '/survey-requests';
            }, 2000);
        } catch (err: any) {
            console.error('KYC Error:', err);

            if (err.response?.data?.message) {
                setError({
                    message: err.response.data.message,
                    ret_code: err.response.data.ret_code,
                });
            } else if (err.isValidationError) {
                setError(err);
            } else {
                setError({
                    message: err.message || 'Failed to verify code. Please try again.',
                });
            }

            setStep('error');
        } finally {
            setLoading(false);
        }
    };

    const resetVerification = () => {
        setNationalId('');
        setServiceNumber('');
        setVerificationCode('');
        setStep('option');
        setError(null);
    };

    const formatDob = (dobString: string) => {
        // Format YYYYMMDD to readable date
        const year = dobString.substring(0, 4);
        const month = dobString.substring(4, 6);
        const day = dobString.substring(6, 8);
        return `${year}-${month}-${day}`;
    };

    if (step === 'success') {
        return (
            <AuthLayout>
                <div className="flex items-center justify-center p-1">
                    <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl">
                        <div className="bg-green-100 p-1">
                            <div className="rounded-t-lg bg-white p-6">
                                <div className="mb-4 flex items-center justify-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                                <CardTitle className="text-center text-2xl font-bold text-gray-800">Verification Successful!</CardTitle>
                                <CardDescription className="mt-2 text-center">
                                    {kycData ? 'Your identity has been successfully verified.' : 'Your phone number has been successfully verified.'}
                                </CardDescription>
                            </div>
                        </div>

                        <CardContent className="space-y-6 p-6">
                            <div className="rounded-lg bg-green-50 p-4">
                                <div className="flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="font-medium text-green-800">
                                            {kycData ? `Welcome, ${kycData.identity?.name?.eng || 'User'}!` : 'Welcome back!'}
                                        </p>
                                        <p className="mt-1 text-sm text-green-600">Redirecting to your profile...</p>
                                    </div>
                                </div>
                            </div>

                            {kycData && (
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Name:</span>
                                        <span>{kycData.identity.name.eng}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Date of Birth:</span>
                                        <span>{formatDob(kycData.identity.dob)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Gender:</span>
                                        <span>{kycData.identity.gender.eng}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-center border-t bg-gray-50 p-6">
                            <p className="text-center text-sm text-gray-600">Your information is securely encrypted and protected.</p>
                        </CardFooter>
                    </Card>
                </div>
            </AuthLayout>
        );
    }

    if (step === 'error') {
        return (
            <AuthLayout>
                <div className="flex items-center justify-center p-1">
                    <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl">
                        <div className="bg-red-100 p-1">
                            <div className="rounded-t-lg bg-white p-6">
                                <div className="mb-4 flex items-center justify-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                        <AlertCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                </div>
                                <CardTitle className="text-center text-2xl font-bold text-gray-800">Verification Failed</CardTitle>
                                <CardDescription className="mt-2 text-center">
                                    {error?.message || 'An error occurred during verification'}
                                </CardDescription>
                            </div>
                        </div>

                        <CardContent className="space-y-6 p-6">
                            <div className="rounded-lg bg-red-50 p-4">
                                <div className="flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="font-medium text-red-800">
                                            {error?.ret_code ? `Error Code: ${error.ret_code}` : 'Please try again'}
                                        </p>
                                        <p className="mt-1 text-sm text-red-600">
                                            {error?.isValidationError
                                                ? 'Please check your input and try again.'
                                                : 'There was a problem with the verification process.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {error?.showNationalIdHelp && (
                                <div className="rounded-lg bg-blue-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <Info className="mt-0.5 h-5 w-5 text-blue-500" />
                                        <div>
                                            <h4 className="font-medium text-blue-800">National ID Help</h4>
                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-700">
                                                <li>Make sure you're entering your 16-digit Ethiopian National ID</li>
                                                <li>Check that all digits are correct and in the right order</li>
                                                <li>Ensure you're not including any spaces or special characters</li>
                                                <li>If you continue to have issues, please contact support</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-center border-t bg-gray-50 p-6">
                            <Button onClick={resetVerification} className="w-full bg-primary py-3 text-lg hover:opacity-90">
                                Try Again
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </AuthLayout>
        );
    }

    return (
        <div className="mx-auto min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="border-b bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <Network className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">EthioTelecom</h1>
                                <p className="text-xs text-gray-500">Fixed Line Services</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Button size="sm" className="bg-primary text-white">
                                <Link href={route('verification')} className="flex items-center">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Sign In
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-2">
                <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl">
                    <div className="bg-primary p-1">
                        <div className="rounded-t-lg bg-white p-6">
                            <div className="mb-4 flex items-center justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                    <Shield className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            <CardTitle className="text-center text-2xl font-bold text-gray-800">Identity Verification</CardTitle>
                            <CardDescription className="mt-2 text-center">
                                {step === 'option'
                                    ? 'Select how you would like to verify your identity'
                                    : step === 'nationalId'
                                      ? 'Enter your National ID for verification'
                                      : step === 'verify'
                                        ? 'Enter the verification code'
                                        : ''}
                            </CardDescription>
                        </div>
                    </div>

                    <CardContent className="space-y-6 p-6">
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
                                className="flex items-center p-0 text-primary hover:bg-transparent hover:text-green-600"
                            >
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back
                            </Button>
                        )}
                        {step === 'option' && (
                            <>
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setStep('nationalId')}
                                        className="flex w-full items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition hover:bg-blue-50 focus:outline-none"
                                    >
                                        <div className="flex items-center space-x-4">
                                            {/* National ID Icon */}
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                                <img src={logo} alt="National ID" className="h-12 w-12 object-contain" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-base font-semibold text-gray-800">Continue with National ID</p>
                                                <p className="text-sm text-gray-500">Use your 16-digit National ID</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </button>

                                    <Link
                                        href={route('otp.phone')}
                                        className="flex w-full items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition hover:bg-blue-50 focus:outline-none"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                                <Phone className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-base font-semibold text-gray-800">Continue with Ethio Telecom Phone Number</p>
                                                <p className="text-sm text-gray-500">Use your existing phone number</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </Link>
                                </div>
                            </>
                        )}

                        {step === 'nationalId' && (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="nationalId" className="mb-2 block text-base font-medium">
                                            National ID Number
                                        </Label>
                                        <Input
                                            id="nationalId"
                                            type="text"
                                            placeholder="xxxx xxxx xxxx xxxx"
                                            value={nationalId}
                                            onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                                            className="py-3 text-lg"
                                            maxLength={16}
                                        />
                                        <p className="mt-2 text-sm text-gray-500">Enter your 16-digit National ID number.</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleVerifyNationalId}
                                    disabled={loading || nationalId.length !== 16}
                                    className="w-full bg-primary py-3 text-lg hover:opacity-90 disabled:opacity-70"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Verifying ID...
                                        </>
                                    ) : (
                                        'Verify National ID'
                                    )}
                                </Button>
                            </>
                        )}
                        {step === 'verify' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Verification code sent to <span className="font-medium">{maskedContact}</span>
                                    </p>
                                </div>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleVerificationCode();
                                    }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label>Enter 6-digit Code</Label>
                                        <div className="flex justify-center space-x-2">
                                            {Array.from({ length: 6 }).map((_, index) => (
                                                <Input
                                                    key={index}
                                                    id={`otp-${index}`}
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

                                                        // auto-focus next input
                                                        if (val && index < 5) {
                                                            const nextInput = document.getElementById(`otp-${index + 1}`);
                                                            nextInput?.focus();
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                                                            const prevInput = document.getElementById(`otp-${index - 1}`);
                                                            prevInput?.focus();
                                                        }
                                                    }}
                                                    onPaste={(e) => {
                                                        if (index !== 0) return;
                                                        e.preventDefault();
                                                        const pasted = e.clipboardData.getData('text/plain').trim();
                                                        if (pasted.length === 6 && /^\d+$/.test(pasted)) {
                                                            setVerificationCode(pasted);
                                                            const lastInput = document.getElementById(`otp-5`);
                                                            lastInput?.focus();
                                                        }
                                                    }}
                                                    className="h-12 w-12 border-primary text-center text-lg font-semibold hover:text-primary focus:border-primary focus:ring-2 focus:ring-primary"
                                                    autoFocus={index === 0}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading || verificationCode.length !== 6}
                                        className="w-full bg-primary py-3 text-lg hover:opacity-90 disabled:opacity-70"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Verifying Code...
                                            </>
                                        ) : (
                                            'Verify Code'
                                        )}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-center border-t bg-gray-50 p-6">
                        <p className="text-center text-sm text-gray-600">Your information is securely encrypted and protected.</p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
