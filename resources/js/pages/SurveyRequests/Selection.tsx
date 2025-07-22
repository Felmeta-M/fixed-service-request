// import { Head, Link } from '@inertiajs/react';
// import { Briefcase, Home, Package, Phone, Wifi } from 'lucide-react';

// const SurveySelectionPage = () => {
//     const services = [
//         {
//             id: 'fl',
//             title: 'Fixed Line (FL)',
//             description: 'Voice telephone service for your home or business',
//             icon: Phone,
//             route: route('survey-requests.create', { type: 'fl' }),
//         },
//         {
//             id: 'fbb',
//             title: 'Fixed Broadband (FBB)',
//             description: 'High-speed internet connection',
//             icon: Wifi,
//             route: route('survey-requests.create', { type: 'fbb' }),
//         },
//         {
//             id: 'combo',
//             title: 'Combo',
//             description: 'Bundle of FL and FBB services',
//             icon: Package,
//             route: route('survey-requests.create', { type: 'combo' }),
//         },
//         {
//             id: 'home',
//             title: 'Home Package',
//             description: 'Special packages for residential customers',
//             icon: Home,
//             route: route('survey-requests.create', { type: 'home' }),
//         },
//         {
//             id: 'business',
//             title: 'Business Package',
//             description: 'Dedicated solutions for enterprises',
//             icon: Briefcase,
//             route: route('survey-requests.create', { type: 'business' }),
//         },
//     ];

//     return (
//         <div className="py-12">
//             <Head title="Select Service" />
//             <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//                 <div className="text-center">
//                     <h1 className="text-3xl font-bold text-gray-900">What service do you need?</h1>
//                     <p className="mt-4 text-lg text-gray-600">Select from our range of fixed line and broadband services</p>
//                 </div>

//                 <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//                     {services.map((service) => (
//                         <Link
//                             key={service.id}
//                             href={service.route}
//                             className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-md"
//                         >
//                             <div className="flex-shrink-0">
//                                 <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
//                                     <service.icon className="h-6 w-6" />
//                                 </div>
//                             </div>
//                             <div className="mt-4 flex-1">
//                                 <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
//                                 <p className="mt-2 text-sm text-gray-500">{service.description}</p>
//                             </div>
//                             <div className="mt-6">
//                                 <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
//                                     Request service
//                                     <svg
//                                         className="ml-1 h-4 w-4"
//                                         fill="none"
//                                         stroke="currentColor"
//                                         viewBox="0 0 24 24"
//                                         xmlns="http://www.w3.org/2000/svg"
//                                     >
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
//                                     </svg>
//                                 </span>
//                             </div>
//                         </Link>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default SurveySelectionPage;

import { Head, Link } from '@inertiajs/react';
import { Package, Phone, Wifi } from 'lucide-react';

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

export default function SurveySelectionPage() {
    return (
        <div className="py-12">
            <Head title="Select Service" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">What service do you need?</h1>
                    <p className="mt-4 text-lg text-gray-600">Select from our range of fixed line and broadband services</p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                        <Link
                            key={service.id}
                            href={route('survey-requests.create', { type: service.id })}
                            className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-md"
                        >
                            <div className="flex-shrink-0">
                                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                                    <service.icon className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex-1">
                                <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
                                <p className="mt-2 text-sm text-gray-500">{service.description}</p>
                            </div>
                            <div className="mt-6">
                                <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
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
            </div>
        </div>
    );
}
