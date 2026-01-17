import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getStatusInfo } from '@/lib/status-map';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Gauge,
    Info,
    Mail,
    MapPin,
    Network,
    Package,
    Phone,
    PhoneCall,
    Smartphone,
    User,
    UserCheck,
    Wifi,
} from 'lucide-react';

const typeMap = {
    '1457567289': {
        label: 'Internet',
        text: 'text-blue-700',
        bg: 'bg-white',
        icon: Wifi,
        color: 'blue',
        description: 'Internet Service',
        border: 'border-blue-200',
    },
    '1207609454': {
        label: 'Voice',
        text: 'text-purple-700',
        bg: 'bg-white',
        icon: Phone,
        color: 'purple',
        description: 'Voice/Telephony Service',
        border: 'border-purple-200',
    },
    '180427974': {
        label: 'Combo',
        text: 'text-green-700',
        bg: 'bg-white',
        icon: Package,
        color: 'green',
        description: 'Internet + Voice Combo Service',
        border: 'border-green-200',
    },
};

const surveyTypeMap = {
    EIC08: {
        label: 'New',
        description: 'New Internet Connection Request',
        icon: Network,
        color: 'bg-white text-blue-700 border border-blue-200',
    },
    // Add other survey types as needed
};

interface SurveyDetail {
    customer_survey_order_id?: string;
    customer_subscription_order_id?: string | null;
    customer_code?: string;
    customer_type?: string;
    survey_type?: string;
    main_offer_id?: string;
    bandwidth?: string | null;
    status?: string | number | null;
    service_number?: string | null;
    with_device?: boolean;
    contact_person?: string;
    contact_no?: string;
    contact_email?: string;
    sec_contact_person?: string;
    sec_contact_no?: string;
    sec_contact_email?: string;
    created_at?: string;
    updated_at?: string;
    subscribed_at?: string;
    survey_address_info?: string;
    external_operid?: string;
}

interface SurveyDetailPageProps {
    survey: SurveyDetail | null;
    onBack?: () => void;
    showBackButton?: boolean;
    customerData?: unknown;
}

export default function SurveyDetailPage({ survey, onBack, showBackButton = true }: SurveyDetailPageProps) {

    if (!survey) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
                <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Survey not found</h3>
                <p className="mb-4 text-gray-600">The requested survey could not be loaded.</p>
                {showBackButton && (
                    <Link href="/dashboard">
                        <Button>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                )}
            </div>
        );
    }

    const serviceType = typeMap[survey.main_offer_id as keyof typeof typeMap] || {
        label: 'Unknown',
        text: 'text-gray-700',
        bg: 'bg-white',
        icon: FileText,
        color: 'gray',
        description: 'Unknown Service Type',
        border: 'border-gray-200',
    };
    const IconComponent = serviceType.icon;

    const surveyTypeInfo = surveyTypeMap[survey.survey_type as keyof typeof surveyTypeMap] || {
        label: survey.survey_type || 'Survey',
        description: 'Service Request',
        icon: FileText,
        color: 'bg-gray-100 text-gray-800 border border-gray-200',
    };
    const SurveyTypeIcon = surveyTypeInfo.icon;


    // Backend now sends status as a string label (e.g., "Waiting", "Completed")
    const statusInfo = getStatusInfo(survey.status);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'PPpp');
        } catch {
            return dateString;
        }
    };

    // Get status icon based on string status label from backend
    const getStatusIcon = (status: string | number | null | undefined) => {
        const statusStr = String(status ?? '');
        
        // Completed/Success states
        if (['Completed', 'Paid', 'Ready'].includes(statusStr)) {
            return (
                <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary" />
                </span>
            );
        }

        // In-progress/Waiting states
        if (['Processing', 'Waiting', 'Created'].includes(statusStr)) {
            return (
                <span className="flex items-center">
                    <Clock className="h-4 w-4 text-orange-500" />
                </span>
            );
        }

        // Error/Failed states
        if (['Failed', 'Cancelled', 'Suspended'].includes(statusStr)) {
            return (
                <span className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                </span>
            );
        }

        // Default
        return (
            <span className="flex items-center">
                <Clock className="h-4 w-4 text-blue-500" />
            </span>
        );
    };

    // Format bandwidth for display
    const formatBandwidth = (bandwidth: string) => {
        if (!bandwidth) return 'Not specified';

        // Convert "2048M" to "2 Gbps"
        if (bandwidth.endsWith('M')) {
            const mbps = parseInt(bandwidth);
            if (mbps >= 1000) {
                return `${(mbps / 1000).toFixed(1)} Gbps`;
            }
            return `${mbps} Mbps`;
        }
        return bandwidth;
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        {showBackButton && onBack && (
                            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <h1 className="text-2xl font-bold tracking-tight">Service Request</h1>
                    </div>
                </div>

                <div className="pr-2 flex flex-col gap-2 text-muted-foreground">
                    <div>
                        Survey Order Number: <span className="font-semibold">{survey.customer_survey_order_id || 'N/A'}</span>
                    </div>
                    {survey.customer_subscription_order_id && (
                        <div>
                            Subscription Order Number:{' '}
                            <Link
                                href={`/services/${survey.customer_subscription_order_id}?customer_subscription_order_id=${survey.customer_subscription_order_id}`}
                                className="font-semibold text-primary hover:underline"
                            >
                                {survey.customer_subscription_order_id}
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-6">
                {/* Service Configuration Card */}
                <Card>
                    <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-500" />
                            Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            {/* Basic Service Info */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Service</p>
                                    <div className="flex items-center gap-2">
                                        <IconComponent className={`h-4 w-4 ${serviceType.text}`} />
                                        <span className="font-medium">{serviceType.label}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                                    <div className="flex items-center gap-2">
                                        <SurveyTypeIcon className="h-4 w-4 text-blue-500" />
                                        <span>{surveyTypeInfo.label}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(survey.status)}
                                        <span className="font-medium">{statusInfo.label}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {survey.bandwidth && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Bandwidth</p>
                                        <div className="flex items-center gap-2">
                                            <Gauge className="h-4 w-4 text-blue-500" />
                                            <span className="font-semibold">{formatBandwidth(survey.bandwidth)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Order Numbers Section */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Survey Order Number</p>
                                <p className="font-mono text-base font-semibold">{survey.customer_survey_order_id || 'N/A'}</p>
                            </div>
                            {survey.customer_subscription_order_id && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Subscription Order Number</p>
                                    <Link
                                        href={`/services/${survey.customer_subscription_order_id}?customer_subscription_order_id=${survey.customer_subscription_order_id}`}
                                        className="font-mono text-base font-semibold text-primary hover:underline"
                                    >
                                        {survey.customer_subscription_order_id}
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Service Number Section */}
                        <div className="">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0">
                                    <p className="text-sm font-medium text-muted-foreground">Service Number</p>
                                    <p className={survey.service_number ? 'text-lg font-semibold' : 'text-sm text-muted-foreground'}>
                                        {survey.service_number || 'Not assigned yet'}
                                    </p>
                                </div>
                                {!survey.service_number && (
                                    <Badge variant="outline" className="text-yellow-600">
                                        Awaiting assignment
                                    </Badge>
                                )}
                            </div>

                            {survey.subscribed_at && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Subscribed Date</p>
                                    <p className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span>{formatDate(survey.subscribed_at)}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-blue-500" />
                            Contact Information
                        </CardTitle>
                        <CardDescription>contact details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Primary Contact */}
                        <div className="grid grid-cols-2 gap-6 space-y-4 md:grid-cols-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                                <p className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{survey.contact_person || 'Not specified'}</span>
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                                <p className="flex items-center gap-2">
                                    <PhoneCall className="h-4 w-4 text-gray-400" />
                                    <span>{survey.contact_no || 'Not specified'}</span>
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                                <p className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span>{survey.contact_email || 'Not specified'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Secondary Contact (if exists) */}
                        {(survey.sec_contact_person || survey.sec_contact_no || survey.sec_contact_email) && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-sm font-medium">
                                        <Smartphone className="h-4 w-4" />
                                        Secondary Contact
                                    </h4>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {survey.sec_contact_person && (
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                                                <p className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span>{survey.sec_contact_person}</span>
                                                </p>
                                            </div>
                                        )}

                                        {survey.sec_contact_no && (
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                                                <p className="flex items-center gap-2">
                                                    <PhoneCall className="h-4 w-4 text-gray-400" />
                                                    <span>{survey.sec_contact_no}</span>
                                                </p>
                                            </div>
                                        )}

                                        {survey.sec_contact_email && (
                                            <div className="space-y-1 md:col-span-2">
                                                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                                                <p className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    <span>{survey.sec_contact_email}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Timeline Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Timeline & Activity
                        </CardTitle>
                        <CardDescription>Request history and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6 space-y-4 md:grid-cols-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Request Created</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(survey.created_at)}</p>
                                    {/* <p className="mt-1 text-xs text-muted-foreground">Customer Code: {survey.customer_code}</p> */}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full">
                                    <Clock className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Last Updated</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(survey.updated_at)}</p>
                                </div>
                            </div>

                            {survey.survey_address_info && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full">
                                        <MapPin className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">Survey Address Info</p>
                                        <p className="text-sm text-muted-foreground">{survey.survey_address_info}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
