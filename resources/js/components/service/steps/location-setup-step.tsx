import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseCoordinate } from '@/lib/coordinate-utils';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Loader2, MapPin, Navigation, Phone } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleLocationMap } from '../google-location-map';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import axios from 'axios';
import { toast } from 'sonner';

interface LocationSetupStepProps {
    formData: any;
    onUpdate: (data: any) => void;
    googleMapsApiKey: string;
    onNext?: (surveyId: string) => void;
}

interface AuthUser {
    id?: number;
    customer_code?: string | number;
    name?: string;
    phone?: string;
    email?: string;
    api_token?: string;
}

export function LocationSetupStep({ formData, onUpdate, googleMapsApiKey, onNext }: LocationSetupStepProps) {
    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isMapAnimating, setIsMapAnimating] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [manualAddress, setManualAddress] = useState('');
    const [showResourceUnavailableDialog, setShowResourceUnavailableDialog] = useState(false);
    const [showManualFlow, setShowManualFlow] = useState(false);

    // Manual flow form state
    const [manualFlowData, setManualFlowData] = useState({
        phone: '',
        name: '',
        reason: '',
    });
    const [manualFlowErrors, setManualFlowErrors] = useState<Record<string, string>>({});
    const [submittingManualFlow, setSubmittingManualFlow] = useState(false);

    // Initialize manual flow data with user info when user is available
    useEffect(() => {
        if (user) {
            setManualFlowData((prev) => ({
                phone: prev.phone || (user as AuthUser)?.phone || '',
                name: prev.name || (user as AuthUser)?.name || '',
                reason: prev.reason,
            }));
        }
    }, [user]);

    const [manualLat, setManualLat] = useState(formData.latitude || '');
    const [manualLng, setManualLng] = useState(formData.longitude || '');
    const [showUpdateBtn, setShowUpdateBtn] = useState(false);

    const hasInitialLocationLoaded = useRef(false);

    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    const getInitialLocation = useCallback(async () => {
        if (hasInitialLocationLoaded.current) return;
        hasInitialLocationLoaded.current = true;

        setLocationLoading(true);
        setLocationError('');

        try {
            console.log('🔄 Getting current location...');
            const position = await getCurrentLocationWithTimeout();
            const { latitude, longitude } = position.coords;
            const preciseLat = parseFloat(latitude.toFixed(6));
            const preciseLng = parseFloat(longitude.toFixed(6));

            console.log('📍 Current location obtained:', { preciseLat, preciseLng });

            const address = await getGoogleAddressFromCoordinates(preciseLat, preciseLng);
            console.log('📫 Address obtained:', address);

            setCurrentLocation({
                lat: preciseLat,
                lng: preciseLng,
                address: address,
            });

            onUpdate({
                latitude: preciseLat,
                longitude: preciseLng,
                address: address,
                resourceAvailable: undefined,
                resourceData: undefined,
                resourceMessage: '',
            });

            setManualAddress(address);
            setManualLat(preciseLat.toString());
            setManualLng(preciseLng.toString());
        } catch (error) {
            console.error('❌ Auto-location failed:', error);
            const errorMessage = getGeolocationErrorMessage(error);
            setLocationError(errorMessage);

            setLocationLoading(false);
            hasInitialLocationLoaded.current = true;
        } finally {
            setLocationLoading(false);
        }
    }, [googleMapsApiKey, onUpdate]);

    useEffect(() => {
        if (!hasInitialLocationLoaded.current && (formData.latitude === 0 || formData.longitude === 0)) {
            getInitialLocation();
        } else {
            if (formData.latitude && formData.longitude) {
                setCurrentLocation({
                    lat: formData.latitude,
                    lng: formData.longitude,
                    address: formData.address || 'Location selected',
                });
            }
            if (formData.address) {
                setManualAddress(formData.address);
            }
            if (formData.latitude) {
                setManualLat(formData.latitude.toString());
            }
            if (formData.longitude) {
                setManualLng(formData.longitude.toString());
            }
            hasInitialLocationLoaded.current = true;
            setLocationLoading(false);
        }
    }, []); // Empty dependency array - run only once

    // Show modal when resource is not available
    useEffect(() => {
        if (formData.resourceAvailable === false && !showManualFlow) {
            setShowResourceUnavailableDialog(true);
        }
    }, [formData.resourceAvailable, showManualFlow]);

    // Validate phone number format
    const validatePhoneNumber = (phone: string): string => {
        if (!phone.trim()) {
            return 'Phone number is required';
        }
        // Allow phone numbers with 9-15 digits (international format)
        const phoneRegex = /^[+]?[\d\s-]{9,15}$/;
        const cleanedPhone = phone.replace(/[\s-]/g, '');
        if (!phoneRegex.test(cleanedPhone)) {
            return 'Please enter a valid phone number (9-15 digits)';
        }
        return '';
    };

    // Handle manual flow submission
    const handleManualFlowSubmit = async () => {
        // Clear previous errors
        setManualFlowErrors({});

        // Validate phone number (required)
        const phoneError = validatePhoneNumber(manualFlowData.phone);
        if (phoneError) {
            setManualFlowErrors({ phone: phoneError });
            return;
        }

        // Validate address (required)
        if (!formData.address || !formData.address.trim()) {
            setManualFlowErrors({ address: 'Location address is required' });
            return;
        }

        setSubmittingManualFlow(true);
        const submissionToast = toast.loading('Creating service request...');

        try {
            // Build survey creation payload (same structure as review-submit-step)
            // For manual flow, we don't have encrypted resource data, so we'll use plain coordinates
            const submitData = {
                customer_code: (user as AuthUser)?.customer_code?.toString() || '',
                customer_type: formData.customerType || 'residential',
                survey_type: 'EIC08',
                telecom_region: '104',
                oper_type: 'A',
                main_offer_id: formData.serviceType,
                bandwidth: formData.bandwidth,
                contact_person: manualFlowData.name.trim() || formData.contactPerson || (user as AuthUser)?.name || 'Customer',
                contact_no: manualFlowData.phone.trim() || formData.contactNo || (user as AuthUser)?.phone || '',
                contact_email: formData.contactEmail || (user as AuthUser)?.email || '',
                survey_address_info: {
                    region_city: '2',
                    subcity_zone: '11',
                    wereda_town: '141',
                    kebele: '',
                    // For manual flow, use plain coordinates (not encrypted)
                    latitude: String(formData.latitude),
                    longitude: String(formData.longitude),
                    address: formData.address || '',
                    // No distance/cable_type for manual flow
                    distance: undefined,
                    cable_type: undefined,
                },
                with_device: formData.withDevice,
                completed_date: new Date()
                    .toISOString()
                    .replace(/[-:T.Z]/g, '')
                    .slice(0, 14),
                external_operid: '512',
                survey_is_manual: true, // Mark as manual survey
            };

            // Create survey via the same API as normal flow
            const response = await axios.post('/api/v1/survey/create', submitData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${(user as AuthUser)?.api_token}`,
                },
            });

            const isSurveySuccess = response.data.success && response.data.data?.original?.success !== false;

            if (!isSurveySuccess) {
                const errorMsg = response.data.data?.original?.message || response.data.message || 'Failed to create service request';
                throw new Error(errorMsg);
            }

            const responseData = response.data.data;
            const { customer_survey_order_id: surveyId } = responseData;

            // Save to local storage
            const serviceTypes: Record<string, string> = {
                '1457567289': 'Fixed Broadband',
                '1207609454': 'Fixed Voice',
                '180427974': 'Combo Services',
            };
            const newSurvey = {
                id: surveyId,
                type: serviceTypes[formData.serviceType] || 'Service Request',
                status: 'waiting',
                createdAt: new Date().toISOString(),
                main_offer_id: formData.serviceType,
            };

            const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
            existingSurveys.push(newSurvey);
            localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));

            toast.success('Service request created successfully. Our team will review your manual request.', {
                id: submissionToast,
            });

            // Close dialogs and reset manual flow
            setShowManualFlow(false);
            setShowResourceUnavailableDialog(false);

            // Update form data to mark as manual submission
            onUpdate({
                ...formData,
                manualSubmission: true,
                resourceAvailable: false, // Ensure it's marked as manual
            });

            // Proceed to next step (review/payment) with the created survey ID
            if (onNext && surveyId) {
                onNext(String(surveyId));
            }
        } catch (error: any) {
            console.error('Manual flow submission error:', error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to submit your request. Please try again later.';

            toast.error(errorMessage, { id: submissionToast });

            // If it's a validation error, show field-specific errors
            if (error.response?.data?.errors) {
                setManualFlowErrors(error.response.data.errors);
            }
        } finally {
            setSubmittingManualFlow(false);
        }
    };

    // Handle "Continue Manually" button click
    const handleContinueManually = () => {
        setShowResourceUnavailableDialog(false);
        setShowManualFlow(true);
        // Pre-fill with user data if available
        setManualFlowData({
            phone: (user as AuthUser)?.phone || '',
            name: (user as AuthUser)?.name || '',
            reason: '',
        });
        setManualFlowErrors({});
    };

    // Handle dialog close - reset states if user cancels
    const handleDialogClose = (open: boolean) => {
        if (!open) {
            setShowResourceUnavailableDialog(false);
            // Don't reset showManualFlow here to allow user to see the form
        }
    };

    const getCurrentLocationWithTimeout = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Location request timed out'));
            }, 10000);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(timeout);
                    resolve(position);
                },
                (error) => {
                    clearTimeout(timeout);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                },
            );
        });
    };

    const getGoogleAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
        try {
            setIsGeocoding(true);
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
                return data.results[0].formatted_address;
            } else if (data.status === 'ZERO_RESULTS') {
                return 'Location identified (specific address not available)';
            } else {
                console.warn('Geocoding API warning:', data.status, data.error_message);
                return 'Address details not available';
            }
        } catch (error) {
            console.error('Google Geocoding error:', error);
            return 'Address service temporarily unavailable';
        } finally {
            setIsGeocoding(false);
        }
    };

    const getCoordinatesFromAddress = async (address: string): Promise<{ lat: number; lng: number; address: string } | null> => {
        try {
            setIsGeocoding(true);
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`,
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'OK' && data?.results?.length > 0) {
                const location = data.results[0].geometry.location;
                return {
                    lat: location.lat,
                    lng: location.lng,
                    address: data.results[0].formatted_address,
                };
            }
            return null;
        } catch (error) {
            console.error('Google Geocoding error:', error);
            return null;
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleLocationSelect = async (lat: number, lng: number, address: string = '') => {
        const finalAddress = address || (await getGoogleAddressFromCoordinates(lat, lng));

        setCurrentLocation({
            lat: lat,
            lng: lng,
            address: finalAddress,
        });

        onUpdate({
            latitude: lat,
            longitude: lng,
            address: finalAddress,
            resourceAvailable: undefined,
            resourceData: undefined,
            resourceMessage: '',
        });

        setManualAddress(finalAddress);
        setManualLat(lat.toString());
        setManualLng(lng.toString());
        setIsEditingAddress(false);
    };

    const handleRefreshLocation = async () => {
        setLocationLoading(true);
        setLocationError('');

        try {
            console.log('🔄 Refreshing location...');
            const position = await getCurrentLocationWithTimeout();
            const { latitude, longitude } = position.coords;
            const preciseLat = parseFloat(latitude.toFixed(6));
            const preciseLng = parseFloat(longitude.toFixed(6));

            console.log('📍 New location obtained:', { preciseLat, preciseLng });

            const address = await getGoogleAddressFromCoordinates(preciseLat, preciseLng);

            await handleLocationSelect(preciseLat, preciseLng, address);
        } catch (error) {
            const errorMessage = getGeolocationErrorMessage(error);
            setLocationError(errorMessage);
            console.error('❌ Location refresh failed:', error);
        } finally {
            setLocationLoading(false);
        }
    };

    const getGeolocationErrorMessage = (error: any): string => {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Location access denied. Please allow location permissions in your browser settings and refresh the page.';
            case error.POSITION_UNAVAILABLE:
                return 'Location information unavailable. Please check your device location services are enabled.';
            case error.TIMEOUT:
                return 'Location request timed out. Please check your internet connection and try again.';
            default:
                return error.message || 'Failed to get your location. Please try again.';
        }
    };

    const handleManualCoordinateSubmit = async () => {
        const lat = parseCoordinate(manualLat);
        const lng = parseCoordinate(manualLng);
        setShowUpdateBtn(false);

        if (!lat || !lng) {
            setLocationError('Please enter valid coordinates');
            return;
        }

        if (lat < -90 || lat > 90) {
            setLocationError('Latitude must be between -90 and 90');
            return;
        }

        if (lng < -180 || lng > 180) {
            setLocationError('Longitude must be between -180 and 180');
            return;
        }

        const address = await getGoogleAddressFromCoordinates(lat, lng);
        await handleLocationSelect(lat, lng, address);
    };

    const handleAddressSearch = async (address: string) => {
        console.log('🔍 Search triggered for:', address);
        setLocationLoading(true);
        setLocationError('');

        try {
            const location = await getCoordinatesFromAddress(address);
            if (location) {
                await handleLocationSelect(location.lat, location.lng, location.address);
            } else {
                setLocationError('Address not found. Please try a different search term or be more specific.');
            }
        } catch (error) {
            setLocationError('Failed to search address. Please check your connection and try again.');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleManualAddressUpdate = async () => {
        if (!manualAddress.trim()) return;

        setLocationLoading(true);
        setLocationError('');

        try {
            const location = await getCoordinatesFromAddress(manualAddress);
            if (location) {
                await handleLocationSelect(location.lat, location.lng, location.address);
            } else {
                setLocationError('Address not found. Please try a different address.');
            }
        } catch (error) {
            setLocationError('Failed to update address. Please check your connection and try again.');
        } finally {
            setLocationLoading(false);
            setIsEditingAddress(false);
        }
    };

    const hasValidLocation = formData.latitude !== 0 && formData.longitude !== 0 && formData.address;

    const mapLocation =
        currentLocation ||
        (hasValidLocation
            ? {
                lat: formData.latitude,
                lng: formData.longitude,
                address: formData.address,
            }
            : null);

    return (
        <div className="min-w-sm space-y-6 md:min-w-3xl">
            <div className="space-y-2">
                <div className="h-full rounded-lg">
                    <GoogleLocationMap
                        onLocationSelect={handleLocationSelect}
                        onAddressSearch={handleAddressSearch}
                        initialLat={mapLocation?.lat || 9.0192}
                        initialLng={mapLocation?.lng || 38.7525}
                        selectedLocation={mapLocation}
                        googleMapsApiKey={googleMapsApiKey}
                        isAnimating={isMapAnimating}
                        onAnimationStateChange={setIsMapAnimating}
                    />
                </div>

                {(hasValidLocation || currentLocation) && (
                    <Card className="border-none pr-0 pl-0 shadow-none transition-all duration-300">
                        <CardContent className="border-none pr-0 pl-0 shadow-none">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Title */}
                                    <div className="mb-3 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <h4 className="font-semibold text-gray-900">
                                            {locationLoading ? 'Detecting Location...' : 'Selected Location'}
                                        </h4>

                                        {(isGeocoding || isMapAnimating) && (
                                            <div className="flex items-center space-x-2">
                                                {isGeocoding && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                                                {isMapAnimating && <div className="h-2 w-2 animate-pulse rounded-full bg-purple-600" />}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <FieldGroup>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <Field>
                                                    <FieldLabel htmlFor="manualLat">Latitude</FieldLabel>
                                                    <Input
                                                        id="manualLat"
                                                        type="number"
                                                        step="any"
                                                        placeholder="9.007428"
                                                        value={manualLat}
                                                        onChange={(e) => {
                                                            setManualLat(e.target.value);
                                                            setShowUpdateBtn(true);
                                                        }}
                                                        className="focus:ring-1 focus:ring-primary"
                                                    />
                                                </Field>

                                                <Field>
                                                    <FieldLabel htmlFor="manualLng">Longitude</FieldLabel>
                                                    <Input
                                                        id="manualLng"
                                                        type="number"
                                                        step="any"
                                                        placeholder="38.733708"
                                                        value={manualLng}
                                                        onChange={(e) => {
                                                            setManualLng(e.target.value);
                                                            setShowUpdateBtn(true);
                                                        }}
                                                        className="focus:ring-1 focus:ring-primary"
                                                    />
                                                </Field>

                                                {/* {showUpdateBtn && (
                                                    <div className="flex items-end">
                                                        <Button
                                                            onClick={handleManualCoordinateSubmit}
                                                            disabled={isGeocoding}
                                                            className="w-full hover:opacity-90"
                                                        >
                                                            {isGeocoding ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Navigation className="mr-2 h-4 w-4" />
                                                            )}
                                                            {isGeocoding ? 'Updating...' : 'Update Coordinates'}
                                                        </Button>
                                                    </div>
                                                )} */}
                                            </div>
                                        </FieldGroup>

                                        {/* <div className="pt-4">
                                            <p className="mb-1 text-sm font-medium text-gray-700">Address</p>
                                            <div className="flex items-center gap-2">
                                                <p className="flex-1 text-sm text-gray-700">{mapLocation?.address || formData.address}</p>
                                            </div>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {locationLoading && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <AlertDescription className="text-blue-700">
                        {isEditingAddress ? 'Updating address...' : 'Getting your current location...'}
                    </AlertDescription>
                </Alert>
            )}

            {/* Resource Unavailable Dialog - Initial Notification */}
            <AlertDialog open={showResourceUnavailableDialog && !showManualFlow} onOpenChange={handleDialogClose}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <AlertDialogTitle className="text-left">
                                Location Review Needed
                            </AlertDialogTitle>
                        </div>

                        <AlertDialogDescription className="pt-3 text-left">
                            <p className="mb-3 text-gray-700">
                                Thank you for selecting your location on the map. We’re currently unable to automatically provision service for this location because available resources could not be confirmed.
                            </p>

                            <p className="mb-3 text-gray-700">
                                You can continue by submitting a manual request. Our team will review your location, perform a manual survey if needed, and contact you to assist with the next steps.
                            </p>

                            <p className="text-sm text-gray-600">
                                We appreciate your patience and look forward to helping you get connected.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                        <AlertDialogCancel onClick={() => setShowResourceUnavailableDialog(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleContinueManually}
                            className="bg-primary hover:bg-primary/90"
                        >
                            Continue Manually
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Manual Flow Dialog - Request Form */}
            <AlertDialog open={showManualFlow} onOpenChange={(open) => !open && setShowManualFlow(false)}>
                <AlertDialogContent className="sm:max-w-lg">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            {/* <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100"> */}
                            <Phone className="h-5 w-5 text-primary" />
                            {/* </div> */}
                            <AlertDialogTitle className="text-left">Submit Manual Request</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className=" text-left">
                            <p className="text-gray-700">
                                Please provide your contact information below. Our team will review your location and get back to you within 1-2 business days.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-2">
                        {/* Phone Number - Required */}
                        <Field>
                            <FieldLabel htmlFor="manual-phone">
                                Contact Phone Number <span className="text-red-500">*</span>
                            </FieldLabel>
                            <Input
                                id="manual-phone"
                                type="tel"
                                placeholder="+251 9XX XXX XXX"
                                value={manualFlowData.phone}
                                onChange={(e) => {
                                    setManualFlowData({ ...manualFlowData, phone: e.target.value });
                                    if (manualFlowErrors.phone) {
                                        setManualFlowErrors({ ...manualFlowErrors, phone: '' });
                                    }
                                }}
                                className={manualFlowErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                disabled={submittingManualFlow}
                            />
                            {manualFlowErrors.phone && (
                                <p className="mt-1 text-sm text-red-600">{manualFlowErrors.phone}</p>
                            )}
                        </Field>

                        {/* Name - Optional */}
                        {/* <Field>
                            <FieldLabel htmlFor="manual-name">Full Name (Optional)</FieldLabel>
                            <Input
                                id="manual-name"
                                type="text"
                                placeholder="Enter your full name"
                                value={manualFlowData.name}
                                onChange={(e) => {
                                    setManualFlowData({ ...manualFlowData, name: e.target.value });
                                    if (manualFlowErrors.name) {
                                        setManualFlowErrors({ ...manualFlowErrors, name: '' });
                                    }
                                }}
                                className={manualFlowErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                disabled={submittingManualFlow}
                            />
                            {manualFlowErrors.name && (
                                <p className="mt-1 text-sm text-red-600">{manualFlowErrors.name}</p>
                            )}
                        </Field> */}

                        <Field>
                            <FieldLabel htmlFor="manual-address">
                                Address <span className="text-red-500">*</span>
                            </FieldLabel>
                            <Textarea
                                id="manual-address"
                                rows={3}
                                // type="text"
                                placeholder="Enter your specific location address"
                                value={formData.address || ''}
                                onChange={(e) => {
                                    const newAddress = e.target.value;
                                    onUpdate({
                                        ...formData,
                                        address: newAddress,
                                    });
                                    // Clear any address-related errors
                                    if (manualFlowErrors.address) {
                                        setManualFlowErrors({ ...manualFlowErrors, address: '' });
                                    }
                                }}
                                className={manualFlowErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                disabled={submittingManualFlow || locationLoading}
                                required
                            />
                            {manualFlowErrors.address && (
                                <p className="mt-1 text-sm text-red-600">{manualFlowErrors.address}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                You can edit this address to provide more specific location details
                            </p>
                        </Field>
                        {/* Reason/Notes - Optional */}
                        {/* <Field>
                            <FieldLabel htmlFor="manual-reason">Description</FieldLabel>
                            <Textarea
                                id="manual-reason"
                                rows={3}
                                placeholder=""
                                value={manualFlowData.reason}
                                onChange={(e) => {
                                    setManualFlowData({ ...manualFlowData, reason: e.target.value });
                                    if (manualFlowErrors.reason) {
                                        setManualFlowErrors({ ...manualFlowErrors, reason: '' });
                                    }
                                }}
                                className={manualFlowErrors.reason ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                disabled={submittingManualFlow}
                            />
                            {manualFlowErrors.reason && (
                                <p className="mt-1 text-sm text-red-600">{manualFlowErrors.reason}</p>
                            )} */}
                        {/* <p className="mt-1 text-xs text-gray-500">
                                Help us understand your specific service needs (e.g., preferred installation date, special requirements)
                            </p> */}
                        {/* </Field> */}

                        {/* Location Info Display */}
                        {/* <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <p className="mb-1 text-xs font-medium text-gray-700">Request Location</p>
                            <p className="text-sm text-gray-600">{formData.address || 'Location selected on map'}</p> */}
                        {/* <p className="mt-1 text-xs text-gray-500">
                                {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
                            </p> */}
                        {/* </div> */}
                    </div>

                    <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                        <AlertDialogCancel
                            onClick={() => {
                                setShowManualFlow(false);
                                setManualFlowErrors({});
                            }}
                            disabled={submittingManualFlow}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleManualFlowSubmit}
                            disabled={submittingManualFlow}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {submittingManualFlow ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Submit Request
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
