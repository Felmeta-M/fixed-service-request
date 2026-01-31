import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ComplaintFormValues, complaintSchema, TroubleReasons } from '@/types/complaint';
import { useForm } from '@inertiajs/react';
import { showErrorToast } from '@/lib/toast-helpers';

type CreateComplaintMutation = {
    mutate: (data: ComplaintFormValues, options?: { onSuccess?: () => void; onError?: (error: Error & { parsed?: { type: string; text: string } }) => void }) => void;
    isPending: boolean;
};

type ComplaintFormProps = {
    /** Mutation hook for creating complaint (authenticated or guest) */
    createMutation: CreateComplaintMutation;
    /** Pre-filled values (e.g. from logged-in user) */
    defaultValues?: Partial<ComplaintFormValues>;
    /** Called on successful submit - use to close modal in guest mode */
    onSuccess?: () => void;
    /** Called on cancel - use to close modal */
    onCancel?: () => void;
    /** Show compact styling for modal */
    compact?: boolean;
};

const Required = () => <span className="ml-1 text-red-500">*</span>;

export function ComplaintForm({
    createMutation,
    defaultValues = {},
    onSuccess,
    onCancel,
    compact = false,
}: ComplaintFormProps) {
    const initialValues: Partial<ComplaintFormValues> & Pick<ComplaintFormValues, 'access_number' | 'contact_person' | 'mobile_no'> = {
        access_number: defaultValues.access_number ?? '',
        contact_person: defaultValues.contact_person ?? '',
        mobile_no: defaultValues.mobile_no ?? '',
        trouble_reason: defaultValues.trouble_reason,
        tt_description: defaultValues.tt_description ?? '',
    };
    const { data, setData, errors, setError, clearErrors, reset } = useForm<ComplaintFormValues>(
        initialValues as ComplaintFormValues
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        const validation = complaintSchema.safeParse(data);

        if (!validation.success) {
            validation.error.errors.forEach((err) => {
                const field = err.path[0] as keyof ComplaintFormValues;
                setError(field, err.message);
            });
            return;
        }

        createMutation.mutate(validation.data, {
            onSuccess: () => {
                reset();
                onSuccess?.();
            },
            onError: (error: Error & { parsed?: { type: string; text: string } }) => {
                if (error.parsed?.type === 'field') {
                    setError('mobile_no', error.parsed.text);
                    showErrorToast('Please correct the highlighted field.');
                } else if (error.parsed?.type === 'business') {
                    showErrorToast(error.parsed.text);
                } else {
                    showErrorToast(error.message || 'Network error. Please try again.');
                }
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`grid grid-cols-1 gap-4 ${compact ? '' : 'lg:grid-cols-2'}`}>
                <div className="space-y-1">
                    <label className="text-sm font-medium">
                        Service Number <Required />
                    </label>
                    <Input
                        placeholder="Enter service number"
                        value={data.access_number}
                        onChange={(e) => setData('access_number', e.target.value)}
                    />
                    {errors.access_number && <p className="text-sm text-red-600">{errors.access_number}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">
                        Mobile Number <Required />
                    </label>
                    <Input
                        value={data.mobile_no}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9+]/g, '').slice(0, 13);
                            setData('mobile_no', value);
                        }}
                    />
                    {errors.mobile_no && <p className="text-sm text-red-600">{errors.mobile_no}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">
                        Contact Person <Required />
                    </label>
                    <Input value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} />
                    {errors.contact_person && <p className="text-sm text-red-600">{errors.contact_person}</p>}
                </div>

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
                            <SelectItem value={TroubleReasons.NO_INTERNET}>No internet connectivity</SelectItem>
                            <SelectItem value={TroubleReasons.SLOW_INTERNET}>Slow internet</SelectItem>
                            <SelectItem value={TroubleReasons.NO_SIGNAL}>No signal</SelectItem>
                            <SelectItem value={TroubleReasons.BILLING_ISSUE}>Billing issue</SelectItem>
                            <SelectItem value={TroubleReasons.OTHER}>Other</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.trouble_reason && <p className="text-sm text-red-600">{errors.trouble_reason}</p>}
                </div>

                <div className={`space-y-1 ${compact ? '' : 'lg:col-span-2'}`}>
                    <label className="text-sm font-medium">
                        Description {data.trouble_reason === TroubleReasons.OTHER && <Required />}
                    </label>
                    <Textarea
                        rows={compact ? 3 : 5}
                        value={data.tt_description || ''}
                        onChange={(e) => setData('tt_description', e.target.value)}
                    />
                    {errors.tt_description && <p className="text-sm text-red-600">{errors.tt_description}</p>}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
                </Button>
            </div>
        </form>
    );
}
