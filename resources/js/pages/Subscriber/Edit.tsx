import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Customer } from '@/types/customer';
import { Subscriber } from '@/types/subscriber';
import { SurveyRequest } from '@/types/survey';
import { Head } from '@inertiajs/react';
import SubscriberForm from './SubscriberForm';

export default function Edit({
    subscriber,
    customers,
    surveyRequests,
}: {
    subscriber: Subscriber;
    customers: Customer[];
    surveyRequests: Pick<SurveyRequest, 'id' | 'customer_survey_order_id'>[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Subscribers', href: '/subscribers' },
        { title: 'Edit', href: `/subscribers/${subscriber.id}/edit` },
    ];
    console.log('Edit Subscriber:', subscriber);
    console.log('Customers:', customers);
    console.log('Survey Requests:', surveyRequests);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Subscriber #${subscriber.id}`} />
            <div className="p-4 sm:p-6 lg:p-8">
                <h1 className="mb-4 text-2xl font-bold">Edit Subscriber</h1>
                <SubscriberForm subscriber={subscriber} customers={customers} surveyRequests={surveyRequests} />
            </div>
        </AppLayout>
    );
}
