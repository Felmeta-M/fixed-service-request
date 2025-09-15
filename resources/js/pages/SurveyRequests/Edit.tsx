import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Customer } from '@/types/customer';
import { SurveyRequest } from '@/types/survey';
import { Head } from '@inertiajs/react';
import SurveyRequestForm from './SurveyRequestForm';

export default function Edit({ surveyRequest, customers }: { surveyRequest: SurveyRequest; customers: Customer[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Survey Requests', href: '/survey-requests' },
        { title: 'Edit', href: `/survey-requests/${surveyRequest.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Survey Request #${surveyRequest.customer_survey_order_id}`} />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">Edit Survey Request</h1>
                </div>

                <SurveyRequestForm surveyRequest={surveyRequest} customers={customers} />
            </div>
        </AppLayout>
    );
}
