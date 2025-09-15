import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Customer } from '@/types/customer';
import { SurveyRequest } from '@/types/survey';
import { Head } from '@inertiajs/react';
import SubscriberForm from './SubscriberForm';

export default function Create({
    customers,
    surveyRequests,
}: {
    customers: Customer[];
    surveyRequests: Pick<SurveyRequest, 'id' | 'customer_survey_order_id'>[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Subscribers', href: '/subscribers' },
        { title: 'Create', href: '/subscribers/create' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Subscriber" />

            <div className="p-4 sm:p-6 lg:p-8">
                <h1 className="mb-4 cursor-pointer text-2xl font-bold">New Subscriber</h1>
                <SubscriberForm customers={customers} surveyRequests={surveyRequests} />
            </div>
        </AppLayout>
    );
}
