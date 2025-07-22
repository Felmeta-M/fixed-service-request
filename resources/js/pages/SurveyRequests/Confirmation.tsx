import { Head, Link } from '@inertiajs/react';
import { CheckCircle, Clock, Mail, Phone } from 'lucide-react';

const ServiceRequestConfirmation = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <Head title="Request Confirmation" />
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="mt-6 text-3xl font-bold text-gray-900">Request Submitted Successfully!</h1>
                    <p className="mt-4 text-lg text-gray-600">Your service request has been received and is being processed.</p>
                    <p className="mt-2 text-gray-600">
                        Reference: <span className="font-medium">SR-2023-0567</span>
                    </p>
                </div>

                <div className="mt-10 overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-lg font-medium text-gray-900">What happens next?</h2>
                        <div className="mt-6 space-y-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Clock className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">1-2 business days:</span> Our team will review your request and contact you to
                                        schedule the installation.
                                    </p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Phone className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">Phone call:</span> Expect a call from our customer service team to confirm
                                        details.
                                    </p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Mail className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">Email confirmation:</span> You'll receive an email with your request details and
                                        next steps.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                    <Link
                        href={route('dashboard')}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700"
                    >
                        Go to Dashboard
                    </Link>
                    <Link
                        href={route('survey-requests.selection')}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Request Another Service
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ServiceRequestConfirmation;
