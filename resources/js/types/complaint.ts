import { z } from 'zod';

// Static fallback trouble reasons (used before service lookup)
export const TroubleReasons = {
    NO_INTERNET: 'no_internet',
    SLOW_INTERNET: 'slow_internet',
    NO_SIGNAL: 'no_signal',
    BILLING_ISSUE: 'billing_issue',
    OTHER: 'other',
} as const;

// Dynamic trouble reason from API
export interface DynamicTroubleReason {
    id: number;
    reason_path: string;
    reason: string;
    label: string;
    value: string;
}

// Service lookup response from API
// Note: No customer names or service numbers exposed for privacy
export interface ServiceLookupResponse {
    success: boolean;
    message: string;
    data?: {
        network: {
            type: number;
            name: string;
        };
        trouble_reasons: DynamicTroubleReason[];
    };
}

export const complaintSchema = z.object({
    access_number: z.string()
        .min(1, 'Service number is required'),

    account_number: z.string().optional().nullable(),

    contact_person: z.string().min(1, 'Contact person is required'),

    mobile_no: z.string()
        .min(1, 'Mobile number is required')
        .regex(/^(\+251|251|0)?9\d{8}$/, 'Invalid mobile number. Must start with +251, 251, 09, or 9'),

    // trouble_reason is now dynamic - accepts any string (reason_path from API)
    trouble_reason: z.string().min(1, 'Trouble reason is required'),

    tt_description: z.string().optional(),
}).superRefine((data, ctx) => {
    // When "Other" is selected, description is required
    if (data.trouble_reason === TroubleReasons.OTHER || data.trouble_reason?.toLowerCase().includes('other')) {
        const desc = (data.tt_description ?? '').trim();
        if (!desc) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Description is required when "Other" is selected', path: ['tt_description'] });
        }
    }
});

export type ComplaintFormValues = z.infer<typeof complaintSchema>;
