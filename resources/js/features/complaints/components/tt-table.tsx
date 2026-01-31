import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DisplayTT } from '@/types/tt';
import { router } from '@inertiajs/react';
import {
    ColumnDef,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Home, Globe, RefreshCw } from 'lucide-react';
import * as React from 'react';

// Same empty-state icon as services page for consistency
function NoTicketsIcon() {
    return (
        <svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto" aria-hidden>
            <line x1="6" y1="9" x2="42" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400" />
            <line x1="6" y1="17" x2="42" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400" />
            <line x1="6" y1="25" x2="20" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400" />
            <line x1="6" y1="33" x2="20" y2="33" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400" />
            <path d="M30 34L36 24L42 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="text-gray-800" />
        </svg>
    );
}

interface TTTableProps {
    tts: DisplayTT[];
    loading?: boolean;
    onTTUpdate?: () => void;
}

export default function TTTable({ tts, loading, onTTUpdate }: TTTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const handleRowClick = (tt: DisplayTT) => {
        router.visit(`/complaints/${tt.tt_no}`);
    };

    /**
     * Display status badge - backend is the source of truth
     * Status styling is based on common patterns but displays actual backend value
     */
    const getStatusBadge = (status: string) => {
        const displayStatus = status || 'N/A';
        const lowerStatus = displayStatus.toLowerCase();
        
        // Color coding based on status category (not transformation)
        // Yellow: waiting/pending states
        // Blue: in-progress/active states  
        // Green: success/completed states
        // Gray: closed/finished states
        // Red: failed/cancelled states
        
        let colorClass = '';
        
        if (lowerStatus.includes('pending') || lowerStatus.includes('waiting')) {
            colorClass = 'text-yellow-700 border-yellow-200 bg-yellow-50';
        } else if (lowerStatus.includes('progress') || lowerStatus.includes('active') || lowerStatus.includes('processing')) {
            colorClass = 'text-blue-700 border-blue-200 bg-blue-50';
        } else if (lowerStatus.includes('resolved') || lowerStatus.includes('completed') || lowerStatus.includes('success')) {
            colorClass = 'text-green-700 border-green-200 bg-green-50';
        } else if (lowerStatus.includes('closed') || lowerStatus.includes('done')) {
            colorClass = 'text-gray-700 border-gray-200 bg-gray-50';
        } else if (lowerStatus.includes('cancelled') || lowerStatus.includes('failed') || lowerStatus.includes('rejected')) {
            colorClass = 'text-red-700 border-red-200 bg-red-50';
        }
        
        // Display the actual backend status value (formatted for readability)
        const formattedStatus = displayStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        return <Badge variant="outline" className={colorClass}>{formattedStatus}</Badge>;
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

    const columns = React.useMemo<ColumnDef<DisplayTT>[]>(
        () => [
            {
                accessorKey: 'tt_no',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="px-0 font-medium hover:text-primary"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        TT Number
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: (info) => {
                    const tt = info.row.original;
                    return (
                        <button
                            type="button"
                            className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-primary hover:underline"
                            onClick={() => handleRowClick(tt)}
                        >
                            {/* {getSourceIcon(tt.source)} */}
                            <span className="font-mono">{String(info.getValue() ?? '-')}</span>
                        </button>
                    );
                },
            },
            {
                accessorKey: 'cust_name',
                header: 'Service Owner',
                cell: ({ getValue }) => {
                    const name = getValue<string>();
                    return <span className="text-gray-800 font-medium">{name || '—'}</span>;
                },
            },
            {
                accessorKey: 'access_number',
                header: 'Access Number',
                cell: ({ getValue }) => {
                    const accessNumber = getValue<string>();
                    return <span className="font-medium text-gray-700">{accessNumber || '—'}</span>;
                },
            },
            {
                accessorKey: 'trouble_reason',
                header: 'Issue',
                cell: ({ row }) => {
                    const tt = row.original;
                    return (
                        <div className="max-w-xs">
                            <div className="text-xs text-muted-foreground capitalize">
                                {tt.trouble_reason?.replace('_', ' ') || 'N/A'}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="px-0 font-medium hover:text-primary"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Created Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ getValue }) => {
                    const raw = getValue<string>();
                    if (!raw) return '-';
                    return <span className="text-gray-600 whitespace-nowrap">{formatDate(raw)}</span>;
                },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ getValue }) => {
                    const status = getValue<string>();
                    return getStatusBadge(status);
                },
            },
            {
                id: 'actions',
                header: () => <div className="flex justify-end px-2">Actions</div>,
                cell: ({ row }) => {
                    const tt = row.original;
                    return (
                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRowClick(tt)}
                                className="h-8 w-8 p-0"
                            >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View details</span>
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [],
    );

    const table = useReactTable({
        data: tts,
        columns,
        state: {
            sorting,
            rowSelection,
            pagination,
        },
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border p-12 text-center">
                <RefreshCw className="mb-3 h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading trouble tickets...</p>
            </div>
        );
    }

    if (!tts || tts.length === 0) {
        return (
            <Card className="rounded-lg border border-gray-200 bg-white shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <h3 className="mb-2 text-lg font-bold text-gray-900">No trouble tickets found</h3>
                    <p className="mb-6 text-sm text-gray-500">
                        You haven't created any tickets yet.
                    </p>
                    <NoTicketsIcon />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full flex-col justify-start gap-6">
            <div className="overflow-hidden rounded-lg bg-white shadow-xs">
                <div className="overflow-x-auto">
                    <Table className="min-w-[700px]">
                        <TableHeader className="bg-gray-50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} colSpan={header.colSpan} className="font-semibold text-gray-700">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                        className="border-b border-gray-100 transition-colors hover:bg-gray-50/50 cursor-pointer"
                                        onClick={() => handleRowClick(row.original)}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-3">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                                        No matching trouble tickets found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t px-4 py-3">
                    <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                        Showing {table.getRowModel().rows.length} of {tts.length} requests
                    </div>
                    <div className="flex w-full items-center gap-8 lg:w-fit">
                        <div className="flex w-fit items-center justify-center text-sm font-medium text-gray-700">
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                        </div>
                        <div className="ml-auto flex items-center gap-2 lg:ml-0">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

