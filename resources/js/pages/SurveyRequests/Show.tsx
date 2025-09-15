import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { SurveyRequest } from '@/types/survey';
import { Head, Link } from '@inertiajs/react';
import React from 'react';

const DescriptionListItem = ({ term, children }: { term: string; children: React.ReactNode }) => (
    <div className="flex flex-col border-b py-3 last:border-none sm:flex-row sm:justify-between dark:border-gray-700">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{term}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 dark:text-white">{children || 'N/A'}</dd>
    </div>
);

export default function Show({ surveyRequest }: { surveyRequest: SurveyRequest }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Survey Requests', href: '/survey-requests' },
        { title: `Details`, href: `/survey-requests/${surveyRequest.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Survey Request #${surveyRequest.customer_survey_order_id}`} />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex justify-between sm:flex sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">Survey Request Details</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{surveyRequest.customer_survey_order_id}</p>
                    </div>
                    <div className="mt-4 flex space-x-2 sm:mt-0">
                        <Link href={route('survey-requests.edit', surveyRequest.id)}>
                            <Button className="cursor-pointer">Edit</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Survey Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DescriptionListItem term="Survey Type">{surveyRequest.survey_type}</DescriptionListItem>
                                <DescriptionListItem term="Telecom Region">{surveyRequest.telecom_region}</DescriptionListItem>
                                <DescriptionListItem term="Operation Type">{surveyRequest.operation_type}</DescriptionListItem>
                                <DescriptionListItem term="Main Offer ID">{surveyRequest.main_offer_id}</DescriptionListItem>
                                <DescriptionListItem term="Bandwidth">{surveyRequest.bandwidth}</DescriptionListItem>
                            </CardContent>
                        </Card>

                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>Contact Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <h3 className="mb-2 font-semibold">Primary Contact</h3>
                                <DescriptionListItem term="Name">{surveyRequest.contact_person}</DescriptionListItem>
                                <DescriptionListItem term="Phone">{surveyRequest.contact_no}</DescriptionListItem>
                                <DescriptionListItem term="Email">{surveyRequest.contact_email}</DescriptionListItem>

                                <h3 className="mt-6 mb-2 font-semibold">Secondary Contact</h3>
                                <DescriptionListItem term="Name">{surveyRequest.sec_contact_person}</DescriptionListItem>
                                <DescriptionListItem term="Phone">{surveyRequest.sec_contact_no}</DescriptionListItem>
                                <DescriptionListItem term="Email">{surveyRequest.sec_contact_email}</DescriptionListItem>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer & Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DescriptionListItem term="Customer">
                                    {surveyRequest.customer ? `${surveyRequest.customer.first_name} ${surveyRequest.customer.last_name}` : 'N/A'}
                                </DescriptionListItem>
                                <DescriptionListItem term="Customer Code">{surveyRequest.customer_code}</DescriptionListItem>
                                <DescriptionListItem term="Status">
                                    <Badge variant="outline">{surveyRequest.status}</Badge>
                                </DescriptionListItem>
                                <DescriptionListItem term="Completed Date">
                                    {surveyRequest.completed_date ? new Date(surveyRequest.completed_date).toLocaleDateString() : 'Not Completed'}
                                </DescriptionListItem>
                                <DescriptionListItem term="Created At">{new Date(surveyRequest.created_at).toLocaleString()}</DescriptionListItem>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
