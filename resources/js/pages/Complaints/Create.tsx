import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/layouts/main-layout';
import { complaintSchema, ComplaintFormValues, TroubleReasons } from '@/types/complaint';
import { router, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useCreateComplaint } from '@/hooks/use-api-mutations';


export default function CreateComplaintPage() {
    const { auth } = usePage().props as any;

    const { user } = auth;
    console.log('user:', user)
    const {
        data,
        setData,
        errors,
        setError,
        clearErrors,
        processing,
        reset,
    } = useForm<ComplaintFormValues>({
        trouble_title: '',
        access_number: '',
        contact_person: user?.name || '',
        mobile_no: user?.phone || '',
        trouble_reason: undefined as any,
        tt_description: '',
    });

    const Required = () => <span className="text-red-500 ml-1">*</span>;

    const createComplaintMutation = useCreateComplaint();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        const validation = complaintSchema.safeParse(data);
        console.log('🚀 ~ handleSubmit ~ validation:', validation);

        if (!validation.success) {
            validation.error.errors.forEach((err) => {
                const field = err.path[0] as keyof ComplaintFormValues;
                setError(field, err.message);
            });
            return;
        }

        createComplaintMutation.mutate(validation.data, {
            onError: (error: Error & { parsed?: { type: string; text: string } }) => {
                if (error.parsed?.type === 'field') {
                    setError('mobile_no', error.parsed.text);
                    toast.error('Please correct the highlighted field.');
                } else if (error.parsed?.type === 'business') {
                    toast.error(error.parsed.text);
                } else {
                    toast.error(error.message || 'Network error. Please try again.');
                }
            },
            onSuccess: () => {
                reset();
            },
        });
    };


    return (
        <MainLayout>
            <div className="w-full px-4 py-6 lg:px-6">
                <Card className="mx-auto max-w-4xl">
                    <CardHeader>
                        <CardTitle>New Complaint</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                                {/* Title */}
                                <div className="lg:col-span-2 space-y-1">
                                    <label className="text-sm font-medium">
                                        Title <Required />
                                    </label>
                                    <Input
                                        value={data.trouble_title}
                                        onChange={(e) => setData('trouble_title', e.target.value)}
                                    />
                                    {errors.trouble_title && (
                                        <p className="text-sm text-red-600">{errors.trouble_title}</p>
                                    )}
                                </div>

                                {/* Access Number */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Service Number <Required />
                                    </label>
                                    <Input
                                        value={data.access_number}
                                        onChange={(e) => setData('access_number', e.target.value)}
                                    />
                                    {errors.access_number && (
                                        <p className="text-sm text-red-600">{errors.access_number}</p>
                                    )}
                                </div>

                                {/* Mobile Number */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Mobile Number <Required />
                                    </label>
                                    <Input
                                        value={data.mobile_no}
                                        onChange={(e) => setData('mobile_no', e.target.value)}
                                    />
                                    {errors.mobile_no && (
                                        <p className="text-sm text-red-600">{errors.mobile_no}</p>
                                    )}
                                </div>

                                {/* Contact Person */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Contact Person <Required />
                                    </label>
                                    <Input
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                    />
                                    {errors.contact_person && (
                                        <p className="text-sm text-red-600">{errors.contact_person}</p>
                                    )}
                                </div>

                                {/* Trouble Reason */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Trouble Reason <Required />
                                    </label>

                                    <Select
                                        value={data.trouble_reason || ''}
                                        onValueChange={(value) => setData('trouble_reason', value as ComplaintFormValues['trouble_reason'])}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select trouble reason" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={TroubleReasons.NO_INTERNET}>
                                                No internet connectivity
                                            </SelectItem>
                                            <SelectItem value={TroubleReasons.SLOW_INTERNET}>
                                                Slow internet
                                            </SelectItem>
                                            <SelectItem value={TroubleReasons.NO_SIGNAL}>
                                                No signal
                                            </SelectItem>
                                            <SelectItem value={TroubleReasons.BILLING_ISSUE}>
                                                Billing issue
                                            </SelectItem>
                                            <SelectItem value={TroubleReasons.OTHER}>
                                                Other
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {errors.trouble_reason && (
                                        <p className="text-sm text-red-600">{errors.trouble_reason}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="lg:col-span-2 space-y-1">
                                    <label className="text-sm font-medium">
                                        Description {data.trouble_reason === TroubleReasons.OTHER && <Required />}
                                    </label>
                                    <Textarea
                                        rows={5}
                                        value={data.tt_description || ''}
                                        onChange={(e) => setData('tt_description', e.target.value)}
                                    />
                                    {errors.tt_description && (
                                        <p className="text-sm text-red-600">{errors.tt_description}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processing || createComplaintMutation.isPending}
                                    onClick={() => {
                                        if (confirm('Discard changes?')) {
                                            router.visit('/complaints');
                                        }
                                    }}
                                >
                                    Cancel
                                </Button>

                                {/* Submit Button */}
                                <Button type="submit" disabled={processing || createComplaintMutation.isPending}>
                                    {processing || createComplaintMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
