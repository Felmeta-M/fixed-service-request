import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GuestLayout from '@/layouts/GuestLayout';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle, ChevronDown, MapPin, Package, Phone, Star, Users, Wifi } from 'lucide-react';
import telebirrLogo from '../images/telebirr-logo-1.png';
import fixedHeroImage from '../images/fixed-hero.png';
import { useRef } from 'react';

export default function HomePage() {
    const { auth } = usePage().props;
    const demoRef = useRef<HTMLDivElement>(null);
    // if (auth?.user) {
    //     window.location.href = route('services');
    // }
    const features = [
        {
            icon: MapPin,
            title: 'GIS Coverage Check',
            description: 'Real-time coverage verification using GPS and GIS mapping technology',
            color: 'primary',
        },
        {
            image: telebirrLogo,
            title: 'telebirr Payment',
            description: 'Secure and convenient payment processing through Telebirr integration',
            color: 'et-blue',
        },
        {
            icon: Users,
            title: '24/7 Support',
            description: 'Round-the-clock customer service and technical support',
            color: 'et-green',
        },
    ];

    const services = [
        {
            icon: Phone,
            title: 'Fixed Voice',
            description: 'Reliable landline telephone service for your home or business',
            features: ['Crystal clear voice quality', 'Local and international calling', 'Competitive rates'],
            color: 'primary',
        },
        {
            icon: Wifi,
            title: 'Fixed Broadband',
            description: 'High-speed internet connection for seamless online experience',
            features: ['Multiple speed options', 'Unlimited data plans', '24/7 technical support'],
            color: 'et-blue',
        },
        {
            icon: Package,
            title: 'Combo Services',
            description: 'Combined voice and broadband packages for maximum value',
            features: ['Voice + Internet bundle', 'Cost-effective packages', 'Single billing convenience'],
            color: 'et-green',
        },
    ];

    // const stats = [
    //     { number: '24/7', label: 'Customer Support' },
    //     { number: '15min', label: 'Average Setup Time' },
    //     { number: '98%', label: 'Service Uptime' },
    //     { number: '50K+', label: 'Happy Customers' },
    // ];
    const stats = [
        { number: '100% Online', label: 'Service Requests' },
        { number: 'Real-Time', label: 'GIS Coverage Check' },
        { number: 'Secure', label: 'Telebirr Payments' },
        { number: 'Official', label: 'Ethio telecom Platform' },
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

    const scrollToDemo = () => {
        demoRef.current?.scrollIntoView({ behavior: "smooth" });
      };

    return (
        <GuestLayout>
            <div className="min-h-screen">
                {/* Hero Section */}
                <section 
                    className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
                    style={{
                        backgroundImage: `url(${fixedHeroImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/90" />
                    
                    {/* Additional subtle overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-r from-et-green/5 via-transparent to-et-blue/5" />
                    
                    {/* Content */}
                    <div className="relative z-10 mx-auto max-w-4xl text-center">
                        {/* <Badge variant="outline" className="mb-4 border px-4 text-sm font-semibold text-et-green">
                            Online Service Provisioning Platform
                        </Badge> */}
                        <div className="-mt-10 sm:-mt-12 lg:-mt-16">
                            <h1 className="mb-6 text-3xl leading-tight font-bold text-gray-900 sm:text-4xl lg:text-5xl">
                                Manage Your <span className="bg-primary bg-clip-text text-transparent">Fixed Services</span> Online
                            </h1>
                            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-700 sm:text-xl">
                                Get reliable fixed voice, high-speed broadband, or combined services.
                                Request and manage everything online with fast, secure service provisioning.
                                <br />
                            </p>
                        </div>
                        <div className="mt-16 flex flex-col justify-center gap-4 sm:flex-row">
                            <Link href={route('otp.phone')}>
                                <Button
                                    size="lg"
                                    className="bg-primary px-8 py-6 text-lg font-semibold text-white shadow-xl transition-all duration-200 hover:opacity-90 hover:shadow-2xl"
                                >
                                    {/* <MapPin className="mr-3 h-5 w-5" /> */}
                                    Get Started Now
                                    <ArrowRight className="text-medium ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            {/* <Link href="#services">
                                <Button 
                                    size="lg" 
                                    variant="outline" 
                                    className="px-8 py-6 text-lg font-semibold  text-gray-700 transition-all duration-200 hover:opacity-90"
                                >
                                    Explore Services
                                </Button>
                            </Link> */}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                {/* <section className="px-4 py- sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-shadow duration-200 hover:shadow-md"
                                >
                                  
<div className="mt-1 text-xl font-semibold text-gray-900">
  {stat.number}
</div>
                                    <div className="text-sm uppercase tracking-wide text-gray-500">
  {stat.label}
</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section> */}
                
                {/* <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Trusted by 5,000+ businesses
              including
            </p> */}
            

        {/* Scroll Indicator */}
        {/* <div className="flex justify-center pb-8">
          <button
            onClick={scrollToDemo}
            className="group flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            <span className="text-sm mb-2">See it in action</span>
            <ChevronDown className="w-6 h-6 animate-bounce group-hover:animate-none" />
          </button>
        </div> */}

                {/* Services Section */}
                <section id="services" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="mb-16 text-center">
                            {/* <Badge variant="outline" className="mb-4 px-4 py-1 text-primary"> */}
                                <h3 className='"mb-4 pb-4 px-4 py-1 text-primary font-semibold'>Our Services</h3>
                            {/* </Badge> */}
                            <h2 className="mb-4 text-4xl font-bold text-gray-900">Comprehensive Fixed Line Solutions</h2>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600">
                                Choose from our range of reliable fixed line services designed to meet your communication needs
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {services.map((service, index) => (
                                <Card
                                    key={index}
                                    className="group transform border-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <CardHeader>
                                        <div
                                            // className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-${service.color}-100 transition-transform duration-200 group-hover:scale-110`}
                                            className={`mb-2 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110`}
                                        >
                                            <service.icon className={`h-7 w-7 text-${service.color}`} />
                                        </div>
                                        <CardTitle className="text-xl">{service.title}</CardTitle>
                                        <CardDescription className="text-base">{service.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {service.features.map((feature, featureIndex) => (
                                                <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                                                    <CheckCircle className={`h-4 w-4 text-${service.color} mr-3 flex-shrink-0`} />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        {/* <Button className="w-full bg-transparent hover:bg-gray-50" variant="outline">
                                            Learn More
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button> */}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                {/* <section className="bg-gradient-to-br from-et-blue-50 to-et-light-blue-50 px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="mb-16 text-center">
                            <h3 className='"mb-4 pb-4 px-4 py-1 text-primary font-semibold'> Why Choose Us</h3>
                            <h2 className="mb-4 text-4xl font-bold text-gray-900">Experience the Difference</h2>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600">
                                We combine cutting-edge technology with exceptional service to deliver the best customer experience
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="group transform rounded-2xl bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div
                                        className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 `}
                                    >
                                        {feature.image ? (
                                            <img src={feature.image} alt="Telebirr Logo" className="h-14 w-14 object-contain" />
                                        ) : (
                                            <feature.icon className={`h-8 w-8 text-${feature.color}`} />
                                        )}
                                    </div>
                                    <h3 className="mb-4 text-xl font-semibold text-gray-900">{feature.title}</h3>
                                    <p className="leading-relaxed text-gray-600">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section> */}

                {/* Testimonials Section */}
                {/* <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="mb-16 text-center">
                            <h3 className='"mb-4 pb-4 px-4 py-1 text-primary font-semibold'>Customer Stories </h3>
                            <h2 className="mb-4 text-4xl font-bold text-gray-900">What Our Customers Say</h2>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600">
                                Don't just take our word for it - hear from our satisfied customers
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {testimonials.map((testimonial, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="mb-4 flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < testimonial.rating ? 'fill-et-yellow text-et-yellow' : 'text-gray-300'}`}
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
                </section> */}

                {/* CTA Section */}
                {/* <section className="px-4 py-20 sm:px-6 lg:px-8">
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
                </section> */}
            </div>
        </GuestLayout>
    );
}
