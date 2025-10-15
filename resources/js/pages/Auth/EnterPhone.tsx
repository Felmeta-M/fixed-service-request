import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { Link } from '@inertiajs/react';
import { ArrowLeft, LogIn, Network, Shield } from 'lucide-react';

export default function LoginPage() {
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
                        <div className="mb-4 flex items-center justify-between">
                            <Link href="/" className="inline-flex items-center text-primary hover:opacity-90">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Home
                            </Link>
                            <h1 className="text-md font-bold text-foreground">Welcome Back</h1>
                            <CardTitle className="flex items-center justify-center space-x-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <span>Sign In</span>
                            </CardTitle>
                        </div>
                        <CardDescription>Enter your mobile number to receive an OTP verification code</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LoginForm />
                    </CardContent>
                </Card>
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/customer/create" className="font-medium text-primary hover:underline">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
            <Toaster />
        </div>
    );
}
