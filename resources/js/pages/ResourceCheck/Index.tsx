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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Pagination, PaginationLink, SharedData } from '@/types';
import { Resource } from '@/types/resource';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { MoreHorizontal, SquarePenIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
    const {
        props: { checks },
    } = usePage<SharedData & { checks: Pagination<Resource> }>();

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Resource Checks', href: '/resource-checks' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Resource Checks" />

            <div className="p-2 sm:p-3 lg:p-4">
                <div className="mb-4 sm:flex sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white"> </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href={route('resource-checks.create')}>
                            <Button className="cursor-pointer">Create Resource</Button>
                        </Link>
                    </div>
                </div>

                <div className="overflow-hidden rounded-sm">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead>Line Number</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Longitude</TableHead>
                                <TableHead>latitude</TableHead>
                                <TableHead>Staff</TableHead>
                                <TableHead>Combo Flag</TableHead>
                                <TableHead>Customer Address</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {checks.data.map((request) => (
                                <TableRow
                                    key={request.id}
                                    className="cursor-pointer"
                                    onClick={() => router.visit(route('resource-checks.show', request.id))}
                                >
                                    <TableCell className="font-medium">{request.number_line}</TableCell>
                                    <TableCell>{request.cust_name}</TableCell>
                                    <TableCell>{request.longitude}</TableCell>
                                    <TableCell>{request.latitude}</TableCell>
                                    <TableCell>{request.staff_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{request.combo_flag}</Badge>
                                    </TableCell>
                                    <TableCell>{request.cust_addr}</TableCell>

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
                                                        <Link className="cursor-pointer" href={route('resource-checks.edit', request.id)}>
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
                                                        This action cannot be undone. This will permanently delete the resource check request.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="cursor-pointer bg-red-600 hover:bg-red-500"
                                                        onClick={() => {
                                                            router.delete(`/resource-checks/${request.id}`, {
                                                                onSuccess: () => toast.success('Resource check deleted successfully!'),
                                                                onError: () => toast.error('Failed to delete resource check.'),
                                                            });
                                                        }}
                                                    >
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
                <div className="mt-4 flex space-x-2">
                    {checks.links.map((link: PaginationLink, index: number) =>
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
