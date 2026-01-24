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

/**
 * Cable Type from BSS survey response (param 50056)
 * Used for device selection - determines compatible devices based on cable infrastructure.
 */
export const CableType = {
    COPPER: 0,
    FIBER: 1,
    EPON: 2,
    GPON: 3,
    WITHOUT_SURVEY: 5,
} as const;

export const CableTypeLabels: Record<number, string> = {
    [CableType.COPPER]: 'Copper',
    [CableType.FIBER]: 'Fiber',
    [CableType.EPON]: 'EPON',
    [CableType.GPON]: 'GPON',
    [CableType.WITHOUT_SURVEY]: 'Without Survey',
};

/**
 * Media Type from BSS survey response (param 50005)
 * PON = Fiber (GPON/EPON), COPPER = Copper cable
 * Critical for device selection - determines which devices are compatible.
 */
export const MediaType = {
    PON: 'PON',
    COPPER: 'COPPER',
} as const;

export const MediaTypeLabels: Record<string, string> = {
    [MediaType.PON]: 'Fiber (PON)',
    [MediaType.COPPER]: 'Copper',
};

/**
 * Check if cable type is fiber-based (supports fiber devices)
 */
export const isFiberCableType = (cableType: number | null | undefined): boolean => {
    return cableType === CableType.FIBER || cableType === CableType.EPON || cableType === CableType.GPON;
};

/**
 * Check if media type supports fiber devices
 */
export const isFiberMediaType = (mediaType: string | null | undefined): boolean => {
    return mediaType === MediaType.PON;
};

// Zod schema for survey request
export const surveyRequestSchema = z.object({
    customer_id: z.number().int().optional(),
    customer_code: z.string().max(50),
    customer_survey_order_id: z.string().max(50).optional(),
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
    customer_survey_order_id: string;
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
    // Manual survey result fields (from BSS response)
    cable_type?: number | null; // BSS param 50056: 0=copper, 1=fiber, 2=EPON, 3=GPON, 5=without survey
    media_type?: string | null; // BSS param 50005: PON (fiber) or COPPER, null if failed
    line_indicator?: number | null; // BSS param 50112: 0=same line, 1=separate line
    survey_failure_reason?: string | null; // Reason when survey failed (50005 = -1)
};

export type ServiceType = 'fl' | 'fbb' | 'combo' | 'home' | 'business';

// export interface SurveyRequest {
//     id: number;
//     customer_survey_order_id: string;
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
