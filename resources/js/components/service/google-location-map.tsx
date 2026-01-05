import { Button } from '@/components/ui/button';
import { formatCoordinate } from '@/lib/coordinate-utils';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ProfessionalSearch } from './map-search';

interface GoogleLocationMapProps {
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    onAddressSearch: (address: string) => void;
    initialLat?: number;
    initialLng?: number;
    selectedLocation?: { lat: number; lng: number; address: string } | null;
    googleMapsApiKey: string;
    isAnimating?: boolean;
    onAnimationStateChange?: (isAnimating: boolean) => void;
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
    onAddressSearch,
    initialLat = 9.0192,
    initialLng = 38.7525,
    selectedLocation,
    googleMapsApiKey,
    isAnimating,
    onAnimationStateChange,
}: GoogleLocationMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [internalAnimating, setInternalAnimating] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
    const animationRef = useRef<number | null>(null);
    const hasInitialized = useRef(false);

    // Sync animation state with parent
    useEffect(() => {
        if (onAnimationStateChange) {
            onAnimationStateChange(internalAnimating);
        }
    }, [internalAnimating, onAnimationStateChange]);

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
        },
        [selectedLocation],
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
        setMap(null);
        hasInitialized.current = false;
    }, []);

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

                const newLat = event.latLng.lat();
                const newLng = event.latLng.lng();

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

            const lat = event.latLng.lat();
            const lng = event.latLng.lng();

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

    // const handleSearch = async () => {
    //     const query = searchQuery.trim();
    //     if (!query || internalAnimating) return;

    //     // Prefer Maps JS Geocoder when available (works well with browser-restricted keys).
    //     if (map && typeof google !== 'undefined' && google.maps?.Geocoder) {
    //         try {
    //             setIsGeocoding(true);
    //             const geocoder = new google.maps.Geocoder();

    //             const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
    //                 geocoder.geocode({ address: query }, (results, status) => {
    //                     if (status === 'OK' && results && results.length > 0) {
    //                         resolve(results);
    //                         return;
    //                     }
    //                     reject(new Error(status));
    //                 });
    //             });

    //             const first = results[0];
    //             const location = first.geometry.location;
    //             onLocationSelect(location.lat(), location.lng(), first.formatted_address);
    //             return;
    //         } catch {
    //             // Fall back to the parent handler (which already reports errors in the UI).
    //         } finally {
    //             setIsGeocoding(false);
    //         }
    //     }

    //     onAddressSearch(query);
    // };
    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query || internalAnimating) return;

        if (map && typeof google !== 'undefined' && google.maps?.Geocoder) {
            try {
                setIsGeocoding(true);
                const geocoder = new google.maps.Geocoder();

                const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                    geocoder.geocode({ address: query }, (results, status) => {
                        if (status === 'OK' && results && results.length > 0) {
                            resolve(results);
                            return;
                        }
                        reject(new Error(`Geocoding failed: ${status}`));
                    });
                });

                const first = results[0];
                const location = first.geometry.location;

                // Call the parent handler with coordinates AND address
                onLocationSelect(location.lat(), location.lng(), first.formatted_address);

                // Clear search query after successful search
                setSearchQuery('');
            } catch (error) {
                console.error('Geocoding failed:', error);
                // Fall back to the parent handler for error display
                onAddressSearch(query);
            } finally {
                setIsGeocoding(false);
            }
        } else {
            // Fallback to parent handler if Geocoder not available
            onAddressSearch(query);
        }
    };

    // Get user's current location
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation || !map) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsGettingLocation(true);
        const toastId = toast.loading('Locating...');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Dismiss loading toast
                toast.dismiss(toastId);

                // Smooth pan to current location
                smoothPanTo(lat, lng, 16);

                // Update marker position
                updateMarkerPosition(lat, lng);

                // Get address for current location
                const address = await getAddressFromCoordinates(lat, lng);
                onLocationSelect(lat, lng, address);

                setIsGettingLocation(false);
            },
            (error) => {
                console.error('Error getting location:', error);

                // Dismiss loading toast
                toast.dismiss(toastId);

                let errorMessage = 'Unable to retrieve your location.';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please enable location permissions.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }

                alert(errorMessage);
                setIsGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
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
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                    <ProfessionalSearch
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onSearch={handleSearch}
                        isLoading={isGeocoding || isCurrentlyAnimating}
                        placeholder="Search for an address, place, or landmark..."
                    />
                </div>
                <Button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation || isCurrentlyAnimating || !map}
                    // variant="outline"
                    className="flex h-8 items-center gap-2"
                >
                    {isGettingLocation ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Locating...</span>
                        </>
                    ) : (
                        <>
                            {/* <Navigation className="h-4 w-4" /> */}
                            <MapPin className="h-4 w-4" />
                            <span className="">Get My Location</span>
                        </>
                    )}
                </Button>
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
