import { Link } from '@inertiajs/react';
import logo from '../../images/ethio_logo_full.png';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white">
            <div className="mx-auto max-w-screen-2xl border-t border-gray-800">
                <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex items-center space-x-3">
                            <img src={logo} alt="EthioTelecom Logo" className="h-10 w-auto transition-all duration-200" />
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-sm text-gray-400">
                                &copy; {currentYear} EthioTelecom. All rights reserved.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                            <Link href={route('terms')} className="transition-colors duration-200 hover:text-white">
                                Terms and Conditions
                            </Link>
                            <Link href="#" className="transition-colors duration-200 hover:text-white">
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
