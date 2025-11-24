import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useCallback, useState } from 'react';

export default function LocationPicker({ googleMapsApiKey, onLocationSelect }) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey,
    });

    const [marker, setMarker] = useState({
        lat: 9.010793,
        lng: 38.761252,
    });

    const onMapClick = useCallback((e) => {
        const newLocation = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
        };
        setMarker(newLocation);
        onLocationSelect(newLocation);
    }, []);

    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <GoogleMap zoom={15} center={marker} mapContainerStyle={{ width: '100%', height: '400px' }} onClick={onMapClick}>
            <Marker position={marker} />
        </GoogleMap>
    );
}
