import LocationMap from '@/components/location-map';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCoordinate, parseCoordinate } from '@/lib/coordinate-utils';
import { checkResourceAvailability } from '@/lib/resource-check';
import { CheckCircle, Loader2, MapPin, Navigation, Search } from 'lucide-react';
import { useState } from 'react';

interface LocationSetupStepProps {
    formData: any;
    onUpdate: (data: any) => void;
}

const locationMethods = [
    {
        id: 'current',
        name: 'Current Location',
        description: 'Automatically detect your GPS location',
        icon: MapPin,
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
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [checkingResource, setCheckingResource] = useState(false);

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

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser');
            return;
        }

        setLocationLoading(true);
        setLocationError('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const preciseLat = parseFloat(latitude.toFixed(6));
                const preciseLng = parseFloat(longitude.toFixed(6));

                handleLocationSelect(preciseLat, preciseLng);
                setLocationLoading(false);
            },
            (error) => {
                setLocationError('Failed to get your location. Please check browser permissions.');
                setLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000,
            },
        );
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
            <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Choose Location Method</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {locationMethods.map((method) => {
                        const IconComponent = method.icon;
                        const isSelected = locationMethod === method.id;

                        return (
                            <Card
                                key={method.id}
                                className={`cursor-pointer border-2 transition-all duration-200 ${isSelected ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300'} `}
                                onClick={() => setLocationMethod(method.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`rounded-lg p-2 ${method.bgColor}`}>
                                            <IconComponent className={`h-5 w-5 ${method.color}`} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{method.name}</h4>
                                            <p className="text-sm text-gray-600">{method.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Location Method Content */}
            <div className="mt-6">
                {locationMethod === 'current' && (
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-gray-900">Current Location Detection</h4>
                                    <p className="mt-1 text-sm text-gray-600">We'll use your device's GPS to automatically detect your location</p>
                                </div>
                                <Button onClick={getCurrentLocation} disabled={locationLoading} className="hover:opacity-90">
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
                        </CardContent>
                    </Card>
                )}

                {locationMethod === 'map' && (
                    <div className="space-y-4">
                        {/* <Card>
                            <CardContent className="p-6">
                                <h4 className="mb-2 font-semibold text-gray-900">Interactive Map</h4>
                                <p className="text-sm text-gray-600">Click on the map to select your exact installation location</p>
                            </CardContent>
                        </Card> */}
                        <div className="h-96 rounded-lg border">
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
                        <CardContent className="p-6">
                            <h4 className="mb-4 font-semibold text-gray-900">Enter Coordinates</h4>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <Label htmlFor="latitude">Latitude</Label>
                                    <Input
                                        id="latitude"
                                        type="number"
                                        step="any"
                                        // value={formData.latitude || ''}
                                        value={formData.latitude || '9.007428'}
                                        onChange={(e) => onUpdate({ latitude: parseFloat(e.target.value) || 0 })}
                                        placeholder="9.007428"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="longitude">Longitude</Label>
                                    <Input
                                        id="longitude"
                                        type="number"
                                        step="any"
                                        // value={formData.longitude || ''}
                                        value={formData.longitude || '38.733708'}
                                        onChange={(e) => onUpdate({ longitude: parseFloat(e.target.value) || 0 })}
                                        placeholder="38.733708"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={handleManualCoordinateSubmit} className="w-full hover:opacity-90">
                                        <Navigation className="mr-2 h-4 w-4" />
                                        Set Coordinates
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Location Status */}
            {formData.latitude !== 0 && formData.longitude !== 0 && (
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-green-800">Location Set</p>
                                <p className="text-sm text-green-700">
                                    {formatCoordinate(formData.latitude)}, {formatCoordinate(formData.longitude)}
                                </p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Resource Check Status */}
            {checkingResource && (
                <Alert className="">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <AlertDescription className="text-green-800">Checking resource availability for this location...</AlertDescription>
                </Alert>
            )}

            {formData.resourceAvailable === true && (
                <div className="flex items-center justify-between">
                    <Alert className="flex justify-between border-gray-200">
                        <AlertDescription className="text-green-700">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Resource available</span>
                                <Badge variant="outline" className="ml-2 text-green-800">
                                    Ready to proceed
                                </Badge>
                            </div>
                            <p className="mt-1">Your selected location has the necessary infrastructure.</p>
                        </AlertDescription>
                        <CheckCircle className="h-5 w-5 !text-green-500" />
                    </Alert>
                </div>
            )}

            {formData.resourceAvailable === false && (
                <Alert className="border-red-200">
                    <AlertDescription className="text-red-800">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Resource not available</span>
                            <Badge variant="destructive">Cannot proceed</Badge>
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
        </div>
    );
}
