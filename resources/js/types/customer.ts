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
    { label: 'Addis Ababa', value: '1' },
    { label: 'Oromia', value: '2' },
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
// export const IdTypes = {
//     PASSPORT: 'passport',
//     NATIONAL_ID: 'national_id',
//     DRIVING_LICENSE: 'driving_license',
//     STUDENT_ID: 'student_id',
//     TIN_NO: 'tin_no',
//     OTHER: 'other',
//     HOUSE_NUMBER: 'house_number',
//     CORPORATE_LETTER: 'corporate_letter',
//     KEBELE_ID: 'kebele_id',
// } as const;

// Payment Types
export const PaymentTypes = {
    PREPAID: 'prepaid',
    POSTPAID: 'postpaid',
} as const;

// Gender Options
// export const GenderOptions = {
//     MALE: 'male',
//     FEMALE: 'female',
// } as const;

// Title Options
// export const TitleOptions = {
//     MR: 'mr.',
//     MRS: 'mrs.',
//     MS: 'ms.',
//     ENGINEER: 'engineer',
//     PROFESSOR: 'professor',
//     DOCTOR: 'doctor',
// } as const;

// Mapping between frontend values and backend IDs
// export const TitleMapping = {
//     [TitleOptions.MR]: '1',
//     [TitleOptions.MRS]: '2',
//     [TitleOptions.MS]: '3',
//     [TitleOptions.ENGINEER]: '6',
//     [TitleOptions.PROFESSOR]: '5',
//     [TitleOptions.DOCTOR]: '4',
// } as const;

// // Reverse mapping for display purposes
// export const ReverseTitleMapping = {
//     '1': TitleOptions.MR,
//     '2': TitleOptions.MRS,
//     '3': TitleOptions.MS,
//     '6': TitleOptions.ENGINEER,
//     '5': TitleOptions.PROFESSOR,
//     '4': TitleOptions.DOCTOR,
// } as const;

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

// export const NotificationModes = {
//     SMS: 'sms',
//     EMAIL: 'email',
//     IVR: 'ivr',
// } as const;

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

// Religion Types
// export const ReligionTypes = {
//     CHRISTIANITY: 'christianity',
//     ISLAM: 'islam',
//     CATHOLICS: 'catholics',
//     ORTHODOX: 'orthodox',
//     PROTESTANT: 'protestant',
//     OTHER: 'other',
// } as const;

// Income Levels
// export const IncomeLevels = {
//     'Birr 0-999': 'birr 0-999', // Birr 0-999
//     'Birr 1,000-1,999': 'birr 1,000-1,999', // Birr 1,000-1,999
//     'Birr 2,000-3,499': 'birr 2,000-3,499', // Birr 2,000-3,499
//     'Birr 3,500-4,999': 'birr 3,500-4,999', // Birr 3,500-4,999
//     'Birr 5,000-7,999': 'birr 5,000-7,999', // Birr 5,000-7,999
//     'Birr 8,000-15,000': 'birr 8,000-15,000', // Birr 8,000-15,000
//     'Above Birr 15,000': 'above birr 15,000', // Above Birr 15,000
// } as const;

// Education Levels
// export const EducationLevels = {
//     ILLITERATE: 'illiterate',
//     PRIMARY_SCHOOL: 'primary school',
//     SECONDARY_SCHOOL: 'secondary school',
//     DIPLOMA_CERTIFICATE: 'diploma/certificate',
//     BACHELORS_DEGREE: "bachelor's degree",
//     MASTERS_DEGREE_AND_ABOVE: "master's degree and above",
//     UNKNOWN: 'unknown',
//     MASTER: 'master',
//     DOCTOR: 'doctor',
//     OTHERS: 'others',
//     BACHELOR: 'bachelor',
// } as const;

// Customer Levels
// export const CustomerLevels = {
//     VCC: 'vcc',
//     VIC: 'vic',
//     PLATINUM: 'platinum',
//     GOLD: 'gold',
//     SILVER: 'silver',
//     BRONZE: 'bronze',
//     COPPER: 'copper',
// } as const;

// Add these to your customer.ts file

// Mapping for customer levels
// export const CustomerLevelMapping = {
//     '1': 'vcc',
//     '2': 'vic',
//     '3': 'platinum',
//     '4': 'gold',
//     '5': 'silver',
//     '6': 'bronze',
//     '7': 'copper',
// } as const;

// export const ReverseCustomerLevelMapping = {
//     vcc: '1',
//     vic: '2',
//     platinum: '3',
//     gold: '4',
//     silver: '5',
//     bronze: '6',
//     copper: '7',
// } as const;

// Mapping for titles
// export const TitleMapping = {
//     '1': 'mr.',
//     '2': 'mrs.',
//     '3': 'ms.',
//     '4': 'engineer',
//     '5': 'professor',
//     '6': 'doctor',
// } as const;

// export const ReverseTitleMapping = {
//     'mr.': '1',
//     'mrs.': '2',
//     'ms.': '3',
//     engineer: '4',
//     professor: '5',
//     doctor: '6',
// } as const;

// Mapping for gender
// export const GenderMapping = {
//     '1': 'male',
//     '2': 'female',
// } as const;

// export const ReverseGenderMapping = {
//     male: '1',
//     female: '2',
// } as const;

// Mapping for identification types
// export const IdTypeMapping = {
//     '1': 'passport',
//     '2': 'national_id',
//     '3': 'driving_license',
//     '4': 'student_id',
//     '5': 'tin_no',
//     '6': 'other',
//     '7': 'house_number',
//     '8': 'corporate_letter',
//     '9': 'kebele_id',
// } as const;

// export const ReverseIdTypeMapping = {
//     passport: '1',
//     national_id: '2',
//     driving_license: '3',
//     student_id: '4',
//     tin_no: '5',
//     other: '6',
//     house_number: '7',
//     corporate_letter: '8',
//     kebele_id: '9',
// } as const;

// Mapping for education levels
// export const EducationLevelMapping = {
//     '1': 'illiterate',
//     '2': 'primary school',
//     '3': 'secondary school',
//     '4': 'diploma/certificate',
//     '5': "bachelor's degree",
//     '6': "master's degree and above",
//     '7': 'unknown',
//     '8': 'master',
//     '9': 'doctor',
//     '10': 'others',
//     '11': 'bachelor',
// } as const;

// export const ReverseEducationLevelMapping = {
//     illiterate: '1',
//     'primary school': '2',
//     'secondary school': '3',
//     'diploma/certificate': '4',
//     "bachelor's degree": '5',
//     "master's degree and above": '6',
//     unknown: '7',
//     master: '8',
//     doctor: '9',
//     others: '10',
//     bachelor: '11',
// } as const;

// Mapping for religion
// export const ReligionMapping = {
//     '1': 'christianity',
//     '2': 'islam',
//     '3': 'catholics',
//     '4': 'orthodox',
//     '5': 'protestant',
//     '6': 'other',
// } as const;

// export const ReverseReligionMapping = {
//     christianity: '1',
//     islam: '2',
//     catholics: '3',
//     orthodox: '4',
//     protestant: '5',
//     other: '6',
// } as const;

// Mapping for income levels
// export const IncomeLevelMapping = {
//     '1': 'birr 0-999',
//     '2': 'birr 1,000-1,999',
//     '3': 'birr 2,000-3,499',
//     '4': 'birr 3,500-4,999',
//     '5': 'birr 5,000-7,999',
//     '6': 'birr 8,000-15,000',
//     '7': 'above birr 15,000',
// } as const;

// export const ReverseIncomeLevelMapping = {
//     'birr 0-999': '1',
//     'birr 1,000-1,999': '2',
//     'birr 2,000-3,499': '3',
//     'birr 3,500-4,999': '4',
//     'birr 5,000-7,999': '5',
//     'birr 8,000-15,000': '6',
//     'above birr 15,000': '7',
// } as const;

// Zod Schema for Customer
export const customerSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(255),
    middle_name: z.string().max(255).optional(),
    last_name: z.string().min(1, 'Last name is required').max(255),
    // title: z
    //     .enum([TitleOptions.MR, TitleOptions.MRS, TitleOptions.MS, TitleOptions.ENGINEER, TitleOptions.PROFESSOR, TitleOptions.DOCTOR])
    //     .optional(),
    title: z.string().optional(),
    // gender: z.enum([GenderOptions.MALE, GenderOptions.FEMALE]).optional(),
    gender: z.string().optional(),
    nationality: z.string().max(100).optional(),
    identification_type: z.string().optional(),
    // identification_type: z.nativeEnum(IdTypes).optional(),
    identification_number: z.string().max(100).optional(),
    date_of_birth: z
        .string()
        // .regex(/^\d{8}$/, 'Date must be in YYYYMMDD format')
        .optional(),
    place_of_birth: z.string().max(255).optional(),
    occupation: z.string().optional(),
    education: z.string().optional(),
    // education: z.nativeEnum(EducationLevels).optional(),
    religion: z.string().optional(),
    // religion: z.nativeEnum(ReligionTypes).optional(),
    income: z.string().optional(),
    // income: z.nativeEnum(IncomeLevels).optional(),
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
            notification_mode: z.string().optional(),
            // notification_mode: z.enum([NotificationModes.SMS, NotificationModes.EMAIL, NotificationModes.IVR]).optional(),
            mobile_no: z.string().max(20).optional(),
            email: z.string().email().max(255).optional(),
            office_no: z.string().max(20).optional(),
            home_no: z.string().max(20).optional(),
            fax_no: z.string().max(20).optional(),
        })
        .optional(),
    contact_person: z
        .array(
            z.object({
                first_name: z.string().max(255),
                middle_name: z.string().max(255),
                last_name: z.string().max(255),
                title: z.string().optional(),
                // title: z
                //     .enum([TitleOptions.MR, TitleOptions.MRS, TitleOptions.MS, TitleOptions.ENGINEER, TitleOptions.PROFESSOR, TitleOptions.DOCTOR])
                //     .optional(),
                home_no: z.string().max(128).optional(),
                office_no: z.string().max(128).optional(),
                mobile_no: z.string().max(20),
                fax_no: z.string().max(20).optional(),
            }),
        )
        .optional(),
    customer_type: z.string().optional(),
    customer_category: z.string().optional(),
    customer_subcategory: z.string().optional(),
    customer_level: z.string().optional(),
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
    title?: string;
    // title?: keyof typeof TitleOptions;
    gender?: string;
    // gender?: keyof typeof GenderOptions;
    nationality?: string;
    identification_type?: string;
    // identification_type?: keyof typeof IdTypes;
    identification_number?: string;
    date_of_birth?: string;
    place_of_birth?: string;
    occupation?: string;
    education?: string;
    // education?: keyof typeof EducationLevels;
    religion?: string;
    // religion?: keyof typeof ReligionTypes;
    income?: string;
    // income?: keyof typeof IncomeLevels;
    primary_language?: string;
    // address?: {
    //     [key in keyof typeof AddressTypes]?: string;
    // };
    // contact?: Array<{
    //     mobile_no?: string;
    //     email?: string;
    //     office_no?: string;
    //     home_no?: string;
    //     fax_no?: string;
    //     notification_mode?: string;
    //     // notification_mode?: keyof typeof NotificationModes;
    // }>;
    address?: Array<{
        region?: string;
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
        // title?: keyof typeof TitleOptions;
        title?: string;
        first_name: string;
        middle_name?: string;
        last_name: string;
        mobile_no: string;
        office_no?: string;
        home_no?: string;
        fax_no?: string;
    }>;
    customer_type?: string;
    customer_category?: string;
    customer_subcategory?: string;
    customer_level?: string;
    // customer_level?: keyof typeof CustomerLevels;
    // payment_type?: keyof typeof PaymentTypes;
    // account_status?: keyof typeof AccountStatuses;
}

export type Option = { label: string; value: string };
