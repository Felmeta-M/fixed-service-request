// customers/success.tsx
import { Button } from '@/components/ui/button';
import CustomerLayout from '@/layouts/customer-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle, Package, Phone, Wifi } from 'lucide-react';

export default function Success() {
    const { props } = usePage();
    const customerId = props.customer?.id; //  pass the customer in the response

    const services = [
        {
            id: 'fl',
            title: 'Fixed Line (FL)',
            description: 'Voice telephone service for your home or business',
            icon: Phone,
        },
        {
            id: 'fbb',
            title: 'Fixed Broadband (FBB)',
            description: 'High-speed internet connection',
            icon: Wifi,
        },
        {
            id: 'combo',
            title: 'Combo',
            description: 'Bundle of FL and FBB services',
            icon: Package,
        },
    ];

    return (
        <CustomerLayout>
            <Head title="Customer Created Successfully" />
            <div className="space-y-6 py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-primary" />
                        <h1 className="text-2xl font-bold text-gray-900">Your Profile Created Successfully!</h1>
                        <p className="text-gray-600">Continue by selecting from our range of services</p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => (
                            <Link
                                key={service.id}
                                href={route('survey-requests.create', { type: service.id })}
                                className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-primary hover:shadow-md"
                            >
                                <div className="flex-shrink-0">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-100 text-primary group-hover:bg-primary group-hover:text-white">
                                        <service.icon className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="mt-4 flex-1">
                                    <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
                                    <p className="mt-2 text-sm text-gray-500">{service.description}</p>
                                </div>
                                <div className="mt-6">
                                    <span className="inline-flex items-center text-sm font-medium text-primary group-hover:text-primary">
                                        Request service
                                        <svg
                                            className="ml-1 h-4 w-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end gap-4">
                        <Button asChild>
                            <Link href={`/customers/${customerId}`}>Go to your profile</Link>
                        </Button>

                        {/* <Button asChild className="gap-2">
                            <Link href={`/survey-requests/create?customer_id=${customerId}&services`}>
                                Continue to Service Request
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button> */}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
