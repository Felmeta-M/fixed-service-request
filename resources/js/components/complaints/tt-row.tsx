import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisplayTT } from '@/types/tt';
import { Eye, Home, Globe, User, Phone, Calendar } from 'lucide-react';

interface TTRowProps {
  tt: DisplayTT;
  showSource?: boolean;
  showDeadline?: boolean;
  onViewDetails: () => void;
}

export function TTRow({ 
  tt, 
  showSource = false, 
  showDeadline = false,
  onViewDetails 
}: TTRowProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('pending') || lowerStatus === 'pending') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
    if (lowerStatus.includes('progress') || lowerStatus === 'in_progress') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
    }
    if (lowerStatus.includes('completed') || lowerStatus.includes('resolved') || lowerStatus.includes('closed')) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
    }
    if (lowerStatus.includes('cancelled') || lowerStatus.includes('failed')) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
    }
    return <Badge variant="outline">{status || 'N/A'}</Badge>;
  };

  const getSourceIcon = (source: 'local' | 'external') => {
    return source === 'local' ? (
      <Home className="h-4 w-4 text-purple-600" />
    ) : (
      <Globe className="h-4 w-4 text-cyan-600" />
    );
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      {showSource && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {getSourceIcon(tt.source)}
            <span className="text-xs font-medium">
              {tt.source === 'local' ? 'Local' : 'External'}
            </span>
          </div>
        </td>
      )}
      
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {!showSource && getSourceIcon(tt.source)}
          <span className="font-mono font-medium text-gray-900">
            {tt.tt_no}
          </span>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-gray-800">{tt.cust_name}</span>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-gray-700">{tt.access_number}</span>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <div className="font-medium text-gray-800">{tt.trouble_title}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {tt.trouble_reason?.replace('_', ' ') || 'N/A'}
          </div>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-gray-600 whitespace-nowrap">
            {formatDate(tt.created_at)}
          </span>
        </div>
      </td>
      
      {showDeadline && (
        <td className="px-4 py-3 text-gray-600">
          {tt.deadline ? formatDate(tt.deadline) : 'N/A'}
        </td>
      )}
      
      <td className="px-4 py-3">
        {getStatusBadge(tt.status)}
      </td>
      
      <td className="px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewDetails}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">View details</span>
        </Button>
      </td>
    </tr>
  );
}