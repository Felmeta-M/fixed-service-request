import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Customer } from '@/types/customer';
import { Head } from '@inertiajs/react';
import SurveyRequestForm from './SurveyRequestForm';

export default function Create({ customers }: { customers: Customer[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Survey Requests', href: '/survey-requests' },
        { title: 'Create', href: '/survey-requests/create' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Survey Request" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">Create a New Survey Request</h1>
                </div>

                <SurveyRequestForm customers={customers} />
            </div>
        </AppLayout>
    );
}
