import { z } from 'zod';

export const TroubleReasons = {
    NO_INTERNET: 'no_internet',
    SLOW_INTERNET: 'slow_internet',
    NO_SIGNAL: 'no_signal',
    BILLING_ISSUE: 'billing_issue',
} as const;

export const complaintSchema = z.object({
    trouble_title: z.string().min(1, 'Subject is required'),

    access_number: z.string().min(1, 'Access number is required'),

    account_number: z.string().optional().nullable(),

    contact_person: z.string().min(1, 'Contact person is required'),

    mobile_no: z.string().min(9, 'Mobile number is required'),

    // trouble_reason: z.enum([
    //     TroubleReasons.NO_INTERNET,
    //     TroubleReasons.SLOW_INTERNET,
    //     TroubleReasons.NO_SIGNAL,
    //     TroubleReasons.BILLING_ISSUE,
    // ], {
    //     required_error: 'Trouble reason is required',
    // }),
    trouble_reason: z.nativeEnum(TroubleReasons, {
        errorMap: () => ({ message: 'Trouble reason is required' }),
    }),

    tt_description: z.string().min(5, 'Description is required'),

    occurrence_date: z.string().optional().nullable(),
});

export type ComplaintFormValues = z.infer<typeof complaintSchema>;
