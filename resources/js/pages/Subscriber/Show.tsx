import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Subscriber } from '@/types/subscriber';
import { Head, Link } from '@inertiajs/react';
import React from 'react';

const DescriptionListItem = ({ term, children }: { term: string; children: React.ReactNode }) => (
    <div className="flex flex-col border-b py-3 last:border-none sm:flex-row sm:justify-between dark:border-gray-700">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{term}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 dark:text-white">{children || 'N/A'}</dd>
    </div>
);

export default function Show({ subscriber }: { subscriber: Subscriber }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Subscribers', href: '/subscribers' },
        { title: `Details`, href: `/subscribers/${subscriber.id}` },
    ];

    console.log('Subscriber Details:', subscriber);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Subscriber #${subscriber.id}`} />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">Subscriber Details</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ID: {subscriber.id}</p>
                    </div>
                    <div className="mt-4 flex space-x-2 sm:mt-0">
                        <Link href={route('subscribers.edit', subscriber.id)}>
                            <Button>Edit</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Account Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DescriptionListItem term="Customer Survey Order ID">{subscriber.customer_survey_order_id}</DescriptionListItem>
                                <DescriptionListItem term="Customer Code">{subscriber.customer_code}</DescriptionListItem>
                                <DescriptionListItem term="Payment Type">{subscriber.payment_type}</DescriptionListItem>
                                <DescriptionListItem term="Bill Cycle">{subscriber.bill_cycle}</DescriptionListItem>
                                <DescriptionListItem term="Region">{subscriber.ethio_zone_or_region}</DescriptionListItem>
                                <DescriptionListItem term="Collection Center">{subscriber.collection_center}</DescriptionListItem>
                                <DescriptionListItem term="Account Language">{subscriber.account_language}</DescriptionListItem>
                            </CardContent>
                        </Card>

                        <Card className="mt-8 border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Personal Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DescriptionListItem term="Name">{`${subscriber.first_name} ${subscriber.middle_or_father_name} ${subscriber.last_name}`}</DescriptionListItem>
                                <DescriptionListItem term="Enterprise Name">{subscriber.enterprise_customer_name}</DescriptionListItem>
                                <DescriptionListItem term="Credit Class">{subscriber.credit_class}</DescriptionListItem>
                                <DescriptionListItem term="City">{subscriber.administrative_region_city}</DescriptionListItem>
                                <DescriptionListItem term="Subcity Zone">{subscriber.subcity_zone}</DescriptionListItem>
                                <DescriptionListItem term="Wereda/Town">{subscriber.wereda_town}</DescriptionListItem>
                                <DescriptionListItem term="Kebele">{subscriber.kebele}</DescriptionListItem>
                                <DescriptionListItem term="House No">{subscriber.house_no}</DescriptionListItem>
                                <DescriptionListItem term="SMS No">{subscriber.sms_no}</DescriptionListItem>
                                <DescriptionListItem term="Payment Mode">{subscriber.payment_mode}</DescriptionListItem>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Subscription Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DescriptionListItem term="External Sequence">{subscriber.external_sequence}</DescriptionListItem>
                                <DescriptionListItem term="Network Type">{subscriber.network_type}</DescriptionListItem>
                                <DescriptionListItem term="Subscription Type">{subscriber.sub_type}</DescriptionListItem>
                                <DescriptionListItem term="Language">{subscriber.sub_language}</DescriptionListItem>
                                <DescriptionListItem term="Offering ID">{subscriber.offering_id}</DescriptionListItem>
                                <DescriptionListItem term="Effective Mode">{subscriber.effective_mode}</DescriptionListItem>
                                <DescriptionListItem term="SLA Priority">{subscriber.sla_priority}</DescriptionListItem>
                                <DescriptionListItem term="Call Center Access">{subscriber.call_center_access}</DescriptionListItem>
                                <DescriptionListItem term="External Operator ID">{subscriber.external_operid}</DescriptionListItem>
                                <DescriptionListItem term="Installment Completed Date">{subscriber.installment_completed_date}</DescriptionListItem>
                                <DescriptionListItem term="Created At">{new Date(subscriber.created_at).toLocaleString()}</DescriptionListItem>
                                <DescriptionListItem term="Updated At">{new Date(subscriber.updated_at).toLocaleString()}</DescriptionListItem>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
