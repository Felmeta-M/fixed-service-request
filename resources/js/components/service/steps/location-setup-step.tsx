// import LocationMap from '@/components/location-map';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
// import { Input } from '@/components/ui/input';
// import { parseCoordinate } from '@/lib/coordinate-utils';
// import { checkResourceAvailability } from '@/lib/resource-check';
// import { CheckCircle, Loader2, MapPin, Navigation, Search } from 'lucide-react';
// import { useState } from 'react';

// interface LocationSetupStepProps {
//     formData: any;
//     onUpdate: (data: any) => void;
// }

// const locationMethods = [
//     {
//         id: 'current',
//         name: 'Current Location',
//         description: 'Automatically detect your GPS location',
//         icon: MapPin,
//         color: 'text-blue-600',
//         bgColor: 'bg-blue-0',
//     },
//     {
//         id: 'map',
//         name: 'Map Selection',
//         description: 'Select location on interactive map',
//         icon: Search,
//         color: 'text-green-600',
//         bgColor: 'bg-green-0',
//     },
//     {
//         id: 'manual',
//         name: 'Manual Coordinates',
//         description: 'Enter latitude and longitude',
//         icon: Navigation,
//         color: 'text-purple-600',
//         bgColor: 'bg-purple-0',
//     },
// ];

// export function LocationSetupStep({ formData, onUpdate }: LocationSetupStepProps) {
//     const [locationMethod, setLocationMethod] = useState('current');
//     const [locationLoading, setLocationLoading] = useState(false);
//     const [locationError, setLocationError] = useState('');
//     const [checkingResource, setCheckingResource] = useState(false);

//     const handleLocationSelect = async (lat: number, lng: number, address: string = '') => {
//         onUpdate({
//             latitude: lat,
//             longitude: lng,
//             address: address || formData.address,
//         });

//         setLocationError('');

//         // Check resource availability
//         setCheckingResource(true);
//         try {
//             const result = await checkResourceAvailability({ latitude: lat, longitude: lng }, formData.contactPerson || 'Customer');

//             onUpdate({
//                 resourceAvailable: result.available,
//                 resourceData: result.data,
//                 resourceMessage: result.message,
//             });
//         } catch (error) {
//             console.error('Resource check error:', error);
//             onUpdate({ resourceAvailable: false });
//         } finally {
//             setCheckingResource(false);
//         }
//     };

//     const getCurrentLocation = () => {
//         if (!navigator.geolocation) {
//             setLocationError('Geolocation is not supported by this browser');
//             return;
//         }

//         setLocationLoading(true);
//         setLocationError('');

//         navigator.geolocation.getCurrentPosition(
//             (position) => {
//                 const { latitude, longitude } = position.coords;
//                 const preciseLat = parseFloat(latitude.toFixed(6));
//                 const preciseLng = parseFloat(longitude.toFixed(6));

//                 handleLocationSelect(preciseLat, preciseLng);
//                 setLocationLoading(false);
//             },
//             (error) => {
//                 setLocationError('Failed to get your location. Please check browser permissions.');
//                 setLocationLoading(false);
//             },
//             {
//                 enableHighAccuracy: true,
//                 timeout: 15000,
//                 maximumAge: 60000,
//             },
//         );
//     };

//     const handleManualCoordinateSubmit = () => {
//         const lat = parseCoordinate(formData.latitude.toString());
//         const lng = parseCoordinate(formData.longitude.toString());

//         if (!lat || !lng) {
//             setLocationError('Please enter valid coordinates');
//             return;
//         }

//         if (lat < -90 || lat > 90) {
//             setLocationError('Latitude must be between -90 and 90');
//             return;
//         }

//         if (lng < -180 || lng > 180) {
//             setLocationError('Longitude must be between -180 and 180');
//             return;
//         }

//         handleLocationSelect(lat, lng);
//     };

//     return (
//         <div className="space-y-6">
//             <div className="mt-6 grid grid-cols-1 gap-y-6 md:grid-cols-3 md:gap-x-4">
//                 {locationMethods.map((method) => {
//                     const Icon = method.icon;
//                     const isSelected = locationMethod === method.id;

//                     return (
//                         <label
//                             key={method.id}
//                             onClick={() => setLocationMethod(method.id)}
//                             className={`group relative flex cursor-pointer flex-col rounded-lg border bg-white p-5 transition ${
//                                 isSelected ? 'border-primary shadow-md ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
//                             }`}
//                         >
//                             {/* Hidden input for accessibility */}
//                             <input
//                                 type="radio"
//                                 name="locationMethod"
//                                 value={method.id}
//                                 checked={isSelected}
//                                 onChange={() => {}}
//                                 className="absolute inset-0 cursor-pointer opacity-0"
//                             />

//                             <div className="flex items-start gap-3">
//                                 <div className={`rounded-xl p-3 ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
//                                     <Icon className={`h-6 w-6`} />
//                                 </div>

//                                 <div className="flex-1">
//                                     <h4 className="font-semibold text-gray-900">{method.name}</h4>
//                                     <p className="mt-1 text-xs text-gray-500">{method.description}</p>
//                                 </div>
//                             </div>

//                             {isSelected && <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-primary" />}
//                         </label>
//                     );
//                 })}
//             </div>

//             {/* Location Method Content */}
//             <div className="mt-4">
//                 {locationMethod === 'current' && (
//                     <Card>
//                         <CardContent>
//                             <div className="flex items-center justify-between">
//                                 <div>
//                                     <h4 className="font-semibold text-gray-900">Current Location Detection</h4>
//                                     <p className="mt-1 text-sm text-gray-600">We'll use your device's GPS to automatically detect your location</p>
//                                 </div>
//                                 <Button onClick={getCurrentLocation} disabled={locationLoading} className="hover:opacity-90">
//                                     {locationLoading ? (
//                                         <>
//                                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                             Detecting...
//                                         </>
//                                     ) : (
//                                         <>
//                                             <MapPin className="mr-2 h-4 w-4" />
//                                             Get My Location
//                                         </>
//                                     )}
//                                 </Button>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}

//                 {locationMethod === 'map' && (
//                     <div className="space-y-4">
//                         <div className="h-full rounded-lg border">
//                             <LocationMap
//                                 onLocationSelect={handleLocationSelect}
//                                 initialLat={formData.latitude || 9.0192}
//                                 initialLng={formData.longitude || 38.7525}
//                             />
//                         </div>
//                     </div>
//                 )}

//                 {locationMethod === 'manual' && (
//                     <Card>
//                         <CardContent>
//                             <h4 className="mb-4 font-semibold text-gray-900">Enter Coordinates</h4>
//                             <FieldGroup>
//                                 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//                                     <Field>
//                                         <FieldLabel htmlFor="latitude">Latitude</FieldLabel>
//                                         <Input
//                                             id="latitude"
//                                             type="number"
//                                             step="any"
//                                             placeholder="9.007428"
//                                             required
//                                             value={formData.latitude || '9.007428'}
//                                             onChange={(e) => onUpdate({ latitude: parseFloat(e.target.value) || 0 })}
//                                         />
//                                     </Field>
//                                     <Field>
//                                         <FieldLabel htmlFor="longitude">Longitude</FieldLabel>
//                                         <Input
//                                             id="longitude"
//                                             type="number"
//                                             step="any"
//                                             placeholder="38.733708"
//                                             required
//                                             value={formData.longitude || '38.733708'}
//                                             onChange={(e) => onUpdate({ longitude: parseFloat(e.target.value) || 0 })}
//                                         />
//                                     </Field>
//                                     <div className="flex items-end">
//                                         <Button onClick={handleManualCoordinateSubmit} className="w-full hover:opacity-90">
//                                             <Navigation className="mr-2 h-4 w-4" />
//                                             Set Coordinates
//                                         </Button>
//                                     </div>
//                                 </div>
//                             </FieldGroup>
//                         </CardContent>
//                     </Card>
//                 )}
//             </div>
//             {checkingResource && (
//                 <Alert className="">
//                     <Loader2 className="h-4 w-4 animate-spin text-primary" />
//                     <AlertDescription className="text-green-800">Checking resource availability for this location...</AlertDescription>
//                 </Alert>
//             )}

//             {formData.resourceAvailable === true && (
//                 <div className="flex items-center justify-between">
//                     <Alert className="flex justify-between border-gray-200">
//                         <AlertDescription className="text-green-700">
//                             <div className="flex items-center justify-between">
//                                 <span className="font-semibold">Resource available</span>
//                                 <Badge variant="outline" className="ml-2 text-green-800">
//                                     Ready to proceed
//                                 </Badge>
//                             </div>
//                             <p className="mt-1">Your selected location has the necessary infrastructure.</p>
//                         </AlertDescription>
//                         <CheckCircle className="h-5 w-5 !text-green-500" />
//                     </Alert>
//                 </div>
//             )}

//             {formData.resourceAvailable === false && (
//                 <div className="flex items-center justify-between">
//                     <Alert className="flex justify-between border-red-200">
//                         <AlertDescription className="text-red-700">
//                             <div className="flex items-center justify-between">
//                                 <span className="font-semibold">Resource not available</span>
//                             </div>
//                             <p className="mt-1">{formData.resourceMessage || 'Service not available in this location.'}</p>
//                         </AlertDescription>
//                         <Badge variant="destructive">Cannot proceed</Badge>
//                     </Alert>
//                 </div>
//             )}

//             {locationError && (
//                 <Alert variant="destructive">
//                     <AlertDescription>{locationError}</AlertDescription>
//                 </Alert>
//             )}
//         </div>
//     );
// }
import LocationMap from '@/components/location-map';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { parseCoordinate } from '@/lib/coordinate-utils';
import { checkResourceAvailability } from '@/lib/resource-check';
import { CheckCircle, Loader2, Locate, Navigation, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LocationSetupStepProps {
    formData: any;
    onUpdate: (data: any) => void;
}

const locationMethods = [
    {
        id: 'current',
        name: 'Current Location',
        description: 'Automatically detect your GPS location',
        icon: Locate,
        color: 'text-blue-600',
        bgColor: 'bg-blue-0',
    },
    {
        id: 'map',
        name: 'Map Selection',
        description: 'Select location on interactive map',
        icon: Search,
        color: 'text-green-600',
        bgColor: 'bg-green-0',
    },
    {
        id: 'manual',
        name: 'Manual Coordinates',
        description: 'Enter latitude and longitude',
        icon: Navigation,
        color: 'text-purple-600',
        bgColor: 'bg-purple-0',
    },
];

export function LocationSetupStep({ formData, onUpdate }: LocationSetupStepProps) {
    const [locationMethod, setLocationMethod] = useState('current');
    const [locationLoading, setLocationLoading] = useState(true); // Start with loading true
    const [locationError, setLocationError] = useState('');
    const [checkingResource, setCheckingResource] = useState(false);
    const [isInitialLocationSet, setIsInitialLocationSet] = useState(false);

    // Get current location automatically on component mount and show on map
    useEffect(() => {
        const getInitialLocation = async () => {
            if (isInitialLocationSet) return;

            setLocationLoading(true);
            setLocationError('');

            try {
                const position = await getCurrentLocationWithTimeout();
                const { latitude, longitude } = position.coords;
                const preciseLat = parseFloat(latitude.toFixed(6));
                const preciseLng = parseFloat(longitude.toFixed(6));

                await handleLocationSelect(preciseLat, preciseLng);
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
                await handleLocationSelect(defaultLat, defaultLng);
                setIsInitialLocationSet(true);

                // Still switch to map view even with default location
                setTimeout(() => {
                    setLocationMethod('map');
                }, 500);
            } finally {
                setLocationLoading(false);
            }
        };

        getInitialLocation();
    }, [isInitialLocationSet]);

    const getCurrentLocationWithTimeout = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Location request timed out'));
            }, 10000); // 10 second timeout

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
                    maximumAge: 60000, // Accept cached location up to 1 minute old
                },
            );
        });
    };

    const handleLocationSelect = async (lat: number, lng: number, address: string = '') => {
        onUpdate({
            latitude: lat,
            longitude: lng,
            address: address || formData.address,
        });

        setLocationError('');

        // Check resource availability
        setCheckingResource(true);
        try {
            const result = await checkResourceAvailability({ latitude: lat, longitude: lng }, formData.contactPerson || 'Customer');

            onUpdate({
                resourceAvailable: result.available,
                resourceData: result.data,
                resourceMessage: result.message,
            });
        } catch (error) {
            console.error('Resource check error:', error);
            onUpdate({ resourceAvailable: false });
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

            await handleLocationSelect(preciseLat, preciseLng);

            // Switch to map view to show the updated location
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

    const handleManualCoordinateSubmit = () => {
        const lat = parseCoordinate(formData.latitude.toString());
        const lng = parseCoordinate(formData.longitude.toString());

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

        handleLocationSelect(lat, lng);
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
                            <LocationMap
                                onLocationSelect={handleLocationSelect}
                                initialLat={formData.latitude || 9.0192}
                                initialLng={formData.longitude || 38.7525}
                            />
                        </div>
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
                                            // value={formData.latitude || '9.007428'}
                                            value={'9.007428'}
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
                                            // value={formData.longitude || '38.733708'}
                                            value={'38.733708'}
                                            onChange={(e) => onUpdate({ longitude: parseFloat(e.target.value) || 0 })}
                                        />
                                    </Field>
                                    <div className="flex items-end">
                                        <Button onClick={handleManualCoordinateSubmit} className="w-full hover:opacity-90">
                                            <Navigation className="mr-2 h-4 w-4" />
                                            Set Coordinates
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
                    <AlertDescription className="text-blue-800">Getting your current location and preparing the map...</AlertDescription>
                </Alert>
            )}

            {checkingResource && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <AlertDescription className="text-blue-800">Checking resource availability for this location...</AlertDescription>
                </Alert>
            )}

            {formData.resourceAvailable === true && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Resource available</span>
                            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                                Ready to proceed
                            </Badge>
                        </div>
                        <p className="mt-1">Your selected location has the necessary infrastructure.</p>
                    </AlertDescription>
                </Alert>
            )}

            {formData.resourceAvailable === false && (
                <Alert className="border-red-200">
                    <AlertDescription className="text-red-800">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Resource not available</span>
                            <Badge variant="destructive" className="ml-2">
                                Cannot proceed
                            </Badge>
                        </div>
                        <p className="mt-1">{formData.resourceMessage || 'Service not available in this location.'}</p>
                    </AlertDescription>
                </Alert>
            )}

            {locationError && (
                <Alert variant="destructive">
                    <AlertDescription>{locationError}</AlertDescription>
                </Alert>
            )}

            {/* Help Text - Only show when not loading */}
            {/* {!locationLoading && (
                <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">
                        <strong>Tip:</strong> Your location has been automatically detected and shown on the map above. You can drag the marker or
                        click anywhere on the map to adjust the location.
                    </p>
                </div>
            )} */}
        </div>
    );
}
