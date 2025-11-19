// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { ServiceProvisionStatus } from '@/lib/status-map';
// import {
//     ColumnDef,
//     flexRender,
//     getCoreRowModel,
//     getFilteredRowModel,
//     getPaginationRowModel,
//     getSortedRowModel,
//     useReactTable,
// } from '@tanstack/react-table';
// import { ArrowUpDown, Box, FileText, Phone, RefreshCw, Wifi } from 'lucide-react';
// import * as React from 'react';
// import SurveyActions from './survey/survey-actions';

// const typeMap = {
//     '1943913918': { label: 'Internet', text: 'text-blue-700', bg: 'bg-blue-400', icon: Wifi },
//     '102647257': { label: 'Voice', text: 'text-purple-700', bg: 'bg-purple-400', icon: Phone },
//     '1207609455': { label: 'Combo', text: ' text-green-700', bg: 'bg-green-400', icon: Box },
// };
// interface SurveyTableProps {
//     surveys: any[];
//     loading?: boolean;
//     onSurveyUpdate: () => void;
// }

// export default function SurveyTable({ surveys, loading, onSurveyUpdate }: SurveyTableProps) {
//     const [globalFilter, setGlobalFilter] = React.useState('');
//     const [sorting, setSorting] = React.useState([]);
//     const [typeFilter, setTypeFilter] = React.useState('');
//     const [statusFilter, setStatusFilter] = React.useState('');

//     const filteredSurveys = React.useMemo(() => {
//         return surveys.filter((s) => {
//             const matchesType = typeFilter ? s.main_offer_id.includes(typeFilter) : true;
//             const matchesStatus = statusFilter ? s.status.toLowerCase() === statusFilter.toLowerCase() : true;
//             return matchesType && matchesStatus;
//         });
//     }, [surveys, typeFilter, statusFilter]);

//     const columns = React.useMemo<ColumnDef<any>[]>(
//         () => [
//             {
//                 accessorKey: 'customer_survey_order_id',
//                 header: ({ column }) => (
//                     <Button
//                         variant="ghost"
//                         className="px-0 font-medium text-gray-700 hover:text-indigo-600"
//                         onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
//                     >
//                         Order ID <ArrowUpDown className="ml-1 h-3 w-3" />
//                     </Button>
//                 ),
//                 cell: (info) => <span className="font-medium">{info.getValue() ?? '-'}</span>,
//             },

//             // TYPE AS BADGE
//             {
//                 accessorKey: 'main_offer_id',
//                 header: 'Type',
//                 cell: ({ getValue }) => {
//                     const id = getValue<string>() || '';
//                     const selected = typeMap[id] || { label: 'Unknown', text: 'text-gray-700', bg: 'bg-gray-400', icon: FileText };
//                     return (
//                         <Badge variant="outline" className="rounded-full">
//                             <selected.icon className={`h-3 w-3 ${selected.text}`} />
//                             <span className={`rounded-full py-1 text-xs font-medium`}>{selected.label}</span>
//                         </Badge>
//                     );
//                 },
//             },

//             // STATUS AS BADGE
//             {
//                 accessorKey: 'status',
//                 header: 'Status',
//                 cell: ({ getValue }) => {
//                     const raw = Number(getValue());
//                     const mapped = ServiceProvisionStatus[raw] ?? {
//                         label: 'Unknown',
//                         text: 'text-gray-700',
//                         bg: 'bg-gray-200',
//                     };

//                     return (
//                         <Badge variant="outline" className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium">
//                             <div className={`h-2 w-2 rounded-full ${mapped.bg} ${mapped.text}`} />
//                             {mapped.label}
//                         </Badge>
//                     );
//                 },
//             },

//             {
//                 accessorKey: 'created_at',
//                 header: 'Created At',
//                 cell: ({ getValue }) => {
//                     const raw = getValue<string>();
//                     if (!raw) return '-';

//                     const date = new Date(raw);

//                     // if backend returns "1 day ago", avoid crashing
//                     if (isNaN(date.getTime())) {
//                         return raw;
//                     }

//                     const formatted = date.toLocaleString('en-US', {
//                         year: 'numeric',
//                         month: '2-digit',
//                         day: '2-digit',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                         hour12: true,
//                     });
//                     return formatted;
//                 },
//             },

//             // ACTIONS
//             {
//                 id: 'actions',
//                 header: 'Actions',
//                 cell: ({ row }) => (
//                     <SurveyActions
//                         survey={row.original}
//                         onActionComplete={() => onSurveyUpdate?.()}
//                         onUpdatingChange={(isUpdating) => console.log('Updating:', isUpdating)}
//                     />
//                 ),
//             },
//         ],
//         [onSurveyUpdate],
//     );

//     const table = useReactTable({
//         data: filteredSurveys,
//         columns,
//         state: { globalFilter, sorting },
//         onSortingChange: setSorting,
//         onGlobalFilterChange: setGlobalFilter,
//         getCoreRowModel: getCoreRowModel(),
//         getFilteredRowModel: getFilteredRowModel(),
//         getSortedRowModel: getSortedRowModel(),
//         getPaginationRowModel: getPaginationRowModel(),
//     });

//     if (loading) {
//         return (
//             <div className="flex flex-col items-center justify-center p-12 text-center">
//                 <RefreshCw className="mb-3 h-6 w-6 animate-spin text-primary" />
//                 <p className="text-gray-600">Loading surveys...</p>
//             </div>
//         );
//     }

//     if (!surveys || surveys.length === 0) {
//         return (
//             <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
//                 <FileText className="mb-3 h-10 w-10 text-gray-300" />
//                 <p className="text-gray-500">No surveys found</p>
//             </div>
//         );
//     }

//     return (
//         <div className="rounded-xl border bg-white p-4 shadow-sm">
//             <div className="mb-4 flex items-center justify-between gap-2">
//                 <div className="flex justify-between gap-2">
//                     <Input
//                         placeholder="Search surveys..."
//                         value={globalFilter ?? ''}
//                         onChange={(e) => setGlobalFilter(e.target.value)}
//                         className="max-w-sm"
//                     />
//                     <Button variant="outline" size="icon" onClick={onSurveyUpdate} title="Refresh surveys">
//                         <RefreshCw className="h-4 w-4" />
//                     </Button>
//                 </div>

//                 <div className="flex items-center gap-3 bg-white p-3">
//                     <select
//                         value={typeFilter}
//                         onChange={(e) => setTypeFilter(e.target.value)}
//                         className="rounded-md border px-2 py-1 text-sm focus:ring focus:ring-indigo-300"
//                     >
//                         <option value="">All Types</option>
//                         <option value="1943913918">🌐 Internet</option>
//                         <option value="102647257">📞 Voice</option>
//                         <option value="1207609455">📦 Combo</option>
//                     </select>

//                     <select
//                         value={statusFilter}
//                         onChange={(e) => setStatusFilter(e.target.value)}
//                         className="rounded-md border px-2 py-1 text-sm focus:ring focus:ring-indigo-300"
//                     >
//                         <option value="">All Status</option>
//                         {Object.values(ServiceProvisionStatus).map((s, i) => (
//                             <option key={i} value={s.label.toLowerCase()}>
//                                 {s.label}
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="overflow-x-auto">
//                 <table className="w-full text-sm">
//                     <thead className="bg-gray-50">
//                         {table.getHeaderGroups().map((headerGroup) => (
//                             <tr key={headerGroup.id}>
//                                 {headerGroup.headers.map((header) => (
//                                     <th key={header.id} className="px-4 py-3 text-left font-medium text-gray-600">
//                                         {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
//                                     </th>
//                                 ))}
//                             </tr>
//                         ))}
//                     </thead>

//                     <tbody>
//                         {table.getRowModel().rows.map((row) => (
//                             <tr key={row.id} className="border-t hover:bg-gray-50">
//                                 {row.getVisibleCells().map((cell) => (
//                                     <td key={cell.id} className="px-4 py-2">
//                                         {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                                     </td>
//                                 ))}
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Pagination */}
//             <div className="flex items-center justify-between border-t bg-gray-50 p-3 text-sm">
//                 <span className="text-gray-600">
//                     Showing {table.getRowModel().rows.length} of {surveys.length}
//                 </span>
//                 <div className="flex gap-2">
//                     <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
//                         Prev
//                     </Button>
//                     <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
//                         Next
//                     </Button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// 'use client';

// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from '@/components/ui/table';
// import {
//     ColumnDef,
//     flexRender,
//     getCoreRowModel,
//     getFilteredRowModel,
//     getPaginationRowModel,
//     getSortedRowModel,
//     useReactTable,
// } from '@tanstack/react-table';
// import { ServiceProvisionStatus } from '@/lib/status-map';
// import { ArrowUpDown, Box, FileText, Phone, RefreshCw, Wifi } from 'lucide-react';
// import * as React from 'react';
// import SurveyActions from './survey/survey-actions';

// const typeMap = {
//     '1943913918': { label: 'Internet', text: 'text-blue-700', bg: 'bg-blue-400', icon: Wifi },
//     '102647257': { label: 'Voice', text: 'text-purple-700', bg: 'bg-purple-400', icon: Phone },
//     '1207609455': { label: 'Combo', text: ' text-green-700', bg: 'bg-green-400', icon: Box },
// };

// interface SurveyTableProps {
//     surveys: any[];
//     loading?: boolean;
//     onSurveyUpdate: () => void;
//     globalFilter: string;
//     typeFilter: string;
//     statusFilter: string;
// }

// export default function SurveyTable({
//     surveys,
//     loading,
//     onSurveyUpdate,
//     globalFilter,
//     typeFilter,
//     statusFilter
// }: SurveyTableProps) {
//     const [sorting, setSorting] = React.useState([]);

//     const filteredSurveys = React.useMemo(() => {
//         return surveys.filter((s) => {
//             const matchesType = typeFilter ? s.main_offer_id.includes(typeFilter) : true;
//             const matchesStatus = statusFilter ? s.status.toLowerCase() === statusFilter.toLowerCase() : true;
//             const matchesGlobal = globalFilter ?
//                 s.customer_survey_order_id?.toString().includes(globalFilter) ||
//                 s.main_offer_id?.toString().includes(globalFilter) ||
//                 s.status?.toLowerCase().includes(globalFilter.toLowerCase())
//                 : true;
//             return matchesType && matchesStatus && matchesGlobal;
//         });
//     }, [surveys, typeFilter, statusFilter, globalFilter]);

//     const columns = React.useMemo<ColumnDef<any>[]>(
//         () => [
//             {
//                 accessorKey: 'customer_survey_order_id',
//                 header: ({ column }) => (
//                     <Button
//                         variant="ghost"
//                         className="px-0 font-medium hover:text-indigo-600"
//                         onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
//                     >
//                         Order ID <ArrowUpDown className="ml-1 h-3 w-3" />
//                     </Button>
//                 ),
//                 cell: (info) => <span className="font-medium">{info.getValue() ?? '-'}</span>,
//             },
//             {
//                 accessorKey: 'main_offer_id',
//                 header: 'Type',
//                 cell: ({ getValue }) => {
//                     const id = getValue<string>() || '';
//                     const selected = typeMap[id] || { label: 'Unknown', text: 'text-gray-700', bg: 'bg-gray-400', icon: FileText };
//                     return (
//                         <Badge variant="outline" className="rounded-full">
//                             <selected.icon className={`h-3 w-3 ${selected.text}`} />
//                             <span className="ml-1 text-xs font-medium">{selected.label}</span>
//                         </Badge>
//                     );
//                 },
//             },
//             {
//                 accessorKey: 'status',
//                 header: 'Status',
//                 cell: ({ getValue }) => {
//                     const raw = Number(getValue());
//                     const mapped = ServiceProvisionStatus[raw] ?? {
//                         label: 'Unknown',
//                         text: 'text-gray-700',
//                         bg: 'bg-gray-200',
//                     };

//                     return (
//                         <Badge variant="outline" className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium">
//                             <div className={`h-2 w-2 rounded-full ${mapped.bg} ${mapped.text}`} />
//                             {mapped.label}
//                         </Badge>
//                     );
//                 },
//             },
//             {
//                 accessorKey: 'created_at',
//                 header: 'Created At',
//                 cell: ({ getValue }) => {
//                     const raw = getValue<string>();
//                     if (!raw) return '-';

//                     const date = new Date(raw);
//                     if (isNaN(date.getTime())) {
//                         return raw;
//                     }

//                     const formatted = date.toLocaleString('en-US', {
//                         year: 'numeric',
//                         month: '2-digit',
//                         day: '2-digit',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                         hour12: true,
//                     });
//                     return formatted;
//                 },
//             },
//             {
//                 id: 'actions',
//                 header: 'Actions',
//                 cell: ({ row }) => (
//                     <SurveyActions
//                         survey={row.original}
//                         onActionComplete={() => onSurveyUpdate?.()}
//                         onUpdatingChange={(isUpdating) => console.log('Updating:', isUpdating)}
//                     />
//                 ),
//             },
//         ],
//         [onSurveyUpdate],
//     );

//     const table = useReactTable({
//         data: filteredSurveys,
//         columns,
//         state: {
//             globalFilter,
//             sorting
//         },
//         onSortingChange: setSorting,
//         onGlobalFilterChange: () => {}, // Handled by parent
//         getCoreRowModel: getCoreRowModel(),
//         getFilteredRowModel: getFilteredRowModel(),
//         getSortedRowModel: getSortedRowModel(),
//         getPaginationRowModel: getPaginationRowModel(),
//     });

//     if (loading) {
//         return (
//             <div className="flex flex-col items-center justify-center p-12 text-center">
//                 <RefreshCw className="mb-3 h-6 w-6 animate-spin text-primary" />
//                 <p className="text-gray-600">Loading surveys...</p>
//             </div>
//         );
//     }

//     if (!surveys || surveys.length === 0) {
//         return (
//             <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
//                 <FileText className="mb-3 h-10 w-10 text-gray-300" />
//                 <p className="text-gray-500">No surveys found</p>
//             </div>
//         );
//     }

//     return (
//         <div className="rounded-xl border bg-white shadow-sm">
//             <div className="p-4">
//                 {/* Table using shadcn components */}
//                 <Table>
//                     <TableHeader>
//                         {table.getHeaderGroups().map((headerGroup) => (
//                             <TableRow key={headerGroup.id}>
//                                 {headerGroup.headers.map((header) => (
//                                     <TableHead key={header.id}>
//                                         {header.isPlaceholder
//                                             ? null
//                                             : flexRender(header.column.columnDef.header, header.getContext())
//                                         }
//                                     </TableHead>
//                                 ))}
//                             </TableRow>
//                         ))}
//                     </TableHeader>
//                     <TableBody>
//                         {table.getRowModel().rows?.length ? (
//                             table.getRowModel().rows.map((row) => (
//                                 <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
//                                     {row.getVisibleCells().map((cell) => (
//                                         <TableCell key={cell.id}>
//                                             {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                                         </TableCell>
//                                     ))}
//                                 </TableRow>
//                             ))
//                         ) : (
//                             <TableRow>
//                                 <TableCell colSpan={columns.length} className="h-24 text-center">
//                                     No results found.
//                                 </TableCell>
//                             </TableRow>
//                         )}
//                     </TableBody>
//                 </Table>
//             </div>

//             {/* Pagination */}
//             <div className="flex items-center justify-between border-t bg-gray-50 p-3 text-sm">
//                 <span className="text-gray-600">
//                     Showing {table.getRowModel().rows.length} of {filteredSurveys.length} results
//                 </span>
//                 <div className="flex gap-2">
//                     <Button
//                         size="sm"
//                         variant="outline"
//                         onClick={() => table.previousPage()}
//                         disabled={!table.getCanPreviousPage()}
//                     >
//                         Previous
//                     </Button>
//                     <Button
//                         size="sm"
//                         variant="outline"
//                         onClick={() => table.nextPage()}
//                         disabled={!table.getCanNextPage()}
//                     >
//                         Next
//                     </Button>
//                 </div>
//             </div>
//         </div>
//     );
// }

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    '1943913918': { label: 'Internet', text: 'text-blue-700', bg: 'bg-blue-400', icon: Wifi },
    '102647257': { label: 'Voice', text: 'text-purple-700', bg: 'bg-purple-400', icon: Phone },
    '1207609455': { label: 'Combo', text: ' text-green-700', bg: 'bg-green-400', icon: Box },
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
                cell: (info) => <div className="font-medium">{info.getValue() ?? '-'}</div>,
            },
            {
                accessorKey: 'main_offer_id',
                header: 'Type',
                cell: ({ getValue }) => {
                    const id = getValue<string>() || '';
                    const selected = typeMap[id] || { label: 'Unknown', text: 'text-gray-700', bg: 'bg-gray-400', icon: FileText };
                    const IconComponent = selected.icon;

                    return (
                        <Badge variant="outline" className="flex items-center gap-1.5">
                            <IconComponent className={`h-3 w-3 ${selected.text}`} />
                            {selected.label}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ getValue }) => {
                    const raw = Number(getValue());
                    const mapped = ServiceProvisionStatus[raw] ?? {
                        label: 'Unknown',
                        text: 'text-gray-700',
                        bg: 'bg-gray-200',
                    };

                    return (
                        <Badge variant="outline" className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${mapped.bg}`} />
                            {mapped.label}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'created_at',
                header: 'Created At',
                cell: ({ getValue }) => {
                    const raw = getValue<string>();
                    if (!raw) return '-';

                    const date = new Date(raw);
                    if (isNaN(date.getTime())) {
                        return raw;
                    }

                    return date.toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    });
                },
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <SurveyActions
                        survey={row.original}
                        onActionComplete={() => onSurveyUpdate?.()}
                        onUpdatingChange={(isUpdating) => console.log('Updating:', isUpdating)}
                    />
                ),
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
                <p className="text-muted-foreground">Loading surveys...</p>
            </div>
        );
    }

    if (!surveys || surveys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No surveys found</p>
            </div>
        );
    }

    return (
        <div className="w-full flex-col justify-start gap-6">
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} colSpan={header.colSpan}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-muted/50">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination - Matching shadcn style */}
            <div className="flex items-center justify-between px-4 pt-4">
                <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                    {/* {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected. */}
                    {table.getFilteredRowModel().rows.length} rows
                </div>
                <div className="flex w-full items-center gap-8 lg:w-fit">
                    <div className="hidden items-center gap-2 lg:flex">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium">
                            Rows per page
                        </Label>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value));
                            }}
                        >
                            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-fit items-center justify-center text-sm font-medium">
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
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
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
    );
}
