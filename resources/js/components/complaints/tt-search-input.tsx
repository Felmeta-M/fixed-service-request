import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';

interface TTSearchInputProps {
  accessNumber: string;
  onAccessNumberChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  placeholder?: string;
}

export function TTSearchInput({
  accessNumber,
  onAccessNumberChange,
  onSearch,
  loading,
  placeholder = "Enter access number to search TTs...",
}: TTSearchInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      onSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={accessNumber}
          onChange={(e) => onAccessNumberChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-9"
          disabled={loading}
        />
      </div>
      <Button onClick={onSearch} disabled={loading || !accessNumber.trim()}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Search
          </>
        )}
      </Button>
    </div>
  );
}