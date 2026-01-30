import { useJsApiLoader, Libraries } from '@react-google-maps/api';
import { createContext, useContext, ReactNode, useMemo } from 'react';

// Define the libraries needed for Google Maps
// Using a constant outside the component to prevent re-renders
const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'geometry'];

interface GoogleMapsContextValue {
    isLoaded: boolean;
    loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({
    isLoaded: false,
    loadError: undefined,
});

interface GoogleMapsProviderProps {
    apiKey: string;
    children: ReactNode;
}

/**
 * GoogleMapsProvider - Centralized Google Maps script loader
 * 
 * This provider ensures the Google Maps script is loaded only once across the entire
 * application, preventing the "Loading Google Maps..." issue that occurs when using
 * LoadScript component multiple times.
 * 
 * Benefits:
 * - Single script load for entire app lifecycle
 * - Consistent loading state across all map components
 * - Better performance and reliability
 * - Works correctly with React 18 StrictMode
 */
export function GoogleMapsProvider({ apiKey, children }: GoogleMapsProviderProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-maps-script',
        googleMapsApiKey: apiKey,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const value = useMemo(() => ({
        isLoaded,
        loadError,
    }), [isLoaded, loadError]);

    return (
        <GoogleMapsContext.Provider value={value}>
            {children}
        </GoogleMapsContext.Provider>
    );
}

/**
 * useGoogleMaps - Hook to access Google Maps loading state
 * 
 * Usage:
 * ```tsx
 * const { isLoaded, loadError } = useGoogleMaps();
 * 
 * if (!isLoaded) return <LoadingSpinner />;
 * if (loadError) return <ErrorMessage />;
 * 
 * return <GoogleMap ... />;
 * ```
 */
export function useGoogleMaps() {
    const context = useContext(GoogleMapsContext);
    
    if (context === undefined) {
        throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
    }
    
    return context;
}

// Export the libraries constant for use elsewhere if needed
export { GOOGLE_MAPS_LIBRARIES };
