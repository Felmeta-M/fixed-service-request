import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import TTTable from '@/features/complaints/components/tt-table';
import { useLocalTTs, useSearchExternalTTs } from '@/features/complaints/hooks/use-complaints';
import { useAuthToken } from '@/hooks/use-auth-token';
import MainLayout from '@/layouts/main-layout';
import { useFilterStore } from '@/store/filter-store';
import { DisplayTT } from '@/types/tt';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Filter, Globe, Home, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type SourceFilter = 'all' | 'local' | 'external';

export default function ComplaintsIndex() {
    // ── Zustand filter store (persists across navigation) ─────────────────
    const complaints = useFilterStore((s) => s.complaints);
    const setComplaintFilter = useFilterStore((s) => s.setComplaintFilter);

    // Destructure for convenience
    const sourceFilter = complaints.sourceFilter;
    const statusFilter = complaints.statusFilter;
    const searchQuery = complaints.searchQuery;
    const accessNumber = complaints.accessNumber;
    const filterAccessNumber = complaints.filterAccessNumber;
    const filterTTSerialNo = complaints.filterTTSerialNo;
    const activeTab = complaints.activeTab;
    const showFilters = complaints.showFilters;

    // Setter wrappers
    const setSourceFilter = (v: SourceFilter) => setComplaintFilter('sourceFilter', v);
    const setStatusFilter = (v: string) => setComplaintFilter('statusFilter', v);
    const setSearchQuery = (v: string) => setComplaintFilter('searchQuery', v);
    const setAccessNumber = (v: string) => setComplaintFilter('accessNumber', v);
    const setFilterAccessNumber = (v: string) => setComplaintFilter('filterAccessNumber', v);
    const setFilterTTSerialNo = (v: string) => setComplaintFilter('filterTTSerialNo', v);
    const setActiveTab = (v: 'my-tickets' | 'search') => setComplaintFilter('activeTab', v);
    const setShowFilters = (v: boolean) => setComplaintFilter('showFilters', v);

    // Local-only state (does not need to persist)
    const [tts, setTts] = useState<DisplayTT[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: complaints.currentPage,
        last_page: 1,
        per_page: 10,
        total: 0,
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
        access_number: activeTab === 'my-tickets' ? debouncedFilterAccessNumber.trim() || undefined : undefined,
        tt_serial_no: activeTab === 'my-tickets' ? debouncedFilterTTSerialNo.trim() || undefined : undefined,
        status: activeTab === 'my-tickets' && statusFilter !== 'all' ? statusFilter : undefined,
    });

    // Query for local TTs with search access number (for search tab)
    const searchLocalTTsQuery = useLocalTTs({
        page: 1,
        per_page: 100,
        access_number: activeTab === 'search' && accessNumber.trim() ? accessNumber.trim() : undefined,
    });

    // Query for external TTs (used in search)
    const externalTTsQuery = useSearchExternalTTs(activeTab === 'search' && accessNumber.trim() ? accessNumber.trim() : '');

    // Update local state when query data changes
    useEffect(() => {
        if (activeTab === 'my-tickets' && localTTsQuery.data?.success) {
            const localTTs = localTTsQuery.data.data.data.map((tt) => ({
                id: `local_${tt.id}`,
                tt_no: tt.tt_serial_no,
                source: 'local' as const,
                cust_name: tt.service_owner_name || tt.contact_person,
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
                total: localTTsQuery.data.data.total,
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
                            cust_name: tt.service_owner_name || tt.contact_person,
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

                const sortedTTs = displayTTs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-1.5 border-primary text-xs sm:gap-2 sm:text-sm"
                        >
                            <Filter className="h-4 w-4 shrink-0" />
                            <span className="">Filters</span>
                            {hasActiveFilters && <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary" />}
                            {showFilters ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
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
                            className="border border-primary text-xs sm:text-sm"
                        >
                            <RefreshCw className={`h-4 w-4 shrink-0 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        <Link href="/complaints/create">
                            <Button size="sm" className="text-xs sm:text-sm">
                                <Plus className="h-4 w-4 shrink-0" />
                                <span className="hidden sm:inline">New Complaint</span>
                                <span className="sm:hidden">New Complaint</span>
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
                        <div className="border-none">
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
                                        <div className="mt-2 sm:mt-0">
                                            {hasActiveFilters && (
                                                <div className="mt-4 flex justify-center sm:justify-end">
                                                    <Button variant="outline" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
                                                        <X className="mr-2 h-4 w-4" />
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
                        <TTTable tts={tts} loading={loading} onTTUpdate={() => localTTsQuery.refetch()} />
                    </TabsContent>

                    <TabsContent value="search" className="space-y-6">
                        {/* Search Card */}
                        <Card>
                            <CardContent className="p-4 pt-6 sm:p-6">
                                <div className="space-y-4">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg">Search Trouble Tickets</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">
                                            Enter access number to search across local and external systems
                                        </CardDescription>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <div className="relative flex-1">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Enter access number..."
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
                                        <Button onClick={handleSearch} disabled={loading || !accessNumber.trim()} className="w-full sm:w-auto">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    <span className="hidden sm:inline">Searching...</span>
                                                    <span className="sm:hidden">...</span>
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
                                                            {tts.filter((t) => t.source === 'local').length}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">Local Tickets</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-5 w-5 text-cyan-600" />
                                                    <div>
                                                        <div className="text-xl font-bold text-cyan-700">
                                                            {tts.filter((t) => t.source === 'external').length}
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
                                                    Access Number: <span className="font-mono font-medium">{accessNumber}</span> - Showing{' '}
                                                    {tts.length} tickets
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
                                                        <SelectItem value="resolved">Resolved</SelectItem>
                                                        <SelectItem value="closed">Closed</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <div className="relative">
                                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search in results..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-[200px] pl-9"
                                                    />
                                                </div>

                                                {hasActiveFilters && (
                                                    <Button variant="outline" size="sm" onClick={clearFilters}>
                                                        <X className="mr-2 h-4 w-4" />
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>

                                {/* Results Table */}
                                <TTTable
                                    tts={tts.filter((tt) => {
                                        // Source filter
                                        if (sourceFilter !== 'all' && tt.source !== sourceFilter) {
                                            return false;
                                        }

                                        // Status filter - exact match with backend status (source of truth)
                                        if (statusFilter !== 'all') {
                                            const ttStatus = (tt.status || '').toLowerCase();
                                            const filterStatus = statusFilter.toLowerCase();

                                            // Direct match - backend status is the source of truth
                                            if (ttStatus !== filterStatus) {
                                                return false;
                                            }
                                        }

                                        // Search query
                                        if (searchQuery) {
                                            const query = searchQuery.toLowerCase();
                                            return (
                                                (tt.tt_no || '').toLowerCase().includes(query) ||
                                                (tt.cust_name || '').toLowerCase().includes(query) ||
                                                (tt.trouble_title || '').toLowerCase().includes(query) ||
                                                (tt.access_number || '').includes(query)
                                            );
                                        }

                                        return true;
                                    })}
                                    loading={loading}
                                />
                            </>
                        ) : accessNumber && !loading ? (
                            <Card className="border border-primary">
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
                                                    <Plus className="mr-2 h-4 w-4" />
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
