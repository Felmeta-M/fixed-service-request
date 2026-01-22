import { Button } from '@/components/ui/button';
import { formatCoordinate } from '@/lib/coordinate-utils';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { Layers, Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AutocompleteSearch } from './map-search';

interface GoogleLocationMapProps {
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    initialLat?: number;
    initialLng?: number;
    selectedLocation?: { lat: number; lng: number; address: string } | null;
    googleMapsApiKey: string;
    isAnimating?: boolean;
    onAnimationStateChange?: (isAnimating: boolean) => void;
    showCoverageArea?: boolean;
}

const mapContainerStyle = {
    width: '100%',
    height: '400px',
};

const defaultCenter = {
    lat: 9.0192,
    lng: 38.7525,
};

// Smooth easing function for natural motion
const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Add this constant outside your component
const LIBRARIES: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['places'];

export function GoogleLocationMap({
    onLocationSelect,
    initialLat = 9.0192,
    initialLng = 38.7525,
    selectedLocation,
    googleMapsApiKey,
    isAnimating,
    onAnimationStateChange,
    showCoverageArea = true,
}: GoogleLocationMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [internalAnimating, setInternalAnimating] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isCoverageVisible, setIsCoverageVisible] = useState(showCoverageArea);
    const [isCoverageLoaded, setIsCoverageLoaded] = useState(false);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
    const animationRef = useRef<number | null>(null);
    const hasInitialized = useRef(false);
    const coverageDataRef = useRef<google.maps.Data.Feature[]>([]);

    // Sync animation state with parent
    useEffect(() => {
        if (onAnimationStateChange) {
            onAnimationStateChange(internalAnimating);
        }
    }, [internalAnimating, onAnimationStateChange]);

    // Get primary color from CSS variable
    const getPrimaryColor = useCallback(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryColor = rootStyles.getPropertyValue('--primary').trim();
        // Convert OKLCH to a usable color - fallback to brand lime-green
        // The primary color oklch(0.761 0.1736 129.58) ≈ #84cc16
        return primaryColor ? '#84cc16' : '#84cc16';
    }, []);

    // Load coverage area GeoJSON
    const loadCoverageArea = useCallback(
        (map: google.maps.Map) => {
            if (isCoverageLoaded) return;

            const primaryColor = getPrimaryColor();

            // Load the GeoJSON file
            map.data.loadGeoJson('/data/coverage_area.geojson', undefined, (features) => {
                coverageDataRef.current = features;
                setIsCoverageLoaded(true);

                // Apply styling to coverage polygons using primary brand color
                map.data.setStyle({
                    fillColor: primaryColor,
                    fillOpacity: 0.1,
                    strokeColor: primaryColor,
                    strokeWeight: 1.5,
                    clickable: false,
                });

                // Set initial visibility based on prop
                if (!isCoverageVisible) {
                    map.data.setStyle({ visible: false });
                }
            });
        },
        [isCoverageLoaded, isCoverageVisible, getPrimaryColor],
    );

    // Toggle coverage area visibility
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
        (map: google.maps.Map) => {
            setMap(map);
            setIsLoading(false);

            // Create info window once
            infoWindowRef.current = new google.maps.InfoWindow();

            // If we have a selected location, center the map on it
            if (selectedLocation && !hasInitialized.current) {
                hasInitialized.current = true;
                map.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
                map.setZoom(16);
            }

            // Load coverage area if enabled
            if (showCoverageArea) {
                loadCoverageArea(map);
            }
        },
        [selectedLocation, showCoverageArea, loadCoverageArea],
    );

    const onUnmount = useCallback(() => {
        // Clean up animations
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        // Clean up markers and info windows
        if (markerRef.current) {
            markerRef.current.setMap(null);
        }
        if (infoWindowRef.current) {
            infoWindowRef.current.close();
        }

        // Clean up coverage area data
        if (map && coverageDataRef.current.length > 0) {
            coverageDataRef.current.forEach((feature) => {
                map.data.remove(feature);
            });
            coverageDataRef.current = [];
        }

        setMap(null);
        hasInitialized.current = false;
        setIsCoverageLoaded(false);
    }, [map]);

    // Smooth pan to location with animation
    const smoothPanTo = useCallback(
        (targetLat: number, targetLng: number, zoom: number = 16) => {
            if (!map) return;

            const startLat = map.getCenter()?.lat() || defaultCenter.lat;
            const startLng = map.getCenter()?.lng() || defaultCenter.lng;
            const startZoom = map.getZoom() || 15;

            const startTime = performance.now();
            const duration = 800; // milliseconds
            const zoomDuration = 400; // milliseconds

            setInternalAnimating(true);

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const zoomProgress = Math.min(elapsed / zoomDuration, 1);

                // Apply easing
                const easedProgress = easeInOutCubic(progress);
                const easedZoomProgress = easeInOutCubic(zoomProgress);

                // Interpolate position
                const currentLat = startLat + (targetLat - startLat) * easedProgress;
                const currentLng = startLng + (targetLng - startLng) * easedProgress;

                // Interpolate zoom (faster zoom animation)
                const currentZoom = startZoom + (zoom - startZoom) * easedZoomProgress;

                map.setCenter({ lat: currentLat, lng: currentLng });

                // Only set zoom if we're still in zoom animation phase
                if (zoomProgress < 1) {
                    map.setZoom(currentZoom);
                }

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    // Ensure final values are set exactly
                    map.setCenter({ lat: targetLat, lng: targetLng });
                    map.setZoom(zoom);
                    setInternalAnimating(false);
                    animationRef.current = null;
                }
            };

            animationRef.current = requestAnimationFrame(animate);
        },
        [map],
    );

    // Get address from coordinates using Google Geocoding API
    const getAddressFromCoordinates = useCallback(
        async (lat: number, lng: number): Promise<string> => {
            try {
                setIsGeocoding(true);
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`);
                const data = await response.json();

                if (data.status === 'OK' && data.results.length > 0) {
                    return data.results[0].formatted_address;
                }
                return 'Location identified (address details limited)';
            } catch (error) {
                console.error('Google Geocoding error:', error);
                return 'Address service temporarily unavailable';
            } finally {
                setIsGeocoding(false);
            }
        },
        [googleMapsApiKey],
    );

    // Update marker position smoothly with bounce animation
    const updateMarkerPosition = useCallback(
        (lat: number, lng: number) => {
            if (!map) return;

            // Remove existing marker
            if (markerRef.current) {
                markerRef.current.setMap(null);
            }

            // Create new marker with smooth animation
            markerRef.current = new google.maps.Marker({
                position: { lat, lng },
                map: map,
                title: 'Selected Location',
                draggable: true,
                animation: google.maps.Animation.DROP,
            });

            // Add smooth drag end listener
            markerRef.current.addListener('dragend', async (event: google.maps.MapMouseEvent) => {
                if (!event.latLng || internalAnimating) return;

                // Round to 6 decimal places for precision
                const rawLat = event.latLng.lat();
                const rawLng = event.latLng.lng();
                const newLat = parseFloat(rawLat.toFixed(6));
                const newLng = parseFloat(rawLng.toFixed(6));

                // Smooth pan to dragged location
                smoothPanTo(newLat, newLng);

                // Update address asynchronously while keeping marker responsive
                const address = await getAddressFromCoordinates(newLat, newLng);
                onLocationSelect(newLat, newLng, address);
            });

            // Add click listener for info window
            markerRef.current.addListener('click', () => {
                if (infoWindowRef.current && markerRef.current) {
                    const position = markerRef.current.getPosition();
                    if (position) {
                        infoWindowRef.current.setContent(`
                        <div class="p-2 max-w-xs">
                            <strong class="text-sm font-semibold">Selected Location</strong><br>
                            <span class="text-xs">Lat: ${formatCoordinate(position.lat())}</span><br>
                            <span class="text-xs">Lng: ${formatCoordinate(position.lng())}</span><br>
                            <span class="text-xs text-gray-600">${selectedLocation?.address || 'Click to select location'}</span>
                        </div>
                    `);
                        infoWindowRef.current.open(map, markerRef.current);
                    }
                }
            });
        },
        [getAddressFromCoordinates, internalAnimating, map, onLocationSelect, selectedLocation, smoothPanTo],
    );

    // Handle map click - smooth and optimized
    const onMapClick = useCallback(
        async (event: google.maps.MapMouseEvent) => {
            if (!event.latLng || !map || internalAnimating) return;

            // Round to 6 decimal places for precision
            const rawLat = event.latLng.lat();
            const rawLng = event.latLng.lng();
            const lat = parseFloat(rawLat.toFixed(6));
            const lng = parseFloat(rawLng.toFixed(6));

            // Smooth pan to clicked location
            smoothPanTo(lat, lng, 16);

            // Update marker position smoothly
            updateMarkerPosition(lat, lng);

            // Get address asynchronously
            const address = await getAddressFromCoordinates(lat, lng);
            onLocationSelect(lat, lng, address);
        },
        [getAddressFromCoordinates, internalAnimating, map, onLocationSelect, smoothPanTo, updateMarkerPosition],
    );

    // Update marker when selectedLocation changes from parent (e.g., from search)
    useEffect(() => {
        if (!map || !selectedLocation || internalAnimating) return;

        // Only update if coordinates actually changed (to prevent loops)
        const currentPos = markerRef.current?.getPosition();
        if (currentPos && Math.abs(currentPos.lat() - selectedLocation.lat) < 0.0001 && Math.abs(currentPos.lng() - selectedLocation.lng) < 0.0001) {
            return;
        }

        // Smooth pan to new location
        smoothPanTo(selectedLocation.lat, selectedLocation.lng, 16);
        updateMarkerPosition(selectedLocation.lat, selectedLocation.lng);

        // Update info window content
        if (infoWindowRef.current && markerRef.current) {
            infoWindowRef.current.setContent(`
                <div class="p-2 max-w-xs">
                    <strong class="text-sm font-semibold">Selected Location</strong><br>
                    <span class="text-xs">Lat: ${formatCoordinate(selectedLocation.lat)}</span><br>
                    <span class="text-xs">Lng: ${formatCoordinate(selectedLocation.lng)}</span><br>
                    <span class="text-xs text-gray-600">${selectedLocation.address}</span>
                </div>
            `);
            infoWindowRef.current.open(map, markerRef.current);
        }
    }, [map, selectedLocation, smoothPanTo, internalAnimating, updateMarkerPosition]);

    // Check geolocation permission status
    const checkGeolocationPermission = async (): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> => {
        if ('permissions' in navigator && 'query' in navigator.permissions) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                return result.state;
            } catch (error) {
                console.warn('Permissions API query failed:', error);
                return 'unknown';
            }
        }
        return 'unknown';
    };

    // Get user's current location
    const getCurrentLocation = useCallback(async () => {
        if (!navigator.geolocation || !map) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        // Check permission status first
        const permissionStatus = await checkGeolocationPermission();
        console.log('📍 Permission status before request:', permissionStatus);

        if (permissionStatus === 'denied') {
            toast.error('Location access is blocked. Please enable location permissions in your browser settings and refresh the page.', {
                duration: 6000,
            });
            setIsGettingLocation(false);
            return;
        }

        // Check if we're on HTTPS (required for geolocation in many browsers)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            console.warn('⚠️ Geolocation may require HTTPS in production');
        }

        setIsGettingLocation(true);
        const toastId = toast.loading('Locating...');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                // Round to 6 decimal places for precision
                const rawLat = position.coords.latitude;
                const rawLng = position.coords.longitude;
                const lat = parseFloat(rawLat.toFixed(6));
                const lng = parseFloat(rawLng.toFixed(6));

                console.log('📍 Get My Location - Current location obtained:', { 
                    raw: { lat: rawLat, lng: rawLng },
                    precise: { lat, lng }
                });

                // Dismiss loading toast
                toast.dismiss(toastId);

                // Smooth pan to current location
                smoothPanTo(lat, lng, 16);

                // Update marker position
                updateMarkerPosition(lat, lng);

                // Get address for current location
                const address = await getAddressFromCoordinates(lat, lng);
                
                // Use precise coordinates
                onLocationSelect(lat, lng, address);

                setIsGettingLocation(false);
            },
            (error) => {
                // Log detailed error information for debugging
                console.error('❌ Geolocation error details:', {
                    error,
                    code: error.code,
                    message: error.message,
                    type: error.constructor?.name,
                    stringified: JSON.stringify(error),
                });

                // Dismiss loading toast
                toast.dismiss(toastId);

                let errorMessage = 'Unable to retrieve your location.';

                // Check if error has a code property (GeolocationPositionError)
                if (typeof error.code === 'number') {
                    // Use numeric constants: PERMISSION_DENIED = 1, POSITION_UNAVAILABLE = 2, TIMEOUT = 3
                    switch (error.code) {
                        case 1: // GeolocationPositionError.PERMISSION_DENIED
                            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
                            break;
                        case 2: // GeolocationPositionError.POSITION_UNAVAILABLE
                            errorMessage = 'Location information is unavailable. Please check your device location services are enabled.';
                            break;
                        case 3: // GeolocationPositionError.TIMEOUT
                            errorMessage = 'Location request timed out. Please check your internet connection and try again.';
                            break;
                    }
                } else {
                    // Fallback: Check error message for permission-related keywords
                    const errorMsg = (error.message || '').toLowerCase();
                    const errorStr = JSON.stringify(error).toLowerCase();
                    
                    if (
                        errorMsg.includes('permission') ||
                        errorMsg.includes('denied') ||
                        errorMsg.includes('blocked') ||
                        errorStr.includes('permission') ||
                        errorStr.includes('denied') ||
                        errorStr.includes('blocked')
                    ) {
                        errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
                    } else if (errorMsg.includes('timeout') || errorStr.includes('timeout')) {
                        errorMessage = 'Location request timed out. Please check your internet connection and try again.';
                    } else if (errorMsg.includes('unavailable') || errorStr.includes('unavailable')) {
                        errorMessage = 'Location information is unavailable. Please check your device location services are enabled.';
                    }
                }

                // Use toast instead of alert for better UX
                toast.error(errorMessage, {
                    duration: 5000,
                });
                setIsGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000, // Increase timeout to match location-setup-step
                maximumAge: 0, // Always get fresh location, never use cached
            },
        );
    }, [map, smoothPanTo, updateMarkerPosition, getAddressFromCoordinates, onLocationSelect]);

    // Use external animation state if provided, otherwise use internal
    const isCurrentlyAnimating = isAnimating !== undefined ? isAnimating : internalAnimating;

    // Calculate initial center - prioritize selectedLocation over initialLat/initialLng
    const getInitialCenter = () => {
        if (selectedLocation) {
            return { lat: selectedLocation.lat, lng: selectedLocation.lng };
        }
        if (initialLat !== 9.0192 || initialLng !== 38.7525) {
            return { lat: initialLat, lng: initialLng };
        }
        return defaultCenter;
    };

    return (
        <div className="space-y-2">
            {/* Search Bar and Get Location Button */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <AutocompleteSearch
                        onPlaceSelect={(lat, lng, address) => {
                            smoothPanTo(lat, lng, 16);
                            updateMarkerPosition(lat, lng);
                            onLocationSelect(lat, lng, address);
                        }}
                        isLoading={isCurrentlyAnimating}
                        placeholder="Search location..."
                        disabled={!map}
                    />
                </div>
                <Button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation || isCurrentlyAnimating || !map}
                    size="sm"
                    className="h-9 shrink-0"
                >
                    {isGettingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <MapPin className="h-4 w-4" />
                            <span className="hidden sm:inline">Get My Location</span>
                            <span className="sm:hidden">Get My Location</span>
                        </>
                    )}
                </Button>
                {showCoverageArea && (
                    <Button
                        type="button"
                        onClick={toggleCoverageVisibility}
                        disabled={!map || !isCoverageLoaded}
                        size="sm"
                        variant={isCoverageVisible ? 'default' : 'outline'}
                        className="h-9 shrink-0"
                        title={isCoverageVisible ? 'Hide coverage area' : 'Show coverage area'}
                    >
                        <Layers className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            {isCoverageVisible ? 'Hide Coverage' : 'Show Coverage'}
                        </span>
                    </Button>
                )}
            </div>

            {/* Status Indicators */}
            {/* <div className="space-y-2">
                {isGettingLocation && (
                    <div className="rounded-lg bg-green-50 p-3 transition-all duration-300">
                        <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                            <span className="text-sm text-green-700">Detecting your current location...</span>
                        </div>
                    </div>
                )}

                {isGeocoding && (
                    <div className="rounded-lg bg-blue-50 p-3 transition-all duration-300">
                        <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-sm text-blue-700">Getting address for selected location...</span>
                        </div>
                    </div>
                )}

                {isCurrentlyAnimating && (
                    <div className="rounded-lg bg-purple-50 p-3 transition-all duration-300">
                        <div className="flex items-center space-x-2">
                            <div className="h-4 w-4 animate-pulse rounded-full bg-purple-600" />
                            <span className="text-sm text-purple-700">Moving to selected location...</span>
                        </div>
                    </div>
                )}
            </div> */}

            {/* Google Maps Container */}
            <div className="relative overflow-hidden rounded-sm transition-all duration-300">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                            <p className="text-sm font-medium text-gray-700">Loading Google Maps...</p>
                        </div>
                    </div>
                )}

                <div className="absolute top-2 right-14 z-10 rounded-sm bg-white/90 px-3 py-2 text-xs font-medium text-gray-700 backdrop-blur-sm transition-all duration-300">
                    📍 Click on map or drag marker to select location
                </div>

                <LoadScript
                    googleMapsApiKey={googleMapsApiKey}
                    libraries={LIBRARIES}
                    // libraries={['places']}
                    loadingElement={
                        <div className="flex h-96 w-full items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                                <p className="text-sm text-gray-600">Loading map...</p>
                            </div>
                        </div>
                    }
                >
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={getInitialCenter()}
                        zoom={15}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        onClick={onMapClick}
                        options={{
                            streetViewControl: true,
                            mapTypeControl: true,
                            fullscreenControl: true,
                            zoomControl: true,
                            gestureHandling: 'greedy',
                            // mapTypeId: 'satellite',
                            styles: [
                                {
                                    featureType: 'poi',
                                    elementType: 'labels',
                                    stylers: [{ visibility: 'on' }],
                                },
                                {
                                    featureType: 'transit',
                                    elementType: 'labels.icon',
                                    stylers: [{ visibility: 'off' }],
                                },
                            ],
                        }}
                    ></GoogleMap>
                </LoadScript>
            </div>
        </div>
    );
}
