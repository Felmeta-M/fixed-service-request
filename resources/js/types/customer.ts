import { z } from 'zod';

// Address enums
export const AddressTypes = {
    REGION: 'region',
    ZONE: 'zone',
    WOREDA: 'woreda',
    CITY: 'city',
    STREET_NAME: 'street_name',
    KEBELE: 'kebele',
    HOUSE_NO: 'house_no',
} as const;

// Payment Types
export const PaymentTypes = {
    PREPAID: 'prepaid',
    POSTPAID: 'postpaid',
} as const;

// Subscriber Types
export const SubscriberTypes = {
    PREPAID: 'prepaid',
    POSTPAID: 'postpaid',
    HYBRID: 'hybrid',
} as const;

// Priority Levels
export const PriorityLevels = {
    HIGH: 'high',
    MIDDLE: 'middle',
    LOW: 'low',
} as const;

// Bill Medium Codes
export const BillMediumCodes = {
    SMS: 'sms',
    EMAIL: 'email',
    STANDARD_PRINT: 'standard_print',
} as const;

// Account Statuses
export const AccountStatuses = {
    IDLE: 'idle',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;
export interface Customer {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    title?: string;
    gender?: string;
    nationality?: string;
    identification_type?: string;
    identification_number?: string;
    date_of_birth: string;
    place_of_birth: string;
    occupation: string;
    education: string;
    religion: string;
    income: string;
    primary_language?: string;
    address?: Array<{
        region: string;
        zone?: string;
        woreda?: string;
        city?: string;
        street_name?: string;
        kebele?: string;
        house_no?: string;
    }>;
    contact?: Array<{
        mobile_no?: string;
        email?: string;
        office_no?: string;
        home_no?: string;
        fax_no?: string;
        notification_mode?: string;
    }>;
    contact_person?: Array<{
        title?: string;
        first_name?: string;
        middle_name?: string;
        last_name?: string;
        mobile_no?: string;
        office_no?: string;
        home_no?: string;
        fax_no?: string;
    }>;
    customer_type?: string;
    customer_category?: string;
    customer_subcategory?: string;
    customer_level?: string;
}

export type Option = { label: string; value: string };

// Zod Schema for Customer
export const customerSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(255),
    middle_name: z.string().min(1, 'Middle name is required').max(255),
    last_name: z.string().min(1, 'Last name is required').max(255),
    title: z.string().min(1, 'Title is required'),
    gender: z.string().min(1, 'Gender is required'),
    nationality: z.string().min(1, 'Nationality is required'),
    identification_type: z.string().min(1, 'Identification type is required'),
    identification_number: z.string().min(5, 'Identification number is required'),
    date_of_birth: z
        .string()
        // .regex(/^\d{8}$/, 'Date must be in YYYYMMDD format')
        .min(1, 'Date of birth is required'),
    place_of_birth: z.string().min(1, 'Place of birth is required').max(255),
    occupation: z.string().min(1, 'Occupation is required'),
    education: z.string().min(1, 'Education is required'),
    religion: z.string().min(1, 'Religion is required'),
    income: z.string().min(1, 'Income is required'),
    primary_language: z.string().min(1, 'Primary language is required').max(255),
    address: z
        .object({
            [AddressTypes.REGION]: z.string().min(1, 'Region is required').max(128),
            [AddressTypes.ZONE]: z.string().optional(),
            [AddressTypes.WOREDA]: z.string().optional(),
            [AddressTypes.CITY]: z.string().optional(),
            [AddressTypes.STREET_NAME]: z.string().optional(),
            [AddressTypes.KEBELE]: z.string().optional(),
            [AddressTypes.HOUSE_NO]: z.string().optional(),
        })
        .partial(),
    contact: z.object({
        notification_mode: z.string().optional(),
        mobile_no: z.string().optional(),
        email: z.string().email().optional(),
        office_no: z.string().optional(),
        home_no: z.string().optional(),
        fax_no: z.string().optional(),
    }),
    contact_person: z.array(
        z.object({
            first_name: z.string().optional(),
            middle_name: z.string().optional(),
            last_name: z.string().optional(),
            title: z.string().optional(),
            home_no: z.string().optional(),
            office_no: z.string().optional(),
            mobile_no: z.string().optional(),
            fax_no: z.string().optional(),
        }),
    ),
    customer_type: z.string().min(1, 'Customer type is required'),
    customer_category: z.string().min(1, 'Category is required'),
    customer_subcategory: z.string().min(1, 'Subcategory is required'),
    customer_level: z.string().min(1, 'Level is required'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
