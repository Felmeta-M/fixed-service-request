import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface PlacePrediction {
    place_id: string;
    description: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

interface AutocompleteSearchProps {
    onPlaceSelect: (lat: number, lng: number, address: string) => void;
    isLoading?: boolean;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function AutocompleteSearch({
    onPlaceSelect,
    isLoading = false,
    placeholder = 'Search location...',
    className = '',
    disabled = false,
}: AutocompleteSearchProps) {
    const [query, setQuery] = useState('');
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Initialize services when Google Maps is loaded
    useEffect(() => {
        const initServices = () => {
            if (typeof google !== 'undefined' && google.maps?.places) {
                autocompleteService.current = new google.maps.places.AutocompleteService();
                // PlacesService needs a map or div element
                const dummyDiv = document.createElement('div');
                placesService.current = new google.maps.places.PlacesService(dummyDiv);
            }
        };

        // Try to initialize immediately
        initServices();

        // Also set up a small delay in case Google Maps is still loading
        const timer = setTimeout(initServices, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Fetch predictions with debounce
    const fetchPredictions = useCallback((input: string) => {
        if (!autocompleteService.current || !input.trim()) {
            setPredictions([]);
            setIsOpen(false);
            return;
        }

        setIsFetching(true);

        autocompleteService.current.getPlacePredictions(
            {
                input,
                types: ['geocode', 'establishment'],
            },
            (results, status) => {
                setIsFetching(false);
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    setPredictions(results as PlacePrediction[]);
                    setIsOpen(true);
                } else {
                    setPredictions([]);
                    setIsOpen(false);
                }
            }
        );
    }, []);

    // Handle input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setActiveIndex(-1);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (!value.trim()) {
            setPredictions([]);
            setIsOpen(false);
            return;
        }

        debounceTimer.current = setTimeout(() => {
            fetchPredictions(value);
        }, 300);
    };

    // Get place details and coordinates
    const selectPlace = useCallback(
        (prediction: PlacePrediction) => {
            if (!placesService.current) return;

            setIsFetching(true);
            setQuery(prediction.description);
            setIsOpen(false);
            setPredictions([]);

            placesService.current.getDetails(
                {
                    placeId: prediction.place_id,
                    fields: ['geometry', 'formatted_address'],
                },
                (place, status) => {
                    setIsFetching(false);
                    if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        const address = place.formatted_address || prediction.description;
                        onPlaceSelect(lat, lng, address);
                        setQuery(''); // Clear after selection
                    }
                }
            );
        },
        [onPlaceSelect]
    );

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || predictions.length === 0) {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && predictions[activeIndex]) {
                    selectPlace(predictions[activeIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setActiveIndex(-1);
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setActiveIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    const clearInput = () => {
        setQuery('');
        setPredictions([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            <div className="relative">
                {/* Search Icon */}
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                    {isFetching || isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : (
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                </div>

                <Input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => predictions.length > 0 && setIsOpen(true)}
                    disabled={disabled || isLoading}
                    className="h-9 pl-8 pr-8 text-sm focus:ring-1 focus:ring-primary"
                    autoComplete="off"
                />

                {/* Clear button */}
                {query && (
                    <button
                        type="button"
                        onClick={clearInput}
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Predictions Dropdown */}
            {isOpen && predictions.length > 0 && (
                <div className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                    <ul className="max-h-60 overflow-auto py-1">
                        {predictions.map((prediction, index) => (
                            <li key={prediction.place_id}>
                                <button
                                    type="button"
                                    onClick={() => selectPlace(prediction)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={cn(
                                        'flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                                        activeIndex === index ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                                    )}
                                >
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-foreground">{prediction.structured_formatting.main_text}</p>
                                        <p className="truncate text-xs text-muted-foreground">{prediction.structured_formatting.secondary_text}</p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="border-t border-border px-3 py-1.5">
                        <p className="text-[10px] text-muted-foreground">Powered by Google</p>
                    </div>
                </div>
            )}
        </div>
    );
}
