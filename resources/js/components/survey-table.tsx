// 'use client';

// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { cn } from '@/lib/utils';
// import {
//     ColumnDef,
//     flexRender,
//     getCoreRowModel,
//     getFilteredRowModel,
//     getPaginationRowModel,
//     getSortedRowModel,
//     useReactTable,
// } from '@tanstack/react-table';
// import { ArrowUpDown, FileText, RefreshCw } from 'lucide-react';
// import * as React from 'react';
// import SurveyActions from './survey/survey-actions';

// interface SurveyTableProps {
//     surveys: any[];
//     loading?: boolean;
//     onSurveyUpdate: (id: string, action: 'cancel' | 'continue') => void;
// }

// export default function SurveyTable({ surveys, loading, onSurveyUpdate }: SurveyTableProps) {
//     const [globalFilter, setGlobalFilter] = React.useState('');
//     const [sorting, setSorting] = React.useState([]);

//     // 🧩 Columns definition
//     const columns = React.useMemo<ColumnDef<any>[]>(
//         () => [
//             {
//                 accessorKey: 'customer_survey_order_id',
//                 header: ({ column }) => (
//                     <Button variant="ghost" className="text-left" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
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
//                     if (id.includes('1943913918')) return '🌐 Internet';
//                     if (id.includes('102647257')) return '📞 Voice';
//                     if (id.includes('1207609455')) return '📦 Combo';
//                     return '📋 Unknown';
//                 },
//             },
//             {
//                 accessorKey: 'status',
//                 header: 'Status',
//                 cell: ({ getValue }) => {
//                     const status = (getValue<string>() || '').toLowerCase();
//                     const colorMap: Record<string, string> = {
//                         waiting: 'bg-yellow-100 text-yellow-700',
//                         completed: 'bg-green-100 text-green-700',
//                         subscribed: 'bg-indigo-100 text-indigo-700',
//                         cancelled: 'bg-red-100 text-red-700',
//                     };
//                     return <Badge className={cn('capitalize', colorMap[status] ?? 'bg-gray-100 text-gray-700')}>{status || 'Unknown'}</Badge>;
//                 },
//             },
//             {
//                 accessorKey: 'created_at',
//                 header: 'Created At',
//                 cell: ({ getValue }) => {
//                     const date = new Date(getValue<string>());
//                     return date.toLocaleDateString('en-US', {
//                         year: 'numeric',
//                         month: 'short',
//                         day: 'numeric',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                     });
//                 },
//             },
//             // {
//             //     id: 'actions',
//             //     header: 'Actions',
//             //     cell: ({ row }) => (
//             //         <div className="flex gap-2">
//             //             <Button
//             //                 size="sm"
//             //                 variant="outline"
//             //                 className="border-red-500 text-red-600 hover:bg-red-50"
//             //                 onClick={() => onSurveyUpdate(row.original.customer_survey_order_id, 'cancel')}
//             //             >
//             //                 Cancel
//             //             </Button>
//             //             <Button
//             //                 size="sm"
//             //                 className="bg-blue-600 text-white hover:bg-blue-700"
//             //                 onClick={() => onSurveyUpdate(row.original.customer_survey_order_id, 'continue')}
//             //             >
//             //                 Continue
//             //             </Button>
//             //         </div>
//             //     ),
//             // },
//             {
//     id: 'actions',
//     header: 'Actions',
//     cell: ({ row }) => (
//         <SurveyActions
//             survey={row.original}
//             onActionComplete={() => onSurveyUpdate?.()}   // refresh list after cancel/continue
//             onUpdatingChange={(isUpdating) => console.log('Updating:', isUpdating)}
//         />
//     ),
// },
//         ],
//         [onSurveyUpdate],
//     );

//     // 🧠 Table instance
//     const table = useReactTable({
//         data: surveys ?? [],
//         columns,
//         state: { globalFilter, sorting },
//         onSortingChange: setSorting,
//         onGlobalFilterChange: setGlobalFilter,
//         getCoreRowModel: getCoreRowModel(),
//         getFilteredRowModel: getFilteredRowModel(),
//         getSortedRowModel: getSortedRowModel(),
//         getPaginationRowModel: getPaginationRowModel(),
//     });

//     // 🌀 Loading / Empty states
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

//     // 🧾 Table view
//     return (
//         <div className="rounded-xl border bg-white p-4 shadow-sm">
//             {/* Search */}
//             <div className="mb-4 flex items-center justify-between gap-4">
//                 <Input
//                     placeholder="Search surveys..."
//                     value={globalFilter ?? ''}
//                     onChange={(e) => setGlobalFilter(e.target.value)}
//                     className="max-w-sm"
//                 />
//             </div>

//             {/* Table */}
//             <div className="overflow-x-auto">
//                 <table className="w-full text-sm">
//                     <thead className="bg-gray-50">
//                         {table.getHeaderGroups().map((headerGroup) => (
//                             <tr key={headerGroup.id}>
//                                 {headerGroup.headers.map((header) => (
//                                     <th key={header.id} className="px-4 py-3 text-left font-semibold text-gray-700">
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
//             <div className="mt-4 flex items-center justify-between text-sm">
//                 <div className="text-gray-500">
//                     Showing {table.getRowModel().rows.length} of {surveys.length}
//                 </div>
//                 <div className="flex gap-2">
//                     <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
//                         Previous
//                     </Button>
//                     <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, FileText, RefreshCw } from 'lucide-react';
import * as React from 'react';
import SurveyActions from './survey/survey-actions';

interface SurveyTableProps {
    surveys: any[];
    loading?: boolean;
    onSurveyUpdate: () => void;
}

export default function SurveyTable({ surveys, loading, onSurveyUpdate }: SurveyTableProps) {
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [sorting, setSorting] = React.useState([]);
    const [typeFilter, setTypeFilter] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('');

    const filteredSurveys = React.useMemo(() => {
        return surveys.filter((s) => {
            const matchesType = typeFilter ? s.main_offer_id.includes(typeFilter) : true;
            const matchesStatus = statusFilter ? s.status.toLowerCase() === statusFilter.toLowerCase() : true;
            return matchesType && matchesStatus;
        });
    }, [surveys, typeFilter, statusFilter]);

    const columns = React.useMemo<ColumnDef<any>[]>(
        () => [
            {
                accessorKey: 'customer_survey_order_id',
                header: ({ column }) => (
                    <Button variant="ghost" className="text-left" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        Order ID <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                ),
                cell: (info) => <span className="font-medium">{info.getValue() ?? '-'}</span>,
            },
            {
                accessorKey: 'main_offer_id',
                header: 'Type',
                cell: ({ getValue }) => {
                    const id = getValue<string>() || '';
                    if (id.includes('1943913918')) return '🌐 Internet';
                    if (id.includes('102647257')) return '📞 Voice';
                    if (id.includes('1207609455')) return '📦 Combo';
                    return '🌐 Internet';
                },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ getValue }) => {
                    const status = (getValue<string>() || '').toLowerCase();
                    const colorMap: Record<string, string> = {
                        waiting: 'bg-yellow-100 text-yellow-700',
                        completed: 'bg-green-100 text-green-700',
                        subscribed: 'bg-indigo-100 text-indigo-700',
                        cancelled: 'bg-red-100 text-red-700',
                    };
                    return <Badge className={cn('capitalize', colorMap[status] ?? 'bg-gray-100 text-gray-700')}>{status || 'Unknown'}</Badge>;
                },
            },
            {
                accessorKey: 'created_at',
                header: 'Created At',
                // cell: ({ getValue }) => {
                //     const date = new Date(getValue<string>());
                //     return date.toLocaleDateString('en-US', {
                //         year: 'numeric',
                //         month: 'short',
                //         day: 'numeric',
                //         hour: '2-digit',
                //         minute: '2-digit',
                //     });
                // },
                cell: ({ getValue }) => {
                    const date = getValue<string>();
                    return date;
                },
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <SurveyActions
                        survey={row.original}
                        onActionComplete={() => onSurveyUpdate?.()} // refresh list after cancel/continue
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
        state: { globalFilter, sorting },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <RefreshCw className="mb-3 h-6 w-6 animate-spin text-primary" />
                <p className="text-gray-600">Loading surveys...</p>
            </div>
        );
    }

    if (!surveys || surveys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
                <FileText className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-gray-500">No surveys found</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
            {/* Search + Filters + Refresh */}
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex justify-between gap-2">
                    <Input
                        placeholder="Search surveys..."
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="max-w-sm"
                    />
                    <Button variant="outline" size="icon" onClick={onSurveyUpdate} title="Refresh surveys">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex justify-between gap-2">
                    {/* Type Filter */}
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded border px-2 py-1 text-sm">
                        <option value="">All Types</option>
                        <option value="1943913918">🌐 Internet</option>
                        <option value="102647257">📞 Voice</option>
                        <option value="1207609455">📦 Combo</option>
                    </select>

                    {/* Status Filter */}
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border px-2 py-1 text-sm">
                        <option value="">All Status</option>
                        <option value="waiting">Waiting</option>
                        <option value="completed">Completed</option>
                        <option value="subscribed">Subscribed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className="px-4 py-3 text-left font-semibold text-gray-700">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="border-t hover:bg-gray-50">
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-4 py-2">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-gray-500">
                    Showing {table.getRowModel().rows.length} of {surveys.length}
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        Previous
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
