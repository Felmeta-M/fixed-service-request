import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseCoordinate } from '@/lib/coordinate-utils';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
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
import { toast } from 'sonner';

interface LocationSetupStepProps {
    formData: any;
    onUpdate: (data: any) => void;
    googleMapsApiKey: string;
    onNext?: (surveyId: string) => void;
    onContinueManually?: () => void;
    hasSeenResourceDialog?: boolean;
    onResourceDialogSeen?: () => void;
}

interface AuthUser {
    id?: number;
    customer_code?: string | number;
    name?: string;
    phone?: string;
    email?: string;
    api_token?: string;
}

export function LocationSetupStep({ formData, onUpdate, googleMapsApiKey, onNext, onContinueManually, hasSeenResourceDialog = false, onResourceDialogSeen }: LocationSetupStepProps) {
    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isMapAnimating, setIsMapAnimating] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [manualAddress, setManualAddress] = useState('');
    const [showResourceUnavailableDialog, setShowResourceUnavailableDialog] = useState(false);

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

    // Show modal when resource is not available, but only if user hasn't seen it yet
    useEffect(() => {
        if (formData.resourceAvailable === false && !hasSeenResourceDialog) {
            setShowResourceUnavailableDialog(true);
        }
    }, [formData.resourceAvailable, hasSeenResourceDialog]);


    // Handle "Continue Manually" button click - show manual step in flow
    const handleContinueManually = () => {
        setShowResourceUnavailableDialog(false);
        // Mark that user has seen the dialog
        onResourceDialogSeen?.();
        // Trigger manual step in parent flow
        onContinueManually?.();
    };

    // Handle dialog close - reset states if user cancels
    const handleDialogClose = (open: boolean) => {
        if (!open) {
            setShowResourceUnavailableDialog(false);
            // Mark that user has seen the dialog even if they cancel
            onResourceDialogSeen?.();
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
            {/* Map Section with Enhanced Styling */}
            <div className="space-y-4">
                <div className="relative h-full overflow-hidden rounded-xl border border-border shadow-lg transition-all duration-300 hover:shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none z-10" />
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

                {/* Location Details Card - Enhanced Design */}
                {(hasValidLocation || currentLocation) && (
                    <Card className="border border-border/50 bg-gradient-to-br from-card to-card/50 shadow-md transition-all duration-300 hover:shadow-lg">
                        <CardContent className="p-6">
                            <div className="space-y-5">
                                {/* Header Section */}
                                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-2 ring-primary/20">
                                            {locationLoading ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            ) : (
                                                <MapPin className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-foreground">
                                                {locationLoading ? 'Detecting Location...' : 'Selected Location'}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                {locationLoading ? 'Please wait while we detect your location' : 'Coordinates and address details'}
                                            </p>
                                        </div>
                                    </div>

                                    {(isGeocoding || isMapAnimating) && (
                                        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
                                            {isGeocoding && (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                                    <span className="text-xs font-medium text-primary">Geocoding...</span>
                                                </>
                                            )}
                                            {isMapAnimating && (
                                                <>
                                                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                                                    <span className="text-xs font-medium text-primary">Updating...</span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {!locationLoading && !isGeocoding && !isMapAnimating && (hasValidLocation || currentLocation) && (
                                        <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 ring-1 ring-green-200">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                            <span className="text-xs font-medium text-green-700">Confirmed</span>
                                        </div>
                                    )}
                                </div>

                                {/* Coordinates Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Coordinates
                                        </span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                    </div>

                                    <FieldGroup>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <Field>
                                                <FieldLabel htmlFor="manualLat" className="text-sm font-medium text-foreground">
                                                    Latitude
                                                </FieldLabel>
                                                <div className="relative">
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
                                                        className="h-11 border-border/60 bg-background/50 transition-all duration-200 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <span className="text-xs text-muted-foreground">°N</span>
                                                    </div>
                                                </div>
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="manualLng" className="text-sm font-medium text-foreground">
                                                    Longitude
                                                </FieldLabel>
                                                <div className="relative">
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
                                                        className="h-11 border-border/60 bg-background/50 transition-all duration-200 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <span className="text-xs text-muted-foreground">°E</span>
                                                    </div>
                                                </div>
                                            </Field>
                                        </div>
                                    </FieldGroup>

                                    {/* Address Display (if available) */}
                                    {mapLocation?.address && (
                                        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-muted-foreground">Address</p>
                                                    <p className="mt-1 text-sm text-foreground">{mapLocation.address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Enhanced Loading Alert */}
            {locationLoading && (
                <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                        <AlertDescription className="text-sm font-medium text-foreground">
                            {isEditingAddress ? 'Updating address...' : 'Getting your current location...'}
                        </AlertDescription>
                    </div>
                </Alert>
            )}

            {/* Enhanced Error Display */}
            {locationError && (
                <Alert className="border-destructive/20 bg-destructive/5 shadow-sm">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-sm text-destructive">
                        {locationError}
                    </AlertDescription>
                </Alert>
            )}

            {/* Enhanced Resource Unavailable Dialog */}
            <AlertDialog open={showResourceUnavailableDialog} onOpenChange={handleDialogClose}>
                <AlertDialogContent className="sm:max-w-lg">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 pb-2">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 ring-2 ring-amber-200">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                            <AlertDialogTitle className="text-xl font-semibold text-foreground">
                                Location Review Needed
                            </AlertDialogTitle>
                        </div>

                        <AlertDialogDescription className="space-y-3 pt-2 text-left">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                Thank you for selecting your location on the map. We're currently unable to automatically provision service for this location because available resources could not be confirmed.
                            </p>

                            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                <p className="text-sm leading-relaxed text-foreground">
                                    You can continue by submitting a manual request. Our team will review your location, perform a manual survey if needed, and contact you to assist with the next steps.
                                </p>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                We appreciate your patience and look forward to helping you get connected.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-2">
                        <AlertDialogCancel
                            onClick={() => setShowResourceUnavailableDialog(false)}
                            className="mt-0 sm:mt-0"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleContinueManually}
                            className="bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary/20"
                        >
                            Continue Manually
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
