import { Button } from '@/components/ui/button';
import { ComplaintForm } from '@/features/complaints/components/complaint-form';
import { useCreateComplaintGuest } from '@/hooks/use-api-mutations';
import { useTranslation } from '@/hooks/use-translation';
import GuestLayout from '@/layouts/guest-layout';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function ComplaintPage() {
    const createComplaintGuest = useCreateComplaintGuest();
    const { t } = useTranslation();

    return (
        <GuestLayout>
            <div className="min-h-[calc(100vh)] bg-gradient-to-b from-gray-50/50 to-white">
                <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-8 lg:py-12">
                    {/* Back Button */}
                    <Link href={route('home')} className="inline-flex">
                        <Button variant="ghost" size="sm" className="gap-2 text-[#068BCC] hover:text-[#068BCC]">
                            <ArrowLeft className="h-4 w-4" />
                            <span>{t('common.back')}</span>
                        </Button>
                    </Link>

                    {/* Header */}
                    {/* <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                            <MessageSquareText className="h-4 w-4" />
                            <span>{t('complaints.title')}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('complaints.submit_complaint')}</h1>
                        <p className="mt-2 text-gray-600">{t('complaints.guest_form_description')}</p>
                    </div> */}

                    {/* Form Card */}
                    <div className="rounded-2xl bg-white p-2 sm:p-4">
                        <ComplaintForm
                            createMutation={createComplaintGuest}
                            requireTurnstile={true}
                            onSuccess={() => {
                                // Form will show success toast automatically
                            }}
                        />
                    </div>

                    {/* Helper Info */}
                    {/* <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{t('complaints.ticket_tracking_hint')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="h-4 w-4" />
                            <span>
                                {t('complaints.call_support')}: <strong className="text-primary">994</strong>
                            </span>
                        </div>
                    </div> */}
                </div>
            </div>
        </GuestLayout>
    );
}
