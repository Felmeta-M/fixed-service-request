import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/layouts/main-layout';
import { Link, usePage } from '@inertiajs/react';
import {
  Filter,
  Plus,
  Search,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  Home,
  Globe
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { DisplayTT } from '@/types/tt';
import { toast } from 'sonner';
import TTTable from '@/features/complaints/components/tt-table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalTTs, useSearchExternalTTs } from '@/features/complaints/hooks/use-complaints';
import { useAuthToken } from '@/hooks/use-auth-token';

type SourceFilter = 'all' | 'local' | 'external';

export default function ComplaintsIndex() {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [accessNumber, setAccessNumber] = useState('');
  const [filterAccessNumber, setFilterAccessNumber] = useState('');
  const [filterTTSerialNo, setFilterTTSerialNo] = useState('');
  const [tts, setTts] = useState<DisplayTT[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-tickets' | 'search'>('my-tickets');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  const { auth } = usePage().props as any;
  const token = useAuthToken();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced filter values - these are used for API calls
  const [debouncedFilterAccessNumber, setDebouncedFilterAccessNumber] = useState('');
  const [debouncedFilterTTSerialNo, setDebouncedFilterTTSerialNo] = useState('');

  // Debounce filter inputs - wait 500ms after user stops typing before updating debounced values
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilterAccessNumber(filterAccessNumber);
      setDebouncedFilterTTSerialNo(filterTTSerialNo);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filterAccessNumber, filterTTSerialNo]);

  // Query for local TTs (for my-tickets tab)
  const localTTsQuery = useLocalTTs({
    page: pagination.current_page,
    per_page: 10,
    access_number: activeTab === 'my-tickets' ? (debouncedFilterAccessNumber.trim() || undefined) : undefined,
    tt_serial_no: activeTab === 'my-tickets' ? (debouncedFilterTTSerialNo.trim() || undefined) : undefined,
    status: activeTab === 'my-tickets' && statusFilter !== 'all' ? statusFilter : undefined,
  });

  // Query for local TTs with search access number (for search tab)
  const searchLocalTTsQuery = useLocalTTs({
    page: 1,
    per_page: 100,
    access_number: activeTab === 'search' && accessNumber.trim() ? accessNumber.trim() : undefined,
  });

  // Query for external TTs (used in search)
  const externalTTsQuery = useSearchExternalTTs(
    activeTab === 'search' && accessNumber.trim() ? accessNumber.trim() : ''
  );

  // Update local state when query data changes
  useEffect(() => {
    if (activeTab === 'my-tickets' && localTTsQuery.data?.success) {
      const localTTs = localTTsQuery.data.data.data.map(tt => ({
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
        current_page: localTTsQuery.data.data.current_page,
        last_page: localTTsQuery.data.data.last_page,
        per_page: localTTsQuery.data.data.per_page,
        total: localTTsQuery.data.data.total
      });
    }
  }, [localTTsQuery.data, activeTab]);

  // Handle loading state
  useEffect(() => {
    if (activeTab === 'my-tickets') {
      setLoading(localTTsQuery.isLoading);
    }
  }, [localTTsQuery.isLoading, activeTab]);

  // Handle errors
  useEffect(() => {
    if (localTTsQuery.error && activeTab === 'my-tickets') {
      toast.error(localTTsQuery.error.message || 'Failed to load your tickets');
    }
  }, [localTTsQuery.error, activeTab]);

  const handleSearch = () => {
    if (!accessNumber.trim()) {
      toast.error('Please enter an access number');
      return;
    }

    setActiveTab('search');
  };

  // Combine search results when in search tab
  useEffect(() => {
    if (activeTab === 'search' && accessNumber.trim()) {
      setLoading(externalTTsQuery.isLoading || searchLocalTTsQuery.isLoading);

      if (!externalTTsQuery.isLoading && !searchLocalTTsQuery.isLoading) {
        const displayTTs: DisplayTT[] = [];

        // Add local TTs
        if (searchLocalTTsQuery.data?.success) {
          searchLocalTTsQuery.data.data.data.forEach((tt) => {
            displayTTs.push({
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
            });
          });
        }

        // Add external TTs
        if (externalTTsQuery.data?.success && externalTTsQuery.data.data.success) {
          externalTTsQuery.data.data.tt_list.forEach((externalTT) => {
            displayTTs.push({
              id: `external_${externalTT.tt_no}`,
              tt_no: externalTT.tt_no,
              source: 'external' as const,
              cust_name: externalTT.cust_name,
              access_number: externalTT.acc_number,
              trouble_title: externalTT.trouble_title,
              accept_time: externalTT.accept_time,
              trouble_reason: externalTT.trouble_reason,
              deadline: externalTT.deadline,
              status: externalTT.tt_status || 'unknown',
              created_at: externalTT.accept_time,
              external_data: externalTT,
            });
          });
        }

        const sortedTTs = displayTTs.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTts(sortedTTs);

        if (sortedTTs.length === 0 && !externalTTsQuery.isLoading && !searchLocalTTsQuery.isLoading) {
          toast.info('No trouble tickets found for this access number');
        } else if (sortedTTs.length > 0) {
          toast.success(`Found ${sortedTTs.length} trouble tickets`);
        }
      }
    }
  }, [activeTab, accessNumber, externalTTsQuery.data, externalTTsQuery.isLoading, searchLocalTTsQuery.data, searchLocalTTsQuery.isLoading]);



  const clearFilters = () => {
    setSourceFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setFilterAccessNumber('');
    setFilterTTSerialNo('');
    setShowFilters(false);
  };

  const hasActiveFilters = sourceFilter !== 'all' || statusFilter !== 'all' || searchQuery || filterAccessNumber || filterTTSerialNo;

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination.current_page < pagination.last_page) {
      setPagination((prev) => ({ ...prev, current_page: prev.current_page + 1 }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.current_page > 1) {
      setPagination((prev) => ({ ...prev, current_page: prev.current_page - 1 }));
    }
  };

  const handlePageClick = (page: number) => {
    setPagination((prev) => ({ ...prev, current_page: page }));
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
          <div className="flex items-center gap-2">
            <div className="">
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
                  onClick={() => {
                    if (activeTab === 'my-tickets') {
                      localTTsQuery.refetch();
                    } else if (activeTab === 'search') {
                      externalTTsQuery.refetch();
                      searchLocalTTsQuery.refetch();
                    }
                  }}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

            </div>
            <div className="flex">
              <Link href="/complaints/create">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  New Complaint
                </Button>
              </Link>
            </div>
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


              {showFilters && (
                <div className="border-t pt-2">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Access Number</label>
                      <Input
                        placeholder="Filter by access number..."
                        value={filterAccessNumber}
                        onChange={(e) => setFilterAccessNumber(e.target.value)}
                        size="sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">TT Serial Number</label>
                      <Input
                        placeholder="Filter by TT serial no..."
                        value={filterTTSerialNo}
                        onChange={(e) => setFilterTTSerialNo(e.target.value)}
                        size="sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 px-2 text-sm">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* <div className="space-y-2">
                      <label className="text-sm font-medium">Quick Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search in results..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div> */}
                    {/* </div> */}
                    <div className="mt-2">
                      {hasActiveFilters && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Clear All Filters
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tickets Table */}
            <TTTable
              tts={tts}
              loading={loading}
              onTTUpdate={() => loadUserTTs(pagination.current_page)}
            />
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            {/* Search Card */}
            <Card >
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
                          Access Number: <span className="font-mono font-medium">{accessNumber}</span> - Showing {tts.length} tickets
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as SourceFilter)}>
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
                <TTTable
                  tts={tts.filter(tt => {
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
                  })}
                  loading={loading}
                />
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

    </MainLayout>
  );
}