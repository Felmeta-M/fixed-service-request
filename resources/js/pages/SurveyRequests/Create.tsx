import LocationMap from '@/components/location-map';
import { BandwidthSelector } from '@/components/survey/bandwidth-selector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
import AuthLayout from '@/layouts/AuthLayout';
import { formatCoordinate, formatCoordinatesForAPI, parseCoordinate } from '@/lib/coordinate-utils';
import { useResourceChecker } from '@/lib/resource-check';
import { SurveyRequest, SurveyRequestFormValues } from '@/types/survey';
import { Link, router, useForm } from '@inertiajs/react';
import { useCreateSurvey } from '@/hooks/use-api-mutations';
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    FileText,
    Loader2,
    MapPin,
    Navigation,
    Package,
    Phone,
    Search,
    Wifi
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

export default function Create() {
    const isAuthenticated = true;

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const createSurveyMutation = useCreateSurvey();
    const [locationError, setLocationError] = useState('');
    const [locationOption, setLocationOption] = useState<string | null>('current');
    const [showLocationOptions, setShowLocationOptions] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
    const [, setMapCenter] = useState<[number, number]>([9.0054, 38.7636]);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [selectedBandwidth, setSelectedBandwidth] = useState('');
    const [bandwidthNumericValue, setBandwidthNumericValue] = useState(0);

    // Enhanced resource check states
    const [resourceAvailable, setResourceAvailable] = useState<boolean | undefined>(undefined);
    const [checkingResource, setCheckingResource] = useState(false);
    const [resourceMessage, setResourceMessage] = useState('');
    const [resourceData, setResourceData] = useState<any>(null);

    const [hasValidLocation, setHasValidLocation] = useState(false);
    const { checkResourceAvailability } = useResourceChecker();


    const { data, setData } = useForm<SurveyRequestFormValues>('createSurvey', {
        customer_code: '',
        survey_type: 'EIC08',
        telecom_region: '104',
        oper_type: 'A',
        main_offer_id: '1457567289',
        survey_address_info: {
            region_city: '2',
            subcity_zone: '11',
            wereda_town: '141',
            kebele: '',
            latitude: 0,
            longitude: 0,
            address: '',
        },
        bandwidth: '',
        contact_person: 'Loading...',
        contact_no: 'Loading...',
        contact_email: 'Loading...',
        external_operid: '512',
        customer_type: '',
    });

    const serviceOptions = [
        {
            id: '1457567289',
            name: 'Fixed Broadband',
            description: 'High-speed internet connection',
            icon: Wifi,
            recommended: true,
        },
        {
            id: '1207609454',
            name: 'Fixed Voice',
            description: 'Telephone service with reliable connectivity',
            icon: Phone,
        },
        {
            id: '1207609454',
            name: 'Combo Services',
            description: 'Bundle of internet and voice services (only for residential)',
            icon: Package,
        },
    ];

    // Enhanced location method options with better styling
    const locationMethods = [
        {
            id: 'current',
            name: 'Current Location',
            description: 'Automatically detect your GPS location',
            icon: MapPin,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
        },
        {
            id: 'other',
            name: 'Map Selection',
            description: 'Search and select location on interactive map',
            icon: Search,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
        },
        {
            id: 'manual',
            name: 'Manual Coordinates',
            description: 'Enter latitude and longitude coordinates',
            icon: Navigation,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
        },
    ];

    // Fetch user data from localStorage and prefill form
    useEffect(() => {
        const fetchUserDataFromLocalStorage = () => {
            try {
                let contactPerson = 'Customer';
                let contactNo = '';
                let contactEmail = 'john@gmail.com';
                let customerCode = '828204303';

                const kycDataString = localStorage.getItem('kycData');
                if (kycDataString) {
                    try {
                        const kycData = JSON.parse(kycDataString);
                        contactPerson = kycData.identity?.name?.eng || 'Customer';
                        contactNo = kycData.identity?.phone || '';
                        contactEmail = kycData.email || 'customer@ethiotelecom.et';
                        customerCode = kycData.customer_data.customer.code;
                    } catch (e) {
                        console.error('Error parsing KYC data:', e);
                    }
                }

                const customerDataString = localStorage.getItem('activeCustomer');
                if (customerDataString && (!contactNo || contactNo === 'Loading...')) {
                    try {
                        const customerData = JSON.parse(customerDataString);
                        if (customerData.contacts && customerData.contacts.length > 0) {
                            contactPerson = `${customerData.contacts[0].name1 || ''} ${customerData.contacts[0].name2 || ''}`.trim() || contactPerson;
                            contactNo = customerData.contacts[0].mobile || contactNo;
                            contactEmail = customerData.contacts[0].email || contactEmail;
                        }
                        if (customerData.customer) {
                            const customer = customerData.customer;
                            contactPerson =
                                `${customer.first_name || ''} ${customer.middle_name || ''} ${customer.last_name || ''}`.trim() || contactPerson;
                            customerCode = customer.code || customerCode;
                            contactEmail = customer.email || contactEmail;
                            customerCode = customer.code;
                        }
                    } catch (e) {
                        console.error('Error parsing customer data:', e);
                    }
                }

                setData((prev) => ({
                    ...prev,
                    customer_code: customerCode,
                    contact_person: contactPerson,
                    contact_no: contactNo,
                    contact_email: contactEmail,
                }));
            } catch (error) {
                console.error('Failed to fetch user data from localStorage:', error);
                setData((prev) => ({
                    ...prev,
                    customer_code: '828204303',
                    contact_person: 'Customer',
                    contact_no: '',
                    contact_email: 'customer@ethiotelecom.et',
                }));
            }
        };

        fetchUserDataFromLocalStorage();
    }, [setData]);

    const { residentialOptions, enterpriseOptions, loading: loadingBandwidths, error: errorBandwidths } = useBandwidthOptions();

    useEffect(() => {
        const hasCoords = data.survey_address_info.latitude !== 0 && data.survey_address_info.longitude !== 0;
        const hasContact = data.contact_person && data.contact_person !== 'Loading...';

        setHasValidLocation(hasCoords);

        if (hasCoords && hasContact && selectedLocation) {
            const [lat, lng] = selectedLocation;
            const timeoutId = setTimeout(() => {
                checkResourceForLocation(lat, lng);
            }, 500);
            return () => clearTimeout(timeoutId);
        } else {
            setResourceAvailable(undefined);
        }
    }, [selectedLocation, data.contact_person, data.survey_address_info.latitude, data.survey_address_info.longitude]);

    const handleChange = (field: keyof SurveyRequest, value: any) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleNestedInputChange = (parent: keyof SurveyRequest, field: string, value: string) => {
        let processedValue: any = value;

        if (field === 'latitude' || field === 'longitude') {
            if (value === '' || value === '-') {
                processedValue = value;
            } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    processedValue = numValue;
                } else {
                    processedValue = 0;
                }
            }
        }

        setData((prev) => ({
            ...prev,
            [parent]: {
                ...(prev[parent] as any),
                [field]: processedValue,
            },
        }));

        const errorKey = `${parent}.${field}`;
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[errorKey];
            return newErrors;
        });
    };

    const handleLocationSelect = (lat: number, lng: number, address: string) => {
        setSelectedLocation([lat, lng]);
        setMapCenter([lat, lng]);
        setHasValidLocation(true);

        setData((prev) => ({
            ...prev,
            survey_address_info: {
                ...prev.survey_address_info,
                latitude: lat,
                longitude: lng,
                address: address || prev.survey_address_info.address,
            },
        }));
        setResourceAvailable(undefined);
        setResourceMessage('');
        setResourceData(null);
    };

    const getCurrentLocation = async () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser');
            return;
        }

        setLocationLoading(true);
        setLocationError('');
        setIsGettingLocation(true);
        setResourceAvailable(undefined);
        setResourceData(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const preciseLat = parseFloat(latitude.toFixed(6));
                const preciseLng = parseFloat(longitude.toFixed(6));

                handleLocationSelect(preciseLat, preciseLng, '');
                setSelectedLocation([latitude, longitude]);
                setMapCenter([latitude, longitude]);

                setData((prev) => ({
                    ...prev,
                    survey_address_info: {
                        ...prev.survey_address_info,
                        latitude,
                        longitude,
                    },
                }));

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                    );

                    if (response.ok) {
                        const data = await response.json();
                        if (data.address) {
                            const address = data.address;
                            setData((prev) => ({
                                ...prev,
                                survey_address_info: {
                                    ...prev.survey_address_info,
                                    region_city: '2',
                                    subcity_zone: address.zone || '11',
                                    wereda_town: address.wereda || '141',
                                    kebele: address.kebele || '',
                                    address: data.display_name || '',
                                },
                            }));
                        }
                    }
                } catch (err) {
                    console.error('Geocoding failed:', err);
                    setLocationError('Location detected but failed to get address details');
                }

                setLocationLoading(false);
                setIsGettingLocation(false);
            },
            (error) => {
                setLocationError('Failed to get your location. Please check your browser permissions.');
                setLocationLoading(false);
                setIsGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000,
            },
        );
    };

    const handleLocationMethodChange = (methodId: string) => {
        if (locationOption === methodId) return;

        setLocationOption(methodId);
        setLocationError('');

        if (methodId !== 'manual') {
            setData((prev) => ({
                ...prev,
                survey_address_info: {
                    ...prev.survey_address_info,
                    latitude: 0,
                    longitude: 0,
                },
            }));
            setSelectedLocation(null);
            setHasValidLocation(false);
        }
    };

    const handleManualCoordinateCheck = async () => {
        let lat = data.survey_address_info.latitude;
        let lng = data.survey_address_info.longitude;

        if (typeof lat === 'string') {
            lat = parseCoordinate(lat);
        }
        if (typeof lng === 'string') {
            lng = parseCoordinate(lng);
        }

        if (!lat || !lng) {
            setHasValidLocation(false);
            setLocationError('Please enter both latitude and longitude');
            return;
        }

        if (lat < -90 || lat > 90) {
            setHasValidLocation(false);
            setLocationError('Latitude must be between -90 and 90');
            return;
        }

        if (lng < -180 || lng > 180) {
            setHasValidLocation(false);
            setLocationError('Longitude must be between -180 and 180');
            return;
        }

        const preciseLat = parseFloat(lat.toFixed(6));
        const preciseLng = parseFloat(lng.toFixed(6));

        setData((prev) => ({
            ...prev,
            survey_address_info: {
                ...prev.survey_address_info,
                latitude: preciseLat,
                longitude: preciseLng,
            },
        }));

        setSelectedLocation([preciseLat, preciseLng]);
        setMapCenter([preciseLat, preciseLng]);
        setLocationError('');
        setHasValidLocation(true);

        setLocationError(`✓ Coordinates set to: ${formatCoordinate(preciseLat)}, ${formatCoordinate(preciseLng)}`);

        setTimeout(() => {
            setLocationError('');
        }, 3000);

        await checkResourceForLocation(preciseLat, preciseLng);
    };

    const validateCoordinateInput = (value: number | string, type: 'lat' | 'lng'): string => {
        if (!value && value !== 0) return '';

        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return 'Invalid number';

        if (type === 'lat' && (num < -90 || num > 90)) return 'Must be between -90 and 90';
        if (type === 'lng' && (num < -180 || num > 180)) return 'Must be between -180 and 180';

        return '';
    };

    const checkResourceForLocation = async (lat: number, lng: number) => {
        if (!data.contact_person || data.contact_person === 'Loading...') {
            return;
        }

        setCheckingResource(true);
        setResourceAvailable(undefined);
        setResourceMessage('');
        setResourceData(null);

        try {
            const result = await checkResourceAvailability(
                {
                    latitude: lat,
                    longitude: lng,
                },
                data.contact_person,
            );

            setResourceAvailable(result.available);
            setResourceMessage(result.message || '');
            setResourceData(result.data);

            if (!result.available) {
                setError(result.message || 'Resource not available in this location');
            } else {
                setError('');
            }
        } catch (error) {
            setResourceAvailable(false);
            setResourceMessage('Failed to check resource availability');
            setError('Failed to check resource availability');
            console.error('Resource check error:', error);
        } finally {
            setCheckingResource(false);
        }
    };


    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!data.customer_code) newErrors.customer_code = 'Customer code is required';
        if (!data.telecom_region) newErrors.telecom_region = 'Telecom region is required';
        if (!data.main_offer_id) newErrors.main_offer_id = 'Service type is required';

        if (data.survey_address_info.latitude === 0 || data.survey_address_info.longitude === 0) {
            newErrors['survey_address_info.location'] = 'Please select a valid location';
        }

        if (resourceAvailable === false) {
            newErrors['resource'] = 'Resource not available in selected location';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitOrder = async () => {
        if (!isAuthenticated) {
            router.visit('/otp/phone');
            return;
        }

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const formatDate = (dateString: Date) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return (
                    date.getFullYear().toString() +
                    (date.getMonth() + 1).toString().padStart(2, '0') +
                    date.getDate().toString().padStart(2, '0') +
                    date.getHours().toString().padStart(2, '0') +
                    date.getMinutes().toString().padStart(2, '0') +
                    date.getSeconds().toString().padStart(2, '0')
                );
            };
            const formattedCoords = formatCoordinatesForAPI(data.survey_address_info.latitude, data.survey_address_info.longitude);

            const submitData = {
                customer_code: data.customer_code,
                survey_type: data.survey_type,
                telecom_region: data.telecom_region,
                oper_type: data.oper_type,
                main_offer_id: data.main_offer_id,
                survey_address_info: {
                    region_city: data.survey_address_info.region_city,
                    subcity_zone: data.survey_address_info.subcity_zone,
                    wereda_town: data.survey_address_info.wereda_town,
                    kebele: data.survey_address_info.kebele,
                    latitude: formattedCoords.latitude,
                    longitude: formattedCoords.longitude,
                    address: data.survey_address_info.address || '',
                },
                bandwidth: '2048M',
                contact_person: data.contact_person,
                contact_no: data.contact_no,
                contact_email: data.contact_email,
                completed_date: formatDate(data.completed_date),
                external_operid: data.external_operid,
            };

            // Store the survey in local storage
            const newSurvey = {
                id: Date.now(),
                type: getServiceName(data.main_offer_id),
                status: 'approved',
                createdAt: new Date().toISOString(),
                customerCode: data.customer_code,
                surveyType: getSurveyType(data.survey_type),
                main_offer_id: data.main_offer_id,
            };

            createSurveyMutation.mutate(submitData, {
                onSuccess: (response) => {
                    const responseData = response.data;

                    if (responseData?.survey_id) {
                        const newSurvey = {
                            id: responseData.survey_id || Date.now(),
                            type: getServiceName(data.main_offer_id),
                            status: 'waiting',
                            createdAt: new Date().toISOString(),
                            customerCode: data.customer_code,
                            surveyType: getSurveyType(data.survey_type),
                            main_offer_id: data.main_offer_id,
                        };

                        const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
                        existingSurveys.push(newSurvey);
                        localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));
                    }

                    setLoading(false);
                    router.visit('/dashboard');
                },
                onError: (err: Error) => {
                    setError(err.message || 'Failed to create order');
                    setLoading(false);
                },
            });
        } catch (e) {
            setError('An error occurred while creating the order');
            setLoading(false);
        }
    };

    const getServiceIcon = (serviceType: string) => {
        switch (serviceType) {
            case '1457567289':
                return Wifi;
            case '1207609454':
                return Phone;
            case '1122464948':
                return Package;
            default:
                return Wifi;
        }
    };

    const getServiceName = (serviceType: string) => {
        switch (serviceType) {
            case '1457567289':
                return 'Fixed Broadband';
            case '1207609454':
                return 'Fixed Voice';
            case '1122464948':
                return 'Combo Services';
            default:
                return 'Survey';
        }
    };

    const getSurveyType = (surveyType: string) => {
        switch (surveyType) {
            case '1':
                return 'Survey for New connection';
            case '2':
                return 'Survey for Change primary offer';
            case '3':
                return 'Survey for Upgrade';
            case '4':
                return 'Survey for Downgrade';
            case '5':
                return 'Survey for Shifting(within or across site)';
            case '6':
                return 'Survey for Reconnection';
            case '7':
                return 'Survey for Change Offering Attribute';
            case '8':
                return 'Survey for Change Copper to Fiber';
            default:
                return 'Survey';
        }
    };

    const getSubmitButtonText = (): string => {
        if (loading) return 'Submitting...';
        if (checkingResource) return 'Checking Availability...';
        if (!hasValidLocation) return 'Select Location First';
        if (resourceAvailable === undefined) return 'Check Resource Availability';
        if (resourceAvailable === false) return 'Resource Not Available';
        return 'Submit Survey';
    };

    const isSubmitDisabled = (): boolean => {
        return loading || checkingResource || !hasValidLocation || resourceAvailable === false || resourceAvailable === undefined;
    };

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Sign In Required</CardTitle>
                        <CardDescription>Please sign in to place a survey order</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Link href="/auth/signin">
                            <Button className="w-full">Sign In</Button>
                        </Link>
                        <p className="mt-4 text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link href="/auth/register" className="text-primary hover:opacity-90">
                                Register here
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getCurrentMethod = () => locationMethods.find((method) => method.id === locationOption);

    return (
        <AuthLayout>
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-6">
                                <div className="flex items-center space-x-4">
                                    <Link href="/dashboard" className="flex items-center space-x-2 text-primary transition-colors hover:opacity-90">
                                        <ArrowLeft className="h-4 w-4" />
                                        <span className="font-medium">Back to Dashboard</span>
                                    </Link>
                                    <div className="h-6 w-px bg-gray-300"></div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-gray-900">Create Survey Order</CardTitle>
                                        <CardDescription className="mt-1 text-gray-600">
                                            Complete all fields to submit your <span className="font-semibold">survey</span> order
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-8 pt-8">
                                {/* Service Type Selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Wifi className="h-5 w-5 text-primary" />
                                        <Label className="text-lg font-semibold text-gray-900">Service Type *</Label>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {serviceOptions.map((service) => {
                                            const IconComponent = service.icon;
                                            const isSelected = data.main_offer_id === service.id;

                                            return (
                                                <div
                                                    key={service.id}
                                                    onClick={() => handleChange('main_offer_id', service.id)}
                                                    className={`cursor-pointer rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md ${isSelected
                                                        ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-md'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div
                                                            className={`rounded-lg p-2 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                        >
                                                            <IconComponent className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className={`font-semibold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                                                {service.name}
                                                            </h3>
                                                            <p className="mt-1 text-sm text-gray-600">{service.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between">
                                                        {service.recommended && (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Recommended</Badge>
                                                        )}
                                                        {isSelected && (
                                                            <div className="flex items-center space-x-1 text-primary">
                                                                <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                                <span className="text-xs font-medium">Selected</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {formErrors.serviceType && <p className="mt-2 text-sm text-red-600">{formErrors.serviceType}</p>}
                                </div>

                                {data.main_offer_id === '1457567289' && (
                                    <BandwidthSelector
                                        residentialOptions={residentialOptions}
                                        enterpriseOptions={enterpriseOptions}
                                        loading={loadingBandwidths}
                                        selectedBandwidth={selectedBandwidth}
                                        onBandwidthChange={(value, numericValue, type) => {
                                            setSelectedBandwidth(value);
                                            setBandwidthNumericValue(numericValue);
                                            setData('customer_type', type);
                                            handleChange('bandwidth', numericValue.toString());
                                        }}
                                        error={formErrors.bandwidth}
                                    />
                                )}

                                {/* Enhanced Location Selection */}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <Label className="text-lg font-semibold text-gray-900">Installation Address</Label>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-md font-medium text-gray-700">Choose Location Method *</Label>

                                        {/* Current Selected Method */}
                                        {locationOption && (
                                            <div className="mb-6">
                                                <div
                                                    className={`rounded-xl border-2 p-4 shadow-sm transition-all duration-200 ${getCurrentMethod()?.borderColor} ${getCurrentMethod()?.bgColor}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4">
                                                            <div className={`rounded-lg p-2 ${getCurrentMethod()?.bgColor}`}>
                                                                {(() => {
                                                                    const IconComponent = getCurrentMethod()?.icon || MapPin;
                                                                    return <IconComponent className={`h-6 w-6 ${getCurrentMethod()?.color}`} />;
                                                                })()}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-gray-900">{getCurrentMethod()?.name}</h3>
                                                                <p className="text-sm text-gray-600">{getCurrentMethod()?.description}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="bg-white">
                                                            Active
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Toggle for showing all options */}
                                        <div className="flex justify-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowLocationOptions(!showLocationOptions)}
                                                className="border-gray-300 bg-white hover:bg-gray-50"
                                            >
                                                <span>{showLocationOptions ? 'Hide Other Methods' : 'Change Location Method'}</span>
                                                {showLocationOptions ? (
                                                    <ChevronUp className="ml-2 h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>

                                        {/* Other Location Methods */}
                                        {showLocationOptions && (
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {locationMethods
                                                    .filter((method) => method.id !== locationOption)
                                                    .map((method) => {
                                                        const IconComponent = method.icon;
                                                        return (
                                                            <button
                                                                key={method.id}
                                                                type="button"
                                                                onClick={() => handleLocationMethodChange(method.id)}
                                                                className={`rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md ${method.borderColor} ${method.bgColor} hover:${method.borderColor.replace('200', '300')}`}
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <div className={`rounded-lg p-2 ${method.bgColor}`}>
                                                                        <IconComponent className={`h-5 w-5 ${method.color}`} />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-semibold text-gray-900">{method.name}</h3>
                                                                        <p className="text-sm text-gray-600">{method.description}</p>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Location Method Content */}
                                    <div className="mt-6">
                                        {locationOption === 'current' && (
                                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-blue-900">Current Location Detection</h4>
                                                        <p className="mt-1 text-sm text-blue-700">
                                                            We'll use your device's GPS to automatically detect your precise location
                                                        </p>
                                                    </div>
                                                    <Button
                                                        onClick={getCurrentLocation}
                                                        disabled={locationLoading}
                                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                                    >
                                                        {locationLoading ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Detecting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <MapPin className="mr-2 h-4 w-4" />
                                                                Get My Location
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {isGettingLocation && (
                                                    <div className="mt-4 flex items-center text-sm text-blue-600">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Getting your location... This may take a few seconds
                                                    </div>
                                                )}

                                                {data.survey_address_info.latitude !== 0 && (
                                                    <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3">
                                                        <div className="text-sm text-blue-800">
                                                            <strong>✓ Location detected:</strong> {data.survey_address_info.latitude?.toFixed(6)},{' '}
                                                            {data.survey_address_info.longitude?.toFixed(6)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {locationOption === 'other' && (
                                            <div className="space-y-4">
                                                <div className="rounded-xl border border-green-200 bg-green-50 p-6">
                                                    <h4 className="mb-2 font-semibold text-green-900">Interactive Map Selection</h4>
                                                    <p className="text-sm text-green-700">
                                                        Click on the map to select your exact installation location. You can zoom and pan to find the
                                                        precise spot.
                                                    </p>
                                                </div>
                                                <Suspense
                                                    fallback={
                                                        <div className="flex h-96 items-center justify-center rounded-xl border border-gray-200 bg-gray-100">
                                                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                                            <span className="ml-2 text-gray-600">Loading map...</span>
                                                        </div>
                                                    }
                                                >
                                                    <LocationMap
                                                        onLocationSelect={handleLocationSelect}
                                                        initialLat={data.survey_address_info.latitude || 9.0192}
                                                        initialLng={data.survey_address_info.longitude || 38.7525}
                                                    />
                                                </Suspense>
                                                {selectedLocation && (
                                                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                                        <div className="text-sm text-green-800">
                                                            <strong>✓ Location selected:</strong> {selectedLocation[0].toFixed(6)},{' '}
                                                            {selectedLocation[1].toFixed(6)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {locationOption === 'manual' && (
                                            <div className="rounded-xl border border-purple-200 bg-purple-50 p-6">
                                                <h4 className="mb-4 font-semibold text-purple-900">Enter Coordinates Manually</h4>

                                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">
                                                            Latitude *
                                                        </Label>
                                                        <Input
                                                            id="latitude"
                                                            type="number"
                                                            step="any"
                                                            value={data.survey_address_info.latitude || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                handleNestedInputChange('survey_address_info', 'latitude', value);
                                                                if (value && formErrors['survey_address_info.latitude']) {
                                                                    setFormErrors((prev) => {
                                                                        const newErrors = { ...prev };
                                                                        delete newErrors['survey_address_info.latitude'];
                                                                        return newErrors;
                                                                    });
                                                                }
                                                            }}
                                                            placeholder="9.007428"
                                                            className="bg-white"
                                                        />
                                                        {data.survey_address_info.latitude !== 0 &&
                                                            validateCoordinateInput(data.survey_address_info.latitude, 'lat') && (
                                                                <p className="text-xs text-red-500">
                                                                    {validateCoordinateInput(data.survey_address_info.latitude, 'lat')}
                                                                </p>
                                                            )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">
                                                            Longitude *
                                                        </Label>
                                                        <Input
                                                            id="longitude"
                                                            type="number"
                                                            step="any"
                                                            value={data.survey_address_info.longitude || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                handleNestedInputChange('survey_address_info', 'longitude', value);
                                                                if (value && formErrors['survey_address_info.longitude']) {
                                                                    setFormErrors((prev) => {
                                                                        const newErrors = { ...prev };
                                                                        delete newErrors['survey_address_info.longitude'];
                                                                        return newErrors;
                                                                    });
                                                                }
                                                            }}
                                                            placeholder="38.733708"
                                                            className="bg-white"
                                                        />
                                                        {data.survey_address_info.longitude !== 0 &&
                                                            validateCoordinateInput(data.survey_address_info.longitude, 'lng') && (
                                                                <p className="text-xs text-red-500">
                                                                    {validateCoordinateInput(data.survey_address_info.longitude, 'lng')}
                                                                </p>
                                                            )}
                                                    </div>

                                                    <div className="flex items-end">
                                                        <Button
                                                            onClick={handleManualCoordinateCheck}
                                                            disabled={
                                                                !data.survey_address_info.latitude ||
                                                                !data.survey_address_info.longitude ||
                                                                !!validateCoordinateInput(data.survey_address_info.latitude, 'lat') ||
                                                                !!validateCoordinateInput(data.survey_address_info.longitude, 'lng')
                                                            }
                                                            className="w-full bg-purple-600 text-white hover:bg-purple-700"
                                                        >
                                                            <Navigation className="mr-2 h-4 w-4" />
                                                            Set Coordinates
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Resource Check Status */}
                                    {checkingResource && (
                                        <Alert className="mt-6 border-blue-200 bg-blue-50">
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                            <AlertDescription className="text-blue-800">
                                                Checking resource availability for this location...
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {resourceAvailable === true && (
                                        <Alert className="mt-6 border-green-200 bg-green-50">
                                            <AlertDescription className="text-green-800">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold">✓ Resource available in this area.</span>
                                                </div>
                                                <p className="mt-1">You can proceed with survey creation.</p>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {resourceAvailable === false && (
                                        <Alert className="mt-6 border-red-200 bg-red-50">
                                            <AlertDescription className="text-red-800">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold">✗ Resource not available</span>
                                                </div>
                                                <p className="mt-1">{resourceMessage || 'Survey creation is not allowed in this area.'}</p>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {locationError && (
                                        <Alert variant="destructive" className="mt-6">
                                            <AlertDescription>{locationError}</AlertDescription>
                                        </Alert>
                                    )}

                                    {formErrors['survey_address_info.location'] && (
                                        <Alert variant="destructive" className="mt-6">
                                            <AlertDescription>{formErrors['survey_address_info.location']}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="mt-8 flex justify-between border-t pt-8">
                                    <Link href="/survey-requests">
                                        <Button variant="outline" className="border-gray-300">
                                            Cancel
                                        </Button>
                                    </Link>

                                    <div className="flex flex-col items-end gap-2">
                                        <Button
                                            onClick={handleSubmitOrder}
                                            disabled={isSubmitDisabled()}
                                            size="lg"
                                            className="min-w-[200px] rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {getSubmitButtonText()}
                                        </Button>
                                        <p className="text-center text-xs text-gray-500">
                                            {!hasValidLocation && 'Please select a valid location first'}
                                            {hasValidLocation && resourceAvailable === undefined && 'Check resource availability before submitting'}
                                            {resourceAvailable === true && 'Ready to submit your survey order'}
                                            {resourceAvailable === false && 'Resource not available in selected location'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8 border-0 shadow-xl">
                            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                                <CardTitle className="flex items-center space-x-3 text-gray-900">
                                    <div className="rounded-lg bg-primary p-2">
                                        <FileText className="h-6 w-6 text-white" />
                                    </div>
                                    <span>Order Summary</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="flex items-center space-x-4 rounded-lg bg-gray-50 p-3">
                                    {(() => {
                                        const ServiceIcon = getServiceIcon(data.main_offer_id);
                                        return <ServiceIcon className="h-10 w-10 text-primary" />;
                                    })()}
                                    <div>
                                        <p className="font-bold text-gray-900">{getServiceName(data.main_offer_id)}</p>
                                        <p className="text-sm text-gray-600 capitalize">{getSurveyType(data.survey_type.replace('_', ' '))}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-600">Resource Status:</span>
                                        {checkingResource ? (
                                            <Badge variant="outline" className="border-blue-200 bg-blue-100 text-blue-800">
                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                Checking...
                                            </Badge>
                                        ) : resourceAvailable === true ? (
                                            <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">
                                                Available
                                            </Badge>
                                        ) : resourceAvailable === false ? (
                                            <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">
                                                Not Available
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-gray-200 bg-gray-100 text-gray-600">
                                                Select Location
                                            </Badge>
                                        )}
                                    </div>

                                    {resourceData && (
                                        <>
                                            <Separator />
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Available Ports:</span>
                                                    <span className="font-semibold">{resourceData.ava_port}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Distance:</span>
                                                    <span className="font-semibold">{resourceData.distance}m</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Node ID:</span>
                                                    <span className="font-semibold">{resourceData.neid}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Technology:</span>
                                                    <span className="font-semibold">{resourceData.cable_type_desc}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <Separator />

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Survey Type:</span>
                                            <Badge variant="outline" className="bg-blue-50 text-xs">
                                                {getSurveyType(data.survey_type)}
                                            </Badge>
                                        </div>
                                        {selectedBandwidth && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Customer Type:</span>
                                                    <span className="font-semibold capitalize">{data.customer_type}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Bandwidth:</span>
                                                    <span className="font-semibold">{selectedBandwidth}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Numeric Value:</span>
                                                    <span className="font-semibold">{bandwidthNumericValue} Mbps</span>
                                                </div>
                                            </>
                                        )}
                                        {data.survey_address_info.latitude !== 0 && (
                                            <div className="space-y-2 pt-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Latitude:</span>
                                                    <span className="font-mono font-semibold">{data.survey_address_info.latitude.toFixed(6)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Longitude:</span>
                                                    <span className="font-mono font-semibold">{data.survey_address_info.longitude.toFixed(6)}</span>
                                                </div>
                                            </div>
                                        )}
                                        {data.contact_person && data.contact_person !== 'Loading...' && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Contact Person:</span>
                                                <span className="font-semibold">{data.contact_person}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </AuthLayout>
    );
}
