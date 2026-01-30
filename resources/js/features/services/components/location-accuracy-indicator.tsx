import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, CircleDot, Info, MapPin, Navigation, Target } from 'lucide-react';

/**
 * Accuracy thresholds based on professional standards
 * - Excellent: < 30m (GPS with good signal)
 * - Good: 30-100m (GPS or high-accuracy WiFi)
 * - Fair: 100-500m (WiFi or cell tower)
 * - Poor: > 500m (IP-based or degraded signal)
 */
export type AccuracyLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface LocationAccuracy {
    meters: number;
    level: AccuracyLevel;
    timestamp?: number;
}

export function getAccuracyLevel(accuracyMeters: number): AccuracyLevel {
    if (accuracyMeters <= 30) return 'excellent';
    if (accuracyMeters <= 100) return 'good';
    if (accuracyMeters <= 500) return 'fair';
    return 'poor';
}

export function getAccuracyConfig(level: AccuracyLevel) {
    const configs = {
        excellent: {
            label: 'Excellent',
            description: 'High precision GPS location',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            ringColor: 'ring-emerald-500/30',
            circleColor: '#10b981', // emerald-500
            circleOpacity: 0.15,
            icon: CheckCircle2,
            showWarning: false,
            canProceed: true,
        },
        good: {
            label: 'Good',
            description: 'Reliable location accuracy',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            ringColor: 'ring-green-500/30',
            circleColor: '#22c55e', // green-500
            circleOpacity: 0.12,
            icon: CheckCircle2,
            showWarning: false,
            canProceed: true,
        },
        fair: {
            label: 'Fair',
            description: 'Approximate location - consider refining',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            ringColor: 'ring-amber-500/30',
            circleColor: '#f59e0b', // amber-500
            circleOpacity: 0.15,
            icon: AlertTriangle,
            showWarning: true,
            canProceed: true,
        },
        poor: {
            label: 'Poor',
            description: 'Low accuracy - please select on map',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            ringColor: 'ring-red-500/30',
            circleColor: '#ef4444', // red-500
            circleOpacity: 0.18,
            icon: AlertTriangle,
            showWarning: true,
            canProceed: false,
        },
        unknown: {
            label: 'Unknown',
            description: 'Accuracy could not be determined',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
            ringColor: 'ring-gray-500/30',
            circleColor: '#6b7280', // gray-500
            circleOpacity: 0.1,
            icon: Info,
            showWarning: true,
            canProceed: true,
        },
    };
    return configs[level];
}

interface LocationAccuracyBadgeProps {
    accuracy: LocationAccuracy | null;
    className?: string;
    showMeters?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * LocationAccuracyBadge - Compact badge showing accuracy level
 * 
 * Displays a color-coded badge with the accuracy level and optionally
 * the accuracy in meters.
 */
export function LocationAccuracyBadge({ 
    accuracy, 
    className,
    showMeters = true,
    size = 'md',
}: LocationAccuracyBadgeProps) {
    if (!accuracy) return null;

    const config = getAccuracyConfig(accuracy.level);
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-sm px-2.5 py-1.5',
    };

    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-3.5 w-3.5',
        lg: 'h-4 w-4',
    };

    return (
        <Badge
            variant="outline"
            className={cn(
                'inline-flex items-center gap-1 font-medium',
                config.bgColor,
                config.borderColor,
                config.color,
                sizeClasses[size],
                className
            )}
        >
            <Icon className={cn('shrink-0', iconSizes[size])} />
            <span>{config.label}</span>
            {showMeters && accuracy.meters > 0 && (
                <span className="opacity-75">
                    (~{accuracy.meters < 1000 
                        ? `${Math.round(accuracy.meters)}m` 
                        : `${(accuracy.meters / 1000).toFixed(1)}km`
                    })
                </span>
            )}
        </Badge>
    );
}

interface LocationAccuracyIndicatorProps {
    accuracy: LocationAccuracy | null;
    isDetecting?: boolean;
    onRefineLocation?: () => void;
    onSelectOnMap?: () => void;
    className?: string;
    compact?: boolean;
}

/**
 * LocationAccuracyIndicator - Comprehensive accuracy display component
 * 
 * Shows accuracy level with description, warnings for low accuracy,
 * and action buttons to refine location.
 */
export function LocationAccuracyIndicator({
    accuracy,
    isDetecting = false,
    onRefineLocation,
    onSelectOnMap,
    className,
    compact = false,
}: LocationAccuracyIndicatorProps) {
    if (isDetecting) {
        return (
            <div className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2',
                'bg-blue-50 border-blue-200 text-blue-700',
                className
            )}>
                <Navigation className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Detecting your location...</span>
            </div>
        );
    }

    if (!accuracy) return null;

    const config = getAccuracyConfig(accuracy.level);
    const Icon = config.icon;

    if (compact) {
        return (
            <div className={cn(
                'flex items-center justify-between gap-2 rounded-lg border px-3 py-2',
                config.bgColor,
                config.borderColor,
                className
            )}>
                <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4 shrink-0', config.color)} />
                    <div className="min-w-0">
                        <span className={cn('text-sm font-medium', config.color)}>
                            {config.label} Accuracy
                        </span>
                        {accuracy.meters > 0 && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                                ±{Math.round(accuracy.meters)}m
                            </span>
                        )}
                    </div>
                </div>
                {config.showWarning && onSelectOnMap && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onSelectOnMap}
                        className="h-7 text-xs"
                    >
                        <MapPin className="mr-1 h-3 w-3" />
                        Refine
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className={cn(
            'rounded-lg border p-4',
            config.bgColor,
            config.borderColor,
            className
        )}>
            <div className="flex items-start gap-3">
                <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    config.bgColor,
                    'ring-2',
                    config.ringColor
                )}>
                    <Icon className={cn('h-5 w-5', config.color)} />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={cn('font-semibold', config.color)}>
                            {config.label} Accuracy
                        </h4>
                        {accuracy.meters > 0 && (
                            <span className="text-sm text-muted-foreground">
                                ±{accuracy.meters < 1000 
                                    ? `${Math.round(accuracy.meters)} meters`
                                    : `${(accuracy.meters / 1000).toFixed(1)} km`
                                }
                            </span>
                        )}
                    </div>
                    
                    <p className="mt-1 text-sm text-muted-foreground">
                        {config.description}
                    </p>

                    {config.showWarning && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {onRefineLocation && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={onRefineLocation}
                                    className="h-8"
                                >
                                    <Target className="mr-1.5 h-3.5 w-3.5" />
                                    Try Again
                                </Button>
                            )}
                            {onSelectOnMap && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={accuracy.level === 'poor' ? 'default' : 'outline'}
                                    onClick={onSelectOnMap}
                                    className="h-8"
                                >
                                    <MapPin className="mr-1.5 h-3.5 w-3.5" />
                                    Select on Map
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface AccuracyCircleConfig {
    center: { lat: number; lng: number };
    radiusMeters: number;
    level: AccuracyLevel;
}

/**
 * getAccuracyCircleOptions - Get Google Maps Circle options for accuracy visualization
 * 
 * Returns configuration for drawing an accuracy circle on the map,
 * similar to how Google Maps shows the blue accuracy circle.
 */
export function getAccuracyCircleOptions(config: AccuracyCircleConfig): google.maps.CircleOptions {
    const accuracyConfig = getAccuracyConfig(config.level);
    
    return {
        center: config.center,
        radius: config.radiusMeters,
        fillColor: accuracyConfig.circleColor,
        fillOpacity: accuracyConfig.circleOpacity,
        strokeColor: accuracyConfig.circleColor,
        strokeOpacity: 0.4,
        strokeWeight: 2,
        clickable: false,
        zIndex: 1,
    };
}

/**
 * formatAccuracyForDisplay - Format accuracy value for user display
 */
export function formatAccuracyForDisplay(meters: number): string {
    if (meters < 1) return '< 1m';
    if (meters < 1000) return `~${Math.round(meters)}m`;
    return `~${(meters / 1000).toFixed(1)}km`;
}

/**
 * shouldPromptManualSelection - Determine if user should be prompted to select manually
 */
export function shouldPromptManualSelection(accuracy: LocationAccuracy | null): boolean {
    if (!accuracy) return true;
    return accuracy.level === 'poor' || accuracy.level === 'unknown';
}

/**
 * canAutoDetectLocation - Check if the browser supports high-accuracy geolocation
 */
export function canAutoDetectLocation(): boolean {
    return 'geolocation' in navigator;
}
