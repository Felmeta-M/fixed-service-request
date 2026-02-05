import { isRecaptchaEnabled, Recaptcha } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { showErrorToast, showSuccessToast } from '@/lib/toast-helpers';
import { ComplaintFormValues, complaintSchema, DynamicTroubleReason, ServiceLookupResponse } from '@/types/complaint';
import { useForm } from '@inertiajs/react';
import { CheckCircle2, Loader2, Search } from 'lucide-react';
import { useCallback, useState } from 'react';

type CreateComplaintMutation = {
    mutate: (
        data: ComplaintFormValues & { recaptcha_token?: string },
        options?: { onSuccess?: () => void; onError?: (error: Error & { parsed?: { type: string; text: string } }) => void },
    ) => void;
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
    /** Auth token for API calls (optional, for authenticated users) */
    token?: string | null;
    /** Whether to require reCAPTCHA (default: true for guest, false if token provided) */
    requireRecaptcha?: boolean;
};

const Required = () => <span className="ml-1 text-red-500">*</span>;

// Fallback static reasons if API lookup fails
const FALLBACK_REASONS: DynamicTroubleReason[] = [
    { id: 1, reason_path: 'no_internet', reason: 'No internet connectivity', label: 'No internet connectivity', value: 'no_internet' },
    { id: 2, reason_path: 'slow_internet', reason: 'Slow internet', label: 'Slow internet', value: 'slow_internet' },
    { id: 3, reason_path: 'no_signal', reason: 'No signal', label: 'No signal', value: 'no_signal' },
    { id: 4, reason_path: 'billing_issue', reason: 'Billing issue', label: 'Billing issue', value: 'billing_issue' },
    { id: 5, reason_path: 'other', reason: 'Other', label: 'Other', value: 'other' },
];

export function ComplaintForm({
    createMutation,
    defaultValues = {},
    onSuccess,
    onCancel,
    compact = false,
    token,
    requireRecaptcha,
}: ComplaintFormProps) {
    // Service lookup state
    const [isSearching, setIsSearching] = useState(false);
    const [lookupDone, setLookupDone] = useState(false);
    const [networkInfo, setNetworkInfo] = useState<{ type: number; name: string } | null>(null);
    const [troubleReasons, setTroubleReasons] = useState<DynamicTroubleReason[]>(FALLBACK_REASONS);

    // reCAPTCHA state - only required for guest users (no token)
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
    const showRecaptcha = requireRecaptcha ?? (!token && isRecaptchaEnabled());

    const initialValues: Partial<ComplaintFormValues> & Pick<ComplaintFormValues, 'access_number' | 'contact_person' | 'mobile_no'> = {
        access_number: defaultValues.access_number ?? '',
        contact_person: defaultValues.contact_person ?? '',
        mobile_no: defaultValues.mobile_no ?? '',
        trouble_reason: defaultValues.trouble_reason,
        trouble_reason_label: defaultValues.trouble_reason_label ?? '',
        tt_description: defaultValues.tt_description ?? '',
    };
    const { data, setData, errors, setError, clearErrors, reset } = useForm<ComplaintFormValues>(initialValues as ComplaintFormValues);

    // Handle reCAPTCHA verification callback
    const handleRecaptchaVerify = useCallback((token: string | null) => {
        setRecaptchaToken(token);
        if (token) {
            setRecaptchaError(null);
        }
    }, []);

    // Lookup service number to get customer info and dynamic trouble reasons
    const handleServiceLookup = async () => {
        const serviceNumber = data.access_number?.trim();

        if (!serviceNumber || serviceNumber.length < 6) {
            setError('access_number', 'Please enter a valid service number (at least 6 characters)');
            return;
        }

        setIsSearching(true);
        clearErrors('access_number');

        try {
            const response = await apiClient.post<ServiceLookupResponse>(
                '/tt/lookup-service',
                { service_number: serviceNumber },
                {
                    token: token ?? undefined,
                    skipAuthRedirect: true, // Public endpoint - don't redirect on auth errors
                },
            );

            if (response.success && response.data) {
                // Update network info
                setNetworkInfo(response.data.network);

                // Update trouble reasons from API
                if (response.data.trouble_reasons && response.data.trouble_reasons.length > 0) {
                    setTroubleReasons(response.data.trouble_reasons);
                }

                setLookupDone(true);

                // Reset trouble reason selection since options changed
                setData({
                    ...data,
                    trouble_reason: '',
                    trouble_reason_label: '',
                });

                showSuccessToast(`Service verified (${response.data.network.name})`);
            } else {
                // API returned success: false
                const errorMessage = response.message || 'Service number not found. Please verify and try again.';
                showErrorToast(errorMessage);
                setError('access_number', errorMessage);
                setLookupDone(false);
            }
        } catch (error: any) {
            // Handle API errors gracefully - don't redirect, just show error message
            let errorMessage = 'Failed to lookup service number. Please try again.';

            // Extract message from different error formats
            if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            // For 404 errors, show a user-friendly message
            if (error?.status === 404) {
                errorMessage = 'Service number not found. Please verify the number and try again.';
            }

            // For network/timeout errors
            if (error?.status === 408 || error?.name === 'AbortError') {
                errorMessage = 'Request timed out. Please check your connection and try again.';
            }

            showErrorToast(errorMessage);
            setError('access_number', errorMessage);
            setLookupDone(false);
        } finally {
            setIsSearching(false);
        }
    };

    // Reset lookup when service number changes
    const handleServiceNumberChange = (value: string) => {
        if (lookupDone) {
            setLookupDone(false);
            setNetworkInfo(null);
            setTroubleReasons(FALLBACK_REASONS);
            setData({
                ...data,
                access_number: value,
                trouble_reason: '',
                trouble_reason_label: '',
            });
        } else {
            setData('access_number', value);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setRecaptchaError(null);

        const validation = complaintSchema.safeParse(data);

        if (!validation.success) {
            validation.error.errors.forEach((err) => {
                const field = err.path[0] as keyof ComplaintFormValues;
                setError(field, err.message);
            });
            return;
        }

        // Validate reCAPTCHA for guest users
        if (showRecaptcha && !recaptchaToken) {
            setRecaptchaError('Please complete the security verification');
            showErrorToast('Please complete the reCAPTCHA verification');
            return;
        }

        // Prepare submission data with optional reCAPTCHA token
        const submissionData = showRecaptcha ? { ...validation.data, recaptcha_token: recaptchaToken! } : validation.data;

        createMutation.mutate(submissionData, {
            onSuccess: () => {
                reset();
                setRecaptchaToken(null);
                onSuccess?.();
            },
            onError: (error: Error & { parsed?: { type: string; text: string } }) => {
                if (error.parsed?.type === 'field') {
                    setError('mobile_no', error.parsed.text);
                    showErrorToast('Please correct the highlighted field.');
                } else if (error.parsed?.type === 'business') {
                    showErrorToast(error.parsed.text);
                } else if (error.parsed?.type === 'recaptcha') {
                    setRecaptchaError(error.parsed.text);
                    showErrorToast(error.parsed.text);
                } else {
                    showErrorToast(error.message || 'Network error. Please try again.');
                }
            },
        });
    };

    // Description is required only when "Other" is selected
    const isDescriptionRequired = data.trouble_reason_label === 'Other';

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`grid grid-cols-1 gap-4 ${compact ? '' : 'lg:grid-cols-2'}`}>
                {/* Service Number with Search Button Inside */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">
                        Service Number <Required />
                    </label>
                    <div className="relative">
                        <Input value={data.access_number} onChange={(e) => handleServiceNumberChange(e.target.value)} className="pr-12" />
                        <button
                            type="button"
                            onClick={handleServiceLookup}
                            disabled={isSearching || !data.access_number?.trim()}
                            title="Search service number"
                            className={`absolute top-1/2 right-1 flex h-8 w-10 -translate-y-1/2 items-center justify-center rounded-md transition-colors ${
                                lookupDone
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500'
                            }`}
                        >
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : lookupDone ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    {errors.access_number && <p className="text-sm text-red-600">{errors.access_number}</p>}

                    {/* Network info display after successful lookup */}
                    {lookupDone && networkInfo && (
                        <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <p className="font-medium">Service verified</p>
                            <p className="text-xs text-green-600 dark:text-green-500">Network: {networkInfo.name}</p>
                        </div>
                    )}
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

                {/* Dynamic Trouble Reason Dropdown */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">
                        Trouble Reason <Required />
                        {networkInfo && <span className="ml-2 text-xs font-normal text-muted-foreground">({networkInfo.name})</span>}
                    </label>
                    <Select
                        value={data.trouble_reason || ''}
                        onValueChange={(value) => {
                            // Find the selected reason to get its label
                            const selectedReason = troubleReasons.find((r) => r.value === value);
                            // Set both trouble_reason and trouble_reason_label together
                            setData({
                                ...data,
                                trouble_reason: value,
                                trouble_reason_label: selectedReason?.reason ?? value,
                            });
                        }}
                        disabled={!lookupDone && troubleReasons === FALLBACK_REASONS}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select trouble reason" />
                        </SelectTrigger>
                        <SelectContent>
                            {troubleReasons.map((reason) => (
                                <SelectItem key={reason.id || reason.value} value={reason.value}>
                                    {reason.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.trouble_reason && <p className="text-sm text-red-600">{errors.trouble_reason}</p>}
                    {!lookupDone && (
                        <p className="text-xs text-muted-foreground">Please search the service number to load available trouble reasons</p>
                    )}
                </div>

                <div className={`space-y-1 ${compact ? '' : 'lg:col-span-2'}`}>
                    <label className="text-sm font-medium">Description {isDescriptionRequired && <Required />}</label>
                    <Textarea rows={compact ? 3 : 5} value={data.tt_description || ''} onChange={(e) => setData('tt_description', e.target.value)} />
                    {errors.tt_description && <p className="text-sm text-red-600">{errors.tt_description}</p>}
                </div>

                {/* reCAPTCHA - only shown for guest users */}
                {showRecaptcha && (
                    <div className={`space-y-1 ${compact ? '' : 'lg:col-span-2'}`}>
                        <label className="text-sm font-medium">
                            Security Verification <Required />
                        </label>
                        <Recaptcha onVerify={handleRecaptchaVerify} size={compact ? 'normal' : 'normal'} error={recaptchaError || undefined} />
                    </div>
                )}
            </div>

            <div className="flex flex-row justify-between gap-3 pt-4 sm:justify-end">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={createMutation.isPending || !lookupDone || (showRecaptcha && !recaptchaToken)}
                    className="w-full sm:w-auto"
                >
                    {createMutation.isPending ? 'Submitting...' : 'Submit'}
                </Button>
            </div>
        </form>
    );
}
