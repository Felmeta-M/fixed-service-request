import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowUpDown, CircleFadingArrowUp, Network, Shield } from 'lucide-react';

const LandingPage = () => {
    return (
        <>
            <Head title="Welcome to Ethio Telecom Fixed Services" />
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
                <Header />

                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
                    <div className="text-center">
                        <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
                            Manage Your Fixed Services <br className="hidden md:block" />
                            <span className="text-primary">With Ease</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-600">
                            New connections, upgrades, surveys and more - all in one place for your Fixed Line, Broadband, and Combo services.
                        </p>
                        <div className="mt-10">
                            <Link
                                href={route('home')}
                                className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 font-semibold text-white transition hover:opacity-90"
                            >
                                Get Started <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="bg-white py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-base font-semibold tracking-wide text-primary uppercase">Features</h2>
                            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                                Everything you need for your fixed services
                            </p>
                        </div>

                        <div className="mt-16">
                            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                                {features.map((feature) => (
                                    <div key={feature.name} className="pt-6">
                                        <div className="flow-root h-full rounded-lg bg-gray-50 px-6 pb-8">
                                            <div className="-mt-6">
                                                <div className="flex items-center justify-center sm:justify-start">
                                                    <span className="inline-flex items-center justify-center rounded-md bg-primary p-3 shadow-lg">
                                                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                                    </span>
                                                </div>
                                                <h3 className="mt-8 text-lg font-medium text-gray-900">{feature.name}</h3>
                                                <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 text-center">
                            <h2 className="text-base font-semibold tracking-wide text-primary uppercase">Process</h2>
                            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                                Simple and Secure Access
                            </p>
                        </div>

                        <div className="mt-10">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-gray-50 px-4 text-2xl font-medium text-gray-500">3 simple steps</span>
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
                                {steps.map((step, index) => (
                                    <div key={step.name} className="pt-6">
                                        <div className="flow-root h-full rounded-lg border border-gray-200 bg-white px-6 pb-8">
                                            <div className="-mt-6">
                                                <div className="flex items-center">
                                                    <span className="inline-flex items-center justify-center rounded-md bg-primary p-3 font-bold text-white shadow-lg">
                                                        {index + 1}
                                                    </span>
                                                    <h3 className="ml-4 text-lg font-medium text-gray-900">{step.name}</h3>
                                                </div>
                                                <p className="mt-5 text-base text-gray-500">{step.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
};

const features = [
    {
        name: 'New Connections',
        description: 'Request new Fixed Line, Fixed Broadband, and Combo services through our portal',
        icon: Network,
    },
    {
        name: 'Change Primary Offer',
        description: 'Modify your current subscription plan for Fixed Line Voice and Fixed Broadband services',
        icon: ArrowUpDown,
    },
    {
        name: 'Upgrade/Downgrade',
        description: 'Seamlessly upgrade or downgrade your Fixed Broadband plans as needed',
        icon: CircleFadingArrowUp,
    },
    {
        name: 'Secure Access',
        description: 'OTP-based authentication ensures your account and services remain secure',
        icon: Shield,
    },
];

const steps = [
    {
        name: 'Get Started',
        description: 'Click the Get Started button to begin your service request or management',
    },
    {
        name: 'OTP Verification',
        description: 'Enter your phone number to receive a one-time password for secure access',
    },
    {
        name: 'Manage Services',
        description: 'Access all fixed service management features after verification',
    },
];

export default LandingPage;
