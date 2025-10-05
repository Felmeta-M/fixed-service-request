import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { CreditCard, LogIn, MapPin, Network, Package, Phone, Users, Wifi } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="container mx-auto min-h-screen max-w-screen-2xl bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="border-b bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                    <Network className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">EthioTelecom</h1>
                                    <p className="text-xs text-gray-500">Fixed Line Services</p>
                                </div>
                            </div>
                        </Link>
                        <div className="flex items-center space-x-3">
                            {/* <select className="rounded-md border px-2 py-1 text-sm">
                                <option value="en">English</option>
                                <option value="am">አማርኛ</option>
                                <option value="or">Afaan Oromoo</option>
                                <option value="ti">ትግርኛ</option>
                                <option value="so">Af Somali</option>
                            </select> */}
                            <Link href={route('verification')}>
                                <Button size="sm">
                                    Sign In
                                    <LogIn className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <section className="px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <Badge variant="outline" className="mb-4">
                        Online Service Provisioning Platform
                    </Badge>
                    <h1 className="mb-6 text-4xl font-bold text-gray-900">Manage Your Fixed Line Services Online</h1>
                    <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
                        Request new services, manage existing connections, and handle service changes without visiting our service centers. Fast,
                        convenient, and secure.
                    </p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Link href={route('verification')}>
                            <Button size="lg" className="bg-primary">
                                <MapPin className="mr-2 h-5 w-5" />
                                Get Started
                            </Button>
                        </Link>
                        <Link href={route('verification')}>
                            <Button size="lg" variant="outline">
                                <Phone className="mr-2 h-5 w-5" />
                                New Connection
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-gray-900">Our Services</h2>
                        <p className="mx-auto max-w-2xl text-gray-600">
                            Choose from our comprehensive range of fixed line services designed to meet your communication needs.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <Card className="transition-shadow hover:shadow-lg">
                            <CardHeader>
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                    <Phone className="h-6 w-6 text-blue-600" />
                                </div>
                                <CardTitle>Fixed Voice</CardTitle>
                                <CardDescription>Reliable landline telephone service for your home or business</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>• Crystal clear voice quality</li>
                                    <li>• Local and international calling</li>
                                    <li>• Competitive rates</li>
                                </ul>
                                <Button className="mt-4 w-full bg-transparent" variant="outline">
                                    Learn More
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="transition-shadow hover:shadow-lg">
                            <CardHeader>
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                                    <Wifi className="h-6 w-6 text-green-600" />
                                </div>
                                <CardTitle>Fixed Broadband</CardTitle>
                                <CardDescription>High-speed internet connection for seamless online experience</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>• Multiple speed options</li>
                                    <li>• Unlimited data plans</li>
                                    <li>• 24/7 technical support</li>
                                </ul>
                                <Button className="mt-4 w-full bg-transparent" variant="outline">
                                    Learn More
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="transition-shadow hover:shadow-lg">
                            <CardHeader>
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                                    <Package className="h-6 w-6 text-purple-600" />
                                </div>
                                <CardTitle>Combo Services</CardTitle>
                                <CardDescription>Combined voice and broadband packages for maximum value</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>• Voice + Internet bundle</li>
                                    <li>• Cost-effective packages</li>
                                    <li>• Single billing convenience</li>
                                </ul>
                                <Button className="mt-4 w-full bg-transparent" variant="outline">
                                    Learn More
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-gray-900">Why Choose Our Platform?</h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                                <MapPin className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">GIS Coverage Check</h3>
                            <p className="text-gray-600">Real-time coverage verification using GPS and GIS mapping technology</p>
                        </div>

                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CreditCard className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">Telebirr Payment</h3>
                            <p className="text-gray-600">Secure and convenient payment processing through Telebirr integration</p>
                        </div>

                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                                <Users className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">24/7 Support</h3>
                            <p className="text-gray-600">Round-the-clock customer service and technical support</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-gray-900 py-12 text-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-4">
                        <div>
                            <div className="mb-4 flex items-center space-x-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                                    <Network className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-bold">EthioTelecom</span>
                            </div>
                            <p className="text-sm text-gray-400">Ethiopia's leading telecommunications service provider</p>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold">Services</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Fixed Voice
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Fixed Broadband
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Combo Packages
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold">Support</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Help Center
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Contact Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Service Centers
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Terms of Service
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                        <p>&copy; 2025 EthioTelecom. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
