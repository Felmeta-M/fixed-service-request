import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ComplaintForm } from '@/features/complaints/components/complaint-form';
import { useCreateComplaint } from '@/hooks/use-api-mutations';
import MainLayout from '@/layouts/main-layout';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function CreateComplaintPage() {
    const { auth } = usePage().props as any;
    const { user } = auth ?? {};
    const createComplaintMutation = useCreateComplaint();
    const [cancelModalOpen, setCancelModalOpen] = useState(false);

    const handleDiscard = () => {
        setCancelModalOpen(false);
        router.visit('/complaints');
    };

    return (
        <MainLayout>
            <div className="w-full py-2 sm:px-4 sm:py-4 lg:px-6">
                <Card className="mx-auto max-w-4xl border-none shadow-none">
                    <CardHeader className="px-4 sm:px-6">
                        <CardTitle className="text-xl sm:text-2xl">Create a Trouble Ticket</CardTitle>
                        <CardDescription>Submit a trouble ticket for your fixed service.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        <ComplaintForm
                            createMutation={createComplaintMutation}
                            defaultValues={{
                                contact_person: user?.name || '',
                                mobile_no: user?.phone || '',
                            }}
                            onCancel={() => setCancelModalOpen(true)}
                        />
                    </CardContent>
                </Card>
            </div>

            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent className="mx-auto max-w-[calc(100%-2rem)] sm:mx-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Discard changes?</DialogTitle>
                        <DialogDescription>Your trouble ticket form has unsaved changes. Do you want to leave and discard them?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-row gap-2 sm:flex-row sm:gap-2">
                        <Button type="button" variant="destructive" onClick={handleDiscard} className="w-full sm:w-auto">
                            Discard
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setCancelModalOpen(false)} className="w-full sm:w-auto">
                            Keep editing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
