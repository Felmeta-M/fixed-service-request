import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ComplaintFormValues, complaintSchema, TroubleReasons, DynamicTroubleReason, ServiceLookupResponse } from '@/types/complaint';
import { useForm } from '@inertiajs/react';
import { showErrorToast, showSuccessToast } from '@/lib/toast-helpers';
import { apiClient } from '@/lib/api-client';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';

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
    /** Auth token for API calls (optional, for authenticated users) */
    token?: string | null;
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
}: ComplaintFormProps) {
    // Service lookup state
    const [isSearching, setIsSearching] = useState(false);
    const [lookupDone, setLookupDone] = useState(false);
    const [networkInfo, setNetworkInfo] = useState<{ type: number; name: string } | null>(null);
    const [troubleReasons, setTroubleReasons] = useState<DynamicTroubleReason[]>(FALLBACK_REASONS);

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
                }
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
                setData('trouble_reason', '');
                
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
        setData('access_number', value);
        if (lookupDone) {
            setLookupDone(false);
            setNetworkInfo(null);
            setTroubleReasons(FALLBACK_REASONS);
            setData('trouble_reason', '');
        }
    };

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

    // Check if description is required (when "Other" or similar is selected)
    const isDescriptionRequired = data.trouble_reason === TroubleReasons.OTHER || 
        data.trouble_reason?.toLowerCase().includes('other');

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`grid grid-cols-1 gap-4 ${compact ? '' : 'lg:grid-cols-2'}`}>
                {/* Service Number with Search Button */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">
                        Service Number <Required />
                    </label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter service number"
                            value={data.access_number}
                            onChange={(e) => handleServiceNumberChange(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant={lookupDone ? "outline" : "secondary"}
                            size="icon"
                            onClick={handleServiceLookup}
                            disabled={isSearching || !data.access_number?.trim()}
                            title="Search service number"
                            className={lookupDone ? "border-green-500 text-green-600" : ""}
                        >
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : lookupDone ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    {errors.access_number && <p className="text-sm text-red-600">{errors.access_number}</p>}
                    
                    {/* Network info display after successful lookup */}
                    {lookupDone && networkInfo && (
                        <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <p className="font-medium">Service verified</p>
                            <p className="text-xs text-green-600 dark:text-green-500">
                                Network: {networkInfo.name}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">
                        Mobile Number <Required />
                    </label>
                    <Input
                        placeholder="09XXXXXXXX"
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
                    <Input 
                        placeholder="Enter contact person name"
                        value={data.contact_person} 
                        onChange={(e) => setData('contact_person', e.target.value)} 
                    />
                    {errors.contact_person && <p className="text-sm text-red-600">{errors.contact_person}</p>}
                </div>

                {/* Dynamic Trouble Reason Dropdown */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">
                        Trouble Reason <Required />
                        {networkInfo && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                ({networkInfo.name})
                            </span>
                        )}
                    </label>
                    <Select
                        value={data.trouble_reason || ''}
                        onValueChange={(value) => setData('trouble_reason', value)}
                        disabled={!lookupDone && troubleReasons === FALLBACK_REASONS}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={lookupDone ? "Select trouble reason" : "Search service number first"} />
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
                        <p className="text-xs text-muted-foreground">
                            Please search the service number to load available trouble reasons
                        </p>
                    )}
                </div>

                <div className={`space-y-1 ${compact ? '' : 'lg:col-span-2'}`}>
                    <label className="text-sm font-medium">
                        Description {isDescriptionRequired && <Required />}
                    </label>
                    <Textarea
                        placeholder="Describe your issue in detail..."
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
                <Button type="submit" disabled={createMutation.isPending || !lookupDone}>
                    {createMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
                </Button>
            </div>
        </form>
    );
}
