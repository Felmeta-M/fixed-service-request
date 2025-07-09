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
import { BreadcrumbItem, Pagination, PaginationLink } from '@/types';
import { SurveyRequest } from '@/types/survey';
import { Head, Link, router } from '@inertiajs/react';
import { MoreHorizontal, SquarePenIcon, Trash2Icon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

export default function Index({ surveyRequests }: { surveyRequests: Pagination<SurveyRequest> }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Survey Requests', href: '/survey-requests' }];

    const handleDelete = (id: number) => {
        router.delete(route('survey-requests.destroy', id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Survey Requests" />

            <div className="p-2 sm:p-3 lg:p-4">
                <div className="mb-4 sm:flex sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white"> </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href={route('survey-requests.create')}>
                            <Button className="cursor-pointer">Create Request</Button>
                        </Link>
                    </div>
                </div>

                <div className="overflow-hidden rounded-sm">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead>Request</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Completed Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {surveyRequests.data.map((request) => (
                                <TableRow
                                    key={request.id}
                                    className="cursor-pointer"
                                    onClick={() => router.visit(route('survey-requests.show', request.id))}
                                >
                                    <TableCell className="font-medium">{request.survey_request_number}</TableCell>
                                    <TableCell>
                                        {request.customer?.first_name} {request.customer?.last_name}
                                    </TableCell>
                                    <TableCell>{request.survey_type}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{request.status}</Badge>
                                    </TableCell>
                                    <TableCell>{request.completed_date ? new Date(request.completed_date).toLocaleDateString() : 'N/A'}</TableCell>
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
                                                        <Link className="cursor-pointer" href={route('survey-requests.edit', request.id)}>
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
                                                        This action cannot be undone. This will permanently delete the survey request.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="cursor-pointer bg-red-600 hover:bg-red-500"
                                                        onClick={() => {
                                                            router.delete(`/survey-requests/${request.id}`, {
                                                                onSuccess: () => toast.success('Survey request deleted successfully!'),
                                                                onError: () => toast.error('Failed to delete survey request.'),
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
                    {surveyRequests.links.map((link: PaginationLink, index: number) =>
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
