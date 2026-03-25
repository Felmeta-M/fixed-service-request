import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useGoogleMaps } from '@/contexts/google-maps-context';
import { formatCoordinate } from '@/lib/coordinate-utils';
import { formatAddressSummary, type StructuredAddress } from '@/lib/geocoding';
import { cn } from '@/lib/utils';
import { GoogleMap, Marker } from '@react-google-maps/api';
import {
    CheckCircle2,
    Info,
    MapPin,
    Navigation,
    MousePointerClick,
    Loader2,
} from 'lucide-react';
import { useCallback, useRef } from 'react';

type DetectionMethod = 'auto-detected' | 'manually-selected';

const PLACEHOLDER_ADDRESSES = [
    'Address details not available',
    'Address service temporarily unavailable',
    'Location identified (specific address not available)',
    'Address found',
];

function isRealAddress(address: string | undefined | null): boolean {
    if (!address || !address.trim()) return false;
    return !PLACEHOLDER_ADDRESSES.includes(address);
}

interface LocationConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onAdjust: () => void;
    latitude: number;
    longitude: number;
    address: string;
    addressComponents?: StructuredAddress;
    locationAccuracy?: { meters: number; level: string; timestamp?: number } | null;
}

function getDetectionMethod(
    accuracy?: { meters: number; level: string; timestamp?: number } | null,
): DetectionMethod {
    if (!accuracy) return 'manually-selected';
    if (accuracy.meters === 0) return 'manually-selected';
    return 'auto-detected';
}

const detectionMethodConfig: Record<
    DetectionMethod,
    { label: string; icon: typeof MapPin; color: string; bgColor: string; borderColor: string }
> = {
    'auto-detected': {
        label: 'Auto-detected via GPS',
        icon: Navigation,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
    },
    'manually-selected': {
        label: 'Manually selected',
        icon: MousePointerClick,
        color: 'text-primary',
        bgColor: 'bg-primary-50',
        borderColor: 'border-primary-200',
    },
};

const miniMapContainerStyle = {
    width: '100%',
    height: '220px',
};

export function LocationConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    onAdjust,
    latitude,
    longitude,
    address,
    addressComponents,
    locationAccuracy,
}: LocationConfirmationDialogProps) {
    const { isLoaded } = useGoogleMaps();
    const mapRef = useRef<google.maps.Map | null>(null);

    const method = getDetectionMethod(locationAccuracy);
    const methodConfig = detectionMethodConfig[method];
    const MethodIcon = methodConfig.icon;
    const hasAddress = isRealAddress(address);
    const summaryLine = formatAddressSummary(addressComponents);

    const center = { lat: latitude, lng: longitude };

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onMapUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
                <AlertDialogHeader className="p-5 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-lg font-semibold text-foreground">
                                Confirm Your Location
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-muted-foreground mt-0.5">
                                Please verify this is where you want the service installed.
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="px-5 pt-4 pb-2 space-y-4">
                    {/* Map Preview */}
                    <div className="relative w-full overflow-hidden rounded-lg border border-border/60">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={miniMapContainerStyle}
                                center={center}
                                zoom={16}
                                onLoad={onMapLoad}
                                onUnmount={onMapUnmount}
                                options={{
                                    disableDefaultUI: true,
                                    zoomControl: true,
                                    mapTypeControl: true,
                                    streetViewControl: false,
                                    fullscreenControl: false,
                                    gestureHandling: 'greedy',
                                    clickableIcons: false,
                                    styles: [
                                        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                                        { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
                                    ],
                                }}
                            >
                                <Marker position={center} />
                            </GoogleMap>
                        ) : (
                            <div className="flex h-[220px] items-center justify-center bg-muted/30">
                                <div className="text-center">
                                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
                                    <p className="text-xs text-muted-foreground">Loading map preview...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Detection Method Badge */}
                    <Badge
                        variant="outline"
                        className={cn(
                            'inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-1',
                            methodConfig.bgColor,
                            methodConfig.borderColor,
                            methodConfig.color,
                        )}
                    >
                        <MethodIcon className="h-3.5 w-3.5 shrink-0" />
                        {methodConfig.label}
                        {locationAccuracy && locationAccuracy.meters > 0 && (
                            <span className="opacity-75">(±{Math.round(locationAccuracy.meters)}m)</span>
                        )}
                    </Badge>

                    {/* Address */}
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                        <div className="flex items-start gap-2.5">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Installation Address
                                </p>
                                {hasAddress ? (
                                    <p className="mt-1 text-sm font-medium text-foreground break-words leading-relaxed">
                                        {address}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-muted-foreground italic">
                                        Address will be determined during service setup
                                    </p>
                                )}

                                {summaryLine && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {summaryLine}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Coordinates */}
                    <div className="flex items-center gap-3 px-1 text-xs text-muted-foreground">
                        <span className="font-mono">
                            {formatCoordinate(latitude)}°N, {formatCoordinate(longitude)}°E
                        </span>
                    </div>

                    {/* Info Note */}
                    <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-100 p-3">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <p className="text-xs leading-relaxed text-blue-700">
                            Once confirmed the selected location is accurate, a service availability check will be performed for this location.
                            If available, your service will be provisioned within <span className="font-semibold">48 hours</span>.
                            Please ensure this is the correct installation address.
                        </p>
                    </div>
                </div>

                <div className="px-5 pb-1">
                    <p className="text-start text-[11px] leading-snug text-muted-foreground">
                        Not accurate? Click <span className="font-medium text-foreground">Adjust Location</span> to drag the pin, search by name, or enter coordinates on the map.
                    </p>
                </div>

                <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:!justify-between p-5 pt-3">
                    <AlertDialogCancel
                        onClick={onAdjust}
                        className="mt-0 sm:mt-0"
                    >
                        <MapPin className=" h-4 w-4" />
                        Adjust Location
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary/20"
                    >
                        <CheckCircle2 className=" h-4 w-4" />
                        Confirm Location
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
