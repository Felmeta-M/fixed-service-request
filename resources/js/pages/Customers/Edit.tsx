import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Customer } from '@/types/customer';
import {
    ContactTypes,
    CustomerFormValues,
    EducationLevels,
    GenderOptions,
    IdTypes,
    IncomeLevels,
    OccupationTypes,
    ReligionTypes,
    TitleOptions,
    regionOptions,
    woredaOptionsMap,
    zoneOptionsMap,
} from '@/types/customer';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Building, FileText, MapPin, Phone, User } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';

// helper function to normalize any ISO timestamp into YYYY-MM-DD
const normalizeDate = (iso?: string) => (iso ? new Date(iso).toISOString().split('T')[0] : '');

type FormInputProps = {
    label: string;
    id: string;
    value: string | number | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    type?: string;
    [key: string]: unknown;
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
                    {options?.map((opt) => (
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

const mapEnumToOptions = (enumObj: Record<string, string>) =>
    Object.values(enumObj).map((value) => ({ label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '), value }));

const mapContactTypeOptions = () =>
    Object.values(ContactTypes).map((value) => ({ label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '), value }));

export default function Edit() {
    const { props } = usePage<{ customer: Customer }>();
    const customer = props.customer;
    const { data, setData, put, processing } = useForm<CustomerFormValues>({
        first_name: customer.first_name || '',
        middle_name: customer.middle_name || '',
        last_name: customer.last_name || '',
        title: customer.title || undefined,
        gender: customer.gender || undefined,
        nationality: customer.nationality || '',
        identification_type: customer.identification_type || undefined,
        identification_number: customer.identification_number || '',
        date_of_birth: normalizeDate(customer.date_of_birth),
        place_of_birth: customer.place_of_birth || '',
        occupation: customer.occupation || undefined,
        education: customer.education || undefined,
        religion: customer.religion || undefined,
        income: customer.income || undefined,
        primary_language: customer.primary_language || '',
        address: {
            region: customer.address?.region || '',
            zone: customer.address?.zone || '',
            woreda: customer.address?.woreda || '',
            city: customer.address?.city || '',
            street_name: customer.address?.street_name || '',
            kebele: customer.address?.kebele || '',
            house_no: customer.address?.house_no || '',
        },
        contact: customer.contact || { phone: '', email: '', secondary_phone: '' },
        contact_persons: customer.contact_persons || [],
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
        { title: 'Edit', href: `/customers/${customer.id}/edit` },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('customers.update', customer.id), {
            onSuccess: () => toast.success('Customer updated successfully!'),
            onError: () => toast.error('Failed to update customer.'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Customer" />
            <form onSubmit={submit} className="space-y-4 p-4">
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>Basic customer name and title</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <FormSelect
                                    label="Title"
                                    id="title"
                                    value={data.title!}
                                    onChange={(v) => setData('title', v as (typeof TitleOptions)[keyof typeof TitleOptions] | undefined)}
                                    options={mapEnumToOptions(TitleOptions)}
                                />
                            </div>
                            <div>
                                <FormInput
                                    label="First Name"
                                    id="first_name"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.currentTarget.value)}
                                />
                            </div>

                            <div>
                                <FormInput
                                    label="Middle Name"
                                    id="middle_name"
                                    value={data.middle_name}
                                    onChange={(e) => setData('middle_name', e.currentTarget.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <FormInput
                                    label="Last Name"
                                    id="last_name"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.currentTarget.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <FormSelect
                                    label="Gender"
                                    id="gender"
                                    value={data.gender}
                                    onChange={(value) => setData('gender', value as (typeof GenderOptions)[keyof typeof GenderOptions] | undefined)}
                                    options={mapEnumToOptions(GenderOptions)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <FormInput
                                    label="Date of Birth"
                                    id="date_of_birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="Place of Birth"
                                    id="place_of_birth"
                                    value={data.place_of_birth}
                                    onChange={(e) => setData('place_of_birth', e.target.value)}
                                    placeholder="Enter place of birth"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <FormInput
                                    label="Nationality"
                                    id="nationality"
                                    value={data.nationality}
                                    onChange={(e) => setData('nationality', e.target.value)}
                                    placeholder="Enter nationality"
                                />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="Primary Language"
                                    id="primary_language"
                                    value={data.primary_language}
                                    onChange={(e) => setData('primary_language', e.target.value)}
                                    placeholder="Enter primary language"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Identification */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Identification
                        </CardTitle>
                        <CardDescription>ID documents and numbers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <FormSelect
                                    label="Type"
                                    id="identification_type"
                                    value={data.identification_type!}
                                    onChange={(v) => setData('identification_type', v as (typeof IdTypes)[keyof typeof IdTypes] | undefined)}
                                    options={mapEnumToOptions(IdTypes)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="Number"
                                    id="identification_number"
                                    value={data.identification_number}
                                    onChange={(e) => setData('identification_number', e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Contact Information */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" /> Contact Information
                        </CardTitle>
                        <CardDescription>Phone & email</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <FormInput
                                    label="Phone"
                                    id="phone"
                                    value={data.contact?.phone}
                                    onChange={(e) => setData('contact', { ...data.contact, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="Mobile"
                                    id="mobile"
                                    value={data.contact?.secondary_phone}
                                    onChange={(e) => setData('contact', { ...data.contact, secondary_phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FormInput
                                label="Email"
                                id="email"
                                type="email"
                                value={data.contact?.email}
                                onChange={(e) => setData('contact', { ...data.contact, email: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>
                {/* Address */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" /> Address
                        </CardTitle>
                        <CardDescription>Residential address</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <FormSelect
                                    label="Region"
                                    id="region"
                                    value={data.address?.region}
                                    onChange={(v) => {
                                        setData('address.region', v);
                                        setData('address.zone', '');
                                        setData('address.woreda', '');
                                    }}
                                    options={regionOptions}
                                    placeholder="Select region"
                                />
                            </div>
                            <div className="space-y-2">
                                <FormSelect
                                    label="Zone"
                                    id="zone"
                                    value={data.address?.zone}
                                    onChange={(v) => {
                                        setData('address.zone', v);
                                        setData('address.woreda', '');
                                    }}
                                    options={data.address?.region ? zoneOptionsMap[data.address.region] : []}
                                    placeholder={data.address?.region ? 'Select zone' : 'First select region'}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormSelect
                                    label="Woreda"
                                    id="woreda"
                                    value={data.address?.woreda}
                                    onChange={(v) => setData('address.woreda', v)}
                                    options={data.address?.zone ? woredaOptionsMap[data.address.zone] : []}
                                    placeholder={data.address?.zone ? 'Select woreda' : 'First select zone'}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="City"
                                    id="city"
                                    value={data.address?.city}
                                    onChange={(e) => setData('address.city', e.target.value)}
                                    placeholder="Enter city"
                                />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="Street Name"
                                    id="street_name"
                                    value={data.address?.street_name}
                                    onChange={(e) => setData('address.street_name', e.target.value)}
                                    placeholder="Enter street name"
                                />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="Kebele"
                                    id="kebele"
                                    value={data.address?.kebele}
                                    onChange={(e) => setData('address.kebele', e.target.value)}
                                    placeholder="Enter kebele"
                                />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="House No."
                                    id="house_no"
                                    value={data.address?.house_no}
                                    onChange={(e) => setData('address.house_no', e.target.value)}
                                    placeholder="Enter house number"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Professional Information */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" /> Professional Information
                        </CardTitle>
                        <CardDescription>Work & education</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <FormSelect
                                    label="Occupation"
                                    id="occupation"
                                    value={data.occupation}
                                    onChange={(v) => setData('occupation', v as (typeof OccupationTypes)[keyof typeof OccupationTypes] | undefined)}
                                    options={mapEnumToOptions(OccupationTypes)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormSelect
                                    label="Education"
                                    id="education"
                                    value={data.education}
                                    onChange={(v) => setData('education', v as (typeof EducationLevels)[keyof typeof EducationLevels] | undefined)}
                                    options={mapEnumToOptions(EducationLevels)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <FormSelect
                                    label="Religion"
                                    id="religion"
                                    value={data.religion}
                                    onChange={(v) => setData('religion', v as (typeof ReligionTypes)[keyof typeof ReligionTypes] | undefined)}
                                    options={mapEnumToOptions(ReligionTypes)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormSelect
                                    label="Income Level"
                                    id="income"
                                    value={data.income}
                                    onChange={(v) => setData('income', v as (typeof IncomeLevels)[keyof typeof IncomeLevels] | undefined)}
                                    options={mapEnumToOptions(IncomeLevels)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Emergency Contacts */}
                <Card className="border-none shadow-sm">
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
                {/* Actions */}
                <div className="flex space-x-2">
                    <Button className="cursor-pointer" type="submit" disabled={processing}>
                        Update
                    </Button>
                    <Link href={route('customers.index')}>
                        <Button className="cursor-pointer" variant="secondary">
                            Cancel
                        </Button>
                    </Link>
                </div>
            </form>
        </AppLayout>
    );
}
