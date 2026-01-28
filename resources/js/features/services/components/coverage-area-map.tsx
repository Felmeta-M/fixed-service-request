import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { CheckCircle2, Loader2, MapPin, RefreshCw, XCircle } from 'lucide-react';
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
const LIBRARIES: Array<'places' | 'drawing' | 'geometry' | 'visualization'> = ['places', 'geometry'];

type AvailabilityStatus = 'idle' | 'checking' | 'inside' | 'outside' | 'error';

export function CoverageAreaMap({ googleMapsApiKey, height = '500px' }: CoverageAreaMapProps) {
    const { t } = useTranslation();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isCoverageLoaded, setIsCoverageLoaded] = useState(false);
    const [isCoverageLoading, setIsCoverageLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [scriptLoadError, setScriptLoadError] = useState<string | null>(null);
    const coverageDataRef = useRef<google.maps.Data.Feature[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('idle');
    const [availabilityMessage, setAvailabilityMessage] = useState<string>('');

    // Load Google Maps script using the recommended hook (more reliable with React 18 / StrictMode)
    const { isLoaded: isScriptLoaded, loadError: jsApiLoadError } = useJsApiLoader({
        id: 'google-maps-coverage-area',
        googleMapsApiKey: googleMapsApiKey || '',
        libraries: LIBRARIES,
    });

    // Validate API key and reflect script load errors
    useEffect(() => {
        if (!googleMapsApiKey || googleMapsApiKey.trim() === '') {
            setScriptLoadError('Google Maps API key is missing');
            return;
        }

        if (jsApiLoadError) {
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
                    geoJsonData.features = geoJsonData.features.slice(0, MAX_FEATURES);
                }

                // Clear any existing data before loading new coverage
                targetMap.data.forEach((feature) => {
                    targetMap.data.remove(feature);
                });

                // Add the GeoJSON data to the map
                const features = targetMap.data.addGeoJson(geoJsonData);

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
                let errorMessage = 'Failed to load coverage area';
                if (error instanceof Error) {
                    errorMessage = error.message || errorMessage;
                }

                setLoadError(true);
            } finally {
                setIsCoverageLoading(false);
            }
        },
        [getPrimaryColor, fitToCoverageBounds, isCoverageLoaded, isCoverageLoading],
    );

    const checkPointInCoverage = useCallback(
        (point: google.maps.LatLngLiteral) => {
            if (!map || !window.google || !google.maps.geometry || coverageDataRef.current.length === 0) {
                setAvailabilityStatus('error');
                setAvailabilityMessage('Coverage check is temporarily unavailable. Please try again in a moment.');
                return;
            }

            const target = new google.maps.LatLng(point.lat, point.lng);
            let isInside = false;

            for (const feature of coverageDataRef.current) {
                const geometry = feature.getGeometry();
                if (!geometry) continue;

                const type = geometry.getType();

                if (type === 'Polygon') {
                    const polygon = new google.maps.Polygon({
                        paths: (geometry as google.maps.Data.Polygon).getArray().map((path) => path.getArray()),
                    });

                    if (google.maps.geometry.poly.containsLocation(target, polygon)) {
                        isInside = true;
                        break;
                    }
                } else if (type === 'MultiPolygon') {
                    const multiPoly = geometry as google.maps.Data.MultiPolygon;
                    const polys = multiPoly.getArray();

                    for (const poly of polys) {
                        const polygon = new google.maps.Polygon({
                            paths: poly.getArray().map((path) => path.getArray()),
                        });

                        if (google.maps.geometry.poly.containsLocation(target, polygon)) {
                            isInside = true;
                            break;
                        }
                    }

                    if (isInside) break;
                }
            }

            if (isInside) {
                setAvailabilityStatus('inside');
                setAvailabilityMessage('Good news! Your selected area is within our current service coverage.');
            } else {
                setAvailabilityStatus('outside');
                setAvailabilityMessage(
                    'This spot is currently outside our fixed service coverage. We are continuously expanding, so please check back soon or contact support.',
                );
            }
        },
        [map],
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

    const handleLocationSelection = useCallback(
        (location: google.maps.LatLngLiteral) => {
            if (!map) return;

            setSelectedLocation(location);
            setAvailabilityStatus('checking');
            setAvailabilityMessage('Checking if this location is within our coverage...');

            map.panTo(location);
            const currentZoom = map.getZoom() ?? 11;
            if (currentZoom < 13) {
                map.setZoom(13);
            }

            window.setTimeout(() => {
                checkPointInCoverage(location);
            }, 150);
        },
        [map, checkPointInCoverage],
    );

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

            {/* Availability status footer */}
            {availabilityStatus !== 'idle' && (
                <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-3 pb-3">
                    <div className="inline-flex max-w-xl items-center gap-2 rounded-md bg-white/95 px-3 py-1.5 text-[11px] text-gray-700 shadow-sm backdrop-blur-sm sm:text-xs">
                        {availabilityStatus === 'inside' && (
                            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                        )}
                        {availabilityStatus === 'outside' && (
                            <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                        )}
                        {availabilityStatus === 'checking' && (
                            <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-primary" />
                        )}
                        {availabilityStatus === 'error' && (
                            <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
                        )}
                        <p className="truncate">
                            {availabilityMessage ||
                                'Tap on the map to verify if your exact location is within the current coverage.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Render map only when script is fully loaded and there is a valid key */}
            {!scriptLoadError && isScriptLoaded && googleMapsApiKey && (
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={defaultCenter}
                    zoom={11}
                    // Allow users to switch between roadmap and satellite views
                    // mapTypeId={google.maps.MapTypeId.ROADMAP}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        mapTypeId: google.maps.MapTypeId.SATELLITE,
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
                        // Enable place / POI labels so users can see shops, malls, restaurants, etc.
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
                    onClick={(event) => {
                        if (event.latLng) {
                            handleLocationSelection({
                                lat: event.latLng.lat(),
                                lng: event.latLng.lng(),
                            });
                        }
                    }}
                >
                    {selectedLocation && (
                        <Marker
                            position={selectedLocation}
                            icon={{
                                url: 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png',
                                scaledSize: new google.maps.Size(20, 30),
                                anchor: new google.maps.Point(15, 30),
                            }}
                        />
                    )}
                </GoogleMap>
            )}
        </div>
    );
}
