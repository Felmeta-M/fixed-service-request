import { z } from 'zod';

export interface Subscriber {
    id: number;
    transaction_id: string;
    process_time: string;
    customer_survey_order_id: string;
    customer_code: string;
    payment_type: string;
    bill_cycle: string;
    ethio_zone_or_region: string;
    collection_center: string;
    account_language: string;
    first_name: string;
    middle_or_father_name: string;
    last_name: string;
    enterprise_customer_name: string;
    credit_class: string;
    administrative_region_city: string;
    subcity_zone: string;
    wereda_town: string;
    kebele: string;
    house_no: string;
    sms_no: string;
    payment_mode: string;
    account_ext_params?: unknown[];
    external_sequence?: string;
    network_type?: string;
    sub_type?: string;
    sub_language?: string;
    offering_id?: string;
    effective_mode?: string;
    sla_priority?: string;
    call_center_access?: string;
    external_operid?: string;
    installment_completed_date?: string;
    installment_amount?: string;
    payment_frequency?: string;
    next_payment_date?: string;
    additional_info?: string;
    created_at: string;
    updated_at: string;
}

// Zod schema for subscriber form
export const subscriberSchema = z.object({
    customer_survey_order_id: z.string().min(1, 'Survey request is required'),
    customer_code: z.string().min(1, 'Customer code is required'),
    payment_type: z.string().min(1, 'Payment type is required'),
    bill_cycle: z.string().nonempty(),
    ethio_zone_or_region: z.string().nonempty(),
    collection_center: z.string().nonempty(),
    account_language: z.string().nonempty(),
    first_name: z.string().nonempty(),
    middle_or_father_name: z.string().nonempty(),
    last_name: z.string().nonempty(),
    enterprise_customer_name: z.string().nonempty(),
    credit_class: z.string().nonempty(),
    administrative_region_city: z.string().nonempty(),
    subcity_zone: z.string().nonempty(),
    wereda_town: z.string().nonempty(),
    kebele: z.string().nonempty(),
    house_no: z.string().nonempty(),
    sms_no: z.string().nonempty(),
    payment_mode: z.string().nonempty(),
    account_ext_params: z.array(z.any()).optional(),
    external_sequence: z.string().optional(),
    network_type: z.string().optional(),
    sub_type: z.string().optional(),
    sub_language: z.string().optional(),
    offering_id: z.string().optional(),
    effective_mode: z.string().optional(),
    sla_priority: z.string().optional(),
    call_center_access: z.string().optional(),
    external_operid: z.string().optional(),
    installment_completed_date: z.string().optional(),
    // installment_completed_date: z
    //     .string()
    //     .optional()
    //     .transform((val) => {
    //         if (!val) return undefined;
    //         const dt = new Date(val);
    //         return dt.toISOString();
    //     }),
    installment_amount: z.string().optional(),
    payment_frequency: z.string().optional(),
    next_payment_date: z.string().optional(),
    additional_info: z.string().optional(),
    // account_ext_params: z
    //     .record(z.unknown())
    //     .optional()
    //     .transform((val) => (val ? [val] : [])),
});

export type SubscriberFormValues = z.infer<typeof subscriberSchema>;
