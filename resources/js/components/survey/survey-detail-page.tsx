import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStatusInfo } from '@/lib/status-map';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertCircle,
    ArrowLeft,
    FileText,
    Gauge,
    MapPin,
    Package,
    Phone,
    User,
    Wifi,
} from 'lucide-react';
import SurveyActions from './survey-actions';

const typeMap = {
    '1457567289': {
        label: 'Internet',
        icon: Wifi,
        description: 'Internet Service',
    },
    '1207609454': {
        label: 'Voice',
        icon: Phone,
        description: 'Voice/Telephony Service',
    },
    '180427974': {
        label: 'Combo',
        icon: Package,
        description: 'Internet + Voice Combo Service',
    },
};

const surveyTypeMap = {
    EIC08: {
        label: 'New Connection',
        description: 'New Internet Connection Request',
    },
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
    // Backend-provided action flags (single source of truth)
    is_paid?: boolean;
    can_pay?: boolean;
    can_subscribe?: boolean;
    can_change_offer?: boolean;
    can_cancel?: boolean;
    payment?: {
        total_amount?: string | number;
        merch_order_id?: string | null;
    };
    [key: string]: unknown;
}

interface SurveyDetailPageProps {
    survey: SurveyDetail | null;
    onBack?: () => void;
    showBackButton?: boolean;
    customerData?: unknown;
    onSurveyUpdate?: () => void;
}

export default function SurveyDetailPage({ survey, onBack, showBackButton = true, onSurveyUpdate }: SurveyDetailPageProps) {
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
        icon: FileText,
        description: 'Unknown Service Type',
    };

    const surveyTypeInfo = surveyTypeMap[survey.survey_type as keyof typeof surveyTypeMap] || {
        label: survey.survey_type || 'Survey',
        description: 'Service Request',
    };

    const statusInfo = getStatusInfo(survey.status);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'PPpp');
        } catch {
            return dateString;
        }
    };

    const formatBandwidth = (bandwidth?: string | null) => {
        if (!bandwidth) return 'N/A';
        if (bandwidth.endsWith('M')) {
            const mbps = parseInt(bandwidth);
            if (mbps >= 1000) {
                return `${(mbps / 1000).toFixed(1)} Gbps`;
            }
            return `${mbps} Mbps`;
        }
        return bandwidth;
    };

    const getStatusBadgeVariant = (status?: string | number | null) => {
        const statusStr = String(status ?? '');
        if (['Survey Completed', 'Order Completed', 'Paid', 'Ready'].includes(statusStr)) {
            return 'default';
        }
        if (['Failed', 'Cancelled', 'Suspended'].includes(statusStr)) {
            return 'destructive';
        }
        return 'secondary';
    };

    const hasSecondaryContact = survey.sec_contact_person || survey.sec_contact_no || survey.sec_contact_email;

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {showBackButton && onBack && (
                        <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    )}
                    <p className="text-muted-foreground">
                        Survey Number: {survey.customer_survey_order_id || 'N/A'}
                    </p>
                </div>
            </div>

            {/* Header Card with Status and Actions */}
            <Card className="border-none shadow-xs">
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div>
                                <CardTitle className="text-lg">{serviceType.label} Service</CardTitle>
                                <CardDescription>{surveyTypeInfo.label} Request</CardDescription>
                            </div>
                            <Badge variant={getStatusBadgeVariant(survey.status) as 'default' | 'secondary' | 'destructive'}>
                                {statusInfo.label}
                            </Badge>
                        </div>
                        {/* Actions - consistent with table actions */}
                        <SurveyActions
                            survey={survey}
                            onActionComplete={() => onSurveyUpdate?.()}
                            onUpdatingChange={() => { }}
                        />
                    </div>
                </CardHeader>
            </Card>

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Service Information */}
                <Card className="border-none shadow-xs">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Gauge className="h-4 w-4" />
                            Service Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <label className="text-sm text-muted-foreground">Service Type</label>
                            <p className="font-medium">{serviceType.label}</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Request Type</label>
                            <p className="font-medium">{surveyTypeInfo.label}</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Bandwidth</label>
                            <p className="font-medium">{formatBandwidth(survey.bandwidth)}</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Service Number</label>
                            <p className="font-medium">
                                {survey.service_number || (
                                    <span className="text-muted-foreground">Awaiting assignment</span>
                                )}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Device Included</label>
                            <p className="font-medium">{survey.with_device ? 'Yes' : 'No'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Information */}
                <Card className="border-none shadow-xs">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4" />
                            Order Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <label className="text-sm text-muted-foreground">Survey Number</label>
                            <p className="font-mono font-medium">{survey.customer_survey_order_id || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Order Number</label>
                            {survey.customer_subscription_order_id ? (
                                <Link
                                    href={`/services/${survey.customer_subscription_order_id}?customer_subscription_order_id=${survey.customer_subscription_order_id}`}
                                    className="block font-mono font-medium text-primary hover:underline"
                                >
                                    {survey.customer_subscription_order_id}
                                </Link>
                            ) : (
                                <p className="font-medium text-muted-foreground">Not yet created</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Created Date</label>
                            <p className="font-medium">{formatDate(survey.created_at)}</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Last Updated</label>
                            <p className="font-medium">{formatDate(survey.updated_at)}</p>
                        </div>
                        {survey.subscribed_at && (
                            <div>
                                <label className="text-sm text-muted-foreground">Subscribed Date</label>
                                <p className="font-medium">{formatDate(survey.subscribed_at)}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="border-none shadow-xs">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4" />
                            Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <label className="text-sm text-muted-foreground">Contact Person</label>
                            <p className="font-medium">{survey.contact_person || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Phone Number</label>
                            <p className="font-medium">{survey.contact_no || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Email Address</label>
                            <p className="font-medium">{survey.contact_email || 'N/A'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Secondary Contact (if exists) */}
                {hasSecondaryContact && (
                    <Card className="border-none shadow-xs">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Phone className="h-4 w-4" />
                                Secondary Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {survey.sec_contact_person && (
                                <div>
                                    <label className="text-sm text-muted-foreground">Contact Person</label>
                                    <p className="font-medium">{survey.sec_contact_person}</p>
                                </div>
                            )}
                            {survey.sec_contact_no && (
                                <div>
                                    <label className="text-sm text-muted-foreground">Phone Number</label>
                                    <p className="font-medium">{survey.sec_contact_no}</p>
                                </div>
                            )}
                            {survey.sec_contact_email && (
                                <div>
                                    <label className="text-sm text-muted-foreground">Email Address</label>
                                    <p className="font-medium">{survey.sec_contact_email}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Location (if address info exists) */}
                {survey.survey_address_info && (
                    <Card className="border-none shadow-xs">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4" />
                                Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <label className="text-sm text-muted-foreground">Installation Address</label>
                                <p className="font-medium">{survey.survey_address_info}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
