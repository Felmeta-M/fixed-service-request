import FormInput from '@/components/form-input';
import FormSelect from '@/components/form-select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
import { useRegions, useWoredas, useZones } from '@/hooks/use-regions';
import { useSurveyTypes } from '@/hooks/use-survey-types';
import CustomerLayout from '@/layouts/customer-layout';
import { Customer } from '@/types/customer';
import { useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Building,
    CheckCircle,
    Clock,
    FileText,
    Home,
    MapPin,
    MessageSquare,
    Package,
    Pencil,
    Phone,
    Plus,
    Trash,
    Wifi,
    XCircle,
} from 'lucide-react';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

function formatDateForBackend(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

const LocationMap = lazy(() => import('@/components/location-map'));

export default function Dashboard() {
    const { props } = usePage<{ customer: Customer; surveyRequests?: any[]; serviceRequests?: any[]; error?: any }>();

    const customer: Customer = props.customer;
    const surveyRequests = props.surveyRequests || [];
    const serviceRequests = props.serviceRequests || [];

    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState<{ type: 'survey' | 'service'; id: string } | null>(null);
    const [customerFeedback, setCustomerFeedback] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const { data, setData, processing } = useForm({
        // customer_code: customer.code || customer.id || '',
        survey_type: '',
        telecom_region: '',
        oper_type: 'A',
        main_offer_id: '',
        bandwidth: '',
        customer_type: '',
        // contact_person: customer.contact_person?.first_name || '',
        // contact_no: customer.contact?.mobile_no || '',
        // contact_email: customer.contact?.email || '',
        completed_date: '',
        external_operid: '',
        survey_address_info: {
            region_city: '',
            subcity_zone: '',
            wereda_town: '',
            kebele: '',
            // latitude: 0,
            // longitude: 0,
        },
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const { types, loading: loadingTypes, error: errorTypes } = useSurveyTypes();
    const { residentialOptions, enterpriseOptions, loading: loadingBandwidths, error: errorBandwidths } = useBandwidthOptions();

    const [location, setLocation] = useState({ latitude: 0, longitude: 0 });

    const { regions: regionOptions, loading: loadingRegions } = useRegions();
    const { zones: zoneOptions, loading: loadingZones } = useZones(data.survey_address_info?.region_city);
    const { woredas: woredaOptions, loading: loadingWoredas } = useWoredas(data.survey_address_info?.subcity_zone);

    useEffect(() => {
        setData((prev) => ({
            ...prev,
            survey_address_info: {
                ...prev.survey_address_info,
                latitude: location.latitude,
                longitude: location.longitude,
            },
        }));
    }, [location, setData]);

    const handleChange = (field: string, value: any) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleLocationSelect = (lat: number, lng: number, address: string) => {
        setData((prev) => ({
            ...prev,
            survey_address_info: {
                ...prev.survey_address_info,
                latitude: lat,
                longitude: lng,
                address: address || prev.survey_address_info.address,
            },
        }));
    };

    const handleNestedInputChange = (parent: string, field: string, value: string) => {
        setData((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value,
            },
        }));

        const errorKey = `${parent}.${field}`;
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[errorKey];
            return newErrors;
        });
    };

    // if (!props.customer) {
    //     return (
    //         <CustomerLayout>
    //             <div className="flex h-screen items-center justify-center">
    //                 <Loader2 className="h-8 w-8 animate-spin" />
    //                 <span className="ml-2">Loading customer data...</span>
    //             </div>
    //         </CustomerLayout>
    //     );
    // }
    if (props.error) {
        return (
            <CustomerLayout>
                <div className="container mx-auto p-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{props.error.message || 'Failed to load customer data'}</AlertDescription>
                    </Alert>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </CustomerLayout>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Waiting':
                return (
                    <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Waiting
                    </Badge>
                );
            case 'Completed':
                return (
                    <Badge variant="outline" className="border-blue-500 text-blue-700">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                    </Badge>
                );
            case 'Approved':
                return (
                    <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approved
                    </Badge>
                );
            case 'Cancelled':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Cancelled
                    </Badge>
                );
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getServiceIcon = (serviceType: string) => {
        switch (serviceType) {
            case 'voice':
                return <Phone className="h-4 w-4" />;
            case 'internet':
                return <Wifi className="h-4 w-4" />;
            case 'combo':
                return <Package className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formattedData = {
            ...data,
            completed_date: formatDateForBackend(data.completed_date),
        };

        console.log('formattedData', formattedData);
        setLoading(true);
        setErrors({});
        try {
            await createSurvey(formattedData);
            toast.success('Survey created successfully!');
        } catch (err: any) {
            setErrors(err?.response?.data?.errors || {});
            toast.error('Failed to create survey.');
        } finally {
            setLoading(false);
        }
    };

    const bandwidthOptions = residentialOptions || enterpriseOptions;

    return (
        <CustomerLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-6 py-6">
                    <span className="text-md text-gray-600">Welcome, Guest</span>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="mx-auto max-w-6xl">
                        {error && (
                            <Alert className="mb-6" variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="mb-6">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <AlertDescription>Survey request submitted successfully!</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-8 lg:grid-cols-2">
                            <div>
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">Survey Requests</h2>
                                    <Button onClick={() => setShowForm(!showForm)} className="cursor-pointer bg-primary hover:bg-green-500">
                                        {showForm ? (
                                            'Hide Form'
                                        ) : (
                                            <>
                                                <Plus className="mr-2 h-4 w-4" /> New Survey
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Survey List */}
                                <div className="space-y-4">
                                    {surveyRequests.length === 0 ? (
                                        <Card>
                                            <CardContent className="py-8 text-center">
                                                <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                <p className="text-gray-600">No survey requests yet</p>
                                                <p className="text-sm text-gray-500">Use the "New Survey" button above to get started</p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        surveyRequests.map((request: any) => (
                                            <Card key={request.id} className="overflow-hidden">
                                                <CardContent className="p-0">
                                                    <div className="flex items-center justify-between border-b bg-gray-50 p-4">
                                                        <div className="flex items-center gap-3">
                                                            <MapPin className="h-5 w-5 text-gray-500" />
                                                            <div>
                                                                <h3 className="font-semibold">#{request.transactionNumber}</h3>
                                                                <p className="text-xs text-gray-500">
                                                                    Created: {new Date(request.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div>{getStatusBadge(request.status)}</div>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="mb-4 grid gap-4 md:grid-cols-2">
                                                            <div>
                                                                <p className="text-sm font-medium">Name</p>
                                                                <p className="text-sm text-gray-600">{request.name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">Customer Type</p>
                                                                <Badge variant={request.customerType === 'enterprise' ? 'default' : 'secondary'}>
                                                                    {request.customerType === 'enterprise' ? (
                                                                        <Building className="mr-1 h-3 w-3" />
                                                                    ) : (
                                                                        <Home className="mr-1 h-3 w-3" />
                                                                    )}
                                                                    {request.customerType}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">Service Type</p>
                                                                <div className="flex items-center gap-1">
                                                                    {getServiceIcon(request.serviceDetails.serviceType)}
                                                                    <span className="text-sm text-gray-600 capitalize">
                                                                        {request.serviceDetails.serviceType}
                                                                        {request.serviceDetails.serviceType === 'internet' &&
                                                                            ` (${request.serviceDetails.internetBandwidth}Mbps)`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">Request Type</p>
                                                                <p className="text-sm text-gray-600 capitalize">
                                                                    {request.serviceDetails.requestType}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="mb-4">
                                                            <p className="text-sm font-medium">Address</p>
                                                            <p className="text-sm text-gray-600">{request.address}</p>
                                                        </div>
                                                        {/* Feedback, Pricing, Actions */}
                                                        <div className="flex justify-end gap-2 border-t pt-2">
                                                            <Button size="sm" variant="outline" onClick={() => setEditingId(request.id)}>
                                                                <Pencil className="mr-1 h-3 w-3" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    /* handle delete */
                                                                }}
                                                            >
                                                                <Trash className="mr-1 h-3 w-3" />
                                                                Delete
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setShowFeedbackModal({ type: 'survey', id: request.id })}
                                                            >
                                                                <MessageSquare className="mr-1 h-3 w-3" />
                                                                Add Feedback
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>

                                {/* Service Requests Section */}
                                <div>
                                    {serviceRequests.length > 0 && (
                                        <div>
                                            <h2 className="mb-6 text-xl font-semibold">Your Service Requests</h2>
                                            <div className="space-y-4">
                                                {serviceRequests.map((request: any) => (
                                                    <Card key={request.id} className="overflow-hidden">
                                                        <CardContent className="p-0">
                                                            <div className="flex items-center justify-between border-b bg-gray-50 p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <FileText className="h-5 w-5 text-gray-500" />
                                                                    <div>
                                                                        <h3 className="font-semibold">Survey: #{request.surveyReference}</h3>
                                                                        <p className="text-xs text-gray-500">
                                                                            Created: {new Date(request.createdAt).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div>{getStatusBadge(request.status)}</div>
                                                            </div>
                                                            <div className="p-4">
                                                                <div className="mb-4 grid gap-4 md:grid-cols-2">
                                                                    <div>
                                                                        <p className="text-sm font-medium">Customer Type</p>
                                                                        <p className="text-sm text-gray-600 capitalize">{request.customerType}</p>
                                                                    </div>
                                                                    {request.pricing && (
                                                                        <div>
                                                                            <p className="text-sm font-medium">Pricing</p>
                                                                            <p className="text-sm text-gray-600">
                                                                                Monthly: ETB {request.pricing.monthlyFee} | Setup: ETB{' '}
                                                                                {request.pricing.setupFee}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Feedback, Actions */}
                                                                <div className="flex justify-end gap-2 border-t pt-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => setShowFeedbackModal({ type: 'service', id: request.id })}
                                                                    >
                                                                        <MessageSquare className="mr-1 h-3 w-3" />
                                                                        Add Feedback
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Survey Form Section */}
                            <div>
                                {showForm && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <MapPin className="h-5 w-5" />
                                                {editingId ? 'Edit Survey Request' : 'New Survey Request'}
                                            </CardTitle>
                                            <CardDescription>
                                                Please provide your location details and service requirements to check availability in your area
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleSubmit} className="space-y-6">
                                                <div className="space-y-4">
                                                    <FormInput
                                                        id="customer_code"
                                                        label="Customer Code"
                                                        value={data.customer_code}
                                                        onChange={(e) => handleChange('customer_code', e.target.value)}
                                                        error={errors.customer_code}
                                                        placeholder="Enter customer code"
                                                        // disabled
                                                    />
                                                    <FormInput
                                                        label="Survey Type"
                                                        id="survey_type"
                                                        value={data.survey_type}
                                                        onChange={(e) => handleChange('survey_type', e.target.value)}
                                                        error={errors.survey_type}
                                                        placeholder="Enter survey type"
                                                    />
                                                    <FormInput
                                                        id="telecom_region"
                                                        label="Telecom Region"
                                                        value={data.telecom_region}
                                                        onChange={(e) => handleChange('telecom_region', e.target.value)}
                                                        error={errors.telecom_region}
                                                    />

                                                    <FormSelect
                                                        id="oper_type"
                                                        label="Operation Type"
                                                        value={data.oper_type}
                                                        onChange={(val) => handleChange('oper_type', val)}
                                                        options={[
                                                            { label: 'New', value: 'A' },
                                                            { label: 'Modify', value: 'M' },
                                                        ]}
                                                        error={errors.oper_type}
                                                        placeholder="Select operation type"
                                                    />

                                                    <FormInput
                                                        id="main_offer_id"
                                                        label="Main Offer ID"
                                                        value={data.main_offer_id}
                                                        onChange={(e) => handleChange('main_offer_id', e.target.value)}
                                                        error={errors.main_offer_id}
                                                    />

                                                    <FormSelect
                                                        id="bandwidth"
                                                        label="Bandwidth"
                                                        value={data.bandwidth}
                                                        onChange={(val) => handleChange('bandwidth', val)}
                                                        options={bandwidthOptions}
                                                        error={errors.bandwidth}
                                                        loading={loadingBandwidths}
                                                        placeholder="Select bandwidth"
                                                    />
                                                    <FormInput
                                                        id="contact_person"
                                                        label="Contact Person"
                                                        value={data.contact_person}
                                                        onChange={(e) => handleChange('contact_person', e.target.value)}
                                                        error={errors.contact_person}
                                                    />

                                                    <FormInput
                                                        id="contact_no"
                                                        label="Contact No"
                                                        value={data.contact_no}
                                                        onChange={(e) => handleChange('contact_no', e.target.value)}
                                                        error={errors.contact_no}
                                                    />

                                                    <FormInput
                                                        id="contact_email"
                                                        label="Contact Email"
                                                        type="email"
                                                        value={data.contact_email}
                                                        onChange={(e) => handleChange('contact_email', e.target.value)}
                                                        error={errors.contact_email}
                                                    />

                                                    <FormInput
                                                        id="completed_date"
                                                        label="Completed Date"
                                                        type="date"
                                                        value={data.completed_date}
                                                        onChange={(e) => handleChange('completed_date', e.target.value)}
                                                        error={errors.completed_date}
                                                    />

                                                    <div className="space-y-2">
                                                        <Label htmlFor="address">Address *</Label>
                                                        <FormSelect
                                                            label="Region"
                                                            id="address.region"
                                                            value={data.survey_address_info?.region_city}
                                                            onChange={(val) => {
                                                                setData((prev) => ({
                                                                    ...prev,
                                                                    survey_address_info: {
                                                                        ...prev.survey_address_info,
                                                                        region_city: val,
                                                                        subcity_zone: '',
                                                                        wereda_town: '',
                                                                    },
                                                                }));
                                                            }}
                                                            options={regionOptions}
                                                            placeholder={loadingRegions ? 'Loading regions...' : 'Select region'}
                                                            error={formErrors['address.region']}
                                                        />
                                                        <FormSelect
                                                            label="Zone"
                                                            id="address.zone"
                                                            value={data.survey_address_info?.subcity_zone}
                                                            onChange={(val) => {
                                                                setData((prev) => ({
                                                                    ...prev,
                                                                    survey_address_info: {
                                                                        ...prev.survey_address_info,
                                                                        subcity_zone: val,
                                                                        wereda_town: '',
                                                                    },
                                                                }));
                                                            }}
                                                            options={data.survey_address_info?.region_city ? zoneOptions : []}
                                                            placeholder={
                                                                data.survey_address_info?.region_city
                                                                    ? loadingZones
                                                                        ? 'Loading zones...'
                                                                        : 'Select zone'
                                                                    : 'First select region'
                                                            }
                                                            error={formErrors['address.zone']}
                                                        />
                                                        <FormSelect
                                                            label="Woreda"
                                                            id="address.woreda"
                                                            value={data.survey_address_info?.wereda_town}
                                                            onChange={(val) => {
                                                                setData((prev) => ({
                                                                    ...prev,
                                                                    survey_address_info: {
                                                                        ...prev.survey_address_info,
                                                                        wereda_town: val,
                                                                    },
                                                                }));
                                                                // clearFieldError('address.woreda');
                                                            }}
                                                            options={data.survey_address_info?.subcity_zone ? woredaOptions : []}
                                                            placeholder={
                                                                data.survey_address_info?.subcity_zone
                                                                    ? loadingWoredas
                                                                        ? 'Loading woredas...'
                                                                        : 'Select woreda'
                                                                    : 'First select zone'
                                                            }
                                                            error={formErrors['address.woreda']}
                                                        />
                                                        <FormInput
                                                            label="Kebele"
                                                            id="survey_address_info.kebele"
                                                            value={data.survey_address_info?.kebele}
                                                            onChange={(e) => handleNestedInputChange('survey_address_info', 'kebele', e.target.value)}
                                                            placeholder="Enter kebele"
                                                            error={formErrors['survey_address_info.kebele']}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="address">Address *</Label>
                                                                <Textarea
                                                                    id="address"
                                                                    value={data.address || ''}
                                                                    onChange={(e) =>
                                                                        setData((prev) => ({
                                                                            ...prev,
                                                                            address: e.target.value,
                                                                        }))
                                                                    }
                                                                    placeholder="Enter your complete address"
                                                                    // required
                                                                />
                                                            </div>
                                                            <Label htmlFor="latitude">Latitude</Label>
                                                            <Input
                                                                id="latitude"
                                                                type="number"
                                                                step="any"
                                                                value={data.survey_address_info?.latitude || ''}
                                                                onChange={(e) =>
                                                                    setData((prev) => ({
                                                                        ...prev,
                                                                        survey_address_info: {
                                                                            ...prev.survey_address_info,
                                                                            latitude: Number.parseFloat(e.target.value) || 0,
                                                                        },
                                                                    }))
                                                                }
                                                                placeholder="9.000000"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="longitude">Longitude</Label>
                                                            <Input
                                                                id="longitude"
                                                                type="number"
                                                                step="any"
                                                                value={data.survey_address_info?.longitude || ''}
                                                                onChange={(e) =>
                                                                    setData((prev) => ({
                                                                        ...prev,
                                                                        survey_address_info: {
                                                                            ...prev.survey_address_info,
                                                                            longitude: Number.parseFloat(e.target.value) || 0,
                                                                        },
                                                                    }))
                                                                }
                                                                placeholder="38.000000"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h2>Location Selection</h2>
                                                        <div>
                                                            <Label className="text-base font-semibold">Select Location on Map *</Label>
                                                            <p className="mb-4 text-sm text-gray-600">
                                                                Click on the map to select your exact location.
                                                            </p>
                                                            <Suspense
                                                                fallback={
                                                                    <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100">
                                                                        Loading map...
                                                                    </div>
                                                                }
                                                            >
                                                                <LocationMap
                                                                    onLocationSelect={handleLocationSelect}
                                                                    initialLat={data.survey_address_info?.latitude || 9.0192}
                                                                    initialLng={data.survey_address_info?.longitude || 38.7525}
                                                                />
                                                            </Suspense>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="notes">Additional Notes</Label>
                                                        <Textarea
                                                            id="notes"
                                                            value={data.telecom_region}
                                                            onChange={(e) => setData((prev) => ({ ...prev, telecom_region: e.target.value }))}
                                                            placeholder="Any additional information"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-4 border-t pt-6">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowForm(false);
                                                            setEditingId(null);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                                                        {loading ? 'Submitting...' : editingId ? 'Update Survey' : 'Submit Survey'}
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Add Your Feedback</CardTitle>
                            <CardDescription>
                                Share your experience with this {showFeedbackModal.type === 'survey' ? 'survey' : 'service request'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerFeedback">Your Feedback</Label>
                                <Textarea
                                    id="customerFeedback"
                                    value={customerFeedback}
                                    onChange={(e) => setCustomerFeedback(e.target.value)}
                                    placeholder="Share your thoughts, suggestions, or concerns..."
                                    rows={4}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        /* handle feedback submit */
                                    }}
                                    className="flex-1"
                                    disabled={!customerFeedback.trim()}
                                >
                                    Submit Feedback
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowFeedbackModal(null);
                                        setCustomerFeedback('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            <div></div>
        </CustomerLayout>
    );
}

async function createSurvey(data: any) {
    const res = await fetch('http://localhost:8000/api/survey/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
}
