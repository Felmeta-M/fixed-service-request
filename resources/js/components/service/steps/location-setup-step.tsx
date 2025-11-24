import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { parseCoordinate } from '@/lib/coordinate-utils';
import { useResourceChecker } from '@/lib/resource-check';
import { CheckCircle, Loader2, Locate, MapPin, Navigation, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { GoogleLocationMap } from '../google-location-map';

interface LocationSetupStepProps {
    formData: any;
    onUpdate: (data: any) => void;
    googleMapsApiKey: string;
}

const locationMethods = [
    {
        id: 'current',
        name: 'Current Location',
        description: 'Automatically detect your GPS location',
        icon: Locate,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    {
        id: 'map',
        name: 'Map Selection',
        description: 'Select location on Google Maps',
        icon: Search,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
    },
    {
        id: 'manual',
        name: 'Manual Coordinates',
        description: 'Enter latitude and longitude',
        icon: Navigation,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
    },
];

export function LocationSetupStep({ formData, onUpdate, googleMapsApiKey }: LocationSetupStepProps) {
    const [locationMethod, setLocationMethod] = useState('current');
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [checkingResource, setCheckingResource] = useState(false);
    const [isInitialLocationSet, setIsInitialLocationSet] = useState(false);
    const [userConfirmedLocation, setUserConfirmedLocation] = useState(false);
    const [temporaryLocation, setTemporaryLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const { checkResourceAvailability } = useResourceChecker();
    const [isMapAnimating, setIsMapAnimating] = useState(false);

    // Clear messages when location method changes
    useEffect(() => {
        setLocationError('');
    }, [locationMethod]);

    // Get current location automatically on component mount
    const getInitialLocation = useCallback(async () => {
        if (isInitialLocationSet) return;

        setLocationLoading(true);
        setLocationError('');

        try {
            const position = await getCurrentLocationWithTimeout();
            const { latitude, longitude } = position.coords;
            const preciseLat = parseFloat(latitude.toFixed(6));
            const preciseLng = parseFloat(longitude.toFixed(6));

            // Get address using Google Geocoding API
            const address = await getGoogleAddressFromCoordinates(preciseLat, preciseLng);

            setTemporaryLocation({
                lat: preciseLat,
                lng: preciseLng,
                address,
            });

            setIsInitialLocationSet(true);

            // Automatically switch to map view to show the location
            setTimeout(() => {
                setLocationMethod('map');
            }, 500);
        } catch (error) {
            console.log('Auto-location failed, using default location:', error);
            // Fallback to a default location (Addis Ababa center)
            const defaultLat = 9.0192;
            const defaultLng = 38.7525;
            const address = await getGoogleAddressFromCoordinates(defaultLat, defaultLng);

            setTemporaryLocation({
                lat: defaultLat,
                lng: defaultLng,
                address,
            });
            setIsInitialLocationSet(true);

            setTimeout(() => {
                setLocationMethod('map');
            }, 500);
        } finally {
            setLocationLoading(false);
        }
    }, [isInitialLocationSet, googleMapsApiKey]);

    useEffect(() => {
        getInitialLocation();
    }, [getInitialLocation]);

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
                    maximumAge: 60000,
                },
            );
        });
    };

    // Google Geocoding API for reverse geocoding with better error handling
    const getGoogleAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
        try {
            setIsGeocoding(true);
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
                // Try to get the most specific address first
                const result = data.results[0];
                return result.formatted_address;
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

            if (data.status === 'OK' && data.results.length > 0) {
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
        // Set as temporary location for user confirmation
        const finalAddress = address || (await getGoogleAddressFromCoordinates(lat, lng));
        setTemporaryLocation({
            lat,
            lng,
            address: finalAddress,
        });
        setUserConfirmedLocation(false);

        // Clear previous resource check results
        onUpdate({
            resourceAvailable: undefined,
            resourceData: undefined,
            resourceMessage: '',
        });
    };

    const confirmLocation = async () => {
        if (!temporaryLocation) return;

        setLocationError('');
        setCheckingResource(true);

        try {
            const result = await checkResourceAvailability(
                { latitude: temporaryLocation.lat, longitude: temporaryLocation.lng },
                formData.contactPerson || 'Customer',
            );

            onUpdate({
                latitude: temporaryLocation.lat,
                longitude: temporaryLocation.lng,
                address: temporaryLocation.address,
                resourceAvailable: result.available,
                resourceData: result.data,
                resourceMessage: result.message,
            });

            setUserConfirmedLocation(true);
        } catch (error) {
            console.error('Resource check error:', error);
            setLocationError('Failed to check resource availability. Please try again.');
            onUpdate({
                resourceAvailable: false,
                resourceMessage: 'Resource check failed',
            });
        } finally {
            setCheckingResource(false);
        }
    };

    const getCurrentLocation = async () => {
        setLocationLoading(true);
        setLocationError('');

        try {
            const position = await getCurrentLocationWithTimeout();
            const { latitude, longitude } = position.coords;
            const preciseLat = parseFloat(latitude.toFixed(6));
            const preciseLng = parseFloat(longitude.toFixed(6));
            const address = await getGoogleAddressFromCoordinates(preciseLat, preciseLng);

            await handleLocationSelect(preciseLat, preciseLng, address);
            setLocationMethod('map');
        } catch (error) {
            const errorMessage = getGeolocationErrorMessage(error);
            setLocationError(errorMessage);
        } finally {
            setLocationLoading(false);
        }
    };

    const getGeolocationErrorMessage = (error: any): string => {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Location access denied. Please allow location permissions in your browser settings.';
            case error.POSITION_UNAVAILABLE:
                return 'Location information unavailable. Please check your device location services.';
            case error.TIMEOUT:
                return 'Location request timed out. Please try again.';
            default:
                return error.message || 'Failed to get your location. Please try again.';
        }
    };

    const handleManualCoordinateSubmit = async () => {
        const lat = parseCoordinate(formData.latitude?.toString() || '9.007428');
        const lng = parseCoordinate(formData.longitude?.toString() || '38.733708');

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
        setLocationMethod('map');
    };

    const handleAddressSearch = async (address: string) => {
        setLocationLoading(true);
        setLocationError('');

        try {
            const location = await getCoordinatesFromAddress(address);
            if (location) {
                await handleLocationSelect(location.lat, location.lng, location.address);
                setLocationMethod('map');
            } else {
                setLocationError('Address not found. Please try a different search term or be more specific.');
            }
        } catch (error) {
            setLocationError('Failed to search address. Please check your connection and try again.');
        } finally {
            setLocationLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Location Method Selection */}
            <div className="grid grid-cols-1 gap-y-6 md:grid-cols-3 md:gap-x-4">
                {locationMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = locationMethod === method.id;

                    return (
                        <label
                            key={method.id}
                            onClick={() => setLocationMethod(method.id)}
                            className={`group relative flex cursor-pointer flex-col rounded-lg border bg-white p-5 transition ${
                                isSelected ? 'border-primary shadow-md ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                        >
                            <input
                                type="radio"
                                name="locationMethod"
                                value={method.id}
                                checked={isSelected}
                                onChange={() => {}}
                                className="absolute inset-0 cursor-pointer opacity-0"
                            />

                            <div className="flex items-start gap-3">
                                <div className={`rounded-xl p-3 ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
                                    <Icon className={`h-6 w-6`} />
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{method.name}</h4>
                                    <p className="mt-1 text-xs text-gray-500">{method.description}</p>
                                </div>
                            </div>

                            {isSelected && <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-primary" />}
                        </label>
                    );
                })}
            </div>

            {/* Location Method Content */}
            <div className="mt-4">
                {locationMethod === 'current' && (
                    <Card className="border-none shadow-none">
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">Current Location Detection</h4>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {locationLoading
                                            ? 'Detecting your location and loading map...'
                                            : "We've detected your location. Switching to map view..."}
                                    </p>
                                </div>
                                <Button onClick={getCurrentLocation} disabled={locationLoading} className="hover:opacity-90">
                                    {locationLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Detecting...
                                        </>
                                    ) : (
                                        <>
                                            <Locate className="h-4 w-4" />
                                            Refresh Location
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {locationMethod === 'map' && (
                    <div className="space-y-4">
                        <div className="h-full rounded-lg">
                            <GoogleLocationMap
                                onLocationSelect={handleLocationSelect}
                                onAddressSearch={handleAddressSearch}
                                initialLat={temporaryLocation?.lat || formData.latitude || 9.0192}
                                initialLng={temporaryLocation?.lng || formData.longitude || 38.7525}
                                selectedLocation={temporaryLocation}
                                googleMapsApiKey={googleMapsApiKey}
                                isAnimating={isMapAnimating}
                                onAnimationStateChange={setIsMapAnimating}
                            />
                        </div>

                        {/* Location Confirmation Card */}
                        {temporaryLocation && (
                            <div className="transition-all duration-300">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="mb-2 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <h4 className="font-semibold text-gray-900">Selected Location</h4>
                                            <div className="flex items-center space-x-2">
                                                {isGeocoding && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                                                {isMapAnimating && <div className="h-2 w-2 animate-pulse rounded-full bg-purple-600" />}
                                            </div>
                                        </div>
                                        <p className="mb-2 text-sm text-gray-600">
                                            Latitude: {temporaryLocation.lat.toFixed(6)}, Longitude: {temporaryLocation.lng.toFixed(6)}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            {temporaryLocation.address}
                                            {temporaryLocation.address.includes('details limited') && (
                                                <span className="ml-2 text-xs text-orange-500">(Coordinates are precise)</span>
                                            )}
                                        </p>
                                        {!userConfirmedLocation && (
                                            <p className="mt-2 text-xs font-medium text-primary">
                                                Please confirm your address to check resource availability.
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        onClick={confirmLocation}
                                        disabled={checkingResource || userConfirmedLocation || isGeocoding || isMapAnimating}
                                        className="bg-primary text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                                    >
                                        {checkingResource ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : userConfirmedLocation ? (
                                            <CheckCircle className="h-4 w-4" />
                                        ) : (
                                            'Confirm Location'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {locationMethod === 'manual' && (
                    <Card>
                        <CardContent>
                            <h4 className="mb-4 font-semibold text-gray-900">Enter Coordinates</h4>
                            <FieldGroup>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <Field>
                                        <FieldLabel htmlFor="latitude">Latitude</FieldLabel>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            placeholder="9.007428"
                                            required
                                            value={formData.latitude || '9.007428'}
                                            onChange={(e) => onUpdate({ latitude: parseFloat(e.target.value) || 0 })}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="longitude">Longitude</FieldLabel>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            placeholder="38.733708"
                                            required
                                            value={formData.longitude || '38.733708'}
                                            onChange={(e) => onUpdate({ longitude: parseFloat(e.target.value) || 0 })}
                                        />
                                    </Field>
                                    <div className="flex items-end">
                                        <Button onClick={handleManualCoordinateSubmit} disabled={isGeocoding} className="w-full hover:opacity-90">
                                            {isGeocoding ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Navigation className="mr-2 h-4 w-4" />
                                            )}
                                            {isGeocoding ? 'Getting Address...' : 'Set Coordinates'}
                                        </Button>
                                    </div>
                                </div>
                            </FieldGroup>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Status Indicators */}
            {locationLoading && locationMethod === 'current' && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <AlertDescription className="text-blue-700">Getting your current location and preparing the map...</AlertDescription>
                </Alert>
            )}

            {checkingResource && (
                <Alert className="border-primary">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <AlertDescription className="text-primary">Checking resource availability for this location...</AlertDescription>
                </Alert>
            )}

            {formData.resourceAvailable === true && userConfirmedLocation && (
                <Alert className="border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Resource available</span>
                            <Badge variant="outline" className="ml-2 text-green-800">
                                Ready to proceed
                            </Badge>
                        </div>
                        <p className="mt-1">Your selected location has the necessary infrastructure.</p>
                    </AlertDescription>
                </Alert>
            )}

            {formData.resourceAvailable === false && userConfirmedLocation && (
                <Alert className="border-orange-200">
                    <AlertDescription className="text-orange-800">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Resource not available</span>
                            <Badge variant="outline" className="ml-2 text-orange-800">
                                Service Limited
                            </Badge>
                        </div>
                        <p className="mt-1">
                            {formData.resourceMessage || 'Service not available in this location. Please try a different location.'}
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {locationError && (
                <Alert variant="destructive">
                    <AlertDescription>{locationError}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
