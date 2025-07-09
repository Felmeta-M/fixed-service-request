import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Customer } from '@/types/customer';
import { Link, router } from '@inertiajs/react';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { MoreVertical, SquarePenIcon, Trash2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface CustomerTableProps {
    data: Customer[];
}

export function CustomerTable({ data }: CustomerTableProps) {
    const [globalFilter, setGlobalFilter] = useState('');

    const columns = useMemo<ColumnDef<Customer>[]>(
        () => [
            {
                accessorKey: 'first_name',
                header: 'First Name',
            },
            {
                accessorKey: 'last_name',
                header: 'Last Name',
            },
            {
                accessorKey: 'title',
                header: 'Title',
            },
            {
                accessorKey: 'nationality',
                header: 'Nationality',
            },
            {
                accessorKey: 'created_at',
                header: 'Created',
                cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    const customer = row.original;
                    return (
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
                                            <MoreVertical className="h-4 w-4" />
                                            <span className="sr-only">Open menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[160px]">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.get(route('customers.edit', customer.id));
                                            }}
                                            className="cursor-pointer"
                                        >
                                            Edit
                                            <DropdownMenuShortcut>
                                                <SquarePenIcon className="h-4 w-4" />
                                            </DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                                                Delete
                                                <DropdownMenuShortcut>
                                                    <Trash2Icon className="h-4 w-4 text-red-600" />
                                                </DropdownMenuShortcut>
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the customer.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="cursor-pointer bg-red-600 hover:bg-red-500"
                                            onClick={() => {
                                                router.delete(`/customers/${customer.id}`, {
                                                    onSuccess: () => toast.success('Customer deleted successfully!'),
                                                    onError: () => toast.error('Failed to delete customer.'),
                                                });
                                            }}
                                        >
                                            Continue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    );
                },
            },
        ],
        [],
    );

    const table = useReactTable({
        data,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString',
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <Input
                    placeholder="Search customers..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.currentTarget.value)}
                    className="max-w-sm"
                />
                <Link href={route('customers.create')}>
                    <Button className="cursor-pointer">Create Customer</Button>
                </Link>
            </div>
            <Table>
                <TableHeader className="bg-muted">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className="cursor-pointer select-none">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                    {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => {
                        const customer = row.original;
                        return (
                            <TableRow key={row.id} className="cursor-pointer" onClick={() => router.get(route('customers.show', customer.id))}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
}
