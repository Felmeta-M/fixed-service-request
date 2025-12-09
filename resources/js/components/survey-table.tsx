import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ServiceProvisionStatus } from '@/lib/status-map';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Box, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Phone, RefreshCw, Wifi } from 'lucide-react';
import * as React from 'react';
import SurveyActions from './survey/survey-actions';

const typeMap = {
    '1943913915': { label: 'Internet', text: 'text-blue-700', bg: 'bg-blue-400', icon: Wifi },
    '102647257': { label: 'Voice', text: 'text-purple-700', bg: 'bg-purple-400', icon: Phone },
    '1207609455': { label: 'Combo', text: 'text-green-700', bg: 'bg-green-400', icon: Box },
};

interface SurveyTableProps {
    surveys: any[];
    loading?: boolean;
    onSurveyUpdate: () => void;
    globalFilter: string;
    typeFilter: string;
    statusFilter: string;
}

export default function SurveyTable({ surveys, loading, onSurveyUpdate, globalFilter, typeFilter, statusFilter }: SurveyTableProps) {
    const [sorting, setSorting] = React.useState([]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const filteredSurveys = React.useMemo(() => {
        return surveys.filter((s) => {
            const matchesType = typeFilter ? s.main_offer_id.includes(typeFilter) : true;
            const matchesStatus = statusFilter ? s.status.toLowerCase() === statusFilter.toLowerCase() : true;
            const matchesGlobal = globalFilter
                ? s.customer_survey_order_id?.toString().includes(globalFilter) ||
                  s.main_offer_id?.toString().includes(globalFilter) ||
                  s.status?.toLowerCase().includes(globalFilter.toLowerCase())
                : true;
            return matchesType && matchesStatus && matchesGlobal;
        });
    }, [surveys, typeFilter, statusFilter, globalFilter]);

    const handleRowClick = (survey: any) => {};

    const columns = React.useMemo<ColumnDef<any>[]>(
        () => [
            {
                accessorKey: 'customer_survey_order_id',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="px-0 font-medium hover:text-primary"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Order ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: (info) => (
                    <div className="cursor-pointer text-sm font-medium hover:text-primary" onClick={() => handleRowClick(info.row.original)}>
                        {info.getValue() ?? '-'}
                    </div>
                ),
            },
            {
                accessorKey: 'main_offer_id',
                header: 'Service Type',
                cell: ({ getValue, row }) => {
                    const id = getValue<string>() || '';
                    const selected = typeMap[id] || { label: 'Unknown', text: 'text-gray-700', bg: 'bg-gray-400', icon: FileText };
                    const IconComponent = selected.icon;

                    return (
                        <div onClick={() => handleRowClick(row.original)} className="cursor-pointer">
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
                cell: ({ getValue, row }) => {
                    const raw = Number(getValue());
                    const mapped = ServiceProvisionStatus[raw] ?? {
                        label: 'Unknown',
                        text: 'text-gray-700',
                        bg: 'bg-gray-200',
                    };

                    const getStatusVariant = (status: number) => {
                        if (status === 5) return 'success';
                        if (status === 3) return 'warning';
                        if (status === 9) return 'destructive';
                        return 'default';
                    };

                    return (
                        <div onClick={() => handleRowClick(row.original)} className="cursor-pointer">
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
                cell: ({ getValue, row }) => {
                    const raw = getValue<string>();
                    if (!raw) return '-';

                    const date = new Date(raw);
                    if (isNaN(date.getTime())) return raw;

                    return (
                        <div onClick={() => handleRowClick(row.original)} className="cursor-pointer">
                            {date.toLocaleString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    const survey = row.original;
                    return (
                        <div onClick={(e) => e.stopPropagation()}>
                            <SurveyActions
                                survey={survey}
                                onActionComplete={() => onSurveyUpdate?.()}
                                onUpdatingChange={(isUpdating) => console.log('Updating:', isUpdating)}
                            />
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
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
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
                                        className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50/50"
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
