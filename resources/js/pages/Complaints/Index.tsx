import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/layouts/main-layout';
import { Link, usePage } from '@inertiajs/react';
import { 
  Eye, 
  Filter, 
  Plus, 
  Search, 
  X, 
  AlertCircle, 
  RefreshCw,
  Globe,
  Home,
  Loader2,
  User,
  Phone,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { DisplayTT } from '@/types/tt';
import { toast } from 'sonner';
import { TTDetailDialog } from '@/components/complaints/tt-detail-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ttService } from '@/lib/ttService';

type SourceFilter = 'all' | 'local' | 'external';

export default function ComplaintsIndex() {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [accessNumber, setAccessNumber] = useState('');
  const [tts, setTts] = useState<DisplayTT[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTT, setSelectedTT] = useState<DisplayTT | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [ttDetail, setTtDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'my-tickets' | 'search'>('my-tickets');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  const { auth } = usePage().props as any;

  // Load user's tickets on mount
  useEffect(() => {
    if (activeTab === 'my-tickets' && auth?.user?.id) {
      loadUserTTs();
    }
  }, [activeTab, auth?.user?.id]);

  const loadUserTTs = async (page = 1) => {
    setLoading(true);
    try {
      const response = await ttService.getLocalTTs({
        mobile_no: auth.user.phone,
        page: page,
        per_page: 10,
      }, auth.user.api_token);

      if (response.success) {
        const localTTs = response.data.data.map(tt => ({
          id: `local_${tt.id}`,
          tt_no: tt.tt_serial_no,
          source: 'local' as const,
          cust_name: tt.contact_person,
          access_number: tt.access_number,
          trouble_title: tt.trouble_title,
          accept_time: tt.created_at,
          trouble_reason: tt.trouble_reason,
          deadline: '',
          status: tt.status,
          created_at: tt.created_at,
          local_data: tt,
        }));

        setTts(localTTs);
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        });
      }
    } catch (error: any) {
      console.error('Failed to load user TTs:', error);
      toast.error(error.message || 'Failed to load your tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!accessNumber.trim()) {
      toast.error('Please enter an access number');
      return;
    }

    setLoading(true);
    setActiveTab('search');
    try {
      const results = await ttService.searchAllTTs(accessNumber, auth.user.api_token);
      setTts(results);
      
      if (results.length === 0) {
        toast.info('No trouble tickets found for this access number');
      } else {
        toast.success(`Found ${results.length} trouble tickets`);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search trouble tickets');
      setTts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (tt: DisplayTT) => {
    setSelectedTT(tt);
    setDetailLoading(true);
    setDetailDialogOpen(true);

    try {
      if (tt.source === 'external') {
        // Use external API for external TTs
        const response = await ttService.getTTDetail(tt.tt_no, auth.user.api_token);
        if (response.success && response.data) {
          setTtDetail(response.data);
        }
      } else {
        // Use local Laravel API for local TTs
        const response = await ttService.getLocalTT(tt.tt_no, auth.user.api_token);
        if (response.success && response.data) {
          setTtDetail({
            ...response.data,
            source: 'local',
          });
        }
      }
    } catch (error: any) {
      console.error('Detail fetch error:', error);
      toast.error(error.message || 'Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredTTs = tts.filter(tt => {
    // Source filter
    if (sourceFilter !== 'all' && tt.source !== sourceFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      const ttStatus = tt.status.toLowerCase();
      const filterStatus = statusFilter.toLowerCase();
      
      if (filterStatus === 'pending' && !ttStatus.includes('pending')) {
        return false;
      }
      if (filterStatus === 'in_progress' && !ttStatus.includes('progress')) {
        return false;
      }
      if (filterStatus === 'completed' && 
          !ttStatus.includes('completed') && 
          !ttStatus.includes('resolved') &&
          !ttStatus.includes('closed')) {
        return false;
      }
      if (filterStatus === 'cancelled' && 
          !ttStatus.includes('cancelled') && 
          !ttStatus.includes('failed')) {
        return false;
      }
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tt.tt_no.toLowerCase().includes(query) ||
        tt.cust_name.toLowerCase().includes(query) ||
        tt.trouble_title.toLowerCase().includes(query) ||
        tt.access_number.includes(query)
      );
    }

    return true;
  });

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

  const clearFilters = () => {
    setSourceFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setShowFilters(false);
  };

  const hasActiveFilters = sourceFilter !== 'all' || statusFilter !== 'all' || searchQuery;

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination.current_page < pagination.last_page) {
      loadUserTTs(pagination.current_page + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.current_page > 1) {
      loadUserTTs(pagination.current_page - 1);
    }
  };

  const handlePageClick = (page: number) => {
    loadUserTTs(page);
  };

  return (
    <MainLayout>
      <div className="w-full space-y-6 px-4 py-2 lg:px-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trouble Tickets</h1>
            <p className="text-muted-foreground">Manage and track your complaint tickets</p>
          </div>
          <div className="flex gap-2">
            <Link href="/complaints/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Complaint
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          {/* <TabsList>
            <TabsTrigger value="my-tickets" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Tickets ({pagination.total})
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Tickets
            </TabsTrigger>
          </TabsList> */}

          <TabsContent value="my-tickets" className="space-y-6">
            {/* Controls and Filters */}
            <div className='border-none'>
              <div className="">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <div>My Compliant Tickets</div>
                    <div className="text-sm text-muted-foreground">
                      All tickets created under your account. Showing page {pagination.current_page} of {pagination.last_page}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      {hasActiveFilters && (
                        <span className="flex h-2 w-2 rounded-full bg-primary" />
                      )}
                      {showFilters ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadUserTTs(pagination.current_page)}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search tickets..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {hasActiveFilters && (
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tickets Table */}
            <Card className='border-none'>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-muted-foreground">Loading your tickets...</p>
                    </div>
                  </div>
                ) : filteredTTs.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Trouble Tickets Found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {hasActiveFilters 
                        ? 'No tickets match your filters'
                        : 'You haven\'t created any tickets yet'}
                    </p>
                    <div className="mt-6">
                      <Link href="/complaints/create">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Ticket
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="px-4 py-3 text-left font-medium text-gray-700">TT Number</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Customer</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Access #</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Issue</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTTs.map((tt) => (
                            <tr key={tt.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {getSourceIcon(tt.source)}
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
                              <td className="px-4 py-3">
                                {getStatusBadge(tt.status)}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(tt)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View details</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                      <div className="border-t px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                            {pagination.total} entries
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePrevPage}
                              disabled={pagination.current_page === 1 || loading}
                            >
                              Previous
                            </Button>
                            
                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                              let pageNum;
                              if (pagination.last_page <= 5) {
                                pageNum = i + 1;
                              } else if (pagination.current_page <= 3) {
                                pageNum = i + 1;
                              } else if (pagination.current_page >= pagination.last_page - 2) {
                                pageNum = pagination.last_page - 4 + i;
                              } else {
                                pageNum = pagination.current_page - 2 + i;
                              }
                              
                              return (
                                <Button
                                  key={pageNum}
                                  variant={pagination.current_page === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageClick(pageNum)}
                                  disabled={loading}
                                  className="w-8"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextPage}
                              disabled={pagination.current_page === pagination.last_page || loading}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            {/* Search Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <CardTitle className="text-lg">Search Trouble Tickets</CardTitle>
                    <CardDescription>
                      Enter access number to search across local and external systems
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Enter access number (e.g., 9295853090)..."
                        value={accessNumber}
                        onChange={(e) => setAccessNumber(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !loading) {
                            handleSearch();
                          }
                        }}
                        className="pl-9"
                        disabled={loading}
                      />
                    </div>
                    <Button 
                      onClick={handleSearch} 
                      disabled={loading || !accessNumber.trim()}
                    >
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
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {loading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Searching for tickets...</p>
                  </div>
                </CardContent>
              </Card>
            ) : tts.length > 0 ? (
              <>
                {/* Results Summary */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div>
                        <CardTitle>Search Results</CardTitle>
                        <CardDescription>
                          Access Number: <span className="font-mono font-medium">{accessNumber}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Home className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="text-xl font-bold text-purple-700">
                              {tts.filter(t => t.source === 'local').length}
                            </div>
                            <div className="text-xs text-muted-foreground">Local Tickets</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-cyan-600" />
                          <div>
                            <div className="text-xl font-bold text-cyan-700">
                              {tts.filter(t => t.source === 'external').length}
                            </div>
                            <div className="text-xs text-muted-foreground">External Tickets</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Filters */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div>
                        <CardTitle>Found Tickets</CardTitle>
                        <CardDescription>
                          Showing {filteredTTs.length} of {tts.length} tickets
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="All Sources" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            <SelectItem value="local">Local Only</SelectItem>
                            <SelectItem value="external">External Only</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search in results..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-[200px] pl-9"
                          />
                        </div>
                        
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Results Table */}
                <Card>
                  <CardContent className="p-0">
                    {filteredTTs.length === 0 ? (
                      <div className="py-12 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Tickets Match Filters</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Try adjusting your filter criteria
                        </p>
                        <div className="mt-6">
                          <Button variant="outline" onClick={clearFilters}>
                            Clear All Filters
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Source</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">TT Number</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Customer</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Access #</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Issue</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Deadline</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTTs.map((tt) => (
                              <tr key={tt.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {getSourceIcon(tt.source)}
                                    <span className="text-xs font-medium">
                                      {tt.source === 'local' ? 'Local' : 'External'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-mono font-medium text-gray-900">
                                    {tt.tt_no}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-800">{tt.cust_name}</td>
                                <td className="px-4 py-3 font-medium text-gray-700">{tt.access_number}</td>
                                <td className="px-4 py-3">
                                  <div className="max-w-xs">
                                    <div className="font-medium text-gray-800">{tt.trouble_title}</div>
                                    <div className="text-xs text-muted-foreground capitalize">
                                      {tt.trouble_reason?.replace('_', ' ') || 'N/A'}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                  {formatDate(tt.created_at)}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {tt.deadline ? formatDate(tt.deadline) : 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                  {getStatusBadge(tt.status)}
                                </td>
                                <td className="px-4 py-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewDetails(tt)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View details</span>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : accessNumber && !loading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Tickets Found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No trouble tickets found for access number: {accessNumber}
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                      <Link href="/complaints/create">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Ticket
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={() => setAccessNumber('')}>
                        Try Another Number
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>

      {/* TT Detail Dialog */}
      <TTDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        detail={ttDetail}
        loading={detailLoading}
        source={selectedTT?.source}
      />
    </MainLayout>
  );
}