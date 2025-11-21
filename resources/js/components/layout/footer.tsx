import { Link } from '@inertiajs/react';
import { Facebook, Instagram, Mail, MapPin, Network, Phone, Twitter, Youtube } from 'lucide-react';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerSections = [
        {
            title: 'Services',
            links: [
                { name: 'Fixed Voice', href: '#' },
                { name: 'Fixed Broadband', href: '#' },
                { name: 'Combo Packages', href: '#' },
                { name: 'Business Solutions', href: '#' },
                { name: 'Enterprise Services', href: '#' },
            ],
        },
        {
            title: 'Support',
            links: [
                { name: 'Help Center', href: '#' },
                { name: 'Service Status', href: '#' },
                { name: 'Contact Support', href: '#' },
                { name: 'Service Centers', href: '#' },
                { name: 'FAQ', href: '#' },
            ],
        },
        {
            title: 'Company',
            links: [
                { name: 'About Us', href: '#' },
                { name: 'Careers', href: '#' },
                { name: 'News & Updates', href: '#' },
                { name: 'Privacy Policy', href: '#' },
                { name: 'Terms of Service', href: '#' },
            ],
        },
        {
            title: 'Resources',
            links: [
                { name: 'Blog', href: '#' },
                { name: 'Developers', href: '#' },
                { name: 'Partners', href: '#' },
                { name: 'Sitemap', href: '#' },
                { name: 'Downloads', href: '#' },
            ],
        },
    ];

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Instagram, href: '#', label: 'Instagram' },
        { icon: Youtube, href: '#', label: 'YouTube' },
    ];

    const contactInfo = [
        { icon: Phone, text: '+251 11 123 4567' },
        { icon: Mail, text: 'support@ethiotelecom.et' },
        { icon: MapPin, text: 'Addis Ababa, Ethiopia' },
    ];

    return (
        <footer className="bg-gray-900 text-white">
            <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-2">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                    <div className="xl:col-span-2">
                        <div className="mb-6 flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-800">
                                <Network className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">EthioTelecom</h3>
                                <p className="text-gray-400">Fixed Line Services</p>
                            </div>
                        </div>
                        <p className="mb-6 max-w-md text-lg text-gray-400">
                            Ethiopia's leading telecommunications provider, connecting communities and empowering digital transformation across the
                            nation.
                        </p>

                        <div className="mb-6 space-y-3">
                            {contactInfo.map((item, index) => (
                                <div key={index} className="flex items-center space-x-3 text-gray-400">
                                    <item.icon className="h-4 w-4" />
                                    <span className="text-sm">{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex space-x-4">
                            {socialLinks.map((social, index) => (
                                <Link
                                    key={index}
                                    href={social.href}
                                    className="rounded-lg bg-gray-800 p-2 transition-colors duration-200 hover:bg-emerald-600"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-5 w-5" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {footerSections.map((section, index) => (
                        <div key={index}>
                            <h4 className="mb-6 text-lg font-semibold text-white">{section.title}</h4>
                            <ul className="space-y-3">
                                {section.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <Link
                                            href={link.href}
                                            className="group flex items-center space-x-2 text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                                        >
                                            <span className="h-1 w-1 rounded-full bg-emerald-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></span>
                                            <span>{link.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-800">
                <div className="max-w-8xl mx-auto px-4 py-8 sm:px-6 lg:px-2">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="text-center md:text-left">
                            <p className="text-sm text-gray-400">
                                &copy; {currentYear} EthioTelecom. All rights reserved. | Connecting Ethiopia to the Future
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                            <Link href="#" className="transition-colors duration-200 hover:text-white">
                                Privacy Policy
                            </Link>
                            <Link href="#" className="transition-colors duration-200 hover:text-white">
                                Terms of Service
                            </Link>
                            <Link href="#" className="transition-colors duration-200 hover:text-white">
                                Cookie Policy
                            </Link>
                            <Link href="#" className="transition-colors duration-200 hover:text-white">
                                Sitemap
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
