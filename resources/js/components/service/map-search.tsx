import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import React from 'react';

interface ProfessionalSearchProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    onSearch: () => void;
    isLoading?: boolean;
    placeholder?: string;
    className?: string;
}

export function ProfessionalSearch({
    searchQuery,
    setSearchQuery,
    onSearch,
    isLoading = false,
    placeholder = 'Search for an address, place, or landmark...',
    className = '',
}: ProfessionalSearchProps) {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSearch();
        }
    };

    return (
        <div className={`relative w-full ${className}`}>
            <div className="relative">
                {/* Search Icon */}
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : <Search className="h-4 w-4 text-gray-400" />}
                </div>

                {/* Input Field */}
                <Input
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full py-2 pr-20 pl-10 focus:ring-1 focus:ring-primary"
                />

                {/* Search Button (inside input) */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                    <Button
                        type="button"
                        onClick={onSearch}
                        disabled={isLoading || !searchQuery.trim()}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-xs font-medium text-muted-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Search
                    </Button>
                </div>
            </div>
        </div>
    );
}
