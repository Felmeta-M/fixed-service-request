import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { parseCoordinate } from '@/lib/coordinate-utils';
import { CheckCircle, Loader2, MapPin, Navigation } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleLocationMap } from '../google-location-map';

interface LocationSetupStepProps {
    formData: any;
    onUpdate: (data: any) => void;
    googleMapsApiKey: string;
}

export function LocationSetupStep({ formData, onUpdate, googleMapsApiKey }: LocationSetupStepProps) {
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isMapAnimating, setIsMapAnimating] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [manualAddress, setManualAddress] = useState('');

    // Use refs to track manual coordinate inputs to prevent re-renders
    const [manualLat, setManualLat] = useState(formData.latitude || '');
    const [manualLng, setManualLng] = useState(formData.longitude || '');
    const [showUpdateBtn, setShowUpdateBtn] = useState(false);

    // Use ref to track if initial location has been loaded
    const hasInitialLocationLoaded = useRef(false);

    // Track current location separately for the map
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    // Get current location automatically on component mount - ONLY ONCE
    const getInitialLocation = useCallback(async () => {
        // Prevent multiple calls
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

            // Get address using Google Geocoding API
            const address = await getGoogleAddressFromCoordinates(preciseLat, preciseLng);
            console.log('📫 Address obtained:', address);

            // Set current location for the map
            setCurrentLocation({
                lat: preciseLat,
                lng: preciseLng,
                address: address,
            });

            // Update form data directly (no temporary location)
            onUpdate({
                latitude: preciseLat,
                longitude: preciseLng,
                address: address,
                resourceAvailable: undefined, // Clear previous resource check
                resourceData: undefined,
                resourceMessage: '',
            });

            setManualAddress(address);
            setManualLat(preciseLat.toString());
            setManualLng(preciseLng.toString());
        } catch (error) {
            console.error('❌ Auto-location failed:', error);
            // Use a more accurate default location or show error to user
            const errorMessage = getGeolocationErrorMessage(error);
            setLocationError(errorMessage);

            // Don't use fallback - let user manually select location
            setLocationLoading(false);
            hasInitialLocationLoaded.current = true;

            // Or if you want to use fallback, uncomment below:
            /*
            const defaultLat = 9.024500; // More specific default
            const defaultLng = 38.748500;
            const address = await getGoogleAddressFromCoordinates(defaultLat, defaultLng);

            setCurrentLocation({
                lat: defaultLat,
                lng: defaultLng,
                address: address
            });

            onUpdate({
                latitude: defaultLat,
                longitude: defaultLng,
                address: address,
                resourceAvailable: undefined,
                resourceData: undefined,
                resourceMessage: '',
            });
            setManualAddress(address);
            setManualLat(defaultLat.toString());
            setManualLng(defaultLng.toString());
            */
        } finally {
            setLocationLoading(false);
        }
    }, [googleMapsApiKey, onUpdate]);

    // Only run once on component mount
    useEffect(() => {
        // Only run if we don't already have a valid location
        if (!hasInitialLocationLoaded.current && (formData.latitude === 0 || formData.longitude === 0)) {
            getInitialLocation();
        } else {
            // If we already have location data, use it
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
                    maximumAge: 0, // Don't use cached position
                },
            );
        });
    };

    // Google Geocoding API for reverse geocoding
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

    // Google Places API for forward geocoding
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

        // Update current location
        setCurrentLocation({
            lat: lat,
            lng: lng,
            address: finalAddress,
        });

        // Update form data directly
        onUpdate({
            latitude: lat,
            longitude: lng,
            address: finalAddress,
            resourceAvailable: undefined, // Clear previous resource check
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
        setShowUpdateBtn(false); // hide after update
        // onManualUpdate(manualLat, manualLng); // your update logic

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

    // Check if we have a valid location selected
    const hasValidLocation = formData.latitude !== 0 && formData.longitude !== 0 && formData.address;

    // Determine what to show on the map
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
        <div className="space-y-6">
            {/* Map Section */}
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

                {/* Selected Location Card */}
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
                                        {/* Coordinates */}
                                        {/* <div>
                                            <p className="mb-1 text-sm font-medium text-gray-700">Coordinates</p>
                                            <p className="text-sm text-gray-600">
                                                Lat: {(mapLocation?.lat || formData.latitude).toFixed(6)}, Lng:{' '}
                                                {(mapLocation?.lng || formData.longitude).toFixed(6)}
                                            </p>
                                        </div> */}
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

                                                {/* Show update button only when user changes something */}
                                                {showUpdateBtn && (
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
                                                )}
                                            </div>
                                        </FieldGroup>

                                        <div className="pt-4">
                                            <p className="mb-1 text-sm font-medium text-gray-700">Address</p>
                                            <div className="flex items-center gap-2">
                                                <p className="flex-1 text-sm text-gray-700">{mapLocation?.address || formData.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Refresh Location Button */}
                {/* <div className="flex justify-center">
                    <Button onClick={handleRefreshLocation} disabled={locationLoading} variant="outline" className="flex items-center gap-2">
                        {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                        {locationLoading ? 'Getting Location...' : 'Refresh My Location'}
                    </Button>
                </div> */}
            </div>

            {/* Status Indicators */}
            {locationLoading && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <AlertDescription className="text-blue-700">
                        {isEditingAddress ? 'Updating address...' : 'Getting your current location...'}
                    </AlertDescription>
                </Alert>
            )}



            {formData.resourceAvailable === false && (
                <Alert variant="destructive">
                    <AlertDescription>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Resource not available</span>
                            <Badge variant="outline" className="ml-2 text-orange-600">
                                Service Limited
                            </Badge>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* {locationError && (
                <Alert variant="destructive">
                    <AlertDescription>{locationError}</AlertDescription>
                </Alert>
            )} */}
        </div>
    );
}
