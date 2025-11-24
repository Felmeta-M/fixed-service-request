import LocationPicker from '@/components/LocationPicker';
import { useState } from 'react';

export default function Create({ googleMapsApiKey }: any) {
    console.log('🚀 ~ Create ~ googleMapsApiKey:', googleMapsApiKey);
    const [location, setLocation] = useState({ lat: null, lng: null });

    const handleSubmit = (e) => {
        e.preventDefault();
        // send form + location to backend
        console.log(location);
    };

    return (
        <div>
            <h1>Request Telecom Service</h1>

            <LocationPicker googleMapsApiKey={googleMapsApiKey} onLocationSelect={setLocation} />

            <form onSubmit={handleSubmit}>
                <input type="hidden" name="latitude" value={location.lat || ''} />
                <input type="hidden" name="longitude" value={location.lng || ''} />

                <button type="submit">Submit</button>
            </form>
        </div>
    );
}
