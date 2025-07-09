import { z } from 'zod';
import { Customer } from './customer';

export const SurveyType = {
    NEW: 'new',
    CHANGE: 'change',
};

// Zod schema for survey request
export const surveyRequestSchema = z.object({
    customer_id: z.number().int().optional(),
    customer_code: z.string().max(50),
    survey_request_number: z.string().max(50).optional(),
    survey_type: z.enum([SurveyType.NEW, SurveyType.CHANGE]),
    telecom_region: z.string().max(100),
    operation_type: z.string().max(100),
    main_offer_id: z.string().max(100),
    bandwidth: z.string().max(100),
    contact_person: z.string().max(100),
    contact_no: z.string().max(20),
    contact_email: z.string().email().max(100),
    sec_contact_person: z.string().max(100),
    sec_contact_no: z.string().max(20),
    sec_contact_email: z.string().email().max(100),
    status: z.string().max(50).optional(),
    completed_date: z.string(),
});
export type SurveyRequestFormValues = z.infer<typeof surveyRequestSchema>;

export type SurveyRequest = {
    id: number;
    customer_id: number;
    customer_code: string;
    survey_request_number: string;
    survey_type: keyof typeof SurveyType;
    telecom_region: string;
    operation_type: string;
    main_offer_id: string;
    bandwidth: string;
    contact_person: string;
    contact_no: string;
    contact_email: string;
    sec_contact_person: string;
    sec_contact_no: string;
    sec_contact_email: string;
    status: string;
    completed_date: string | null;
    created_at: string;
    updated_at: string;
    customer?: Customer;
};
