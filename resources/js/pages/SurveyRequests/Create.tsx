import LocationMap from '@/components/location-map';
import { BandwidthSelector } from '@/components/survey/bandwidth-selector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
import AuthLayout from '@/layouts/AuthLayout';
import { SurveyRequest, SurveyRequestFormValues } from '@/types/survey';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, FileText, Info, Loader2, MapPin, Package, Phone, Search, Wifi } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

// Helper function to get customer code from stored data
const getCustomerCodeFromStorage = () => {
    try {
        // Check for National ID verification data
        const kycDataString = localStorage.getItem('kycData');
        if (kycDataString) {
            const kycData = JSON.parse(kycDataString);
            // KYC data typically doesn't have customer code, so return default
            return '828204303'; // Default fallback
        }

        // Check for phone verification data
        const customerDataString = localStorage.getItem('customerData');
        if (customerDataString) {
            const customerData = JSON.parse(customerDataString);
            if (customerData.customer && customerData.customer.code) {
                return customerData.customer.code;
            }
        }
    } catch (error) {
        console.error('Error getting customer code from storage:', error);
    }

    return '828204303'; // Default fallback
};

export default function Create() {
    const { props } = usePage<{ user?: any; isAuthenticated?: boolean }>();
    const user = props.user;
    const isAuthenticated = true;

    // Get search params from URL
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [locationError, setLocationError] = useState('');
    const [locationOption, setLocationOption] = useState('current');
    const [locationLoading, setLocationLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([9.0054, 38.7636]);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [selectedBandwidth, setSelectedBandwidth] = useState('');
    const [bandwidthNumericValue, setBandwidthNumericValue] = useState(0);
    const [customerType, setCustomerType] = useState<'residential' | 'enterprise'>('residential');

    const { data, setData, processing } = useForm<SurveyRequestFormValues>('createSurvey', {
        customer_code: getCustomerCodeFromStorage(),
        survey_type: searchParams.get('survey_type') || 'EIC08',
        telecom_region: searchParams.get('telecom_region') || '104',
        oper_type: searchParams.get('oper_type') || 'A',
        main_offer_id: searchParams.get('main_offer_id') || '1943913915',
        survey_address_info: {
            region_city: '2',
            subcity_zone: '11',
            wereda_town: '141',
            kebele: '',
            latitude: 0,
            longitude: 0,
            address: '',
        },
        bandwidth: searchParams.get('bandwidth') || '',
        // bandwidth: searchParams.get('bandwidth') || '2048',
        contact_person: 'Loading...', // Will be updated from storage
        contact_no: 'Loading...', // Will be updated from storage
        contact_email: 'Loading...', // Will be updated from storage
        completed_date: new Date(),
        external_operid: searchParams.get('external_operid') || '512',
        customer_type: customerType,
    });

    console.log('🚀 ~ SurveyRequestPage ~ surveyData:', data);

    const serviceOptions = [
        {
            // id: 'fixed_broadband',
            id: '1943913915',
            // id: '1457567289',
            name: 'Fixed Broadband',
            description: 'High-speed internet connection',
            icon: Wifi,
            recommended: true,
        },
        {
            // id: 'fixed_voice',
            id: '1207609454',
            name: 'Fixed Voice',
            description: 'Telephone service with reliable connectivity',
            icon: Phone,
        },
        {
            // id: 'combo',
            id: '1122464948',
            name: 'Combo Services',
            description: 'Bundle of internet and voice services ',
            icon: Package,
        },
    ];

    // Order type options
    const surveyTypeOptions = [
        { id: 'EIC08', name: 'Survey for New connection' },
        { id: 'EIC09', name: 'Survey for Change primary offer' },
        { id: 'EIC10', name: 'Survey for Upgrade' },
        { id: 'EIC11', name: 'Survey for Downgrade' },
        { id: 'EIC12', name: 'Survey for Shifting(within or across site)' },
        { id: 'EIC13', name: 'Survey for Reconnection' },
        { id: 'EIC14', name: 'Survey for Change Offering Attribute' },
        { id: 'EIC16', name: 'Survey for Change Copper to Fiber' },
    ];

    // Fetch user data and prefill form
    // useEffect(() => {
    //     const fetchUserData = async () => {
    //         if (user && user.id) {
    //             try {
    //                 const response = await fetch(`/api/users/${user.id}`);
    //                 const userData = await response.json();

    //                 if (response.ok) {
    //                     setData((prev) => ({
    //                         ...prev,
    //                         contact_person: `${userData.firstName} ${userData.lastName}`,
    //                         contact_no: userData.contactInfo?.mobileNo || '',
    //                         contact_email: userData.contactInfo?.email || '',
    //                         survey_address_info: {
    //                             ...prev.survey_address_info,
    //                             region_city: userData.address?.region || '',
    //                             subcity_zone: userData.address?.zone || '',
    //                             wereda_town: userData.address?.wereda || '',
    //                             kebele: userData.address?.kebele || '',
    //                             latitude: userData.address?.latitude || 0,
    //                             longitude: userData.address?.longitude || 0,
    //                         },
    //                         customer_code: userData.customerCode || '',
    //                     }));
    //                 }
    //             } catch (error) {
    //                 console.error('Failed to fetch user data:', error);
    //             }
    //         }
    //     };

    //     fetchUserData();
    // }, [user, setData]);

    // Fetch user data from localStorage and prefill form
    useEffect(() => {
        const fetchUserDataFromLocalStorage = () => {
            try {
                let contactPerson = 'Customer';
                let contactNo = '';
                let contactEmail = 'john@gmail.com';
                let customerCode = '828204303'; // Default fallback

                // Check for National ID verification data first
                const kycDataString = localStorage.getItem('kycData');
                if (kycDataString) {
                    try {
                        const kycData = JSON.parse(kycDataString);

                        // Extract contact information from KYC data
                        contactPerson = kycData.identity?.name?.eng || 'Customer';
                        contactNo = kycData.identity?.phone || '';
                        contactEmail = kycData.email || 'customer@ethiotelecom.et';

                        console.log('Using KYC data for contact info');
                    } catch (e) {
                        console.error('Error parsing KYC data:', e);
                    }
                }

                // If no KYC data or incomplete, check for phone verification data
                const customerDataString = localStorage.getItem('customerData');
                if (customerDataString && (!contactNo || contactNo === 'Loading...')) {
                    try {
                        const customerData = JSON.parse(customerDataString);

                        // Extract contact information from customer data
                        if (customerData.contacts && customerData.contacts.length > 0) {
                            contactPerson = `${customerData.contacts[0].name1 || ''} ${customerData.contacts[0].name2 || ''}`.trim() || contactPerson;
                            contactNo = customerData.contacts[0].mobile || contactNo;
                        }

                        // Also use customer name if available
                        if (customerData.customer) {
                            const customer = customerData.customer;
                            contactPerson =
                                `${customer.first_name || ''} ${customer.middle_name || ''} ${customer.last_name || ''}`.trim() || contactPerson;
                            customerCode = customer.code || customerCode;
                        }

                        console.log('Using customer data for contact info');
                    } catch (e) {
                        console.error('Error parsing customer data:', e);
                    }
                }

                // Set the form data
                setData((prev) => ({
                    ...prev,
                    customer_code: customerCode,
                    contact_person: contactPerson,
                    contact_no: contactNo,
                    contact_email: contactEmail,
                }));
            } catch (error) {
                console.error('Failed to fetch user data from localStorage:', error);

                // Set default values if localStorage fails
                setData((prev) => ({
                    ...prev,
                    contact_person: 'Customer',
                    contact_no: '',
                    contact_email: 'customer@ethiotelecom.et',
                }));
            }
        };

        fetchUserDataFromLocalStorage();
    }, [setData]);
    // Helper function to get customer ID from stored data
    const getCustomerIdFromStorage = () => {
        try {
            // Check for National ID verification data
            const kycDataString = localStorage.getItem('kycData');
            if (kycDataString) {
                const kycData = JSON.parse(kycDataString);
                // KYC data typically doesn't have customer ID, so return default
                return '';
            }

            // Check for phone verification data
            const customerDataString = localStorage.getItem('customerData');
            if (customerDataString) {
                const customerData = JSON.parse(customerDataString);
                if (customerData.customer && customerData.customer.id) {
                    return customerData.customer.id;
                }
            }
        } catch (error) {
            console.error('Error getting customer ID from storage:', error);
        }

        return '';
    };

    const { residentialOptions, enterpriseOptions, loading: loadingBandwidths, error: errorBandwidths } = useBandwidthOptions();

    // const bandwidthOptions = user?.customer_type === 'residential' ? residentialOptions : enterpriseOptions;

    const handleChange = (field: keyof SurveyRequest, value: any) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleNestedInputChange = (parent: keyof SurveyRequest, field: string, value: string) => {
        setData((prev) => ({
            ...prev,
            [parent]: {
                ...(prev[parent] as any),
                [field]: value,
            },
        }));

        // Clear the nested field error
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

    const getCurrentLocation = async () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser');
            return;
        }

        setLocationLoading(true);
        setLocationError('');
        setIsGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Update coordinates and map
                setSelectedLocation([latitude, longitude]);
                setMapCenter([latitude, longitude]);

                setData((prev) => ({
                    ...prev,
                    survey_address_info: {
                        ...prev.survey_address_info, // Preserve existing codes
                        latitude,
                        longitude,
                    },
                }));

                try {
                    // Use a real geocoding service (here using Nominatim as an example)
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
                                    // region_city: address.state || address.region || '2',
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

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!data.customer_code) newErrors.customer_code = 'Customer code is required';
        // if (!data.survey_type) newErrors.survey_type = 'Survey type is required';
        if (!data.telecom_region) newErrors.telecom_region = 'Telecom region is required';
        if (!data.main_offer_id) newErrors.main_offer_id = 'Service type is required';

        if (data.survey_address_info.latitude === 0 || data.survey_address_info.longitude === 0) {
            newErrors['survey_address_info.location'] = 'Please select a valid location';
        }

        // if (!data.contact_person) newErrors.contact_person = 'Contact person is required';
        // if (!data.contact_no) newErrors.contact_no = 'Contact number is required';
        // if (data.contact_email && !/\S+@\S+\.\S+/.test(data.contact_email)) {
        //     newErrors.contact_email = 'Please enter a valid email';
        // }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitOrder = async () => {
        if (!isAuthenticated) {
            router.visit('/otp/phone');
            return;
        }

        console.log('recieved data', data);

        if (!validateForm()) return;

        console.log('validated data', data);

        setLoading(true);
        setError('');

        try {
            // Format the date to match the backend requirement (YYYYMMDDHHMMSS)
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
            // Determine the main_offer_id based on customer type
            const finalMainOfferId = customerType === 'residential' ? '1457567289' : '1043913525';

            //  const finalMainOfferId = customerType === 'residential' ? '1943913915' : '1043913525';

            // Prepare the data in the exact format expected by the backend
            const submitData = {
                customer_code: data.customer_code,
                survey_type: data.survey_type,
                telecom_region: data.telecom_region,
                oper_type: data.oper_type,
                // main_offer_id: data.main_offer_id,
                main_offer_id: '1943913915', // TODO: Change this based on customer type
                survey_address_info: {
                    region_city: data.survey_address_info.region_city, // This should be numeric code
                    subcity_zone: data.survey_address_info.subcity_zone, // This should be numeric code
                    wereda_town: data.survey_address_info.wereda_town, // This should be numeric code
                    kebele: data.survey_address_info.kebele,
                    latitude: data.survey_address_info.latitude,
                    longitude: data.survey_address_info.longitude,
                    address: data.survey_address_info.address || '',
                },
                // bandwidth: data.bandwidth,
                // bandwidth: bandwidthNumericValue.toString(), // Send the numeric value
                bandwidth: '2048M', // TODO: Change this based on selection
                contact_person: data.contact_person,
                contact_no: data.contact_no,
                contact_email: data.contact_email,
                completed_date: formatDate(data.completed_date),
                external_operid: data.external_operid,
                // customer_type: customerType,
            };
            console.log('🚀 ~ handleSubmitOrder ~ submitData:', submitData);

            if (submitData) {
                // Store the survey in local storage or context for dashboard display
                const newSurvey = {
                    id: Date.now(),
                    type: getServiceName(data.main_offer_id),
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    customerCode: data.customer_code,
                    surveyType: getSurveyType(data.survey_type),
                    main_offer_id: data.main_offer_id,
                    // Add other relevant data
                };

                // Save to local storage or context
                const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
                existingSurveys.push(newSurvey);
                localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));
            }

            console.log('submitted data', submitData);

            // const newSurvey = {
            //     id: Date.now(),
            //     type: getServiceName(data.main_offer_id),
            //     status: 'approved',
            //     createdAt: new Date().toISOString(),
            //     customerCode: data.customer_code,
            //     surveyType: getSurveyType(data.survey_type),
            //     main_offer_id: data.main_offer_id,
            // };

            // // Save to local storage or context
            // const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
            // existingSurveys.push(newSurvey);
            // localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));

            //Redirect to dashboard
            router.visit('/dashboard');

            const response = await axios.post('http://localhost:8000/api/v1/survey/create', submitData);

            if (response.data.success) {
                console.log('success!!!');
            }
            if (response.data.success) {
                // Store the survey in local storage or context for dashboard display
                const newSurvey = {
                    id: response.data.survey_id || Date.now(),
                    type: getServiceName(data.main_offer_id),
                    status: 'waiting',
                    createdAt: new Date().toISOString(),
                    customerCode: data.customer_code,
                    surveyType: getSurveyType(data.survey_type),
                    main_offer_id: data.main_offer_id,
                    // Add other relevant data
                };

                // Save to local storage or context
                const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
                existingSurveys.push(newSurvey);
                localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));
            }

            console.log('submitted data', submitData);

            // const newSurvey = {
            //     id: response.data.survey_id || Date.now(),
            //     type: getServiceName(data.main_offer_id),
            //     status: 'approved',
            //     createdAt: new Date().toISOString(),
            //     customerCode: data.customer_code,
            //     surveyType: getSurveyType(data.survey_type),
            //     main_offer_id: data.main_offer_id,
            // };

            // Save to local storage or context
            // const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
            // existingSurveys.push(newSurvey);
            // localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));

            //Redirect to dashboard
            // router.visit('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const getServiceIcon = (serviceType: string) => {
        switch (serviceType) {
            case '1943913915':
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
            case '1943913915':
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
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-4">
                                    <Link href="/survey-requests" className="text-primary hover:opacity-90">
                                        <ArrowLeft className="inline-block h-4 w-4" /> Dashboard
                                    </Link>
                                    <div className="h-6 w-px bg-gray-300"></div>
                                    <div>
                                        <CardTitle>Create Survey Order</CardTitle>
                                    </div>
                                </div>
                                <CardDescription>
                                    Complete all fields to submit your <samp>survey</samp> order
                                </CardDescription>
                                {/* <CardTitle>Survey Order Form</CardTitle> */}
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div>
                                    <Label className="mb-3 block text-sm font-medium text-gray-700">Service Type *</Label>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {serviceOptions.map((service) => {
                                            const IconComponent = service.icon;
                                            return (
                                                <div
                                                    key={service.id}
                                                    onClick={() => handleChange('main_offer_id', service.id)}
                                                    className={`cursor-pointer rounded-lg border-2 p-2 text-left transition-all duration-200 ${
                                                        data.main_offer_id === service.id
                                                            ? 'border-primary bg-green-50 shadow-md'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div
                                                            className={`rounded-full p-2 ${
                                                                data.main_offer_id === service.id ? 'bg-green-100' : 'bg-gray-100'
                                                            }`}
                                                        >
                                                            <IconComponent
                                                                className={`h-5 w-5 ${
                                                                    data.main_offer_id === service.id ? 'text-primary' : 'text-gray-600'
                                                                }`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <h3
                                                                className={`font-medium ${
                                                                    data.main_offer_id === service.id ? 'text-green-900' : 'text-gray-900'
                                                                }`}
                                                            >
                                                                {service.name}
                                                            </h3>
                                                            <p className="mt-1 text-sm text-gray-600">{service.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        {service.recommended && (
                                                            <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">Recommended</Badge>
                                                        )}
                                                        {data.main_offer_id === service.id && (
                                                            <div className="mt-2 flex items-center space-x-2">
                                                                <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                                <span className="text-xs font-medium text-primary">Selected</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {formErrors.serviceType && <p className="mt-1 text-sm text-red-600">{formErrors.serviceType}</p>}
                                </div>

                                {/* <div>
                                    <FormSelect
                                        id="survey_type"
                                        label="Survey Type *"
                                        value={data.survey_type}
                                        onChange={(val) => handleChange('survey_type', val)}
                                        options={surveyTypeOptions.map((type) => ({
                                            label: type.name,
                                            value: type.id,
                                        }))}
                                        error={formErrors.survey_type}
                                        placeholder="Select survey type"
                                    />
                                </div> */}

                                {/* <div className="hidden"> */}
                                {/* <FormInput
                                        id="customer_code"
                                        value={data.customer_code}
                                        onChange={(e) => handleChange('customer_code', e.target.value)}
                                        error={formErrors.customer_code}
                                        placeholder="Enter customer code"
                                        required
                                    /> */}

                                {/* <FormInput
                                        id="telecom_region"
                                        value={data.telecom_region}
                                        onChange={(e) => handleChange('telecom_region', e.target.value)}
                                        error={formErrors.telecom_region}
                                        required
                                    /> */}

                                {/* <FormInput
                                        id="main_offer_id"
                                        value={data.main_offer_id}
                                        onChange={(e) => handleChange('main_offer_id', e.target.value)}
                                        error={formErrors.main_offer_id}
                                    /> */}

                                {/* <FormInput
                                        id="survey_type"
                                        value={data.survey_type}
                                        onChange={(e) => handleChange('survey_type', e.target.value)}
                                        error={formErrors.survey_type}
                                        placeholder="Enter survey type"
                                        required
                                    /> */}
                                {/* <div>
                                        <FormSelect
                                            id="oper_type"
                                            label="Operation Type *"
                                            value={data.oper_type}
                                            onChange={(val) => handleChange('oper_type', val)}
                                            options={[
                                                { label: 'New', value: 'A' },
                                                { label: 'Modify', value: 'M' },
                                            ]}
                                            error={formErrors.oper_type}
                                            placeholder="Select operation type"
                                        />
                                    </div> */}
                                {/* </div> */}

                                {/* {data.main_offer_id === '1943913915' && (
                                    <div>
                                        <FormSelect
                                            id="bandwidth"
                                            label="Bandwidth"
                                            value={data.bandwidth}
                                            onChange={(val) => handleChange('bandwidth', val)}
                                            options={bandwidthOptions}
                                            error={formErrors.bandwidth}
                                            loading={loadingBandwidths}
                                            placeholder="Select bandwidth"
                                        />
                                    </div>
                                )} */}
                                {data.main_offer_id === '1943913915' && (
                                    <BandwidthSelector
                                        residentialOptions={residentialOptions}
                                        enterpriseOptions={enterpriseOptions}
                                        loading={loadingBandwidths}
                                        selectedBandwidth={selectedBandwidth}
                                        customerType={customerType}
                                        onCustomerTypeChange={(type) => {
                                            setCustomerType(type);
                                            setData('customer_type', type);
                                        }}
                                        onBandwidthChange={(value, numericValue, type) => {
                                            setSelectedBandwidth(value);
                                            setBandwidthNumericValue(numericValue);
                                            setCustomerType(type);
                                            setData('bandwidth', numericValue.toString());
                                            setData('customer_type', type);
                                        }}
                                        error={formErrors.bandwidth}
                                    />
                                )}

                                {/* Location Selection */}
                                <div>
                                    <div className="mb-6">
                                        <Label className="text-md mb-4 font-medium">Installation Address</Label>
                                        <Label className="mb-3 block text-sm font-medium text-gray-700">Choose Installation Location Method *</Label>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <button
                                                type="button"
                                                onClick={() => setLocationOption('current')}
                                                className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                                                    locationOption === 'current'
                                                        ? 'border-primary bg-green-50 shadow-md'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        className={`rounded-full p-2 ${locationOption === 'current' ? 'bg-green-100' : 'bg-gray-100'}`}
                                                    >
                                                        <MapPin
                                                            className={`h-5 w-5 ${locationOption === 'current' ? 'text-primary' : 'text-gray-600'}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3
                                                            className={`font-medium ${
                                                                locationOption === 'current' ? 'text-green-900' : 'text-gray-900'
                                                            }`}
                                                        >
                                                            Use Current Location
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-600">Automatically detect your GPS location</p>
                                                    </div>
                                                </div>
                                                {locationOption === 'current' && (
                                                    <div className="mt-2 flex items-center space-x-2">
                                                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                        <span className="text-xs font-medium text-primary">Selected</span>
                                                    </div>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setLocationOption('other')}
                                                className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                                                    locationOption === 'other'
                                                        ? 'border-primary bg-green-50 shadow-md'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        className={`rounded-full p-2 ${locationOption === 'other' ? 'bg-green-100' : 'bg-gray-100'}`}
                                                    >
                                                        <Search
                                                            className={`h-5 w-5 ${locationOption === 'other' ? 'text-primary' : 'text-gray-600'}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3
                                                            className={`font-medium ${
                                                                locationOption === 'other' ? 'text-green-900' : 'text-gray-900'
                                                            }`}
                                                        >
                                                            Select from Map
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-600">Search location on map</p>
                                                    </div>
                                                </div>
                                                {locationOption === 'other' && (
                                                    <div className="mt-2 flex items-center space-x-2">
                                                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                        <span className="text-xs font-medium text-primary">Selected</span>
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {locationOption === 'current' && (
                                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <p className="text-sm text-green-800">
                                                    We'll use your device's GPS to automatically detect your location
                                                </p>
                                                <Button
                                                    onClick={getCurrentLocation}
                                                    disabled={locationLoading}
                                                    size="sm"
                                                    className="bg-primary hover:opacity-90"
                                                >
                                                    {locationLoading ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Detecting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MapPin className="mr-2 h-4 w-4" />
                                                            Get Location
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {isGettingLocation && (
                                                <div className="mt-2 text-sm text-primary">
                                                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                                                    Getting your location...
                                                </div>
                                            )}

                                            {data.survey_address_info.latitude !== 0 && (
                                                <div className="mt-2 rounded bg-green-50 p-2 text-sm text-green-700">
                                                    ✓ Location detected: {data.survey_address_info.latitude?.toFixed(6)},{' '}
                                                    {data.survey_address_info.longitude?.toFixed(6)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {locationOption === 'other' && (
                                        <div className="space-y-4">
                                            <div className="mt-4">
                                                <Label className="mb-2 block text-sm font-medium text-gray-700">Select Location on Map *</Label>
                                                <p className="mb-4 text-sm text-gray-600">Click on the map to select your exact location.</p>
                                                <Suspense
                                                    fallback={
                                                        <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100">
                                                            Loading map...
                                                        </div>
                                                    }
                                                >
                                                    <LocationMap
                                                        onLocationSelect={handleLocationSelect}
                                                        initialLat={data.survey_address_info.latitude || 9.0192}
                                                        initialLng={data.survey_address_info.longitude || 38.7525}
                                                    />
                                                </Suspense>
                                            </div>
                                            {selectedLocation && (
                                                <div className="mt-2 rounded bg-green-50 p-2 text-sm text-green-700">
                                                    ✓ Location selected: {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {locationError && (
                                        <Alert variant="destructive" className="mt-4">
                                            <AlertDescription>{locationError}</AlertDescription>
                                        </Alert>
                                    )}

                                    {formErrors['survey_address_info.location'] && (
                                        <Alert variant="destructive" className="mt-4">
                                            <AlertDescription>{formErrors['survey_address_info.location']}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                {/* Address Details */}
                                <div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="latitude">Latitude</Label>
                                            <Input
                                                id="latitude"
                                                type="number"
                                                step="any"
                                                value={data.survey_address_info.latitude || ''}
                                                onChange={(e) => handleNestedInputChange('survey_address_info', 'latitude', e.target.value)}
                                                placeholder="9.000000"
                                                readOnly={locationOption === 'current'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="longitude">Longitude</Label>
                                            <Input
                                                id="longitude"
                                                type="number"
                                                step="any"
                                                value={data.survey_address_info.longitude || ''}
                                                onChange={(e) => handleNestedInputChange('survey_address_info', 'longitude', e.target.value)}
                                                placeholder="38.000000"
                                                readOnly={locationOption === 'current'}
                                            />
                                        </div>
                                    </div>

                                    {/* <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Region/City</Label>
                                            <Input
                                                value={data.survey_address_info.region_city}
                                                onChange={(e) => handleNestedInputChange('survey_address_info', 'region_city', e.target.value)}
                                                placeholder="Enter region/city"
                                                className={formErrors['survey_address_info.region_city'] ? 'border-red-500' : ''}
                                            />
                                            {formErrors['survey_address_info.region_city'] && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors['survey_address_info.region_city']}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label>Subcity/Zone</Label>
                                            <Input
                                                value={data.survey_address_info.subcity_zone}
                                                onChange={(e) => handleNestedInputChange('survey_address_info', 'subcity_zone', e.target.value)}
                                                placeholder="Enter subcity/zone"
                                                className={formErrors['survey_address_info.subcity_zone'] ? 'border-red-500' : ''}
                                            />
                                            {formErrors['survey_address_info.subcity_zone'] && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors['survey_address_info.subcity_zone']}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Wereda/Town</Label>
                                            <Input
                                                value={data.survey_address_info.wereda_town}
                                                onChange={(e) => handleNestedInputChange('survey_address_info', 'wereda_town', e.target.value)}
                                                placeholder="Enter wereda/town"
                                                className={formErrors['survey_address_info.wereda_town'] ? 'border-red-500' : ''}
                                            />
                                            {formErrors['survey_address_info.wereda_town'] && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors['survey_address_info.wereda_town']}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label>Kebele</Label>
                                            <Input
                                                value={data.survey_address_info.kebele}
                                                onChange={(e) => handleNestedInputChange('survey_address_info', 'kebele', e.target.value)}
                                                placeholder="Enter kebele"
                                                className={formErrors['survey_address_info.kebele'] ? 'border-red-500' : ''}
                                            />
                                            {formErrors['survey_address_info.kebele'] && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors['survey_address_info.kebele']}</p>
                                            )}
                                        </div>
                                    </div> */}

                                    <div className="mt-4 hidden">
                                        <Label>Address</Label>
                                        <Textarea
                                            value={data.survey_address_info.address}
                                            onChange={(e) => handleNestedInputChange('survey_address_info', 'address', e.target.value)}
                                            placeholder="Full address details"
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className='hidden'>
                                    <h3 className="mb-4 text-lg font-medium">Primary Contact</h3>
                                    <div className="mb-3 rounded-lg bg-blue-50 p-3">
                                        <p className="text-sm text-blue-700">
                                            <Info className="mr-1 inline h-4 w-4" />
                                            Contact information automatically filled from verification
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Contact Person *</Label>
                                            <Input
                                                value={data.contact_person}
                                                onChange={(e) => handleChange('contact_person', e.target.value)}
                                                placeholder="Full name"
                                                className={formErrors.contact_person ? 'border-red-500' : ''}
                                            />
                                            {formErrors.contact_person && <p className="mt-1 text-sm text-red-600">{formErrors.contact_person}</p>}
                                        </div>
                                        <div>
                                            <Label>Mobile Number *</Label>
                                            <Input
                                                value={data.contact_no}
                                                onChange={(e) => handleChange('contact_no', e.target.value)}
                                                placeholder="9XXXXXXXX"
                                                className={formErrors.contact_no ? 'border-red-500' : ''}
                                            />
                                            {formErrors.contact_no && <p className="mt-1 text-sm text-red-600">{formErrors.contact_no}</p>}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Label>Email Address</Label>
                                        <Input
                                            type="email"
                                            value={data.contact_email}
                                            onChange={(e) => handleChange('contact_email', e.target.value)}
                                            placeholder="email@example.com"
                                            className={formErrors.contact_email ? 'border-red-500' : ''}
                                        />
                                        {formErrors.contact_email && <p className="mt-1 text-sm text-red-600">{formErrors.contact_email}</p>}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="mt-8 flex justify-between border-t pt-6">
                                    <Link href="/survey-requests">
                                        <Button variant="outline">Cancel</Button>
                                    </Link>
                                    <Button onClick={handleSubmitOrder} disabled={loading} size="lg">
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Survey'
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <FileText className="h-8 w-8" />
                                    <span>Order Details</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    {(() => {
                                        const ServiceIcon = getServiceIcon(data.main_offer_id);
                                        return <ServiceIcon className="h-8 w-8 text-primary" />;
                                    })()}
                                    <div>
                                        <p className="font-medium">{getServiceName(data.main_offer_id)}</p>
                                        <p className="text-sm text-gray-600 capitalize">{getSurveyType(data.survey_type.replace('_', ' '))}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Survey Type:</span>
                                        <Badge variant="outline" className="text-xs">
                                            {getSurveyType(data.survey_type)}
                                        </Badge>
                                    </div>
                                    {/* {data.bandwidth && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Bandwidth:</span>
                                            <span className="font-medium">{data.bandwidth}</span>
                                        </div>
                                    )} */}
                                    {selectedBandwidth && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Customer Type:</span>
                                                <span className="font-medium capitalize">{customerType}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Bandwidth:</span>
                                                <span className="font-medium">{selectedBandwidth}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Numeric Value:</span>
                                                <span className="font-medium">{bandwidthNumericValue} Mbps</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Service ID:</span>
                                                <span className="font-medium">{customerType === 'residential' ? '1457567289' : '1043913525'}</span>
                                            </div>
                                        </>
                                    )}
                                    {data.survey_address_info.latitude && (
                                        <div className="space-y-1">
                                            {data.survey_address_info.latitude && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Latitude:</span>
                                                    <span className="font-medium">{data.survey_address_info.latitude}</span>
                                                </div>
                                            )}
                                            {data.survey_address_info.longitude && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Longitude:</span>
                                                    <span className="font-medium">{data.survey_address_info.longitude}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {data.contact_person && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Contact Person:</span>
                                            <span className="font-medium">{data.contact_person}</span>
                                        </div>
                                    )}
                                    {data.contact_no && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Contact Number:</span>
                                            <span className="font-medium">{data.contact_no}</span>
                                        </div>
                                    )}
                                    {data.contact_email && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Contact Email:</span>
                                            <span className="font-medium">{data.contact_email}</span>
                                        </div>
                                    )}
                                    {data.completed_date && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Completed Date:</span>
                                            <span className="font-medium">{data.completed_date.toISOString()}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </AuthLayout>
    );
}
