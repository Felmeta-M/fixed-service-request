// import { z } from 'zod';

// // Address enums
// export const AddressTypes = {
//     REGION: 'region',
//     ZONE: 'zone',
//     WOREDA: 'woreda',
//     CITY: 'city',
//     STREET_NAME: 'street_name',
//     KEBELE: 'kebele',
//     HOUSE_NO: 'house_no',
// } as const;

// // Payment Types
// export const PaymentTypes = {
//     PREPAID: 'prepaid',
//     POSTPAID: 'postpaid',
// } as const;

// // Subscriber Types
// export const SubscriberTypes = {
//     PREPAID: 'prepaid',
//     POSTPAID: 'postpaid',
//     HYBRID: 'hybrid',
// } as const;

// // Priority Levels
// export const PriorityLevels = {
//     HIGH: 'high',
//     MIDDLE: 'middle',
//     LOW: 'low',
// } as const;

// // Bill Medium Codes
// export const BillMediumCodes = {
//     SMS: 'sms',
//     EMAIL: 'email',
//     STANDARD_PRINT: 'standard_print',
// } as const;

// // Account Statuses
// export const AccountStatuses = {
//     IDLE: 'idle',
//     ACTIVE: 'active',
//     INACTIVE: 'inactive',
// } as const;
// export interface Customer {
//     id: number;
//     first_name: string;
//     middle_name?: string;
//     last_name: string;
//     title?: string;
//     gender?: string;
//     nationality?: string;
//     identification_type?: string;
//     identification_number?: string;
//     date_of_birth: string;
//     place_of_birth: string;
//     occupation: string;
//     education: string;
//     religion: string;
//     income: string;
//     primary_language?: string;
//     address?: Array<{
//         region: string;
//         zone?: string;
//         woreda?: string;
//         city?: string;
//         street_name?: string;
//         kebele?: string;
//         house_no?: string;
//     }>;
//     contact?: Array<{
//         mobile_no?: number;
//         email?: string;
//         office_no?: string;
//         home_no?: string;
//         fax_no?: string;
//         notification_mode?: string;
//     }>;
//     contact_person?: Array<{
//         title?: string;
//         first_name?: string;
//         middle_name?: string;
//         last_name?: string;
//         mobile_no?: number;
//         office_no?: string;
//         home_no?: string;
//         fax_no?: string;
//     }>;
//     customer_type?: string;
//     customer_category?: string;
//     customer_subcategory?: string;
//     customer_level?: string;
// }

// export type Option = { label: string; value: string };

// // Zod Schema for Customer
// export const customerSchema = z.object({
//     first_name: z.string().min(1, 'First name is required').max(255),
//     middle_name: z.string().min(1, 'Middle name is required').max(255),
//     last_name: z.string().min(1, 'Last name is required').max(255),
//     title: z.string().min(1, 'Title is required'),
//     gender: z.string().min(1, 'Gender is required'),
//     nationality: z.string().min(1, 'Nationality is required'),
//     identification_type: z.string().min(1, 'Identification type is required'),
//     identification_number: z.string().min(5, 'Identification number is required'),
//     date_of_birth: z
//         .string()
//         // .regex(/^\d{8}$/, 'Date must be in YYYYMMDD format')
//         .min(1, 'Date of birth is required'),
//     place_of_birth: z.string().optional().nullable(),
//     occupation: z.string().min(1, 'Occupation is required'),
//     education: z.string().min(1, 'Education is required'),
//     religion: z.string().min(1, 'Religion is required'),
//     income: z.string().optional().nullable(),
//     primary_language: z.string().min(1, 'Primary language is required').max(255),
//     address: z
//         .object({
//             [AddressTypes.REGION]: z.string().min(1, 'Region is required').max(128),
//             [AddressTypes.ZONE]: z.string().optional(),
//             [AddressTypes.WOREDA]: z.string().optional(),
//             [AddressTypes.CITY]: z.string().optional(),
//             [AddressTypes.STREET_NAME]: z.string().optional(),
//             [AddressTypes.KEBELE]: z.string().optional(),
//             [AddressTypes.HOUSE_NO]: z.string().optional(),
//         })
//         .partial(),
//     contact: z.object({
//         notification_mode: z.string().optional(),
//         mobile_no: z.number().optional(),
//         email: z.string().email().optional(),
//         office_no: z.string().optional(),
//         home_no: z.string().optional(),
//         fax_no: z.string().optional(),
//     }),
//     contact_person: z.array(
//         z.object({
//             title: z.string().min(1, 'Contact person title is required'),
//             first_name: z.string().min(1, 'Contact person first name is required'),
//             middle_name: z.string().min(1, 'Contact person middle name is required'),
//             last_name: z.string().min(1, 'Contact person last name is required'),
//             mobile_no: z.number().min(1, 'Contact person mobile number is required'),
//             office_no: z.string().nullable().optional(),
//             home_no: z.string().nullable().optional(),
//             fax_no: z.string().nullable().optional(),
//         }),
//     ),
//     // .min(1, 'At least one contact person is required'),
//     customer_type: z.string().min(1, 'Customer type is required'),
//     customer_category: z.string().min(1, 'Category is required'),
//     customer_subcategory: z.string().min(1, 'Subcategory is required'),
//     customer_level: z.string().min(1, 'Level is required'),
// });

// export type CustomerFormValues = z.infer<typeof customerSchema>;

// /**
//  * Creates a dynamic customer schema with conditional validations
//  * @param isEmailRequired - Whether email is required (when notification mode is Email)
//  * @param isKebeleRequired - Whether kebele is required (for regions other than Addis Ababa)
//  * @returns A Zod schema with conditional validations applied
//  */
// export function createDynamicCustomerSchema(isEmailRequired: boolean, isKebeleRequired: boolean) {
//     return customerSchema.extend({
//         contact: z.object({
//             notification_mode: z.string().optional(),
//             mobile_no: z.number().optional(),
//             email: isEmailRequired
//                 ? z.string().email('Valid email is required when Email notification mode is selected').min(1, 'Email is required when Email notification mode is selected')
//                 : z.string().email('Invalid email format').optional().or(z.literal('')),
//             office_no: z.string().optional(),
//             home_no: z.string().optional(),
//             fax_no: z.string().optional(),
//         }),
//         address: z
//             .object({
//                 region: z.string().min(1, 'Region is required').max(128),
//                 zone: z.string().optional(),
//                 woreda: z.string().optional(),
//                 city: z.string().optional(),
//                 street_name: z.string().optional(),
//                 kebele: isKebeleRequired
//                     ? z.string().min(1, 'Kebele is required for this region')
//                     : z.string().optional(),
//                 house_no: z.string().optional(),
//             })
//             .partial(),
//     });
// }


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
        mobile_no?: string; // Changed from number to string
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
        mobile_no?: string; // Changed from number to string
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
        .min(1, 'Date of birth is required'),
    place_of_birth: z.string().optional().nullable(),
    occupation: z.string().min(1, 'Occupation is required'),
    education: z.string().min(1, 'Education is required'),
    religion: z.string().min(1, 'Religion is required'),
    income: z.string().optional().nullable(),
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
        mobile_no: z.string().min(1, 'Phone number is required'), // Changed from number to string
        email: z.string().email().optional().or(z.literal('')),
        office_no: z.string().optional(),
        home_no: z.string().optional(),
        fax_no: z.string().optional(),
    }),
    contact_person: z.array(
        z.object({
            title: z.string().optional(),
            first_name: z.string().optional(),
            middle_name: z.string().optional(),
            last_name: z.string().optional(),
            mobile_no: z.string().optional(), // Changed from number to string
            office_no: z.string().nullable().optional(),
            home_no: z.string().nullable().optional(),
            fax_no: z.string().nullable().optional(),
        }),
    ).optional(), // Made optional
    customer_type: z.string().optional().default('1'),
    customer_category: z.string().optional().default('1'),
    customer_subcategory: z.string().optional().default('1'),
    customer_level: z.string().optional().default('8'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

/**
 * Creates a dynamic customer schema with conditional validations
 * @param isEmailRequired - Whether email is required (when notification mode is Email)
 * @param isKebeleRequired - Whether kebele is required (for regions other than Addis Ababa)
 * @returns A Zod schema with conditional validations applied
 */
export function createDynamicCustomerSchema(isEmailRequired: boolean, isKebeleRequired: boolean) {
    return customerSchema.extend({
        contact: z.object({
            notification_mode: z.string().min(1, 'Notification mode is required'),
            mobile_no: z.string().regex(/^(\+251|251|0)?(9)\d{8}$/, 'Please enter a valid phone number'), // 9 digit is allowed if it start from 9
            email: isEmailRequired
                ? z.string().email('Valid email is required when Email notification mode is selected').min(1, 'Email is required when Email notification mode is selected')
                : z.string().email('Invalid email format').optional().or(z.literal('')),
            office_no: z.string().optional(),
            home_no: z.string().optional(),
            fax_no: z.string().optional(),
        }),
        address: z
            .object({
                region: z.string().min(1, 'Region is required').max(128),
                zone: z.string().optional(),
                woreda: z.string().optional(),
                city: z.string().optional(),
                street_name: z.string().optional(),
                kebele: isKebeleRequired
                    ? z.string().min(1, 'Kebele is required for this region')
                    : z.string().optional(),
                house_no: z.string().optional(),
            })
            .partial(),
    });
}