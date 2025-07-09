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

// Address dropdown data
export const regionOptions = [
    { label: 'Addis Ababa', value: 'addis_ababa' },
    { label: 'Oromia', value: 'oromia' },
];

export const zoneOptionsMap: Record<string, { label: string; value: string }[]> = {
    addis_ababa: [
        { label: 'Bole', value: 'bole' },
        { label: 'Lideta', value: 'lideta' },
        { label: 'Yeka', value: 'yeka' },
        { label: 'Addis Ketema', value: 'addis_ketema' },
    ],
    oromia: [
        { label: 'East Shewa', value: 'east_shewa' },
        { label: 'West Shewa', value: 'west_shewa' },
        { label: 'Arsi', value: 'arsi' },
        { label: 'Jimma', value: 'jimma' },
    ],
};

export const woredaOptionsMap: Record<string, { label: string; value: string }[]> = {
    bole: [
        { label: 'Woreda 01', value: 'woreda_01' },
        { label: 'Woreda 02', value: 'woreda_02' },
    ],
    lideta: [
        { label: 'Woreda 03', value: 'woreda_03' },
        { label: 'Woreda 04', value: 'woreda_04' },
    ],
    yeka: [
        { label: 'Woreda 05', value: 'woreda_05' },
        { label: 'Woreda 06', value: 'woreda_06' },
    ],
    addis_ketema: [
        { label: 'Woreda 07', value: 'woreda_07' },
        { label: 'Woreda 08', value: 'woreda_08' },
    ],
    east_shewa: [
        { label: 'Woreda 09', value: 'woreda_09' },
        { label: 'Woreda 10', value: 'woreda_10' },
    ],
    west_shewa: [
        { label: 'Woreda 11', value: 'woreda_11' },
        { label: 'Woreda 12', value: 'woreda_12' },
    ],
    arsi: [
        { label: 'Woreda 13', value: 'woreda_13' },
        { label: 'Woreda 14', value: 'woreda_14' },
    ],
    jimma: [
        { label: 'Woreda 15', value: 'woreda_15' },
        { label: 'Woreda 16', value: 'woreda_16' },
    ],
};

// ID Types
export const IdTypes = {
    PASSPORT: 'passport',
    NATIONAL_ID: 'national_id',
    DRIVING_LICENSE: 'driving_license',
    STUDENT_ID: 'student_id',
    TIN_NO: 'tin_no',
    OTHER: 'other',
    HOUSE_NUMBER: 'house_number',
    CORPORATE_LETTER: 'corporate_letter',
    KEBELE_ID: 'kebele_id',
} as const;

// Payment Types
export const PaymentTypes = {
    PREPAID: 'prepaid',
    POSTPAID: 'postpaid',
} as const;

// Gender Options
export const GenderOptions = {
    MALE: 'male',
    FEMALE: 'female',
} as const;

// Title Options
export const TitleOptions = {
    MR: 'mr',
    MRS: 'mrs',
    MS: 'ms',
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

// Contact Types
export const ContactTypes = {
    FATHER: 'father',
    MOTHER: 'mother',
    SPOUSE: 'spouse',
    SECOND_CONTACT: 'second_contact',
    ONESELF: 'oneself',
    OTHER: 'other',
} as const;

// Bill Medium Codes
export const BillMediumCodes = {
    SMS: 'sms',
    EMAIL: 'email',
    STANDARD_PRINT: 'standard_print',
} as const;

// Industry Types
export const IndustryTypes = {
    AGRICULTURE: 'agriculture',
    EDUCATION: 'education',
    FINANCIAL_SERVICES: 'financial_services',
    HEALTH: 'health',
    BEAUTY: 'beauty',
    HOSPITALITY: 'hospitality',
    FOOD: 'food',
    LOGISTICS: 'logistics',
    PROPERTY: 'property',
    SERVICES: 'services',
    TELECOMMUNICATIONS: 'telecommunications',
    MANUFACTURING: 'manufacturing',
    WHOLESALE_RETAIL: 'wholesale_retail',
    WHOLESALE_RETAIL_FTSARA: 'wholesale_retail_ftsara',
    HOTELS: 'hotels',
    FINANCIAL_SERVICES_KL_BAR: 'financial_services_kl_bar',
    MRCA: 'mrca',
    GOVERNMENT: 'government',
    VEHICLE_TRACKING: 'vehicle_tracking',
} as const;

// Account Statuses
export const AccountStatuses = {
    IDLE: 'idle',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

// Occupation Types
export const OccupationTypes = {
    MANAGEMENT: 'management',
    BUSINESS_FINANCE: 'business_finance',
    COMPUTER_MATH: 'computer_math',
    ARCHITECTURE_ENGINEERING: 'architecture_engineering',
    SCIENCE: 'science',
    COMMUNITY_SOCIAL: 'community_social',
    LEGAL: 'legal',
    EDUCATION: 'education',
    ARTS: 'arts',
    HEALTHCARE_PRACTITIONER: 'healthcare_practitioner',
    HEALTHCARE_SUPPORT: 'healthcare_support',
    PROTECTIVE_SERVICE: 'protective_service',
    FOOD_SERVICE: 'food_service',
    CLEANING_MAINTENANCE: 'cleaning_maintenance',
    PERSONAL_CARE: 'personal_care',
    SALES: 'sales',
    ADMINISTRATIVE_SUPPORT: 'administrative_support',
    FARMING: 'farming',
    CONSTRUCTION: 'construction',
    MAINTENANCE_REPAIR: 'maintenance_repair',
    PRODUCTION: 'production',
    TRANSPORTATION: 'transportation',
    MILITARY: 'military',
    OTHER: 'other',
} as const;

// Religion Types
export const ReligionTypes = {
    CHRISTIANITY: 'christianity',
    ISLAM: 'islam',
    OTHER: 'other',
    CATHOLICS: 'catholics',
    ORTHODOX: 'orthodox',
    PROTESTANT: 'protestant',
} as const;

// Income Levels
export const IncomeLevels = {
    'Birr 0-999': 'birr 0-999', // Birr 0-999
    'Birr 1,000-1,999': 'birr 1,000-1,999', // Birr 1,000-1,999
    'Birr 2,000-3,499': 'birr 2,000-3,499', // Birr 2,000-3,499
    'Birr 3,500-4,999': 'birr 3,500-4,999', // Birr 3,500-4,999
    'Birr 5,000-7,999': 'birr 5,000-7,999', // Birr 5,000-7,999
    'Birr 8,000-15,000': 'birr 8,000-15,000', // Birr 8,000-15,000
    'Above Birr 15,000': 'birr 15,000+', // Above Birr 15,000
} as const;

// Education Levels
export const EducationLevels = {
    ILLITERATE: 'illiterate',
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    DIPLOMA: 'diploma',
    BACHELOR: 'bachelor',
    MASTER: 'master',
    GENERAL: 'general',
} as const;

// Customer Types
export const CustomerTypes = {
    INDIVIDUAL: 'individual',
    ENTERPRISE: 'enterprise',
} as const;

// Customer Levels
export const CustomerLevels = {
    VCC: 'vcc',
    VIC: 'vic',
    PLATINUM: 'platinum',
    GOLD: 'gold',
    SILVER: 'silver',
    BRONZE: 'bronze',
    COPPER: 'copper',
} as const;

// Zod Schema for Customer
export const customerSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(255),
    middle_name: z.string().max(255).optional(),
    last_name: z.string().min(1, 'Last name is required').max(255),
    title: z.enum([TitleOptions.MR, TitleOptions.MRS, TitleOptions.MS]).optional(),
    gender: z.enum([GenderOptions.MALE, GenderOptions.FEMALE]).optional(),
    nationality: z.string().max(100).optional(),
    identification_type: z.nativeEnum(IdTypes).optional(),
    identification_number: z.string().max(100).optional(),
    date_of_birth: z
        .string()
        // .regex(/^\d{8}$/, 'Date must be in YYYYMMDD format')
        .optional(),
    place_of_birth: z.string().max(255).optional(),
    occupation: z.nativeEnum(OccupationTypes).optional(),
    education: z.nativeEnum(EducationLevels).optional(),
    religion: z.nativeEnum(ReligionTypes).optional(),
    income: z.nativeEnum(IncomeLevels).optional(),
    primary_language: z.string().max(100).optional(),
    address: z
        .object({
            [AddressTypes.REGION]: z.string().max(128),
            [AddressTypes.ZONE]: z.string().max(128),
            [AddressTypes.WOREDA]: z.string().max(128),
            [AddressTypes.CITY]: z.string().max(128),
            [AddressTypes.STREET_NAME]: z.string().max(128).optional(),
            [AddressTypes.KEBELE]: z.string().max(128),
            [AddressTypes.HOUSE_NO]: z.string().max(128),
        })
        .partial(),
    contact: z
        .object({
            phone: z.string().max(20).optional(),
            email: z.string().email().max(255).optional(),
            secondary_phone: z.string().max(20).optional(),
        })
        .optional(),
    contact_persons: z
        .array(
            z.object({
                type: z.nativeEnum(ContactTypes),
                name: z.string().max(255),
                phone: z.string().max(20),
                relationship: z.string().max(100).optional(),
            }),
        )
        .optional(),
    // customer_type: z.nativeEnum(CustomerTypes),
    // customer_level: z.nativeEnum(CustomerLevels).optional(),
    // payment_type: z.nativeEnum(PaymentTypes).default(PaymentTypes.PREPAID),
    // account_status: z.nativeEnum(AccountStatuses).optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

// Types for Customer
export interface Customer {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    title?: keyof typeof TitleOptions;
    gender?: keyof typeof GenderOptions;
    nationality?: string;
    identification_type?: keyof typeof IdTypes;
    identification_number?: string;
    date_of_birth?: string;
    place_of_birth?: string;
    occupation?: keyof typeof OccupationTypes;
    education?: keyof typeof EducationLevels;
    religion?: keyof typeof ReligionTypes;
    income?: keyof typeof IncomeLevels;
    primary_language?: string;
    address?: {
        [key in keyof typeof AddressTypes]?: string;
    };
    contact?: {
        phone?: string;
        email?: string;
        secondary_phone?: string;
    };
    contact_persons?: Array<{
        type: keyof typeof ContactTypes;
        name: string;
        phone: string;
        relationship?: string;
    }>;
    // customer_type: keyof typeof CustomerTypes;
    // customer_level?: keyof typeof CustomerLevels;
    // payment_type?: keyof typeof PaymentTypes;
    // account_status?: keyof typeof AccountStatuses;
}
