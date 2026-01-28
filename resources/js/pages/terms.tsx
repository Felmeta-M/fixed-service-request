import { Button } from '@/components/ui/button';
import GuestLayout from '@/layouts/guest-layout';
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
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            className="-ml-2 flex items-center gap-2 px-2 text-sm text-gray-600 hover:text-gray-900 sm:-ml-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back</span>
                        </Button>
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                                Ethio Telecom Online Fixed Services Request
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">Terms and Conditions</p>
                        </div>
                    </div>
                    <div className="prose prose-sm prose-gray max-w-none text-gray-700">
                        <p className="mb-4 text-xs uppercase tracking-wide text-emerald-700">
                            Ethio Telecom Online Fixed Services Request
                        </p>
                        <p className="mb-8 text-sm text-gray-500">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">1. Acceptance of Terms</h2>
                            <p className="leading-relaxed">
                                By submitting an online request for Fixed services (New Request, Upgrade/Downgrade, Relocation,
                                Reconnection and Service Termination) through Ethio Telecom&apos;s website, portal or authorized digital platform,
                                you agree to be bound by these Terms and Conditions. These Terms constitute a pre-service agreement governing the
                                request and preliminary provisioning process.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">2. Service Request is Not a Guarantee</h2>
                            <p className="mb-3 leading-relaxed">
                                2.1. The submission of a Service Request is an application for service and does not constitute an immediate activation
                                or a binding contract for the provision of Fixed services.
                            </p>
                            <p className="mb-2 leading-relaxed">
                                2.2. Final service provisioning is strictly subject to:
                            </p>
                            <ul className="ml-5 list-disc space-y-1">
                                <li>
                                    <span className="font-semibold">a) Technical Feasibility:</span> Verification of network infrastructure and capacity
                                    at your specified service address (your location).
                                </li>
                                <li>
                                    <span className="font-semibold">b) Documentation:</span> Receipt and verification of all required legal documents
                                    (e.g., valid Kebele ID / National ID, proof of address, rental agreement if applicable).
                                </li>
                                <li>
                                    <span className="font-semibold">c) Site Survey:</span> Successful completion of a physical site survey, if required.
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">3. Customer Obligations &amp; Accurate Information</h2>
                            <p className="mb-2 leading-relaxed">
                                3.1. You warrant that all information provided during the Service Request (including personal details, identification,
                                and Service Address / GIS Location) is accurate, complete, and current.
                            </p>
                            <p className="mb-2 leading-relaxed">
                                3.2. You are responsible for providing necessary access to the Service Address for site surveys and installation.
                            </p>
                            <p className="leading-relaxed">
                                3.3. You authorize Ethio Telecom to use the submitted information for feasibility studies and communication regarding
                                your application.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">4. Feasibility, Survey, and Installation</h2>
                            <p className="mb-2 leading-relaxed">
                                4.1. Ethio Telecom will conduct a feasibility study based on your Service Request. You will be notified of the outcome
                                (Available or Not Available).
                            </p>
                            <p className="mb-2 leading-relaxed">
                                4.2. If feasible, Ethio Telecom will schedule a site survey / installation. You must ensure an authorized adult (18+)
                                is present at the agreed time.
                            </p>
                            <p className="mb-2 leading-relaxed">
                                4.3. You are responsible for preparing the premises, including providing a suitable power source and a secure location
                                for the installed equipment (CPE).
                            </p>
                            <p className="leading-relaxed">
                                4.4. Ethio Telecom reserves the right to decline the Service Request at any stage due to technical, operational or
                                administrative reasons.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">5. Financial Terms</h2>
                            <p className="mb-2 leading-relaxed">
                                5.1. Current FBB tariff plans, installation fees, modem/router costs and related information are published on Ethio
                                Telecom&apos;s official website and are subject to change.
                            </p>
                            <p className="mb-2 leading-relaxed">
                                5.2. You agree to pay all applicable charges as per the selected tariff plan upon service activation. All fees are
                                inclusive of applicable taxes.
                            </p>
                            <p className="leading-relaxed">
                                5.3. The specific charges for your connection will be confirmed after the site survey and before the final service
                                activation.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">6. Equipment &amp; Property</h2>
                            <p className="mb-2 leading-relaxed">
                                6.1. Modem, router or terminal equipment (CPE) may be provided by Ethio Telecom, or you may avail the modem, router or
                                terminal equipment (CPE) as per your preference, subject to Ethio Telecom&apos;s technical specifications.
                            </p>
                            <p className="leading-relaxed">
                                6.2. You are responsible for the safekeeping of the CPE.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">7. Limitation of Liability</h2>
                            <p className="mb-2 leading-relaxed">
                                7.1. Ethio Telecom shall not be liable for any delays in processing the Service Request, conducting the site survey or
                                installing the service arising from factors beyond its reasonable control (Force Majeure).
                            </p>
                            <p className="leading-relaxed">
                                7.2. To the maximum extent permitted by law, Ethio Telecom&apos;s liability related to this Service Request process is
                                limited to the re-processing of the request or a formal apology.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">8. Privacy</h2>
                            <p className="leading-relaxed">
                                Your personal information will be handled in accordance with our Privacy Policy, which is incorporated by reference
                                into these Terms. We will use your data primarily to process your Request and, if you proceed, to provide service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">9. Governing Law and Dispute Resolution</h2>
                            <p className="leading-relaxed">
                                These Terms shall be governed by and construed in accordance with the laws of the Federal Democratic Republic of
                                Ethiopia (FDRE). Any dispute arising from this Service Request shall be primarily resolved through harmonious
                                settlement or, if necessary, through the competent courts of Ethiopia.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">10. Modification of Terms</h2>
                            <p className="leading-relaxed">
                                Ethio Telecom reserves the right to modify these Terms at any time. The updated version will be posted on Ethio
                                Telecom websites. Continued use of the platform or submission of a Service Request after changes constitutes
                                acceptance. Changes to these Terms and Conditions will be effective as of the date they are validated.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">11. Contact</h2>
                            <p className="mb-2 leading-relaxed">
                                For your questions regarding your Service Request, contact:
                            </p>
                            <ul className="ml-5 list-disc space-y-1">
                                <li>
                                    <span className="font-semibold">Ethio Telecom Customer Care:</span> 899 / 994
                                </li>
                                <li>
                                    <span className="font-semibold">Website:</span>{' '}
                                    <a
                                        href="https://www.ethiotelecom.et"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary underline underline-offset-2 hover:opacity-80"
                                    >
                                        www.ethiotelecom.et
                                    </a>
                                </li>
                            </ul>
                        </section>

                        <section className="rounded-lg border border-dashed border-et-blue bg-et-blue/10 px-4 py-5 text-sm text-gray-800">
                            <h2 className="mb-3 text-base font-semibold text-et-blue">Declaration by Customer</h2>
                            <ul className="ml-4 list-disc space-y-1">
                                <li>I have read, understood and agreed to all the Terms and Conditions above.</li>
                                <li>All information I have provided is true and correct.</li>
                                <li>I authorize Ethio Telecom to conduct the necessary technical and credit checks.</li>
                            </ul>
                            <p className="mt-4 text-xs text-gray-700">
                                By submitting this request electronically, I provide my electronic consent, which shall have the full legal force of a
                                handwritten signature.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
