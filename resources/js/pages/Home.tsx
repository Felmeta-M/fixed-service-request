import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GuestLayout from '@/layouts/GuestLayout';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle, MapPin, Package, Phone, Star, Users, Wifi } from 'lucide-react';
import telebirrLogo from '../images/telebirr-logo.png';

export default function HomePage() {
    const { auth } = usePage().props;
    // if (auth?.user) {
    //     window.location.href = route('services');
    // }
    const features = [
        {
            icon: MapPin,
            title: 'GIS Coverage Check',
            description: 'Real-time coverage verification using GPS and GIS mapping technology',
            color: 'blue',
        },
        {
            image: telebirrLogo,
            title: 'telebirr Payment',
            description: 'Secure and convenient payment processing through Telebirr integration',
            color: 'green',
        },
        {
            icon: Users,
            title: '24/7 Support',
            description: 'Round-the-clock customer service and technical support',
            color: 'purple',
        },
    ];

    const services = [
        {
            icon: Phone,
            title: 'Fixed Voice',
            description: 'Reliable landline telephone service for your home or business',
            features: ['Crystal clear voice quality', 'Local and international calling', 'Competitive rates'],
            color: 'blue',
        },
        {
            icon: Wifi,
            title: 'Fixed Broadband',
            description: 'High-speed internet connection for seamless online experience',
            features: ['Multiple speed options', 'Unlimited data plans', '24/7 technical support'],
            color: 'green',
        },
        {
            icon: Package,
            title: 'Combo Services',
            description: 'Combined voice and broadband packages for maximum value',
            features: ['Voice + Internet bundle', 'Cost-effective packages', 'Single billing convenience'],
            color: 'purple',
        },
    ];

    const stats = [
        { number: '50K+', label: 'Happy Customers' },
        { number: '98%', label: 'Service Uptime' },
        { number: '24/7', label: 'Customer Support' },
        { number: '15min', label: 'Average Setup Time' },
    ];

    const testimonials = [
        {
            name: 'Alem Tesfaye',
            role: 'Small Business Owner',
            content: 'The online service provisioning saved me days of waiting. Everything was completed in under 30 minutes!',
            rating: 5,
        },
        {
            name: 'Meron Getachew',
            role: 'Home User',
            content: 'The GIS coverage check was incredibly accurate. No more guessing if service is available in my area.',
            rating: 5,
        },
        {
            name: 'Dawit Hailu',
            role: 'Enterprise Client',
            content: 'Telebirr integration made payments so convenient. Highly recommended for busy professionals.',
            rating: 4,
        },
    ];

    return (
        <GuestLayout>
            <div className="min-h-screen">
                {/* Hero Section */}
                <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
                    <div className="absolute inset-0 mx-auto max-w-screen-2xl rounded-3xl" />
                    <div className="relative mx-auto max-w-4xl text-center">
                        <Badge variant="outline" className="mb-4 border px-4 text-sm font-semibold text-primary">
                            Online Service Provisioning Platform
                        </Badge>
                        <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900">
                            Manage Your <span className="bg-primary bg-clip-text text-transparent">Fixed Services</span> Online
                        </h1>
                        <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-gray-600">
                            Request new services, manage existing connections, and handle service changes without visiting our service centers. Fast,
                            convenient, and secure digital experience.
                        </p>
                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <Link href={route('otp.phone')}>
                                <Button
                                    size="lg"
                                    className="bg-primary px-8 py-3 text-lg text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                                >
                                    {/* <MapPin className="mr-3 h-5 w-5" /> */}
                                    Get Started Now
                                    <ArrowRight className="text-medium ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="#services">
                                <Button size="lg" variant="outline" className="px-8 py-3 text-lg transition-all duration-200">
                                    Explore Services
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-shadow duration-200 hover:shadow-md"
                                >
                                    <div className="mb-2 text-3xl font-bold text-gray-900">{stat.number}</div>
                                    <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section id="services" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="mb-16 text-center">
                            <Badge variant="outline" className="mb-4 px-4 py-1 text-primary">
                                Our Services
                            </Badge>
                            <h2 className="mb-4 text-4xl font-bold text-gray-900">Comprehensive Fixed Line Solutions</h2>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600">
                                Choose from our range of reliable fixed line services designed to meet your communication needs
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {services.map((service, index) => (
                                <Card
                                    key={index}
                                    className="group transform border-0 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                                >
                                    <CardHeader className="pb-4">
                                        <div
                                            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-${service.color}-100 transition-transform duration-200 group-hover:scale-110`}
                                        >
                                            <service.icon className={`h-7 w-7 text-${service.color}-600`} />
                                        </div>
                                        <CardTitle className="text-xl">{service.title}</CardTitle>
                                        <CardDescription className="mt-2 text-base">{service.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="mb-6 space-y-3">
                                            {service.features.map((feature, featureIndex) => (
                                                <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                                                    <CheckCircle className={`h-4 w-4 text-${service.color}-500 mr-3 flex-shrink-0`} />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button className="w-full bg-transparent hover:bg-gray-50" variant="outline">
                                            Learn More
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="mb-16 text-center">
                            <Badge variant="outline" className="mb-4py-1 text-primary">
                                Why Choose Us
                            </Badge>
                            <h2 className="mb-4 text-4xl font-bold text-gray-900">Experience the Difference</h2>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600">
                                We combine cutting-edge technology with exceptional service to deliver the best customer experience
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="group transform rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div
                                        className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-${feature.color}-100 transition-transform duration-200 group-hover:scale-110`}
                                    >
                                        {feature.image ? (
                                            <img src={feature.image} alt="Telebirr Logo" className="h-14 w-14 object-contain" />
                                        ) : (
                                            <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
                                        )}
                                    </div>
                                    <h3 className="mb-4 text-xl font-semibold text-gray-900">{feature.title}</h3>
                                    <p className="leading-relaxed text-gray-600">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="mb-16 text-center">
                            <Badge variant="outline" className="mb-4 px-4 py-1 text-amber-600">
                                Customer Stories
                            </Badge>
                            <h2 className="mb-4 text-4xl font-bold text-gray-900">What Our Customers Say</h2>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600">
                                Don't just take our word for it - hear from our satisfied customers
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {testimonials.map((testimonial, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-shadow duration-200 hover:shadow-lg"
                                >
                                    <div className="mb-4 flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="mb-4 text-gray-700 italic">"{testimonial.content}"</p>
                                    <div>
                                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                        <div className="rounded-3xl bg-white px-8 py-12 shadow-lg">
                            <h2 className="mb-4 text-4xl font-bold">Ready to Get Started?</h2>
                            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-400">
                                Join thousands of satisfied customers who manage their fixed line services online
                            </p>
                            <Link href={route('otp.phone')}>
                                <Button
                                    size="lg"
                                    className="bg-primary px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl"
                                >
                                    <MapPin className="mr-3 h-5 w-5" />
                                    Check Coverage & Start
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </GuestLayout>
    );
}
