import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { parseCoordinate } from '@/lib/coordinate-utils';
import { reverseGeocodeDetailed, geocodeAddress, formatAddressSummary, type StructuredAddress } from '@/lib/geocoding';
import { useServiceFormStore } from '@/store/service-form-store';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleLocationMap } from '../google-location-map';
import {
    LocationAccuracy,
    LocationAccuracyIndicator,
    shouldPromptManualSelection,
} from '../location-accuracy-indicator';

interface LocationSetupStepProps {
    googleMapsApiKey: string;
    onNext?: (surveyId: string) => void;
    onContinueManually?: () => void;
}

interface AuthUser {
    id?: number;
    customer_code?: string | number;
    name?: string;
    phone?: string;
    email?: string;
    api_token?: string;
}

export function LocationSetupStep({
    googleMapsApiKey,
    onNext,
    onContinueManually,
}: LocationSetupStepProps) {
    // ── Zustand store ─────────────────────────────────────────────────────
    const formData = useServiceFormStore((s) => s.formData);
    const updateFormData = useServiceFormStore((s) => s.updateFormData);
    const hasSeenResourceDialog = useServiceFormStore((s) => s.hasSeenResourceDialog);
    const setHasSeenResourceDialog = useServiceFormStore((s) => s.setHasSeenResourceDialog);

    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isMapAnimating, setIsMapAnimating] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [manualAddress, setManualAddress] = useState('');
    const [showResourceUnavailableDialog, setShowResourceUnavailableDialog] = useState(false);
    const [locationAccuracy, setLocationAccuracy] = useState<LocationAccuracy | null>(null);
    const [isAutoDetecting, setIsAutoDetecting] = useState(false);
    const [autoDetectTriggered, setAutoDetectTriggered] = useState(false);

    const [manualLat, setManualLat] = useState(formData.latitude || '');
    const [manualLng, setManualLng] = useState(formData.longitude || '');
    const [showUpdateBtn, setShowUpdateBtn] = useState(false);

    const isFirstMount = useRef(true);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleLocationMapRef = useRef<{ triggerGetLocation: () => void } | null>(null);

    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    // Auto-detect location on mount (if no existing location)
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            
            // If we already have valid coordinates from a previous session, use them
            if (formData.latitude && formData.longitude && formData.latitude !== 0 && formData.longitude !== 0) {
                setCurrentLocation({
                    lat: formData.latitude,
                    lng: formData.longitude,
                    address: formData.address || '',
                });
                setManualLat(formData.latitude.toString());
                setManualLng(formData.longitude.toString());
                setManualAddress(formData.address || '');
                
                // Set accuracy based on whether this was manually selected
                if (formData.locationAccuracy) {
                    setLocationAccuracy(formData.locationAccuracy as LocationAccuracy);
                }
            } else {
                // No existing location - trigger auto-detection
                setAutoDetectTriggered(true);
            }
        }
    }, []);

    // Show dialog when resource is not available for any reason
    useEffect(() => {
        if (formData.resourceAvailable === false && !hasSeenResourceDialog) {
            setShowResourceUnavailableDialog(true);
        }
    }, [formData.resourceAvailable, hasSeenResourceDialog]);

    // Handle "Continue Manually" button click - show manual step in flow
    const handleContinueManually = () => {
        setShowResourceUnavailableDialog(false);
        setHasSeenResourceDialog(true);
        onContinueManually?.();
    };

    // Handle dialog close - reset states if user cancels
    const handleDialogClose = (open: boolean) => {
        if (!open) {
            setShowResourceUnavailableDialog(false);
            setHasSeenResourceDialog(true);
        }
    };

    const lastStructuredRef = useRef<StructuredAddress | undefined>(undefined);

    const getGoogleAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
        try {
            setIsGeocoding(true);
            const detailed = await reverseGeocodeDetailed(lat, lng);
            lastStructuredRef.current = detailed;
            return detailed.formatted;
        } catch (error) {
            lastStructuredRef.current = undefined;
            return 'Address service temporarily unavailable';
        } finally {
            setIsGeocoding(false);
        }
    };

    const getCoordinatesFromAddress = async (address: string): Promise<{ lat: number; lng: number; address: string } | null> => {
        try {
            setIsGeocoding(true);
            return await geocodeAddress(address);
        } catch (error) {
            return null;
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleLocationSelect = async (
        lat: number,
        lng: number,
        address: string = '',
        accuracy?: LocationAccuracy,
        addressComponents?: StructuredAddress,
    ) => {
        const finalAddress = address || (await getGoogleAddressFromCoordinates(lat, lng));
        const components = addressComponents ?? lastStructuredRef.current;

        setCurrentLocation({
            lat: lat,
            lng: lng,
            address: finalAddress,
        });

        if (accuracy) {
            setLocationAccuracy(accuracy);
        }

        updateFormData({
            latitude: lat,
            longitude: lng,
            address: finalAddress,
            addressComponents: components,
            locationAccuracy: accuracy || locationAccuracy || undefined,
            resourceAvailable: undefined,
            resourceData: undefined,
            resourceMessage: '',
        });

        setManualAddress(finalAddress);
        setManualLat(lat.toString());
        setManualLng(lng.toString());
        setIsEditingAddress(false);
    };

    // Handle accuracy changes from the map component
    const handleAccuracyChange = useCallback((accuracy: LocationAccuracy | null) => {
        setLocationAccuracy(accuracy);
    }, []);

    // Handle auto-detection state changes from the map component
    const handleAutoDetectStateChange = useCallback((isDetecting: boolean) => {
        setIsAutoDetecting(isDetecting);
    }, []);

    const handleManualCoordinateSubmit = async () => {
        const lat = parseCoordinate(manualLat);
        const lng = parseCoordinate(manualLng);

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

        setLocationError('');
        setLocationLoading(true);
        
        try {
            const address = await getGoogleAddressFromCoordinates(lat, lng);
            const manualAccuracy: LocationAccuracy = {
                meters: 0,
                level: 'excellent',
                timestamp: Date.now(),
            };
            await handleLocationSelect(lat, lng, address, manualAccuracy);
        } finally {
            setLocationLoading(false);
        }
        
        setShowUpdateBtn(false);
    };

    const handleManualAddressUpdate = async () => {
        if (!manualAddress.trim()) return;

        setLocationLoading(true);
        setLocationError('');

        try {
            const location = await getCoordinatesFromAddress(manualAddress);
            if (location) {
                const searchAccuracy: LocationAccuracy = {
                    meters: 0,
                    level: 'excellent',
                    timestamp: Date.now(),
                };
                await handleLocationSelect(location.lat, location.lng, location.address, searchAccuracy);
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

    // Scroll to map section
    const scrollToMap = () => {
        mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    // Determine if we should show the accuracy warning
    const showAccuracyWarning = locationAccuracy && shouldPromptManualSelection(locationAccuracy) && !isAutoDetecting;

    return (
        <div className="w-full max-w-full space-y-6 overflow-x-hidden">
            {/* Map Section */}
            <div className="space-y-4" ref={mapRef}>
                <div className="relative h-full w-full overflow-hidden rounded-sm shadow-xs">
                    <div className="pointer-events-none absolute inset-0 z-10" />
                    <GoogleLocationMap
                        onLocationSelect={handleLocationSelect}
                        initialLat={mapLocation?.lat || 9.0192}
                        initialLng={mapLocation?.lng || 38.7525}
                        selectedLocation={mapLocation}
                        googleMapsApiKey={googleMapsApiKey}
                        isAnimating={isMapAnimating}
                        onAnimationStateChange={setIsMapAnimating}
                        showCoverageArea={true}
                        onAccuracyChange={handleAccuracyChange}
                        autoDetectOnMount={autoDetectTriggered}
                        onAutoDetectStateChange={handleAutoDetectStateChange}
                    />
                </div>

                {/* Accuracy Warning - Show when accuracy is poor and not currently detecting */}
                {showAccuracyWarning && currentLocation && (
                    <LocationAccuracyIndicator
                        accuracy={locationAccuracy}
                        onRefineLocation={scrollToMap}
                        onSelectOnMap={scrollToMap}
                        compact={false}
                    />
                )}

                {/* Location Details Card - Enhanced Design */}
                {(hasValidLocation || currentLocation) && (
                    <Card className="w-full shadow-none transition-all duration-300">
                        <CardContent className="shadow-none p-4 sm:p-6">
                            <div className="space-y-5">
                                {/* Header Section */}
                                <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ring-1 ring-primary/80">
                                            {locationLoading ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            ) : (
                                                <MapPin className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-base font-semibold text-foreground sm:text-lg">
                                                {locationLoading ? 'Updating Location...' : 'Selected Location'}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                {locationLoading ? 'Please wait while we update your location' : 'Coordinates and address details'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        {(isGeocoding || isMapAnimating) && (
                                            <div className="flex items-center gap-2 rounded-full px-2 py-1.5 sm:px-3">
                                                {isGeocoding && (
                                                    <>
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                                                        <span className="hidden text-xs font-medium text-primary sm:inline">Geocoding...</span>
                                                    </>
                                                )}
                                                {isMapAnimating && (
                                                    <>
                                                        <div className="h-2 w-2 animate-pulse rounded-full bg-primary shrink-0" />
                                                        <span className="hidden text-xs font-medium text-primary sm:inline">Updating...</span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {!locationLoading && !isGeocoding && !isMapAnimating && (hasValidLocation || currentLocation) && (
                                            <div className="flex items-center gap-1.5 rounded-full px-2 py-1.5 sm:px-3">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-et-green shrink-0" />
                                                <span className="hidden text-xs font-medium text-et-green sm:inline">Confirmed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Coordinates Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Coordinates</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                    </div>

                                    <FieldGroup>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                                        className="h-11 w-full border-border/60 bg-background/50 transition-all duration-200 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                                                    />
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
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
                                                        className="h-11 w-full border-border/60 bg-background/50 transition-all duration-200 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                                                    />
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                        <span className="text-xs text-muted-foreground">°E</span>
                                                    </div>
                                                </div>
                                            </Field>
                                        </div>
                                    </FieldGroup>

                                    {/* Update Location Button */}
                                    {showUpdateBtn && (
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                onClick={handleManualCoordinateSubmit}
                                                disabled={locationLoading || isGeocoding || isMapAnimating}
                                                className="h-9 w-full px-4 text-sm sm:w-auto"
                                            >
                                                {locationLoading || isGeocoding ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                                                        <span>Updating...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <MapPin className="mr-2 h-4 w-4 shrink-0" />
                                                        <span>Update Location</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Address Display */}
                                    {mapLocation?.address && (
                                        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-medium text-muted-foreground">Address</p>
                                                    <p className="mt-1 break-words text-sm text-foreground">{mapLocation.address}</p>
                                                    {formatAddressSummary(formData.addressComponents) && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {formatAddressSummary(formData.addressComponents)}
                                                        </p>
                                                    )}
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
                <Alert className="flex items-center shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                        <AlertDescription className="text-sm font-medium text-foreground">
                            {isEditingAddress ? 'Updating address...' : 'Updating your location...'}
                        </AlertDescription>
                    </div>
                </Alert>
            )}

            {/* Enhanced Error Display */}
            {locationError && (
                <Alert className="border-destructive/20 bg-destructive/5 shadow-sm">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-sm text-destructive">{locationError}</AlertDescription>
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
                            <AlertDialogTitle className="text-xl font-semibold text-foreground">Notice</AlertDialogTitle>
                        </div>

                        <AlertDialogDescription className="space-y-3 pt-2 text-left">
                            <div className="text-sm leading-relaxed text-muted-foreground">
                                <p>Dear Customer,</p>
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                            Thank you for selecting your location on the map! We wanted to let you know that, at the moment, we can't automatically set up service for your area because we couldn't confirm available resources.
                            </p>

                            <div className="text-sm leading-relaxed text-muted-foreground">
                        
                                But don't worry! You can still submit a manual request. Our team will take a closer look at your location, and if needed, we'll conduct a site assessment. We'll reach out to you soon to guide you through the next steps.
                               
                            </div>

                            <p className="text-xs text-muted-foreground">
                            We really appreciate your patience and can't wait to help you get connected!
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-2">
                        <AlertDialogCancel onClick={() => setShowResourceUnavailableDialog(false)} className="mt-0 sm:mt-0">
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
