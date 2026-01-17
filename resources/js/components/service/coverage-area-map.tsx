import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
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
    const coverageDataRef = useRef<google.maps.Data.Feature[]>([]);
    const loadAttemptRef = useRef(0);

    const mapContainerStyle = {
        width: '100%',
        height: height,
    };

    // Get primary color from CSS variable
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
            
            // After fitting bounds, zoom in by 1 level for a closer view
            // while still keeping all coverage areas visible
            setTimeout(() => {
                const currentZoom = targetMap.getZoom();
                if (currentZoom && currentZoom < 14) {
                    targetMap.setZoom(currentZoom + 0.4);
                }
            }, 100);
        }
    }, []);

    // Load coverage area GeoJSON
    const loadCoverageArea = useCallback(
        (targetMap: google.maps.Map) => {
            if (isCoverageLoaded || isCoverageLoading) return;

            setIsCoverageLoading(true);
            setLoadError(false);
            const primaryColor = getPrimaryColor();

            // First, apply the style so it's ready when data loads
            targetMap.data.setStyle({
                fillColor: primaryColor,
                fillOpacity: 0.2,
                strokeColor: primaryColor,
                strokeWeight: 1.5,
                clickable: false,
            });

            // Load the GeoJSON file
            targetMap.data.loadGeoJson(
                '/data/coverage_area.geojson',
                undefined,
                (features) => {
                    if (features && features.length > 0) {
                        coverageDataRef.current = features;
                        setIsCoverageLoaded(true);
                        setIsCoverageLoading(false);
                        setLoadError(false);

                        // Fit map to coverage bounds after a small delay to ensure rendering
                        setTimeout(() => {
                            fitToCoverageBounds(targetMap);
                        }, 100);
                    } else {
                        // No features loaded, might be an error
                        setIsCoverageLoading(false);
                        setLoadError(true);
                    }
                },
            );

            // Set a timeout for loading - if it takes too long, show error state
            setTimeout(() => {
                if (!isCoverageLoaded && isCoverageLoading) {
                    setIsCoverageLoading(false);
                    setLoadError(true);
                }
            }, 10000);
        },
        [getPrimaryColor, fitToCoverageBounds, isCoverageLoaded, isCoverageLoading],
    );

    // Retry loading coverage
    const retryLoadCoverage = useCallback(() => {
        if (map) {
            setIsCoverageLoaded(false);
            setLoadError(false);
            loadAttemptRef.current += 1;
            loadCoverageArea(map);
        }
    }, [map, loadCoverageArea]);

    // Initialize map
    const onLoad = useCallback(
        (loadedMap: google.maps.Map) => {
            setMap(loadedMap);
            setIsMapReady(true);
        },
        [],
    );

    // Load coverage area when map is ready
    useEffect(() => {
        if (map && isMapReady && !isCoverageLoaded && !isCoverageLoading) {
            // Small delay to ensure map is fully initialized
            const timer = setTimeout(() => {
                loadCoverageArea(map);
            }, 300);
            return () => clearTimeout(timer);
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

    // Show loading state
    const isLoading = !isMapReady || isCoverageLoading;

    return (
        <div 
            className="relative overflow-hidden rounded-xl shadow-lg bg-gray-100"
            style={{ minHeight: height }}
        >
            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm font-medium text-gray-700">
                            {!isMapReady ? t('coverage_map.loading_map') : t('coverage_map.loading_coverage')}
                        </p>
                    </div>
                </div>
            )}

            {/* Error state */}
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

            {/* Map info badge - responsive */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-md bg-white/95 px-2 py-1.5 shadow-md backdrop-blur-sm sm:top-4 sm:left-4 sm:gap-2 sm:rounded-lg sm:px-4 sm:py-2">
                <div className="h-2 w-2 rounded-full bg-primary opacity-60 sm:h-3 sm:w-3"></div>
                <span className="text-xs font-medium text-gray-700 sm:text-sm">
                    <span className="hidden sm:inline">{t('coverage_map.badge')}</span>
                    <span className="sm:hidden">{t('coverage_map.badge_short')}</span>
                </span>
            </div>

            {/* Center button - responsive */}
            {isCoverageLoaded && !loadError && (
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
            )}

            <LoadScript
                googleMapsApiKey={googleMapsApiKey}
                libraries={LIBRARIES}
                loadingElement={
                    <div
                        className="flex w-full items-center justify-center bg-gray-100"
                        style={{ height }}
                    >
                        <div className="text-center">
                            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-gray-600">{t('coverage_map.initializing')}</p>
                        </div>
                    </div>
                }
            >
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={defaultCenter}
                    zoom={11}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
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
            </LoadScript>
        </div>
    );
}
