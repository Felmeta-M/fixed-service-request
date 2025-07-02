import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    ContactTypes,
    CustomerFormValues,
    customerSchema,
    EducationLevels,
    GenderOptions,
    IdTypes,
    IncomeLevels,
    OccupationTypes,
    ReligionTypes,
    TitleOptions,
} from '@/types/customer';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Building, CheckCircle, FileText, MapPin, Phone, User } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

type FormInputProps = {
    label: string;
    id: string;
    value: string | number | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    type?: string;
    [key: string]: any;
};
function FormInput({ label, id, value, onChange, placeholder, error, type = 'text', ...props }: FormInputProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                type={type}
                className={error ? 'border-red-500' : ''}
                {...props}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

type SelectOption = { label: string; value: string };
type FormSelectProps = {
    label: string;
    id: string;
    value: string | undefined;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
};
function FormSelect({ label, id, value, onChange, options, placeholder, error }: FormSelectProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

// Helper function to map enums to select options
const mapEnumToOptions = (enumObj: Record<string, string>) =>
    Object.values(enumObj).map((value) => ({ label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '), value }));

const mapContactTypeOptions = () =>
    Object.values(ContactTypes).map((value) => ({ label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '), value }));

export default function Create() {
    const [step, setStep] = useState(1);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const { data, setData, post, processing } = useForm<CustomerFormValues>('createCustomer', {
        first_name: '',
        middle_name: '',
        last_name: '',
        title: undefined,
        gender: undefined,
        nationality: '',
        identification_type: undefined,
        identification_number: '',
        date_of_birth: '',
        place_of_birth: '',
        occupation: undefined,
        education: undefined,
        religion: undefined,
        income: undefined,
        primary_language: '',
        address: {
            region: '',
            zone: '',
            woreda: '',
            city: '',
            street_name: '',
            kebele: '',
            house_no: '',
        },
        contact: {
            phone: '',
            email: '',
            mobile: '',
        },
        contact_persons: [],
    });

    const [contactPersons, setContactPersons] = useState(data.contact_persons || []);
    useEffect(() => {
        setData('contact_persons', contactPersons);
    }, [contactPersons, setData]);
    const addContactPerson = () => setContactPersons((prev) => [...prev, { type: ContactTypes.OTHER, name: '', phone: '', relationship: '' }]);
    const removeContactPerson = (i: number) => setContactPersons((prev) => prev.filter((_, idx) => idx !== i));
    const updateContactPerson = (i: number, field: string, val: string) =>
        setContactPersons((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Customers', href: '/customers' },
        { title: 'Create', href: '/customers/create' },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setFormErrors({});
        // console.log("data",    data);
        const result = customerSchema.safeParse(data);
        // console.log("result", result);
        if (result.success) {
            setData(result.data);
            post(route('customers.store'));
        } else {
            // Flatten Zod errors for display
            const fieldErrors: Record<string, string> = {};
            for (const [key, val] of Object.entries(result.error.flatten().fieldErrors)) {
                if (val && val.length > 0) fieldErrors[key] = val[0];
            }
            setFormErrors(fieldErrors);
        }
    };

    const handleNext = () => {
        if (step < 6) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const renderStepIndicator = () => (
        <div className="mb-8 flex items-center justify-center space-x-4">
            {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                            step >= stepNumber ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                        } `}
                    >
                        {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                    </div>
                    {stepNumber < 6 && <div className={`mx-2 h-0.5 sm:w-16 ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'} `} />}
                </div>
            ))}
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Customer" />
            <div className="mx-auto space-y-6">
                <div className="p-1">
                    <h1 className="text-3xl font-bold text-gray-900">Create New Customer</h1>
                    <p className="mt-1 text-gray-600">Fill in the customer details step by step</p>
                </div>

                {renderStepIndicator()}

                {/* 1: Personal Information */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>Basic personal details of the customer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormSelect
                                    label="Title"
                                    id="title"
                                    value={data.title}
                                    onChange={(value) => setData('title', value as (typeof TitleOptions)[keyof typeof TitleOptions] | undefined)}
                                    options={mapEnumToOptions(TitleOptions)}
                                    placeholder="Select title"
                                    error={formErrors.title}
                                />
                                <FormInput
                                    label="First Name *"
                                    id="first_name"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    placeholder="Enter first name"
                                    error={formErrors.first_name}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Middle Name"
                                    id="middle_name"
                                    value={data.middle_name}
                                    onChange={(e) => setData('middle_name', e.target.value)}
                                    placeholder="Enter middle name"
                                    error={formErrors.middle_name}
                                />
                                <FormInput
                                    label="Last Name *"
                                    id="last_name"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    placeholder="Enter last name"
                                    error={formErrors.last_name}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormSelect
                                    label="Gender"
                                    id="gender"
                                    value={data.gender}
                                    onChange={(value) => setData('gender', value as (typeof GenderOptions)[keyof typeof GenderOptions] | undefined)}
                                    options={mapEnumToOptions(GenderOptions)}
                                    placeholder="Select gender"
                                    error={formErrors.gender}
                                />
                                <FormInput
                                    label="Date of Birth (YYYYMMDD)"
                                    id="date_of_birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                    placeholder="e.g. 19900101"
                                    error={formErrors.date_of_birth}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Place of Birth"
                                    id="place_of_birth"
                                    value={data.place_of_birth}
                                    onChange={(e) => setData('place_of_birth', e.target.value)}
                                    placeholder="Enter place of birth"
                                    error={formErrors.place_of_birth}
                                />
                                <FormInput
                                    label="Nationality"
                                    id="nationality"
                                    value={data.nationality}
                                    onChange={(e) => setData('nationality', e.target.value)}
                                    placeholder="Enter nationality"
                                    error={formErrors.nationality}
                                />
                            </div>
                            <FormInput
                                label="Primary Language"
                                id="primary_language"
                                value={data.primary_language}
                                onChange={(e) => setData('primary_language', e.target.value)}
                                placeholder="Enter primary language"
                                error={formErrors.primary_language}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* 2: Identification */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Identification
                            </CardTitle>
                            <CardDescription>Identification documents and numbers</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormSelect
                                    label="Identification Type"
                                    id="identification_type"
                                    value={data.identification_type}
                                    onChange={(value) => setData('identification_type', value as (typeof IdTypes)[keyof typeof IdTypes] | undefined)}
                                    options={mapEnumToOptions(IdTypes)}
                                    placeholder="Select ID type"
                                    error={formErrors.identification_type}
                                />
                                <FormInput
                                    label="Identification Number"
                                    id="identification_number"
                                    value={data.identification_number}
                                    onChange={(e) => setData('identification_number', e.target.value)}
                                    placeholder="Enter ID number"
                                    error={formErrors.identification_number}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 3: Contact Information */}
                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Contact Information
                            </CardTitle>
                            <CardDescription>Phone numbers and email addresses</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Phone Number"
                                    id="phone"
                                    value={data.contact?.phone || ''}
                                    onChange={(e) => setData('contact', { ...data.contact, phone: e.target.value })}
                                    placeholder="Enter phone number"
                                    error={formErrors['contact.phone']}
                                />
                                <FormInput
                                    label="Mobile Number"
                                    id="mobile"
                                    value={data.contact?.mobile || ''}
                                    onChange={(e) => setData('contact', { ...data.contact, mobile: e.target.value })}
                                    placeholder="Enter mobile number"
                                    error={formErrors['contact.mobile']}
                                />
                            </div>
                            <FormInput
                                label="Email Address"
                                id="email"
                                type="email"
                                value={data.contact?.email || ''}
                                onChange={(e) => setData('contact', { ...data.contact, email: e.target.value })}
                                placeholder="Enter email address"
                                error={formErrors['contact.email']}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* 4: Address */}
                {step === 4 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Address
                            </CardTitle>
                            <CardDescription>Current residential address</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Region"
                                    id="region"
                                    value={data.address?.region || ''}
                                    onChange={(e) => setData('address', { ...data.address, region: e.target.value })}
                                    placeholder="Enter region"
                                    error={formErrors['address.region']}
                                />
                                <FormInput
                                    label="Zone"
                                    id="zone"
                                    value={data.address?.zone || ''}
                                    onChange={(e) => setData('address', { ...data.address, zone: e.target.value })}
                                    placeholder="Enter zone"
                                    error={formErrors['address.zone']}
                                />
                                <FormInput
                                    label="Woreda"
                                    id="woreda"
                                    value={data.address?.woreda || ''}
                                    onChange={(e) => setData('address', { ...data.address, woreda: e.target.value })}
                                    placeholder="Enter woreda"
                                    error={formErrors['address.woreda']}
                                />
                                <FormInput
                                    label="City"
                                    id="city"
                                    value={data.address?.city || ''}
                                    onChange={(e) => setData('address', { ...data.address, city: e.target.value })}
                                    placeholder="Enter city"
                                    error={formErrors['address.city']}
                                />
                                <FormInput
                                    label="Street Name"
                                    id="street_name"
                                    value={data.address?.street_name || ''}
                                    onChange={(e) => setData('address', { ...data.address, street_name: e.target.value })}
                                    placeholder="Enter street name"
                                    error={formErrors['address.street_name']}
                                />
                                <FormInput
                                    label="Kebele"
                                    id="kebele"
                                    value={data.address?.kebele || ''}
                                    onChange={(e) => setData('address', { ...data.address, kebele: e.target.value })}
                                    placeholder="Enter kebele"
                                    error={formErrors['address.kebele']}
                                />
                                <FormInput
                                    label="House Number"
                                    id="house_no"
                                    value={data.address?.house_no || ''}
                                    onChange={(e) => setData('address', { ...data.address, house_no: e.target.value })}
                                    placeholder="Enter house number"
                                    error={formErrors['address.house_no']}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/*5: Professional Information */}
                {step === 5 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Professional Information
                            </CardTitle>
                            <CardDescription>Work and educational background</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormSelect
                                    label="Occupation"
                                    id="occupation"
                                    value={data.occupation}
                                    onChange={(value) =>
                                        setData('occupation', value as (typeof OccupationTypes)[keyof typeof OccupationTypes] | undefined)
                                    }
                                    options={mapEnumToOptions(OccupationTypes)}
                                    placeholder="Select occupation"
                                    error={formErrors.occupation}
                                />
                                <FormSelect
                                    label="Education"
                                    id="education"
                                    value={data.education}
                                    onChange={(value) =>
                                        setData('education', value as (typeof EducationLevels)[keyof typeof EducationLevels] | undefined)
                                    }
                                    options={mapEnumToOptions(EducationLevels)}
                                    placeholder="Select education level"
                                    error={formErrors.education}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormSelect
                                    label="Religion"
                                    id="religion"
                                    value={data.religion}
                                    onChange={(value) => setData('religion', value as (typeof ReligionTypes)[keyof typeof ReligionTypes] | undefined)}
                                    options={mapEnumToOptions(ReligionTypes)}
                                    placeholder="Select religion"
                                    error={formErrors.religion}
                                />
                                <FormSelect
                                    label="Income Level"
                                    id="income"
                                    value={data.income}
                                    onChange={(value) => setData('income', value as (typeof IncomeLevels)[keyof typeof IncomeLevels] | undefined)}
                                    options={mapEnumToOptions(IncomeLevels)}
                                    placeholder="Select income level"
                                    error={formErrors.income}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/*6: Contact Persons */}
                {step === 6 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">Contact Persons</CardTitle>
                            <CardDescription>Emergency or alternate contacts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {contactPersons.map((person, i) => (
                                <div key={i} className="space-y-4 rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Contact Person {i + 1}</h4>
                                        <Button type="button" variant="outline" size="sm" onClick={() => removeContactPerson(i)}>
                                            Remove
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormSelect
                                            label="Type"
                                            id={`type_${i}`}
                                            value={person.type}
                                            onChange={(value) => updateContactPerson(i, 'type', value)}
                                            options={mapContactTypeOptions()}
                                            placeholder="Select type"
                                        />
                                        <FormInput
                                            label="Name"
                                            id={`name_${i}`}
                                            value={person.name}
                                            onChange={(e) => updateContactPerson(i, 'name', e.target.value)}
                                            placeholder="Enter name"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormInput
                                            label="Phone"
                                            id={`phone_${i}`}
                                            value={person.phone}
                                            onChange={(e) => updateContactPerson(i, 'phone', e.target.value)}
                                            placeholder="Enter phone number"
                                        />
                                        <FormInput
                                            label="Relationship"
                                            id={`relationship_${i}`}
                                            value={person.relationship}
                                            onChange={(e) => updateContactPerson(i, 'relationship', e.target.value)}
                                            placeholder="Enter relationship"
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addContactPerson} className="w-full">
                                Add Contact Person
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1} className="cursor-pointer hover:opacity-80">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    {step < 6 ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={step === 1 && (!data.first_name || !data.last_name)}
                            className="cursor-pointer bg-primary hover:opacity-90"
                        >
                            Next
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="button" onClick={submit} disabled={processing} className="cursor-pointer bg-primary hover:opacity-90">
                            Submit Customer
                            <CheckCircle className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
