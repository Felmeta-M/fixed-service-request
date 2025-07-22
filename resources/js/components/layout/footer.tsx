import { Link } from '@inertiajs/react';
import { Facebook, Linkedin, Mail, MapPin, Network, Phone, Twitter } from 'lucide-react';

export function Footer() {
    return (
        <footer className="mt-8 bg-primary text-white sm:px-8">
            <div className="container mx-auto px-4 py-12">
                <div className="grid gap-8 md:grid-cols-4">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                                <Network className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Ethio Telecom Fixed Services</h3>
                                <p className="text-sm text-gray-300">The Right to Connect</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-200">
                            Connecting Ethiopia with reliable fixed line voice and high-speed internet services. Your trusted telecommunications
                            partner.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-200 transition-colors hover:text-secondary">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-200 transition-colors hover:text-secondary">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-200 transition-colors hover:text-secondary">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="mb-4 text-lg font-semibold">Services</h4>
                        <ul className="space-y-2 text-gray-200">
                            <li>
                                <Link href="#" className="transition-colors hover:text-secondary">
                                    Fixed Line Voice
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="transition-colors hover:text-secondary">
                                    High-Speed Internet
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="transition-colors hover:text-secondary">
                                    Bundle Packages
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="transition-colors hover:text-secondary">
                                    Enterprise Solutions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="mb-4 text-lg font-semibold">Support</h4>
                        <ul className="space-y-2 text-gray-200">
                            <li>
                                <Link href="/portal" className="transition-colors hover:text-secondary">
                                    Customer Portal
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="transition-colors hover:text-secondary">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="transition-colors hover:text-secondary">
                                    Technical Support
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="transition-colors hover:text-secondary">
                                    Service Status
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="mb-4 text-lg font-semibold">Contact Us</h4>
                        <div className="space-y-3 text-gray-200">
                            <div className="flex items-center space-x-3">
                                <Phone className="h-4 w-4" />
                                <span className="text-sm">+251-11-123-4567</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">support@ethiotelecom.et</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <MapPin className="mt-0.5 h-4 w-4" />
                                <span className="text-sm">
                                    Bole Road, Addis Ababa
                                    <br />
                                    Ethiopia
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t border-green-800 pt-6">
                    <div className="flex flex-col items-center justify-between md:flex-row">
                        <p className="text-sm text-gray-200">© 2025 Ethio Telecom. All rights reserved.</p>
                        <div className="mt-4 flex space-x-6 md:mt-0">
                            <Link href="#" className="text-sm text-gray-200 transition-colors hover:text-secondary">
                                Privacy Policy
                            </Link>
                            <Link href="#" className="text-sm text-gray-200 transition-colors hover:text-secondary">
                                Terms of Service
                            </Link>
                            <Link href="#" className="text-sm text-gray-200 transition-colors hover:text-secondary">
                                Cookie Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
