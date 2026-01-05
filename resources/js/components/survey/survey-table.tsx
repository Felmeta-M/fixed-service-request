import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ServiceProvisionStatus } from '@/lib/status-map';
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
import { ArrowUpDown, Box, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Phone, RefreshCw, Wifi } from 'lucide-react';
import * as React from 'react';
import SurveyActions from './survey-actions';

const typeMap = {
    // '1457567289': { label: 'Internet', text: 'text-blue-700', bg: 'bg-blue-400', icon: Wifi },
    // '1207609454': { label: 'Voice', text: 'text-purple-700', bg: 'bg-purple-400', icon: Phone },
    // '180427974': { label: 'Combo', text: 'text-green-700', bg: 'bg-green-400', icon: Box },
    '1457567289': { label: 'Internet', text: 'text-et-blue', bg: 'bg-blue-400', icon: Wifi },
    '1207609454': { label: 'Voice', text: 'text-primary', bg: 'bg-purple-400', icon: Phone },
    '180427974': { label: 'Combo', text: 'text-et-green', bg: 'bg-green-400', icon: Box },
};

interface SurveyTableProps {
    surveys: SurveyRow[];
    loading?: boolean;
    onSurveyUpdate: () => void;
    globalFilter: string;
    typeFilter: string;
    statusFilter: string;
}

type SurveyRow = {
    customer_survey_order_id?: string;
    service_number?: string | null;
    main_offer_id?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
};

export default function SurveyTable({ surveys, loading, onSurveyUpdate, globalFilter, typeFilter, statusFilter }: SurveyTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const filteredSurveys = React.useMemo(() => {
        return surveys.filter((s) => {
            const offerId = String(s.main_offer_id ?? '');
            const status = String(s.status ?? '');

            const matchesType = typeFilter ? offerId.includes(typeFilter) : true;
            const matchesStatus = statusFilter ? status.toLowerCase() === statusFilter.toLowerCase() : true;
            const matchesGlobal = globalFilter
                ? s.customer_survey_order_id?.toString().includes(globalFilter) ||
                  offerId.includes(globalFilter) ||
                  status.toLowerCase().includes(globalFilter.toLowerCase())
                : true;
            return matchesType && matchesStatus && matchesGlobal;
        });
    }, [surveys, typeFilter, statusFilter, globalFilter]);

    const handleRowClick = (survey: SurveyRow) => {
        const id = survey?.customer_survey_order_id;
        if (!id) return;
        router.visit(`/services/${id}`);
    };

    const columns = React.useMemo<ColumnDef<SurveyRow>[]>(
        () => [
            {
                accessorKey: 'customer_survey_order_id',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="!hover:text-primary px-0 font-medium"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Order ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: (info) => (
                    <button
                        type="button"
                        className="relative z-10 text-sm font-medium text-gray-900 hover:text-primary hover:underline"
                        onClick={() => handleRowClick(info.row.original)}
                    >
                        {String(info.getValue() ?? '-')}
                    </button>
                ),
            },
            {
                accessorKey: 'service_number',
                header: 'Service Number',
                cell: ({ getValue }) => {
                    const serviceNumber = getValue<string>() ?? null; // null-safe

                    return (
                        <div>
                            {/* <Badge
                                variant="outline"
                                className="flex items-center gap-1.5 bg-white"
                            > */}
                            <span className="text-xs font-medium">{serviceNumber || '—'}</span>
                            {/* </Badge> */}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'main_offer_id',
                header: 'Service Type',
                cell: ({ getValue }) => {
                    const id = getValue<string>() || '';
                    const selected = typeMap[id as keyof typeof typeMap] || {
                        label: 'Unknown',
                        text: 'text-gray-700',
                        bg: 'bg-gray-400',
                        icon: FileText,
                    };
                    const IconComponent = selected.icon;

                    return (
                        <div>
                            <Badge variant="outline" className="flex items-center gap-1.5 bg-white">
                                <IconComponent className={`h-3 w-3 ${selected.text}`} />
                                <span className="text-xs font-medium">{selected.label}</span>
                            </Badge>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ getValue }) => {
                    const raw = Number(getValue());
                    const mapped = ServiceProvisionStatus[raw as keyof typeof ServiceProvisionStatus] ?? {
                        label: 'Unknown',
                        text: 'text-gray-700',
                        bg: 'bg-gray-200',
                    };

                    const getStatusVariant = (status: number) => {
                        // Badge supports: default | secondary | destructive | outline
                        if (status === 9) return 'destructive';
                        if (status === 3) return 'warning';
                        if (status === 5) return 'success';
                        if (status === 11) return 'success';
                        if (status === 14) return 'success';
                        return 'default';
                    };

                    return (
                        <div>
                            <Badge variant={getStatusVariant(raw)} className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${mapped.bg}`} />
                                <span className="text-xs">{mapped.label}</span>
                            </Badge>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'created_at',
                header: 'Created Date',
                cell: ({ getValue }) => {
                    const raw = getValue<string>();
                    if (!raw) return '-';

                    const date = new Date(raw);
                    if (isNaN(date.getTime())) return raw;

                    return date.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    });
                },
            },
            {
                id: 'actions',
                header: () => <div className="flex justify-end px-2">Actions</div>,
                cell: ({ row }) => {
                    const survey = row.original;
                    return (
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <SurveyActions
                                survey={survey}
                                onActionComplete={() => onSurveyUpdate?.()}
                                onUpdatingChange={(isUpdating) => console.log('Updating:', isUpdating)}
                            />
                            {/* <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRowClick(survey)}
                                className="h-8 w-8 p-0"
                            >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View details</span>
                            </Button> */}
                        </div>
                    );
                },
            },
        ],
        [onSurveyUpdate],
    );

    const table = useReactTable({
        data: filteredSurveys,
        columns,
        state: {
            sorting,
            rowSelection,
            globalFilter,
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
                <p className="text-muted-foreground">Loading service requests...</p>
            </div>
        );
    }

    if (!surveys || surveys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No service requests found</h3>
                <p className="mb-4 text-gray-600">Get started by creating your first service request.</p>
            </div>
        );
    }

    return (
        <div className="w-full flex-col justify-start gap-6">
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
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
                                        className="border-b border-gray-100 transition-colors hover:bg-gray-50/50"
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
                                        No matching service requests found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 pt-4">
                    <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                        Showing {table.getRowModel().rows.length} of {filteredSurveys.length} requests
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
