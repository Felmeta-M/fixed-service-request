import { formatCoordinate, parseCoordinate } from '@/lib/coordinate-utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import { AutocompleteSearch } from '@/features/services/components/map-search';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LocationMapProps {
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    initialLat?: number;
    initialLng?: number;
}

const LocationMap: React.FC<LocationMapProps> = ({ onLocationSelect, initialLat = 9.007428, initialLng = 38.733708 }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<L.Map | null>(null);
    const [marker, setMarker] = useState<L.Marker | null>(null);
    const [coordinates, setCoordinates] = useState({
        lat: parseCoordinate(initialLat),
        lng: parseCoordinate(initialLng),
    });
    const [isLoading, setIsLoading] = useState(true);
    const [address, setAddress] = useState<string>('');

    // Function to get address from coordinates
    const getAddressFromCoordinates = async (lat: number, lng: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
                return data.display_name;
            }
            return '';
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return '';
        }
    };

    // Function to handle coordinate selection (ensures 6 decimal precision)
    const handleCoordinateSelection = async (rawLat: number, rawLng: number) => {
        // Round to 6 decimal places for internal state
        const preciseLat = parseFloat(rawLat.toFixed(6));
        const preciseLng = parseFloat(rawLng.toFixed(6));

        setCoordinates({ lat: preciseLat, lng: preciseLng });
        const address = await getAddressFromCoordinates(preciseLat, preciseLng);

        // Pass the precise coordinates to parent
        onLocationSelect(preciseLat, preciseLng, address);

        return { preciseLat, preciseLng, address };
    };

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize the map with precise coordinates
        const mapInstance = L.map(mapRef.current, {
            center: [coordinates.lat, coordinates.lng],
            zoom: 15,
            zoomControl: true,
            attributionControl: true,
        });

        // Add beautiful tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
        }).addTo(mapInstance);

        // Create custom icon for the marker
        const customIcon = L.icon({
            iconUrl:
                'data:image/svg+xml;base64,' +
                btoa(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2C11.58 2 8 5.58 8 10C8 17 16 30 16 30C16 30 24 17 24 10C24 5.58 20.42 2 16 2Z" fill="#2563eb"/>
                    <path d="M16 14C17.1046 14 18 13.1046 18 12C18 10.8954 17.1046 10 16 10C14.8954 10 14 10.8954 14 12C14 13.1046 14.8954 14 16 14Z" fill="white"/>
                    <path d="M16 2C11.58 2 8 5.58 8 10C8 17 16 30 16 30C16 30 24 17 24 10C24 5.58 20.42 2 16 2Z" stroke="white" stroke-width="2"/>
                </svg>
            `),
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
        });

        // Create marker with custom icon
        const newMarker = L.marker([coordinates.lat, coordinates.lng], {
            draggable: true,
            icon: customIcon,
        }).addTo(mapInstance);

        // Add popup to marker with formatted coordinates
        newMarker.bindPopup(`
            <div class="p-2">
                <strong>Selected Location</strong><br>
                Lat: ${formatCoordinate(coordinates.lat)}<br>
                Lng: ${formatCoordinate(coordinates.lng)}<br>
                ${address ? `Address: ${address}` : ''}
            </div>
        `);

        // Event handler for marker drag end
        const handleMarkerDragEnd = async (e: L.DragEndEvent) => {
            const position = e.target.getLatLng();
            const { preciseLat, preciseLng, address } = await handleCoordinateSelection(position.lat, position.lng);

            // Update popup with formatted coordinates
            newMarker.setPopupContent(`
                <div class="p-2">
                    <strong>Selected Location</strong><br>
                    Lat: ${formatCoordinate(preciseLat)}<br>
                    Lng: ${formatCoordinate(preciseLng)}<br>
                    ${address ? `Address: ${address}` : ''}
                </div>
            `);
        };

        // Event handler for map click
        const handleMapClick = async (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            const { preciseLat, preciseLng, address } = await handleCoordinateSelection(lat, lng);

            newMarker.setLatLng([preciseLat, preciseLng]);

            // Update popup with formatted coordinates
            newMarker.setPopupContent(`
                <div class="p-2">
                    <strong>Selected Location</strong><br>
                    Lat: ${formatCoordinate(preciseLat)}<br>
                    Lng: ${formatCoordinate(preciseLng)}<br>
                    ${address ? `Address: ${address}` : ''}
                </div>
            `);
        };

        // Add event listeners
        newMarker.on('dragend', handleMarkerDragEnd);
        mapInstance.on('click', handleMapClick);

        // Add scale control
        L.control.scale({ imperial: false }).addTo(mapInstance);

        setMap(mapInstance);
        setMarker(newMarker);
        setIsLoading(false);

        // Get initial address
        getAddressFromCoordinates(coordinates.lat, coordinates.lng);

        return () => {
            mapInstance.remove();
        };
    }, []);

    // Update effect to handle initialLat/initialLng changes
    useEffect(() => {
        if (map && marker) {
            const numLat = parseCoordinate(initialLat);
            const numLng = parseCoordinate(initialLng);

            // Only update if coordinates actually changed
            if (Math.abs(coordinates.lat - numLat) > 0.0001 || Math.abs(coordinates.lng - numLng) > 0.0001) {
                const preciseLat = parseFloat(numLat.toFixed(6));
                const preciseLng = parseFloat(numLng.toFixed(6));

                map.setView([preciseLat, preciseLng], map.getZoom());
                marker.setLatLng([preciseLat, preciseLng]);
                setCoordinates({ lat: preciseLat, lng: preciseLng });

                // Update address
                getAddressFromCoordinates(preciseLat, preciseLng);
            }
        }
    }, [initialLat, initialLng, map, marker]);

    const handlePlaceSelect = async (lat: number, lng: number, address: string) => {
        setIsLoading(true);
        try {
            const { preciseLat, preciseLng } = await handleCoordinateSelection(lat, lng);

            if (map && marker) {
                map.setView([preciseLat, preciseLng], 16);
                marker.setLatLng([preciseLat, preciseLng]);
                setAddress(address);

                // Update popup with formatted coordinates
                marker
                    .setPopupContent(
                        `
                        <div class="p-2">
                            <strong>Selected Location</strong><br>
                            Lat: ${formatCoordinate(preciseLat)}<br>
                            Lng: ${formatCoordinate(preciseLng)}<br>
                            Address: ${address}
                        </div>
                    `,
                    )
                    .openPopup();

                onLocationSelect(preciseLat, preciseLng, address);
            }
        } catch (error) {
            console.error('Error handling place selection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Use formatted coordinates for display
    const displayLat = formatCoordinate(coordinates.lat);
    const displayLng = formatCoordinate(coordinates.lng);

    return (
        <div className="space-y-1">
            <AutocompleteSearch
                onPlaceSelect={handlePlaceSelect}
                isLoading={isLoading}
                placeholder="Search for an address, place, or landmark..."
                className=""
            />
            {/* Map Container */}
            <div className="relative overflow-hidden rounded-lg">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                            <p className="text-sm font-medium text-gray-700">Loading map...</p>
                        </div>
                    </div>
                )}

                <div className="absolute top-2 left-2 z-[400] rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-gray-700 backdrop-blur-sm">
                    📍 Click on map or drag marker to select location
                </div>

                <div ref={mapRef} className="h-96 w-full" style={{ minHeight: '384px' }} />
            </div>

            {/* Selected Coordinates Display */}
            {/* <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"> */}
            {/* <div className="flex items-start gap-3"> */}
            {/* <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" /> */}
            {/* <div className="flex-1"> */}
            {/* <p className="text-sm font-medium text-gray-900">Selected Location</p> */}
            {/* <p className="mt-1 text-sm text-gray-600">
                            Coordinates: {displayLat}, {displayLng}
                        </p> */}
            {/* {address && <p className="mt-1 text-sm text-gray-600">Address: {address}</p>} */}
            {/* <p className="mt-1 text-xs text-green-600">✓ Formatted for API (6 decimal places)</p> */}
            {/* </div> */}
            {/* </div> */}
            {/* </div> */}
        </div>
    );
};

export default LocationMap;
