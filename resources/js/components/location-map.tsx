// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import { MapPin, Search } from 'lucide-react';
// import React, { useEffect, useRef, useState } from 'react';
// import { Button } from './ui/button';
// import { Input } from './ui/input';

// interface LocationMapProps {
//     onLocationSelect: (lat: number, lng: number, address?: string) => void;
//     initialLat?: number;
//     initialLng?: number;
// }

// const LocationMap: React.FC<LocationMapProps> = ({
//     onLocationSelect,
//     initialLat = 9.0192, // Addis Ababa latitude
//     initialLng = 38.7525, // Addis Ababa longitude
// }) => {
//     const mapRef = useRef<HTMLDivElement>(null);
//     const [map, setMap] = useState<L.Map | null>(null);
//     const [marker, setMarker] = useState<L.Marker | null>(null);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });
//     const [isLoading, setIsLoading] = useState(true);

//     useEffect(() => {
//         if (!mapRef.current) return;

//         // Initialize the map
//         const mapInstance = L.map(mapRef.current, {
//             center: [initialLat, initialLng],
//             zoom: 13,
//             zoomControl: true,
//             attributionControl: true,
//         });

//         // Add tile layer
//         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//             attribution: '© OpenStreetMap contributors',
//             maxZoom: 19,
//         }).addTo(mapInstance);

//         // Fix for default markers
//         const DefaultIcon = L.icon({
//             iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//             iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//             shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
//             iconSize: [25, 41],
//             iconAnchor: [12, 41],
//             popupAnchor: [1, -34],
//             shadowSize: [41, 41],
//         });

//         // Create marker
//         const newMarker = L.marker([initialLat, initialLng], {
//             draggable: true,
//             icon: DefaultIcon,
//         }).addTo(mapInstance);

//         // Add event listeners
//         newMarker.on('dragend', (e) => {
//             const position = e.target.getLatLng();
//             setCoordinates({ lat: position.lat, lng: position.lng });
//             onLocationSelect(position.lat, position.lng);
//         });

//         mapInstance.on('click', (e) => {
//             const { lat, lng } = e.latlng;
//             newMarker.setLatLng([lat, lng]);
//             setCoordinates({ lat, lng });
//             onLocationSelect(lat, lng);
//         });

//         setMap(mapInstance);
//         setMarker(newMarker);
//         setIsLoading(false);

//         return () => {
//             mapInstance.remove();
//         };
//     }, []);

//     useEffect(() => {
//         if (map && marker) {
//             const currentPos = marker.getLatLng();
//             if (Math.abs(currentPos.lat - initialLat) > 0.0001 || Math.abs(currentPos.lng - initialLng) > 0.0001) {
//                 map.setView([initialLat, initialLng], map.getZoom());
//                 marker.setLatLng([initialLat, initialLng]);
//                 setCoordinates({ lat: initialLat, lng: initialLng });
//             }
//         }
//     }, [initialLat, initialLng, map, marker]);

//     const handleSearch = async () => {
//         if (!searchQuery.trim()) return;

//         try {
//             const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
//             const data = await response.json();

//             if (data && data.length > 0) {
//                 const { lat, lon, display_name } = data[0];
//                 const newLat = Number.parseFloat(lat);
//                 const newLng = Number.parseFloat(lon);

//                 if (map && marker) {
//                     map.setView([newLat, newLng], 15);
//                     marker.setLatLng([newLat, newLng]);
//                     setCoordinates({ lat: newLat, lng: newLng });
//                     onLocationSelect(newLat, newLng, display_name);
//                 }
//             }
//         } catch (error) {
//             console.error('Geocoding error:', error);
//         }
//     };

//     const handleKeyPress = (e: React.KeyboardEvent) => {
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             handleSearch();
//         }
//     };

//     return (
//         <div className="space-y-4">
//             <div className="flex gap-2">
//                 <Input
//                     placeholder="Search for an address..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     onKeyPress={handleKeyPress}
//                 />
//                 <Button type="button" onClick={handleSearch} size="icon">
//                     <Search className="h-4 w-4" />
//                 </Button>
//             </div>

//             <div className="relative">
//                 {isLoading && (
//                     <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-100">
//                         <div className="text-center">
//                             <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
//                             <p className="text-sm text-gray-600">Loading map...</p>
//                         </div>
//                     </div>
//                 )}
//                 <div ref={mapRef} className="h-96 w-full rounded-lg border" style={{ minHeight: '384px' }} />
//             </div>

//             <div className="flex items-center gap-2 text-sm text-gray-600">
//                 <MapPin className="h-4 w-4" />
//                 <span>
//                     Selected: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
//                 </span>
//             </div>
//         </div>
//     );
// };

// export default LocationMap;

// // components/location-map.tsx
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import { MapPin, Search } from 'lucide-react';
// import React, { useEffect, useRef, useState } from 'react';
// import { Button } from './ui/button';
// import { Input } from './ui/input';

// // Fix for default markers in React/Next.js
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//     iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//     shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
// });

// interface LocationMapProps {
//     onLocationSelect: (lat: number, lng: number, address?: string) => void;
//     initialLat?: number;
//     initialLng?: number;
// }

// const LocationMap: React.FC<LocationMapProps> = ({
//     onLocationSelect,
//     initialLat = 9.0192, // Addis Ababa latitude
//     initialLng = 38.7525, // Addis Ababa longitude
// }) => {
//     const mapRef = useRef<HTMLDivElement>(null);
//     const [map, setMap] = useState<L.Map | null>(null);
//     const [marker, setMarker] = useState<L.Marker | null>(null);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [coordinates, setCoordinates] = useState({
//         lat: Number(initialLat),
//         lng: Number(initialLng),
//     });
//     const [isLoading, setIsLoading] = useState(true);
//     const [address, setAddress] = useState<string>('');

//     // Function to get address from coordinates
//     const getAddressFromCoordinates = async (lat: number, lng: number) => {
//         try {
//             const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
//             const data = await response.json();
//             if (data && data.display_name) {
//                 setAddress(data.display_name);
//                 return data.display_name;
//             }
//             return '';
//         } catch (error) {
//             console.error('Reverse geocoding error:', error);
//             return '';
//         }
//     };

//     useEffect(() => {
//         if (!mapRef.current) return;

//         // Initialize the map with better styling
//         const mapInstance = L.map(mapRef.current, {
//             center: [coordinates.lat, coordinates.lng],
//             zoom: 15,
//             zoomControl: true,
//             attributionControl: true,
//         });

//         // Add beautiful tile layer - Using CartoDB Voyager for a modern look
//         L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
//             attribution:
//                 '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
//             subdomains: 'abcd',
//             maxZoom: 20,
//         }).addTo(mapInstance);

//         // Add alternative tile layer (OSM) as fallback
//         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//             attribution: '© OpenStreetMap contributors',
//             maxZoom: 19,
//         }).addTo(mapInstance);

//         // Create custom icon for the marker
//         const customIcon = L.icon({
//             iconUrl:
//                 'data:image/svg+xml;base64,' +
//                 btoa(`
//                 <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <path d="M16 2C11.58 2 8 5.58 8 10C8 17 16 30 16 30C16 30 24 17 24 10C24 5.58 20.42 2 16 2Z" fill="#2563eb"/>
//                     <path d="M16 14C17.1046 14 18 13.1046 18 12C18 10.8954 17.1046 10 16 10C14.8954 10 14 10.8954 14 12C14 13.1046 14.8954 14 16 14Z" fill="white"/>
//                     <path d="M16 2C11.58 2 8 5.58 8 10C8 17 16 30 16 30C16 30 24 17 24 10C24 5.58 20.42 2 16 2Z" stroke="white" stroke-width="2"/>
//                 </svg>
//             `),
//             iconSize: [32, 32],
//             iconAnchor: [16, 32],
//             popupAnchor: [0, -32],
//         });

//         // Create marker with custom icon
//         const newMarker = L.marker([coordinates.lat, coordinates.lng], {
//             draggable: true,
//             icon: customIcon,
//         }).addTo(mapInstance);

//         // Add popup to marker
//         newMarker.bindPopup(`
//             <div class="p-2">
//                 <strong>Selected Location</strong><br>
//                 Lat: ${coordinates.lat.toFixed(6)}<br>
//                 Lng: ${coordinates.lng.toFixed(6)}<br>
//                 ${address ? `Address: ${address}` : ''}
//             </div>
//         `);

//         // Event handler for marker drag end
//         const handleMarkerDragEnd = async (e: L.DragEndEvent) => {
//             const position = e.target.getLatLng();
//             const lat = Number(position.lat);
//             const lng = Number(position.lng);

//             setCoordinates({ lat, lng });
//             const address = await getAddressFromCoordinates(lat, lng);
//             onLocationSelect(lat, lng, address);

//             // Update popup
//             newMarker.setPopupContent(`
//                 <div class="p-2">
//                     <strong>Selected Location</strong><br>
//                     Lat: ${lat.toFixed(6)}<br>
//                     Lng: ${lng.toFixed(6)}<br>
//                     ${address ? `Address: ${address}` : ''}
//                 </div>
//             `);
//         };

//         // Event handler for map click
//         const handleMapClick = async (e: L.LeafletMouseEvent) => {
//             const { lat, lng } = e.latlng;
//             const numLat = Number(lat);
//             const numLng = Number(lng);

//             newMarker.setLatLng([numLat, numLng]);
//             setCoordinates({ lat: numLat, lng: numLng });
//             const address = await getAddressFromCoordinates(numLat, numLng);
//             onLocationSelect(numLat, numLng, address);

//             // Update popup
//             newMarker.setPopupContent(`
//                 <div class="p-2">
//                     <strong>Selected Location</strong><br>
//                     Lat: ${numLat.toFixed(6)}<br>
//                     Lng: ${numLng.toFixed(6)}<br>
//                     ${address ? `Address: ${address}` : ''}
//                 </div>
//             `);
//         };

//         // Add event listeners
//         newMarker.on('dragend', handleMarkerDragEnd);
//         mapInstance.on('click', handleMapClick);

//         // Add scale control
//         L.control.scale({ imperial: false }).addTo(mapInstance);

//         // Add custom CSS for better styling
//         const style = document.createElement('style');
//         style.textContent = `
//             .leaflet-popup-content-wrapper {
//                 border-radius: 8px;
//                 box-shadow: 0 10px 25px rgba(0,0,0,0.1);
//             }
//             .leaflet-popup-tip {
//                 box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//             }
//         `;
//         document.head.appendChild(style);

//         setMap(mapInstance);
//         setMarker(newMarker);
//         setIsLoading(false);

//         // Get initial address
//         getAddressFromCoordinates(coordinates.lat, coordinates.lng);

//         return () => {
//             mapInstance.remove();
//             document.head.removeChild(style);
//         };
//     }, []);

//     // Update effect to handle initialLat/initialLng changes
//     useEffect(() => {
//         if (map && marker) {
//             const numLat = Number(initialLat);
//             const numLng = Number(initialLng);

//             // Only update if coordinates actually changed
//             if (Math.abs(coordinates.lat - numLat) > 0.0001 || Math.abs(coordinates.lng - numLng) > 0.0001) {
//                 map.setView([numLat, numLng], map.getZoom());
//                 marker.setLatLng([numLat, numLng]);
//                 setCoordinates({ lat: numLat, lng: numLng });

//                 // Update address
//                 getAddressFromCoordinates(numLat, numLng);
//             }
//         }
//     }, [initialLat, initialLng, map, marker]);

//     const handleSearch = async () => {
//         if (!searchQuery.trim()) return;

//         setIsLoading(true);
//         try {
//             const response = await fetch(
//                 `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
//             );
//             const data = await response.json();

//             if (data && data.length > 0) {
//                 const { lat, lon, display_name } = data[0];
//                 const newLat = Number.parseFloat(lat);
//                 const newLng = Number.parseFloat(lon);

//                 if (map && marker) {
//                     map.setView([newLat, newLng], 16);
//                     marker.setLatLng([newLat, newLng]);
//                     setCoordinates({ lat: newLat, lng: newLng });
//                     setAddress(display_name);

//                     // Update popup
//                     marker
//                         .setPopupContent(
//                             `
//                         <div class="p-2">
//                             <strong>Selected Location</strong><br>
//                             Lat: ${newLat.toFixed(6)}<br>
//                             Lng: ${newLng.toFixed(6)}<br>
//                             Address: ${display_name}
//                         </div>
//                     `,
//                         )
//                         .openPopup();

//                     onLocationSelect(newLat, newLng, display_name);
//                 }
//             }
//         } catch (error) {
//             console.error('Geocoding error:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleKeyPress = (e: React.KeyboardEvent) => {
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             handleSearch();
//         }
//     };

//     // Ensure coordinates are numbers before calling toFixed
//     const displayLat = typeof coordinates.lat === 'number' ? coordinates.lat.toFixed(6) : '0.000000';
//     const displayLng = typeof coordinates.lng === 'number' ? coordinates.lng.toFixed(6) : '0.000000';

//     return (
//         <div className="space-y-4">
//             {/* Search Bar */}
//             <div className="flex gap-2">
//                 <Input
//                     placeholder="Search for an address, place, or landmark..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     onKeyPress={handleKeyPress}
//                     className="flex-1"
//                 />
//                 <Button type="button" onClick={handleSearch} disabled={isLoading} className="bg-primary hover:bg-primary/90">
//                     {isLoading ? (
//                         <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
//                     ) : (
//                         <Search className="h-4 w-4" />
//                     )}
//                 </Button>
//             </div>

//             {/* Map Container */}
//             <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm">
//                 {isLoading && (
//                     <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
//                         <div className="text-center">
//                             <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
//                             <p className="text-sm font-medium text-gray-700">Loading map...</p>
//                         </div>
//                     </div>
//                 )}

//                 {/* Map Instructions */}
//                 <div className="absolute top-2 left-2 z-[400] rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-gray-700 backdrop-blur-sm">
//                     📍 Click on map or drag marker to select location
//                 </div>

//                 <div ref={mapRef} className="h-96 w-full" style={{ minHeight: '384px' }} />
//             </div>

//             {/* Selected Coordinates Display */}
//             <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
//                 <div className="flex items-start gap-3">
//                     <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
//                     <div className="flex-1">
//                         <p className="text-sm font-medium text-gray-900">Selected Location</p>
//                         <p className="mt-1 text-sm text-gray-600">
//                             Coordinates: {displayLat}, {displayLng}
//                         </p>
//                         {address && <p className="mt-1 text-sm text-gray-600">Address: {address}</p>}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default LocationMap;

// components/location-map.tsx
import { formatCoordinate, parseCoordinate } from '@/lib/coordinate-utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

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
    const [searchQuery, setSearchQuery] = useState('');
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

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const rawLat = parseFloat(lat);
                const rawLng = parseFloat(lon);
                const { preciseLat, preciseLng } = await handleCoordinateSelection(rawLat, rawLng);

                if (map && marker) {
                    map.setView([preciseLat, preciseLng], 16);
                    marker.setLatLng([preciseLat, preciseLng]);
                    setAddress(display_name);

                    // Update popup with formatted coordinates
                    marker
                        .setPopupContent(
                            `
                        <div class="p-2">
                            <strong>Selected Location</strong><br>
                            Lat: ${formatCoordinate(preciseLat)}<br>
                            Lng: ${formatCoordinate(preciseLng)}<br>
                            Address: ${display_name}
                        </div>
                    `,
                        )
                        .openPopup();

                    onLocationSelect(preciseLat, preciseLng, display_name);
                }
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    // Use formatted coordinates for display
    const displayLat = formatCoordinate(coordinates.lat);
    const displayLng = formatCoordinate(coordinates.lng);

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <Input
                    placeholder="Search for an address, place, or landmark..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                />
                <Button type="button" onClick={handleSearch} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                    {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Map Container */}
            <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm">
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
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Selected Location</p>
                        {/* <p className="mt-1 text-sm text-gray-600">
                            Coordinates: {displayLat}, {displayLng}
                        </p> */}
                        {address && <p className="mt-1 text-sm text-gray-600">Address: {address}</p>}
                        {/* <p className="mt-1 text-xs text-green-600">✓ Formatted for API (6 decimal places)</p> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationMap;
