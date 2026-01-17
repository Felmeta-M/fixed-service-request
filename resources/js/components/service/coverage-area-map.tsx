import { Button } from '@/components/ui/button';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface CoverageAreaMapProps {
    googleMapsApiKey: string;
    height?: string;
}

const defaultCenter = {
    lat: 9.0192,
    lng: 38.7525,
};

// Libraries needed for the map
const LIBRARIES: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['places'];

export function CoverageAreaMap({ googleMapsApiKey, height = '500px' }: CoverageAreaMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCoverageLoaded, setIsCoverageLoaded] = useState(false);
    const coverageDataRef = useRef<google.maps.Data.Feature[]>([]);

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
    const fitToCoverageBounds = useCallback((map: google.maps.Map) => {
        const bounds = new google.maps.LatLngBounds();
        let hasFeatures = false;

        map.data.forEach((feature) => {
            const geometry = feature.getGeometry();
            if (geometry) {
                geometry.forEachLatLng((latLng) => {
                    bounds.extend(latLng);
                    hasFeatures = true;
                });
            }
        });

        if (hasFeatures) {
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }
    }, []);

    // Load coverage area GeoJSON
    const loadCoverageArea = useCallback(
        (map: google.maps.Map) => {
            const primaryColor = getPrimaryColor();

            // Load the GeoJSON file
            map.data.loadGeoJson('/data/coverage_area.geojson', undefined, (features) => {
                coverageDataRef.current = features;
                setIsCoverageLoaded(true);

                // Apply styling to coverage polygons using primary brand color
                map.data.setStyle({
                    fillColor: primaryColor,
                    fillOpacity: 0.2,
                    strokeColor: primaryColor,
                    strokeWeight: 1.5,
                    clickable: false,
                });

                // Fit map to coverage bounds
                fitToCoverageBounds(map);
            });
        },
        [getPrimaryColor, fitToCoverageBounds],
    );

    // Initialize map
    const onLoad = useCallback(
        (map: google.maps.Map) => {
            setMap(map);
            setIsLoading(false);

            // Load coverage area
            loadCoverageArea(map);
        },
        [loadCoverageArea],
    );

    const onUnmount = useCallback(() => {
        // Clean up coverage area data
        if (map && coverageDataRef.current.length > 0) {
            coverageDataRef.current.forEach((feature) => {
                map.data.remove(feature);
            });
            coverageDataRef.current = [];
        }

        setMap(null);
        setIsCoverageLoaded(false);
    }, [map]);

    // Center map on coverage area
    const centerOnCoverage = useCallback(() => {
        if (map) {
            fitToCoverageBounds(map);
        }
    }, [map, fitToCoverageBounds]);

    return (
        <div className="relative overflow-hidden rounded-xl shadow-lg">
            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                        <p className="text-sm font-medium text-gray-700">Loading coverage map...</p>
                    </div>
                </div>
            )}

            {/* Map info badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm">
                <div className="h-3 w-3 rounded-full bg-primary opacity-60"></div>
                <span className="text-sm font-medium text-gray-700">Service Coverage Area</span>
            </div>

            {/* Center button */}
            {isCoverageLoaded && (
                <Button
                    type="button"
                    onClick={centerOnCoverage}
                    size="sm"
                    variant="secondary"
                    className="absolute top-4 right-4 z-10 shadow-md"
                >
                    <MapPin className="mr-1 h-4 w-4" />
                    View Full Coverage
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
                            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                            <p className="text-sm text-gray-600">Loading map...</p>
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
                        mapTypeControl: true,
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
