import { Button } from '@/components/ui/button';
import GuestLayout from '@/layouts/GuestLayout';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    const handleBack = () => {
        // Use browser history to go back
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // Fallback to services page if no history
            router.visit(route('services'));
        }
    };
    return (
        <GuestLayout>
            <Head title="Terms and Conditions" />
            <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="rounded-sm bg-white p-8 shadow-xs">
                    <div className="mb-4 flex items-center gap-2">
                        <Button variant="ghost" onClick={handleBack} className="-ml-4 flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-center text-4xl font-bold text-gray-900">Terms and Conditions</h1>
                    </div>
                    {/* <h1 className="mb-6 text-4xl font-bold text-gray-900">Terms and Conditions</h1> */}
                    <div className="prose prose-gray max-w-none">
                        <p className="mb-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
                            <p className="mb-4 leading-relaxed text-gray-700">
                                By accessing and using this online service provisioning platform, you accept and agree to be bound by the terms and
                                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">2. Service Description</h2>
                            <p className="mb-4 leading-relaxed text-gray-700">
                                EthioTelecom provides fixed line services including Fixed Voice, Fixed Broadband, and Combo Services. This platform
                                allows you to request new services, manage existing connections, and handle service changes online.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">3. User Responsibilities</h2>
                            <p className="mb-4 leading-relaxed text-gray-700">
                                You are responsible for maintaining the confidentiality of your account information and for all activities that occur
                                under your account. You agree to:
                            </p>
                            <ul className="mb-4 ml-6 list-disc space-y-2 text-gray-700">
                                <li>Provide accurate and complete information when using our services</li>
                                <li>Keep your account credentials secure and confidential</li>
                                <li>Notify us immediately of any unauthorized use of your account</li>
                                <li>Comply with all applicable laws and regulations</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">4. Payment Terms</h2>
                            <p className="mb-4 leading-relaxed text-gray-700">
                                All payments for services are processed through our integrated payment systems, including Telebirr. By making a
                                payment, you agree to the payment terms and conditions. All fees are non-refundable unless otherwise stated.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">5. Service Availability</h2>
                            <p className="mb-4 leading-relaxed text-gray-700">
                                While we strive to provide continuous service availability, we do not guarantee that our services will be available at
                                all times. Service may be interrupted due to maintenance, technical issues, or circumstances beyond our control.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">6. Coverage Verification</h2>
                            <p className="mb-4 leading-relaxed text-gray-700">
                                Our GIS coverage check provides an indication of service availability in your area. However, final service
                                availability is subject to technical verification and may vary based on your specific location.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">7. Limitation of Liability</h2>
                            <p className="mb-4 leading-relaxed text-gray-700">
                                EthioTelecom shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting
                                from your use of or inability to use the service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">8. Privacy and Data Protection</h2>
                            <p className="mb-4 leading-relaxed text-gray-700">
                                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your
                                personal information.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">9. Modifications to Terms</h2>
                            <p className="mb-4 leading-relaxed text-gray-700">
                                We reserve the right to modify these terms and conditions at any time. Changes will be effective immediately upon
                                posting on this page. Your continued use of the service after changes are posted constitutes acceptance of the
                                modified terms.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">10. Contact Information</h2>
                            <p className="mb-4 leading-relaxed text-gray-700">
                                If you have any questions about these Terms and Conditions, please contact us at:
                            </p>
                            <p className="mb-2 text-gray-700">
                                <strong>Email:</strong> support@ethiotelecom.et
                            </p>
                            <p className="mb-2 text-gray-700">
                                <strong>Phone:</strong> +251 11 123 4567
                            </p>
                            <p className="text-gray-700">
                                <strong>Address:</strong> Addis Ababa, Ethiopia
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
