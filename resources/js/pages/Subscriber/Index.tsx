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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, type Pagination, type PaginationLink } from '@/types';
import { Subscriber } from '@/types/subscriber';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { LoaderCircle, MoreHorizontal, SquarePenIcon, Trash2Icon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

export default function Index() {
    const { requests } = usePage().props as unknown as {
        requests: Pagination<Subscriber>;
    };
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Subscribers', href: '/subscribers' }];
    console.log('requests:', requests);

    const [deletingId, setDeletingId] = React.useState<number | null>(null);

    const handleDelete = (id: number) => {
        setDeletingId(id);
        router.delete(route('subscribers.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Subscriber deleted successfully!');
                setDeletingId(null);
            },
            onError: () => {
                toast.error('Failed to delete subscriber.');
                setDeletingId(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscribers" />
            <div className="p-2 sm:p-3 lg:p-4">
                <div className="mb-4 sm:flex sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white"> </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href={route('subscribers.create')}>
                            <Button className="cursor-pointer">New Subscriber</Button>
                        </Link>
                    </div>
                </div>
                <div className="overflow-hidden rounded-sm">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Customer Code</TableHead>
                                <TableHead>First Name</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.data.map((request) => (
                                <TableRow
                                    key={request.id}
                                    className="cursor-pointer"
                                    onClick={() => router.visit(route('subscribers.show', request.id))}
                                >
                                    <TableCell className="font-medium">{request.id}</TableCell>
                                    <TableCell>{request.customer_code}</TableCell>
                                    <TableCell>
                                        {request.first_name} {request.middle_or_father_name} {request.last_name}
                                    </TableCell>
                                    <TableCell>{new Date(request.created_at).toLocaleDateString() || 'N/A'}</TableCell>
                                    <TableCell className="text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem asChild>
                                                        <Link className="cursor-pointer" href={route('subscribers.edit', request.id)}>
                                                            Edit
                                                            <DropdownMenuShortcut>
                                                                <SquarePenIcon className="h-4 w-4" />
                                                            </DropdownMenuShortcut>
                                                        </Link>
                                                    </DropdownMenuItem>
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
                                                        This action cannot be undone. This will permanently delete the subscription request.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="cursor-pointer bg-red-600 hover:bg-red-500"
                                                        onClick={() => handleDelete(request.id)}
                                                        disabled={deletingId === request.id}
                                                    >
                                                        {deletingId === request.id ? (
                                                            <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />
                                                        ) : null}
                                                        Continue
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* pagination links */}
                <div className="mt-4 flex space-x-2">
                    {requests.links.map((link: PaginationLink, index: number) =>
                        link.url ? (
                            <Link
                                key={index}
                                href={link.url}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className="rounded border px-3 py-1 text-sm"
                            />
                        ) : (
                            <span
                                key={index}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className="rounded bg-gray-200 px-3 py-1 text-sm dark:bg-gray-700"
                            />
                        ),
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
