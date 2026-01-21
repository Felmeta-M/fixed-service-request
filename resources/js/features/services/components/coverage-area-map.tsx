import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, MapPin, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CoverageAreaMapProps {
    googleMapsApiKey: string;
    height?: string;
}

const defaultCenter = {
    lat: 9.0192,
    lng: 38.7525,
};

// Libraries needed for the map
const LIBRARIES: Array<'places' | 'drawing' | 'geometry' | 'visualization'> = ['places'];

export function CoverageAreaMap({ googleMapsApiKey, height = '500px' }: CoverageAreaMapProps) {
    const { t } = useTranslation();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isCoverageLoaded, setIsCoverageLoaded] = useState(false);
    const [isCoverageLoading, setIsCoverageLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [scriptLoadError, setScriptLoadError] = useState<string | null>(null);
    const coverageDataRef = useRef<google.maps.Data.Feature[]>([]);

    // Load Google Maps script using the recommended hook (more reliable with React 18 / StrictMode)
    const { isLoaded: isScriptLoaded, loadError: jsApiLoadError } = useJsApiLoader({
        id: 'google-maps-coverage-area',
        googleMapsApiKey: googleMapsApiKey || '',
        libraries: LIBRARIES,
    });

    // Validate API key and reflect script load errors
    useEffect(() => {
        if (!googleMapsApiKey || googleMapsApiKey.trim() === '') {
            console.error('Google Maps API key is missing or empty');
            setScriptLoadError('Google Maps API key is missing');
            return;
        }

        if (jsApiLoadError) {
            console.error('Google Maps script failed to load:', jsApiLoadError);
            setScriptLoadError('Failed to load Google Maps. Please check your API key and network connection.');
            return;
        }

        if (isScriptLoaded) {
            setScriptLoadError(null);
        }
    }, [googleMapsApiKey, isScriptLoaded, jsApiLoadError]);

    const mapContainerStyle = {
        width: '100%',
        height: height,
    };

    // Get primary color
    const getPrimaryColor = useCallback(() => {
        // The primary color oklch(0.761 0.1736 129.58) ≈ #84cc16
        return '#84cc16';
    }, []);

    // Fit map bounds to coverage area
    const fitToCoverageBounds = useCallback((targetMap: google.maps.Map) => {
        const bounds = new google.maps.LatLngBounds();
        let hasFeatures = false;

        targetMap.data.forEach((feature) => {
            const geometry = feature.getGeometry();
            if (geometry) {
                geometry.forEachLatLng((latLng) => {
                    bounds.extend(latLng);
                    hasFeatures = true;
                });
            }
        });

        if (hasFeatures) {
            // Use minimal padding to maximize coverage visibility
            targetMap.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });

            // After fitting bounds, zoom in a bit more for better detail
            // while still keeping all coverage areas visible
            window.setTimeout(() => {
                const currentZoom = targetMap.getZoom();
                if (currentZoom) {
                    const targetZoom = Math.min(currentZoom + 0.2, 12);
                    targetMap.setZoom(targetZoom);
                }
            }, 100);
        }
    }, []);

    // Load coverage area GeoJSON
    const loadCoverageArea = useCallback(
        async (targetMap: google.maps.Map) => {
            if (isCoverageLoaded || isCoverageLoading) return;

            setIsCoverageLoading(true);
            setLoadError(false);

            const primaryColor = getPrimaryColor();

            try {
                // Fetch the GeoJSON with simple, robust handling
                const response = await fetch('/data/coverage_area.geojson', {
                    headers: {
                        Accept: 'application/json, application/geo+json,*/*',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch coverage area: ${response.status} ${response.statusText}`);
                }

                const geoJsonData = await response.json();

                // Basic GeoJSON validation
                if (
                    !geoJsonData ||
                    typeof geoJsonData !== 'object' ||
                    !geoJsonData.type ||
                    !geoJsonData.features ||
                    !Array.isArray(geoJsonData.features) ||
                    geoJsonData.features.length === 0
                ) {
                    throw new Error('Invalid or empty GeoJSON data');
                }

                // For performance and to avoid Google Maps internal errors on very large datasets,
                // limit the number of features we render in this lightweight homepage map.
                const MAX_FEATURES = 800;
                if (geoJsonData.features.length > MAX_FEATURES) {
                    console.warn(
                        `Coverage GeoJSON has ${geoJsonData.features.length} features; truncating to first ${MAX_FEATURES} for homepage map.`,
                    );
                    geoJsonData.features = geoJsonData.features.slice(0, MAX_FEATURES);
                }

                // Clear any existing data before loading new coverage
                targetMap.data.forEach((feature) => {
                    targetMap.data.remove(feature);
                });

                // Add the GeoJSON data to the map
                const features = targetMap.data.addGeoJson(geoJsonData);
                console.log('Coverage features added to map:', features.length);

                if (!features || features.length === 0) {
                    throw new Error('No features were added to the map from GeoJSON');
                }

                coverageDataRef.current = features;

                // Apply styling
                targetMap.data.setStyle({
                    fillColor: primaryColor,
                    fillOpacity: 0.2,
                    strokeColor: primaryColor,
                    strokeWeight: 1.5,
                    clickable: false,
                });

                setIsCoverageLoaded(true);
                setLoadError(false);

                // Fit map to coverage bounds after a small delay to ensure rendering
                window.setTimeout(() => {
                    fitToCoverageBounds(targetMap);
                }, 100);
            } catch (error) {
                console.error('Error loading coverage area:', error);

                let errorMessage = 'Failed to load coverage area';
                if (error instanceof Error) {
                    errorMessage = error.message || errorMessage;
                }

                console.error('Coverage area load error details:', {
                    message: errorMessage,
                    error,
                });

                setLoadError(true);
            } finally {
                setIsCoverageLoading(false);
            }
        },
        [getPrimaryColor, fitToCoverageBounds, isCoverageLoaded, isCoverageLoading],
    );

    // Retry loading coverage
    const retryLoadCoverage = useCallback(() => {
        if (map) {
            setIsCoverageLoaded(false);
            setLoadError(false);
            loadCoverageArea(map);
        }
    }, [map, loadCoverageArea]);

    // Initialize map
    const onLoad = useCallback(
        (loadedMap: google.maps.Map) => {
            console.log('Google Map loaded successfully');
            setMap(loadedMap);
            setIsMapReady(true);
            setScriptLoadError(null);
        },
        [],
    );

    // Load coverage area when map is ready
    useEffect(() => {
        if (map && isMapReady && !isCoverageLoaded && !isCoverageLoading) {
            // Small delay to ensure map is fully initialized
            const timer = window.setTimeout(() => {
                loadCoverageArea(map);
            }, 300);
            return () => window.clearTimeout(timer);
        }
    }, [map, isMapReady, isCoverageLoaded, isCoverageLoading, loadCoverageArea]);

    const onUnmount = useCallback(() => {
        // Clean up coverage area data
        if (map && coverageDataRef.current.length > 0) {
            coverageDataRef.current.forEach((feature) => {
                map.data.remove(feature);
            });
            coverageDataRef.current = [];
        }

        setMap(null);
        setIsMapReady(false);
        setIsCoverageLoaded(false);
        setIsCoverageLoading(false);
    }, [map]);

    // Center map on coverage area
    const centerOnCoverage = useCallback(() => {
        if (map) {
            fitToCoverageBounds(map);
        }
    }, [map, fitToCoverageBounds]);

    // Show loading state - only show overlay when map script or instance is not ready
    // Once map is ready, let it show even while coverage is loading
    const isLoading = !isScriptLoaded || !isMapReady;

    const containerStyle = {
        width: '100%',
        height: height === '100%' ? '100%' : height,
        minHeight: height === '100%' ? '400px' : undefined,
    };

    return (
        <div 
            className="relative overflow-hidden rounded-xl shadow-lg bg-gray-100"
            style={containerStyle}
        >
            {/* Script load error */}
            {scriptLoadError && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100">
                    <div className="text-center px-4">
                        <p className="mb-3 text-sm font-medium text-red-600">
                            {scriptLoadError}
                        </p>
                        <p className="text-xs text-gray-600">
                            Please check your Google Maps API key configuration.
                        </p>
                    </div>
                </div>
            )}

            {/* Loading overlay - only show when map script or map instance is loading */}
            {isLoading && !scriptLoadError && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm font-medium text-gray-700">
                            {t('coverage_map.loading_map')}
                        </p>
                    </div>
                </div>
            )}

            {/* Coverage loading indicator - subtle, doesn't block map */}
            {isMapReady && isCoverageLoading && !loadError && (
                <div className="absolute top-20 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm sm:top-24">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-xs font-medium text-gray-700 sm:text-sm">
                            {t('coverage_map.loading_coverage')}
                        </p>
                    </div>
                </div>
            )}

            {/* Error state for coverage data */}
            {loadError && !isCoverageLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100/90">
                    <div className="text-center">
                        <p className="mb-3 text-sm font-medium text-gray-700">
                            {t('coverage_map.load_failed')}
                        </p>
                        <Button
                            type="button"
                            onClick={retryLoadCoverage}
                            size="sm"
                            variant="outline"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {t('coverage_map.retry')}
                        </Button>
                    </div>
                </div>
            )}

            

            {/* Center button - responsive */}
            {/* {isCoverageLoaded && !loadError && (
                <Button
                    type="button"
                    onClick={centerOnCoverage}
                    size="sm"
                    variant="secondary"
                    className="absolute top-3 right-3 z-10 h-8 px-2 text-xs shadow-md sm:top-4 sm:right-4 sm:h-9 sm:px-3 sm:text-sm"
                >
                    <MapPin className="h-3 w-3 sm:mr-1 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('coverage_map.view_full')}</span>
                </Button>
            )} */}

            {/* Render map only when script is fully loaded and there is a valid key */}
            {!scriptLoadError && isScriptLoaded && googleMapsApiKey && (
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={defaultCenter}
                    zoom={11}
                    // Allow users to switch between roadmap and satellite views
                    mapTypeId={google.maps.MapTypeId.ROADMAP}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        streetViewControl: false,
                        // Show map type control so users can choose Satellite
                        mapTypeControl: true,
                        mapTypeControlOptions: {
                            style: google.maps.MapTypeControlStyle.DEFAULT,
                            mapTypeIds: [
                                google.maps.MapTypeId.ROADMAP,
                                google.maps.MapTypeId.SATELLITE,
                                google.maps.MapTypeId.HYBRID,
                            ],
                        },
                        fullscreenControl: true,
                        zoomControl: true,
                        gestureHandling: 'cooperative',
                        styles: [
                            {
                                featureType: 'poi',
                                elementType: 'labels',
                                stylers: [{ visibility: 'off' }],
                            },
                            {
                                featureType: 'transit',
                                elementType: 'labels.icon',
                                stylers: [{ visibility: 'off' }],
                            },
                        ],
                    }}
                />
            )}
        </div>
    );
}
