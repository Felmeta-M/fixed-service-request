import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComplaintForm } from '@/features/complaints/components/complaint-form';
import { useCreateComplaint } from '@/hooks/use-api-mutations';
import MainLayout from '@/layouts/main-layout';
import { router, usePage } from '@inertiajs/react';

export default function CreateComplaintPage() {
    const { auth } = usePage().props as any;
    const { user } = auth ?? {};
    const createComplaintMutation = useCreateComplaint();

    return (
        <MainLayout>
            <div className="w-full px-4 py-6 lg:px-6">
                <Card className="mx-auto max-w-4xl">
                    <CardHeader>
                        <CardTitle>Create a Trouble Ticket</CardTitle>
                        <CardDescription>Submit a trouble ticket for your fixed service.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ComplaintForm
                            createMutation={createComplaintMutation}
                            defaultValues={{
                                contact_person: user?.name || '',
                                mobile_no: user?.phone || '',
                            }}
                            onCancel={() => {
                                if (confirm('Discard changes?')) {
                                    router.visit('/complaints');
                                }
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
