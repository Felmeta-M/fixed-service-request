import { OTPVerification } from '@/components/auth/otp-verification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { Link } from '@inertiajs/react';
import { LogIn, Network, Phone } from 'lucide-react';

export default function VerifyPage() {
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
            <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center p-2">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                            <Phone className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle>Verify Your Number</CardTitle>
                        <CardDescription>
                            <div className="text-muted-foreground">Enter 6 digit OTP sent to your number</div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OTPVerification />
                    </CardContent>
                </Card>
            </div>
            <Toaster />
        </div>
    );
}
