import { z } from 'zod';

export interface Resource {
    id: number;
    prod_spec_code: string;
    number_line: number;
    event_code: string;
    cust_id: string;
    cust_name: string;
    longitude: number | null;
    latitude: number | null;
    staff_code: string;
    staff_name: string;
    combo_flag?: boolean;
    // timestamp: string;
    cust_addr: string;
}

// Zod schema for resource form
export const resourceSchema = z.object({
    prod_spec_code: z.string(),
    number_line: z.number().nullable(),
    event_code: z.string(),
    cust_id: z.string().nonempty(),
    cust_name: z.string().nonempty(),
    longitude: z.number().nullable(),
    latitude: z.number().nullable(),
    staff_code: z.string().nonempty(),
    staff_name: z.string().nonempty(),
    combo_flag: z.boolean().optional(),
    // timestamp: z.string().nonempty(),
    cust_addr: z.string().nonempty(),
});

export type ResourceFormValues = z.infer<typeof resourceSchema>;
