import { Link, Head } from '@inertiajs/react';
import { Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
    status: number;
    title: string;
    message: string;
}

export default function Error({ status, title, message }: ErrorPageProps) {
    // Determine icon and colors based on status
    const getStatusConfig = () => {
        if (status === 404) {
            return {
                icon: '🔍',
                color: 'text-amber-600',
                bgColor: 'bg-amber-50 dark:bg-amber-900/20',
            };
        }
        if (status === 401 || status === 403) {
            return {
                icon: '🔒',
                color: 'text-red-600',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
            };
        }
        if (status === 419 || status === 429) {
            return {
                icon: '⏰',
                color: 'text-orange-600',
                bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            };
        }
        // 500+ errors
        return {
            icon: '⚠️',
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
        };
    };

    const config = getStatusConfig();

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    };

    return (
        <>
            <Head title={`${status} - ${title}`} />
            
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
                <div className="w-full max-w-md">
                    {/* Error Card */}
                    <div className={`rounded-2xl ${config.bgColor} p-8 text-center shadow-lg`}>
                        {/* Status Icon */}
                        <div className="mb-4 text-6xl">{config.icon}</div>
                        
                        {/* Status Code */}
                        <div className={`mb-2 text-7xl font-bold ${config.color}`}>
                            {status}
                        </div>
                        
                        {/* Title */}
                        <h1 className="mb-4 text-2xl font-semibold text-foreground">
                            {title}
                        </h1>
                        
                        {/* Message */}
                        <p className="mb-8 text-muted-foreground">
                            {message}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button
                                variant="outline"
                                onClick={handleGoBack}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Go Back
                            </Button>
                            
                            <Link href="/">
                                <Button className="w-full gap-2 sm:w-auto">
                                    <Home className="h-4 w-4" />
                                    Home
                                </Button>
                            </Link>
                            
                            {status >= 500 && (
                                <Button
                                    variant="secondary"
                                    onClick={handleRefresh}
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Retry
                                </Button>
                            )}
                        </div>
                    </div>
                    
                    {/* Help Text */}
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        {status === 404 && (
                            <p>
                                If you believe this is an error, please{' '}
                                <Link href="/support-request" className="text-primary underline hover:no-underline">
                                    contact support
                                </Link>
                                .
                            </p>
                        )}
                        {status >= 500 && (
                            <p>
                                Our team has been notified. If the problem persists, please{' '}
                                <Link href="/support-request" className="text-primary underline hover:no-underline">
                                    contact support
                                </Link>
                                .
                            </p>
                        )}
                        {(status === 401 || status === 403) && (
                            <p>
                                Need access?{' '}
                                <Link href="/login" className="text-primary underline hover:no-underline">
                                    Log in
                                </Link>
                                {' '}or{' '}
                                <Link href="/" className="text-primary underline hover:no-underline">
                                    return home
                                </Link>
                                .
                            </p>
                        )}
                    </div>
                </div>
                
                {/* Footer */}
                <div className="mt-8 text-center text-xs text-muted-foreground">
                    <p>ethio telecom Fixed Services</p>
                </div>
            </div>
        </>
    );
}
