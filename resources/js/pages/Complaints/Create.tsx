import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/layouts/main-layout';
import { complaintSchema, ComplaintFormValues, TroubleReasons } from '@/types/complaint';
import { router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';

export function parseApiError(message: string): {
    type: 'field' | 'business' | 'general';
    text: string;
} {
    const lower = message.toLowerCase();

    if (lower.includes('mobile')) {
        return {
            type: 'field',
            text: 'Mobile number must be 10 digits and start with 0.',
        };
    }

    if (lower.includes('already cct')) {
        return {
            type: 'business',
            text: message,
        };
    }

    return {
        type: 'general',
        text: message || 'Something went wrong.',
    };
}


export default function CreateComplaintPage() {
    const { auth } = usePage().props as any;

    const { user } = auth;
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
        contact_person: '',
        mobile_no: '',
        trouble_reason: '',
        tt_description: '',
    });

    const Required = () => <span className="text-red-500 ml-1">*</span>;

    // const handleSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     clearErrors();

    //     const validation = complaintSchema.safeParse(data);
    //     console.log("🚀 ~ handleSubmit ~ validation:", validation)
    //     if (!validation.success) {
    //         validation.error.errors.forEach((err) => {
    //             const field = err.path[0] as keyof ComplaintFormValues;
    //             setError(field, err.message);
    //         });
    //         return;
    //     }

    //     const toastId = toast.loading('Submitting complaint...');

    //     try {
    //         const response = await fetch(
    //             `${process.env.API_BASE_URL}/v1/tt/create}`,
    //             {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                 },
    //                 body: JSON.stringify(validation.data),
    //             }
    //         );

    //         const responseData = await response.json();

    //         if (responseData.success === false) {
    //             const parsed = parseApiError(responseData.message);

    //             toast.dismiss(toastId);

    //             if (parsed.type === 'field') {
    //                 setError('mobile_no', parsed.text);
    //                 toast.error('Please correct the highlighted field.');
    //                 return;
    //             }

    //             toast.error(parsed.text);
    //             return;
    //         }

    //         // ✅ Success
    //         toast.dismiss(toastId);
    //         toast.success('Complaint submitted successfully!');
    //         reset();

    //     } catch (err) {
    //         toast.dismiss(toastId);
    //         toast.error('Network error. Please try again.');
    //         console.error('Submit error:', err);
    //     }
    // };


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

    const toastId = toast.loading('Submitting complaint...');

    try {
        const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/v1/tt/create`,
            validation.data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.api_token}`, // ✅ Bearer token added
                },
                timeout: 15000, // optional safety timeout
            }
        );

        const responseData = response.data;

        // ❌ API-level failure (not HTTP failure)
        if (responseData?.success === false) {
            const parsed = parseApiError(responseData.message);

            toast.dismiss(toastId);

            if (parsed.type === 'field') {
                setError('mobile_no', parsed.text);
                toast.error('Please correct the highlighted field.');
                return;
            }

            toast.error(parsed.text);
            return;
        }

        // ✅ Success
        toast.dismiss(toastId);
        toast.success('Complaint submitted successfully!');
        reset();

    } catch (error) {
        toast.dismiss(toastId);

        // Axios-specific error handling
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data || error.message);

            const apiMessage =
                error.response?.data?.message ||
                'Request failed. Please try again.';

            toast.error(apiMessage);
        } else {
            console.error('Unexpected error:', error);
            toast.error('Network error. Please try again.');
        }
    }
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
                                        value={data.trouble_reason}
                                        onValueChange={(value) => setData('trouble_reason', value)}
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
                                        </SelectContent>
                                    </Select>

                                    {errors.trouble_reason && (
                                        <p className="text-sm text-red-600">{errors.trouble_reason}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="lg:col-span-2 space-y-1">
                                    <label className="text-sm font-medium">
                                        Description <Required />
                                    </label>
                                    <Textarea
                                        rows={5}
                                        value={data.tt_description}
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
                                    disabled={processing}
                                    // onClick={() => router.visit('/complaints')}
                                    onClick={() => {
                                        if (confirm('Discard changes?')) {
                                            router.visit('/complaints');
                                        }
                                    }}
                                >
                                    Cancel
                                </Button>

                                {/* Submit Button */}
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Submitting...' : 'Submit Complaint'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
