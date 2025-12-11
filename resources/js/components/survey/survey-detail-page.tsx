import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ServiceProvisionStatus } from '@/lib/status-map';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Gauge,
    Home,
    Info,
    Mail,
    MapPin,
    Network,
    Package,
    Phone,
    PhoneCall,
    Server,
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

const customerTypeMap = {
    residential: { label: 'Residential', icon: Home, color: 'bg-white text-blue-700 border border-blue-200' },
    business: { label: 'Business', icon: Building2, color: 'bg-white text-purple-700 border border-purple-800' },
    enterprise: { label: 'Enterprise', icon: Server, color: 'bg-white text-indigo-700 border border-indigo-800' },
};

interface SurveyDetailPageProps {
    survey: any;
    onBack?: () => void;
    showBackButton?: boolean;
    customerData?: any;
}

export default function SurveyDetailPage({ survey, onBack, showBackButton = true, customerData }: SurveyDetailPageProps) {
    console.log('🚀 ~ SurveyDetailPage ~ survey:', survey);

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

    const customerTypeInfo = customerTypeMap[survey.customer_type as keyof typeof customerTypeMap] || {
        label: survey.customer_type || 'Unknown',
        icon: User,
        color: 'bg-gray-100 text-gray-800 border border-gray-200',
    };
    const CustomerTypeIcon = customerTypeInfo.icon;

    const statusInfo = ServiceProvisionStatus[Number(survey.status)] || {
        label: 'Unknown',
        text: 'text-gray-700',
        bg: 'bg-gray-200',
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'PPpp');
        } catch {
            return dateString;
        }
    };

    // ACTIVE: [1, 3, 6, 11], // Processing, Waiting, Ready, Paid
    // PENDING: [0, 10], // Created, Pending Payment
    // COMPLETED: [4, 5, 9, 13], // Failed, Survey Completed, Cancelled, Refund
    // SUSPENDED: [2], // Suspended

    // const getStatusIcon = (status: number) => {
    //     if ([4, 5, 9, 13].includes(status)) return <CheckCircle className="h-4 w-4 text-primary" />;
    //     if ([1, 3, 6, 11].includes(status)) return <Clock className="h-8 w-30 text-orange-500" />;
    //     if ([0, 10].includes(status)) return <Clock className="h-4 w-4 text-blue-500" />;
    //     if ([2].includes(status)) return <AlertCircle className="h-4 w-4 text-red-500" />;
    //     return <Clock className="h-4 w-4 text-blue-500" />;
    // };
    const getStatusIcon = (status: number) => {
        if ([4, 5, 9, 13].includes(status))
            return (
                <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary" />
                </span>
            );

        if ([1, 3, 6, 11].includes(status))
            return (
                <span className="flex items-center">
                    <Clock className="h-4 w-4 text-orange-500" />
                </span>
            );

        if ([0, 10].includes(status))
            return (
                <span className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500" />
                </span>
            );

        if ([2].includes(status))
            return (
                <span className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                </span>
            );

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
                    {/* <p className="text-muted-foreground">
                        Order ID: <span className="font-semibold">{survey.customer_survey_order_id || 'N/A'}</span>
                    </p> */}
                </div>

                <p className="pr-2 text-muted-foreground">
                    Order ID: <span className="font-semibold">{survey.customer_survey_order_id || 'N/A'}</span>
                </p>
                {/* <div className="flex items-center gap-2">
                    <Badge className={`flex items-center gap-2 ${surveyTypeInfo.color}`}>
                        <SurveyTypeIcon className="h-3 w-3" />
                        {surveyTypeInfo.label}
                    </Badge>
                    <Badge variant="outline" className={`flex items-center gap-2 ${serviceType.bg} ${serviceType.text} ${serviceType.border}`}>
                        <IconComponent className="h-3 w-3" />
                        {serviceType.label}
                    </Badge>
                    <Badge className={`flex items-center gap-2 ${customerTypeInfo.color}`}>
                        <CustomerTypeIcon className="h-3 w-3" />
                        {customerTypeInfo.label}
                    </Badge>
                    <Badge
                        variant="default"
                        className="bg-opacity-10 flex items-center gap-2"
                        style={{
                            backgroundColor: `${statusInfo.bg.replace('bg-', '')}20`,
                            color: statusInfo.text.replace('text-', ''),
                        }}
                    >
                        {getStatusIcon(Number(survey.status))}
                        {statusInfo.label}
                    </Badge>
                </div> */}
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
                        {/* <CardDescription>Technical specifications and service details</CardDescription> */}
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

                            {/* Technical Specifications */}
                            {/* <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Customer Type</p>
                                    <div className="flex items-center gap-2">
                                        <CustomerTypeIcon className="h-4 w-4 text-blue-500" />
                                        <span>{customerTypeInfo.label}</span>
                                    </div>
                                </div>
                            </div> */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(Number(survey.status))}
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
                            {/* <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Main Offer ID</p>
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-4 w-4 text-gray-400" />
                                            <span className="font-mono">{survey.main_offer_id}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">External Operator ID</p>
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-gray-400" />
                                            <span className="font-mono">{survey.external_operid || '512'}</span>
                                        </div>
                                    </div>
                                    </div> */}
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
                            {/* <h4 className="flex items-center gap-2 text-sm font-medium">
                                <User className="h-4 w-4" />
                                Primary Contact
                            </h4> */}

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

                {/* Right Column - Status & Actions */}
                {/* <div className="space-y-6"> */}
                {/* Status Overview Card */}
                {/* <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Status Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-gray-50 p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-medium">Current Status</span>
                                    <Badge className={statusInfo.bg}>{statusInfo.label}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{getStatusDescription(Number(survey.status))}</p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Next Steps</p>
                                <ul className="space-y-2 text-sm">
                                    {getNextSteps(Number(survey.status)).map((step, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {survey.status === '3' && (
                                <div className="mt-4 rounded-lg bg-blue-50 p-3">
                                    <p className="mb-1 text-sm font-medium text-blue-800">Waiting Status</p>
                                    <p className="text-xs text-blue-700">
                                        Your request is in the waiting queue. You'll be notified when it's ready for payment.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card> */}

                {/* Quick Actions Card */}
                {/* <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {survey.status === '5' && (
                                <Button className="w-full" size="sm">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Proceed to Payment
                                </Button>
                            )}

                            <Button className="w-full" variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Download Request PDF
                            </Button>

                            <Button className="w-full" variant="outline" size="sm">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Contact Support
                            </Button>

                            {showBackButton && onBack && (
                                <Button className="w-full" variant="ghost" size="sm" onClick={onBack}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Services
                                </Button>
                            )}
                        </CardContent>
                    </Card> */}

                {/* Technical Details Card */}
                {/* <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Technical Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Order ID:</span>
                                <span className="font-mono font-medium">{survey.customer_survey_order_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Customer Code:</span>
                                <span className="font-mono">{survey.customer_code}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Survey Type:</span>
                                <span>{survey.survey_type}</span>
                            </div>
                            {survey.survey_address_info && (
                                <div className="border-t pt-2">
                                    <span className="text-muted-foreground">Address Info:</span>
                                    <p className="mt-1 text-xs">{survey.survey_address_info}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card> */}

                {/* Service Summary Card */}
                {/* <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Service Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">{serviceType.label}</span>
                            </div>
                            {survey.bandwidth && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Speed:</span>
                                    <span className="font-medium">{formatBandwidth(survey.bandwidth)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Customer:</span>
                                <span className="font-medium">{customerTypeInfo.label}</span>
                            </div>
                        </CardContent>
                    </Card> */}
                {/* </div> */}
            </div>
        </div>
    );
}

function getStatusDescription(status: number): string {
    const descriptions: { [key: number]: string } = {
        0: 'Your service request has been created and is awaiting initial processing by our technical team.',
        1: 'Your request is currently being processed by our technical team.',
        3: 'Your request is in the waiting list for technical survey and further processing.',
        5: 'Technical survey has been completed. You can now proceed with payment to activate the service.',
        9: 'This service request has been cancelled by the customer.',
        13: 'Payment has been refunded for this request.',
    };
    return descriptions[status] || 'Status information is not available.';
}

function getNextSteps(status: number): string[] {
    const steps: { [key: number]: string[] } = {
        0: ['Awaiting system processing', 'Technical team will review within 24 hours'],
        1: ['Processing by technical team', 'Survey team will contact you shortly'],
        3: ['In technical survey queue', 'Wait for survey completion notification'],
        5: ['Proceed to payment', 'Complete payment within 7 days to activate'],
        9: ['Request cancelled', 'Create new request if service is still needed'],
        13: ['Refund processed', 'Contact support for refund status'],
    };
    return steps[status] || ['Check back for updates', 'Contact support for assistance'];
}
