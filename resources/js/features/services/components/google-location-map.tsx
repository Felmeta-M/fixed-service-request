import { Button } from '@/components/ui/button';
import { useGoogleMaps } from '@/contexts/google-maps-context';
import { formatCoordinate } from '@/lib/coordinate-utils';
import { reverseGeocode } from '@/lib/geocoding';
import { Circle, GoogleMap } from '@react-google-maps/api';
import { Layers, Loader2, Navigation, Target } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    LocationAccuracy,
    LocationAccuracyBadge,
    getAccuracyCircleOptions,
    getAccuracyConfig,
    getAccuracyLevel,
} from './location-accuracy-indicator';
import { AutocompleteSearch } from './map-search';

interface GoogleLocationMapProps {
    onLocationSelect: (lat: number, lng: number, address?: string, accuracy?: LocationAccuracy) => void;
    initialLat?: number;
    initialLng?: number;
    selectedLocation?: { lat: number; lng: number; address: string } | null;
    googleMapsApiKey: string;
    isAnimating?: boolean;
    onAnimationStateChange?: (isAnimating: boolean) => void;
    showCoverageArea?: boolean;
    onAccuracyChange?: (accuracy: LocationAccuracy | null) => void;
    autoDetectOnMount?: boolean;
    onAutoDetectStateChange?: (isDetecting: boolean) => void;
}

const mapContainerStyle = {
    width: '100%',
    height: '400px',
    minHeight: '300px',
};

const defaultCenter = {
    lat: 9.0192,
    lng: 38.7525,
};

export function GoogleLocationMap({
    onLocationSelect,
    initialLat = 9.0192,
    initialLng = 38.7525,
    selectedLocation,
    googleMapsApiKey,
    isAnimating,
    onAnimationStateChange,
    showCoverageArea = true,
    onAccuracyChange,
    autoDetectOnMount = false,
    onAutoDetectStateChange,
}: GoogleLocationMapProps) {
    const { isLoaded, loadError } = useGoogleMaps();

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isCoverageVisible, setIsCoverageVisible] = useState(showCoverageArea);
    const [isCoverageLoaded, setIsCoverageLoaded] = useState(false);
    const [locationAccuracy, setLocationAccuracy] = useState<LocationAccuracy | null>(null);
    const [showAccuracyCircle, setShowAccuracyCircle] = useState(true);
    const [detectionStatus, setDetectionStatus] = useState<string>('');
    const [, forceUpdate] = useState({});
    const [currentMapType, setCurrentMapType] = useState<google.maps.MapTypeId | string>('roadmap');

    const markerRef = useRef<google.maps.Marker | null>(null);
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
    const hasInitialized = useRef(false);
    const coverageDataRef = useRef<google.maps.Data.Feature[]>([]);
    const watchIdRef = useRef<number | null>(null);
    const autoDetectTriggeredRef = useRef(false);

    // Use refs for synchronous tracking (not affected by React's async state updates)
    const isInternalActionRef = useRef(false);
    const currentPositionRef = useRef<{ lat: number; lng: number } | null>(null);
    const internalAnimatingRef = useRef(false);

    // Notify parent of accuracy changes
    useEffect(() => {
        if (onAccuracyChange) {
            onAccuracyChange(locationAccuracy);
        }
    }, [locationAccuracy, onAccuracyChange]);

    // Notify parent of animation state
    useEffect(() => {
        if (onAnimationStateChange) {
            onAnimationStateChange(internalAnimatingRef.current);
        }
    }, [onAnimationStateChange]);

    // Notify parent of auto-detection state
    useEffect(() => {
        if (onAutoDetectStateChange) {
            onAutoDetectStateChange(isGettingLocation);
        }
    }, [isGettingLocation, onAutoDetectStateChange]);

    // Auto-detect location when map is ready
    useEffect(() => {
        if (autoDetectOnMount && isMapReady && map && !autoDetectTriggeredRef.current) {
            autoDetectTriggeredRef.current = true;
            const timer = setTimeout(() => {
                getCurrentLocation();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [autoDetectOnMount, isMapReady, map]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const getPrimaryColor = useCallback(() => '#84cc16', []);

    // Load coverage area
    const loadCoverageArea = useCallback(
        (map: google.maps.Map) => {
            if (isCoverageLoaded) return;

            const primaryColor = getPrimaryColor();

            map.data.loadGeoJson('/data/coverage_area.geojson', undefined, (features) => {
                coverageDataRef.current = features;
                setIsCoverageLoaded(true);

                map.data.setStyle({
                    fillColor: primaryColor,
                    fillOpacity: 0.1,
                    strokeColor: primaryColor,
                    strokeWeight: 1.5,
                    clickable: false,
                    visible: isCoverageVisible,
                });
            });
        },
        [isCoverageLoaded, isCoverageVisible, getPrimaryColor],
    );

    // Toggle coverage visibility
    const toggleCoverageVisibility = useCallback(() => {
        if (!map) return;
        const newVisibility = !isCoverageVisible;
        setIsCoverageVisible(newVisibility);
        const primaryColor = getPrimaryColor();
        map.data.setStyle({
            fillColor: primaryColor,
            fillOpacity: 0.15,
            strokeColor: primaryColor,
            strokeWeight: 1.5,
            clickable: false,
            visible: newVisibility,
        });
    }, [map, isCoverageVisible, getPrimaryColor]);

    // Initialize map
    const onLoad = useCallback(
        (loadedMap: google.maps.Map) => {
            setMap(loadedMap);
            setIsMapReady(true);
            infoWindowRef.current = new google.maps.InfoWindow();

            if (selectedLocation && !hasInitialized.current) {
                hasInitialized.current = true;
                loadedMap.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
                loadedMap.setZoom(16);
                currentPositionRef.current = { lat: selectedLocation.lat, lng: selectedLocation.lng };
            }

            if (showCoverageArea) {
                loadCoverageArea(loadedMap);
            }

            // Listen for map type changes to preserve user's selection
            loadedMap.addListener('maptypeid_changed', () => {
                const newMapType = loadedMap.getMapTypeId();
                if (newMapType) {
                    setCurrentMapType(newMapType);
                }
            });
        },
        [selectedLocation, showCoverageArea, loadCoverageArea],
    );

    const onUnmount = useCallback(() => {
        if (markerRef.current) {
            markerRef.current.setMap(null);
        }
        if (infoWindowRef.current) {
            infoWindowRef.current.close();
        }
        if (map && coverageDataRef.current.length > 0) {
            coverageDataRef.current.forEach((f) => map.data.remove(f));
            coverageDataRef.current = [];
        }
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        setMap(null);
        setIsMapReady(false);
        hasInitialized.current = false;
        setIsCoverageLoaded(false);
    }, [map]);

    // Simple pan without animation - just move directly
    const panTo = useCallback(
        (lat: number, lng: number, zoom: number = 16) => {
            if (!map) return;
            map.panTo({ lat, lng });
            if (map.getZoom() !== zoom) {
                map.setZoom(zoom);
            }
            currentPositionRef.current = { lat, lng };
        },
        [map],
    );

    // Get address from coordinates
    const getAddressFromCoordinates = useCallback(async (lat: number, lng: number): Promise<string> => {
        try {
            setIsGeocoding(true);
            return await reverseGeocode(lat, lng);
        } catch {
            return 'Address service temporarily unavailable';
        } finally {
            setIsGeocoding(false);
        }
    }, []);

    // Update or create marker at position
    const placeMarker = useCallback(
        (lat: number, lng: number, animate: boolean = true) => {
            if (!map) return;

            // Remove existing marker
            if (markerRef.current) {
                markerRef.current.setMap(null);
                markerRef.current = null;
            }

            // Create new marker
            markerRef.current = new google.maps.Marker({
                position: { lat, lng },
                map: map,
                title: 'Selected Location',
                draggable: true,
                animation: animate ? google.maps.Animation.DROP : undefined,
            });

            // Drag end handler
            markerRef.current.addListener('dragend', async (event: google.maps.MapMouseEvent) => {
                if (!event.latLng) return;

                const newLat = parseFloat(event.latLng.lat().toFixed(6));
                const newLng = parseFloat(event.latLng.lng().toFixed(6));

                // Mark as internal action
                isInternalActionRef.current = true;
                currentPositionRef.current = { lat: newLat, lng: newLng };

                // Pan map to follow marker
                panTo(newLat, newLng);

                const accuracy: LocationAccuracy = {
                    meters: 0,
                    level: 'excellent',
                    timestamp: Date.now(),
                };
                setLocationAccuracy(accuracy);

                const address = await getAddressFromCoordinates(newLat, newLng);
                onLocationSelect(newLat, newLng, address, accuracy);

                // Reset flag after a delay
                setTimeout(() => {
                    isInternalActionRef.current = false;
                }, 100);
            });

            // Click handler for info window
            markerRef.current.addListener('click', () => {
                if (infoWindowRef.current && markerRef.current) {
                    const position = markerRef.current.getPosition();
                    if (position) {
                        infoWindowRef.current.setContent(`
                        <div class="p-2 max-w-xs">
                            <strong class="text-sm font-semibold">Selected Location</strong><br>
                            <span class="text-xs">Lat: ${formatCoordinate(position.lat())}</span><br>
                            <span class="text-xs">Lng: ${formatCoordinate(position.lng())}</span>
                        </div>
                    `);
                        infoWindowRef.current.open(map, markerRef.current);
                    }
                }
            });

            currentPositionRef.current = { lat, lng };
        },
        [map, panTo, getAddressFromCoordinates, onLocationSelect],
    );

    // Handle map click
    const onMapClick = useCallback(
        async (event: google.maps.MapMouseEvent) => {
            if (!event.latLng || !map) return;

            const lat = parseFloat(event.latLng.lat().toFixed(6));
            const lng = parseFloat(event.latLng.lng().toFixed(6));

            // Mark as internal action IMMEDIATELY (synchronous)
            isInternalActionRef.current = true;
            currentPositionRef.current = { lat, lng };

            // Pan and place marker
            panTo(lat, lng, 16);
            placeMarker(lat, lng);

            const accuracy: LocationAccuracy = {
                meters: 0,
                level: 'excellent',
                timestamp: Date.now(),
            };
            setLocationAccuracy(accuracy);

            // Get address and notify parent
            const address = await getAddressFromCoordinates(lat, lng);
            onLocationSelect(lat, lng, address, accuracy);

            // Reset flag after parent state has updated
            setTimeout(() => {
                isInternalActionRef.current = false;
            }, 100);
        },
        [map, panTo, placeMarker, getAddressFromCoordinates, onLocationSelect],
    );

    // Handle search selection
    const handleSearchSelect = useCallback(
        async (lat: number, lng: number, address: string) => {
            // Mark as internal action
            isInternalActionRef.current = true;
            currentPositionRef.current = { lat, lng };

            panTo(lat, lng, 16);
            placeMarker(lat, lng);

            const accuracy: LocationAccuracy = {
                meters: 0,
                level: 'excellent',
                timestamp: Date.now(),
            };
            setLocationAccuracy(accuracy);
            onLocationSelect(lat, lng, address, accuracy);

            setTimeout(() => {
                isInternalActionRef.current = false;
            }, 100);
        },
        [panTo, placeMarker, onLocationSelect],
    );

    // Watch for EXTERNAL selectedLocation changes only
    useEffect(() => {
        if (!map || !selectedLocation || !isMapReady) return;

        // Skip if this was triggered by our own internal action
        if (isInternalActionRef.current) {
            return;
        }

        // Check if we're already at this position
        const current = currentPositionRef.current;
        if (current) {
            const latDiff = Math.abs(current.lat - selectedLocation.lat);
            const lngDiff = Math.abs(current.lng - selectedLocation.lng);
            if (latDiff < 0.00001 && lngDiff < 0.00001) {
                return;
            }
        }

        // This is a genuine external update - pan and place marker
        panTo(selectedLocation.lat, selectedLocation.lng, 16);
        placeMarker(selectedLocation.lat, selectedLocation.lng, false);
    }, [map, selectedLocation, isMapReady, panTo, placeMarker]);

    // Geolocation permission check
    const checkGeolocationPermission = async (): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> => {
        if ('permissions' in navigator && 'query' in navigator.permissions) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                return result.state;
            } catch {
                return 'unknown';
            }
        }
        return 'unknown';
    };

    // Get current location with progressive accuracy
    const getCurrentLocation = useCallback(async () => {
        if (!navigator.geolocation || !map) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        const permissionStatus = await checkGeolocationPermission();
        if (permissionStatus === 'denied') {
            toast.error('Location access is blocked. Please enable location permissions in your browser settings.', {
                duration: 6000,
            });
            return;
        }

        setIsGettingLocation(true);
        setDetectionStatus('Requesting location permission...');

        const toastId = toast.loading('Detecting your location...', {
            description: 'Please allow location access when prompted',
        });

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        let bestPosition: GeolocationPosition | null = null;
        let updateCount = 0;
        const maxUpdates = 5;
        const maxWaitTime = 15000;
        let timeoutId: NodeJS.Timeout | null = null;

        const processPosition = async (position: GeolocationPosition) => {
            updateCount++;
            const { latitude, longitude, accuracy } = position.coords;

            if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
                bestPosition = position;

                const lat = parseFloat(latitude.toFixed(6));
                const lng = parseFloat(longitude.toFixed(6));
                const accuracyMeters = Math.round(accuracy);
                const accuracyLevel = getAccuracyLevel(accuracyMeters);

                const locationAccuracyData: LocationAccuracy = {
                    meters: accuracyMeters,
                    level: accuracyLevel,
                    timestamp: Date.now(),
                };

                setLocationAccuracy(locationAccuracyData);
                setDetectionStatus(
                    `Accuracy: ±${accuracyMeters}m${accuracyLevel !== 'excellent' && accuracyLevel !== 'good' ? ' (improving...)' : ''}`,
                );

                toast.loading(`Location detected (±${accuracyMeters}m)`, {
                    id: toastId,
                    description: accuracyLevel === 'excellent' || accuracyLevel === 'good' ? 'Good accuracy achieved!' : 'Improving accuracy...',
                });

                // Mark as internal action
                isInternalActionRef.current = true;
                currentPositionRef.current = { lat, lng };

                panTo(lat, lng, 16);
                placeMarker(lat, lng);

                const address = await getAddressFromCoordinates(lat, lng);
                onLocationSelect(lat, lng, address, locationAccuracyData);

                setTimeout(() => {
                    isInternalActionRef.current = false;
                }, 100);

                if (accuracyLevel === 'excellent' || accuracyLevel === 'good' || updateCount >= maxUpdates) {
                    finishDetection(true);
                }
            }
        };

        const finishDetection = (success: boolean) => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            setIsGettingLocation(false);
            setDetectionStatus('');
            toast.dismiss(toastId);

            if (success && bestPosition) {
                const accuracy = Math.round(bestPosition.coords.accuracy);
                const level = getAccuracyLevel(accuracy);
                const config = getAccuracyConfig(level);

                if (level === 'excellent' || level === 'good') {
                    toast.success(`Location detected with ${config.label.toLowerCase()} accuracy (±${accuracy}m)`, {
                        duration: 3000,
                    });
                } else {
                    toast.warning(`Location detected with ${config.label.toLowerCase()} accuracy (±${accuracy}m). Click on the map to refine.`, {
                        duration: 5000,
                    });
                }
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            finishDetection(false);
            let msg = 'Unable to retrieve your location.';
            if (error.code === error.PERMISSION_DENIED) {
                msg = 'Location access denied. Please enable location permissions.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                msg = 'Location unavailable. Check your device location services.';
            } else if (error.code === error.TIMEOUT) {
                msg = 'Location request timed out. Please try again.';
            }
            toast.error(msg, { duration: 5000 });
        };

        timeoutId = setTimeout(() => {
            if (bestPosition) {
                finishDetection(true);
            } else {
                finishDetection(false);
                toast.error('Could not detect location. Please select on the map.', { duration: 5000 });
            }
        }, maxWaitTime);

        watchIdRef.current = navigator.geolocation.watchPosition(processPosition, handleError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });
    }, [map, panTo, placeMarker, getAddressFromCoordinates, onLocationSelect]);

    const isCurrentlyAnimating = isAnimating !== undefined ? isAnimating : internalAnimatingRef.current;

    const getInitialCenter = () => {
        if (selectedLocation) {
            return { lat: selectedLocation.lat, lng: selectedLocation.lng };
        }
        if (initialLat !== 9.0192 || initialLng !== 38.7525) {
            return { lat: initialLat, lng: initialLng };
        }
        return defaultCenter;
    };

    if (loadError) {
        return (
            <div className="w-full space-y-2">
                <div className="relative w-full overflow-hidden rounded-sm bg-gray-100" style={mapContainerStyle}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="px-4 text-center">
                            <p className="mb-2 text-sm font-medium text-red-600">Failed to load Google Maps</p>
                            <p className="text-xs text-gray-600">Please check your internet connection.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full space-y-2">
                <div className="relative w-full overflow-hidden rounded-sm bg-gray-100" style={mapContainerStyle}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-gray-700">Loading Google Maps...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-2">
            {/* Search Bar and Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="w-full min-w-0 flex-1">
                    <AutocompleteSearch
                        onPlaceSelect={handleSearchSelect}
                        isLoading={isCurrentlyAnimating}
                        placeholder="Search location..."
                        disabled={!isMapReady}
                    />
                </div>
                <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                    <Button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation || isCurrentlyAnimating || !isMapReady}
                        size="sm"
                        className="h-8 flex-1 text-xs sm:h-9 sm:flex-initial sm:shrink-0 sm:text-sm"
                    >
                        {isGettingLocation ? (
                            <>
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                <span>Detecting...</span>
                            </>
                        ) : (
                            <>
                                <Navigation className="h-4 w-4 shrink-0 sm:mr-1" />
                                <span>Get My Location</span>
                            </>
                        )}
                    </Button>
                    {showCoverageArea && (
                        <Button
                            type="button"
                            onClick={toggleCoverageVisibility}
                            disabled={!isMapReady || !isCoverageLoaded}
                            size="sm"
                            variant={isCoverageVisible ? 'default' : 'outline'}
                            className="h-8 shrink-0 text-xs sm:h-9 sm:text-sm"
                        >
                            <Layers className="h-4 w-4 shrink-0 sm:mr-1" />
                            <span>{isCoverageVisible ? 'Hide' : 'Show'} Fiber Coverage</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Detection Status */}
            {isGettingLocation && detectionStatus && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">{detectionStatus}</span>
                </div>
            )}

            {/* Accuracy Badge */}
            {!isGettingLocation && locationAccuracy && locationAccuracy.meters > 0 && (
                <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                        <LocationAccuracyBadge accuracy={locationAccuracy} size="sm" />
                        {locationAccuracy.level !== 'excellent' && locationAccuracy.level !== 'good' && (
                            <span className="text-xs text-muted-foreground">Click on map for precise selection</span>
                        )}
                    </div>
                    {locationAccuracy.meters > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAccuracyCircle(!showAccuracyCircle)}
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <Target className="mr-1 h-3 w-3" />
                            {showAccuracyCircle ? 'Hide' : 'Show'} radius
                        </Button>
                    )}
                </div>
            )}

            {/* Map Container */}
            <div className="relative w-full overflow-hidden rounded-sm">
                {!isMapReady && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                            <p className="text-sm font-medium text-gray-700">Initializing map...</p>
                        </div>
                    </div>
                )}

                <div className="absolute top-2 right-2 left-2 z-10 rounded-sm bg-white/90 px-2 py-1.5 text-[10px] font-medium text-gray-700 backdrop-blur-sm sm:right-14 sm:left-auto sm:px-3 sm:py-2 sm:text-xs">
                    <span className="hidden sm:inline">📍 Click on map or drag marker to select location</span>
                    <span className="sm:hidden">📍 Click map or drag marker</span>
                </div>

                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={getInitialCenter()}
                    zoom={15}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={onMapClick}
                    options={{
                        mapTypeId: currentMapType as google.maps.MapTypeId,
                        streetViewControl: true,
                        mapTypeControl: true,
                        fullscreenControl: true,
                        zoomControl: true,
                        gestureHandling: 'greedy',
                        // Disable double-click zoom to prevent accidental map type resets
                        disableDoubleClickZoom: true,
                        styles: [
                            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'on' }] },
                            { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
                        ],
                    }}
                >
                    {showAccuracyCircle && locationAccuracy && locationAccuracy.meters > 0 && selectedLocation && (
                        <Circle
                            center={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                            options={getAccuracyCircleOptions({
                                center: { lat: selectedLocation.lat, lng: selectedLocation.lng },
                                radiusMeters: locationAccuracy.meters,
                                level: locationAccuracy.level,
                            })}
                        />
                    )}
                </GoogleMap>
            </div>
        </div>
    );
}
