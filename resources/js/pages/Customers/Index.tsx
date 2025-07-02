import { CustomerTable } from '@/components/CustomerTable';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Customer, Pagination, PaginationLink } from '@/types/customer';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Index() {
    const {
        props: { customers },
    } = usePage<SharedData & { customers: Pagination<Customer> }>();

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Customers', href: '/customers' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers" />
            <div className="p-4">
                <CustomerTable data={customers.data} />
                <div className="mt-4 flex space-x-2">
                    {customers.links.map((link: PaginationLink, index: number) =>
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
