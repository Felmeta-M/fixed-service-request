import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LocationMapProps {
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    initialLat?: number;
    initialLng?: number;
}

const LocationMap: React.FC<LocationMapProps> = ({
    onLocationSelect,
    initialLat = 9.0192, // Addis Ababa latitude
    initialLng = 38.7525, // Addis Ababa longitude
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<L.Map | null>(null);
    const [marker, setMarker] = useState<L.Marker | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize the map
        const mapInstance = L.map(mapRef.current, {
            center: [initialLat, initialLng],
            zoom: 13,
            zoomControl: true,
            attributionControl: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(mapInstance);

        // Fix for default markers
        const DefaultIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        });

        // Create marker
        const newMarker = L.marker([initialLat, initialLng], {
            draggable: true,
            icon: DefaultIcon,
        }).addTo(mapInstance);

        // Add event listeners
        newMarker.on('dragend', (e) => {
            const position = e.target.getLatLng();
            setCoordinates({ lat: position.lat, lng: position.lng });
            onLocationSelect(position.lat, position.lng);
        });

        mapInstance.on('click', (e) => {
            const { lat, lng } = e.latlng;
            newMarker.setLatLng([lat, lng]);
            setCoordinates({ lat, lng });
            onLocationSelect(lat, lng);
        });

        setMap(mapInstance);
        setMarker(newMarker);
        setIsLoading(false);

        return () => {
            mapInstance.remove();
        };
    }, []);

    useEffect(() => {
        if (map && marker) {
            const currentPos = marker.getLatLng();
            if (Math.abs(currentPos.lat - initialLat) > 0.0001 || Math.abs(currentPos.lng - initialLng) > 0.0001) {
                map.setView([initialLat, initialLng], map.getZoom());
                marker.setLatLng([initialLat, initialLng]);
                setCoordinates({ lat: initialLat, lng: initialLng });
            }
        }
    }, [initialLat, initialLng, map, marker]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newLat = Number.parseFloat(lat);
                const newLng = Number.parseFloat(lon);

                if (map && marker) {
                    map.setView([newLat, newLng], 15);
                    marker.setLatLng([newLat, newLng]);
                    setCoordinates({ lat: newLat, lng: newLng });
                    onLocationSelect(newLat, newLng, display_name);
                }
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Search for an address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <Button type="button" onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                </Button>
            </div>

            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-100">
                        <div className="text-center">
                            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                            <p className="text-sm text-gray-600">Loading map...</p>
                        </div>
                    </div>
                )}
                <div ref={mapRef} className="h-96 w-full rounded-lg border" style={{ minHeight: '384px' }} />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                    Selected: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </span>
            </div>
        </div>
    );
};

export default LocationMap;
