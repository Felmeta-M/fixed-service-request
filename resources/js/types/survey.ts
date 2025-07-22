import { z } from 'zod';
import { Customer } from './customer';

export const SurveyType = {
    NEW: 'new',
    CHANGE: 'change',
};

export const ServiceType = {
    FIXED_LINE: 'fl',
    FIXED_BROADBAND: 'fbb',
    COMBO: 'combo',
    HOME: 'home',
    BUSINESS: 'business',
} as const;

// Zod schema for survey request
export const surveyRequestSchema = z.object({
    customer_id: z.number().int().optional(),
    customer_code: z.string().max(50),
    survey_request_number: z.string().max(50).optional(),
    survey_type: z.enum([SurveyType.NEW, SurveyType.CHANGE]),
    service_type: z.enum(Object.values(ServiceType) as [string, ...string[]]),
    telecom_region: z.string().max(100),
    operation_type: z.string().max(100),
    main_offer_id: z.string().max(100),
    bandwidth: z.string().max(100),
    contact_person: z.string().max(100),
    contact_no: z.string().max(20),
    contact_email: z.string().email().max(100),
    sec_contact_person: z.string().max(100).optional(),
    sec_contact_no: z.string().max(20).optional(),
    sec_contact_email: z.string().email().max(100).optional(),
    status: z.string().max(50).optional(),
    completed_date: z.string().optional(),
    services: z.array(z.enum(Object.values(ServiceType) as [string, ...string[]])).optional(),
});
export type SurveyRequestFormValues = z.infer<typeof surveyRequestSchema>;

export type SurveyRequest = {
    id: number;
    customer_id: number;
    customer_code: string;
    survey_request_number: string;
    survey_type: keyof typeof SurveyType;
    service_type: keyof typeof ServiceType;
    telecom_region: string;
    operation_type: string;
    main_offer_id: string;
    bandwidth: string;
    contact_person: string;
    contact_no: string;
    contact_email: string;
    sec_contact_person?: string;
    sec_contact_no?: string;
    sec_contact_email?: string;
    status?: string;
    completed_date?: string | null;
    created_at: string;
    updated_at: string;
    customer?: Customer;
    services: keyof typeof ServiceType;
};

export type ServiceType = 'fl' | 'fbb' | 'combo' | 'home' | 'business';

// export interface SurveyRequest {
//     id: number;
//     survey_request_number: string;
//     customer_id: number;
//     service_type: ServiceType;
//     survey_type: string;
//     telecom_region: string;
//     operation_type: string;
//     main_offer_id: string;
//     bandwidth: string;
//     contact_person: string;
//     contact_no: string;
//     contact_email: string;
//     sec_contact_person: string;
//     sec_contact_no: string;
//     sec_contact_email: string;
//     status: string;
//     completed_date: string;
//     created_at: string;
//     updated_at: string;
// }

// export interface SurveyRequestFormValues {
//     customer_id?: number;
//     customer_code: string;
//     survey_type: string;
//     telecom_region: string;
//     operation_type: string;
//     main_offer_id: string;
//     bandwidth: string;
//     contact_person: string;
//     contact_no: string;
//     contact_email: string;
//     sec_contact_person: string;
//     sec_contact_no: string;
//     sec_contact_email: string;
//     status: string;
//     completed_date: string;
//     service_type: ServiceType;
// }
