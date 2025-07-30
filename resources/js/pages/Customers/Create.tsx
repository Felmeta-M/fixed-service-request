// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import CustomerLayout from '@/layouts/customer-layout';
// import { type BreadcrumbItem } from '@/types';
// import {
//     CustomerFormValues,
//     customerSchema,
//     EducationLevels,
//     GenderOptions,
//     IdTypes,
//     IncomeLevels,
//     OccupationTypes,
//     regionOptions,
//     ReligionTypes,
//     TitleOptions,
//     woredaOptionsMap,
//     zoneOptionsMap,
// } from '@/types/customer';
// import { Head, useForm } from '@inertiajs/react';
// import { ArrowLeft, ArrowRight, Building, CheckCircle, FileText, MapPin, Phone, User } from 'lucide-react';
// import { FormEventHandler, useEffect, useState } from 'react';
// import { toast } from 'sonner';

// type FormInputProps = {
//     label: string;
//     id: string;
//     value: string | number | undefined;
//     onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//     placeholder?: string;
//     error?: string;
//     type?: string;
//     [key: string]: unknown;
// };
// function FormInput({ label, id, value, onChange, placeholder, error, type = 'text', ...props }: FormInputProps) {
//     return (
//         <div className="space-y-2">
//             <Label htmlFor={id}>{label}</Label>
//             <Input
//                 id={id}
//                 value={value}
//                 onChange={onChange}
//                 placeholder={placeholder}
//                 type={type}
//                 className={error ? 'border-red-500' : ''}
//                 {...props}
//             />
//             {error && <p className="text-sm text-red-500">{error}</p>}
//         </div>
//     );
// }

// type SelectOption = { label: string; value: string };
// type FormSelectProps = {
//     label: string;
//     id: string;
//     value: string | undefined;
//     onChange: (value: string) => void;
//     options: SelectOption[];
//     placeholder?: string;
//     error?: string;
// };
// function FormSelect({ label, id, value, onChange, options, placeholder, error }: FormSelectProps) {
//     return (
//         <div className="space-y-2">
//             <Label htmlFor={id}>{label}</Label>
//             <Select value={value} onValueChange={onChange}>
//                 <SelectTrigger>
//                     <SelectValue placeholder={placeholder} />
//                 </SelectTrigger>
//                 <SelectContent>
//                     {options.map((opt) => (
//                         <SelectItem key={opt.value} value={opt.value} className="hover:bg-green-50 focus:bg-primary focus:text-white">
//                             {opt.label}
//                         </SelectItem>
//                     ))}
//                 </SelectContent>
//             </Select>
//             {error && <p className="text-sm text-red-500">{error}</p>}
//         </div>
//     );
// }

// // Helper function to map enums to select options
// const mapEnumToOptions = (enumObj: Record<string, string>) =>
//     Object.values(enumObj).map((value) => ({ label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '), value }));

// // const mapContactTypeOptions = () =>
// //     Object.values(ContactTypes).map((value) => ({ label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '), value }));

// export default function Create() {
//     const [step, setStep] = useState(1);
//     const [formErrors, setFormErrors] = useState<Record<string, string>>({});
//     const { data, setData, post, processing } = useForm<CustomerFormValues>('createCustomer', {
//         first_name: '',
//         middle_name: '',
//         last_name: '',
//         title: undefined,
//         gender: undefined,
//         nationality: '',
//         identification_type: undefined,
//         identification_number: '',
//         date_of_birth: '',
//         place_of_birth: '',
//         occupation: undefined,
//         education: undefined,
//         religion: undefined,
//         income: undefined,
//         primary_language: '',
//         address: {
//             region: '',
//             zone: '',
//             woreda: '',
//             city: '',
//             street_name: '',
//             kebele: '',
//             house_no: '',
//         },
//         contact: [],
//         contact_persons: [],
//     });

//     const [contact, setContact] = useState(data.contact || []);
//     const [contactPersons, setContactPersons] = useState(data.contact_persons || []);
//     useEffect(() => {
//         setData('contact_persons', contactPersons);
//     }, [contactPersons, setData]);
//     const addContactPerson = () =>
//         setContactPersons((prev) => [
//             ...prev,
//             { first_name: '', middle_name: '', last_name: '', title: undefined, mobile_no: '', office_no: '', home_no: '', fax_no: '' },
//         ]);
//     const removeContactPerson = (i: number) => setContactPersons((prev) => prev.filter((_, idx) => idx !== i));
//     const updateContactPerson = (i: number, field: string, val: string) =>
//         setContactPersons((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));

//     const breadcrumbs: BreadcrumbItem[] = [
//         { title: 'Customers', href: '/customers' },
//         { title: 'Create', href: '/create/customers' },
//     ];

//     const submit: FormEventHandler = (e) => {
//         e.preventDefault();
//         setFormErrors({});
//         console.log('Submitting data:', data);
//         console.log('type of contact:', typeof data.contact);
//         const result = customerSchema.safeParse(data);
//         console.log('Validation result:', result);
//         if (result.success) {
//             setData(result.data);
//             post(route('customers.store'), {
//                 onSuccess: (page) => {
//                     // Get phone from response (if available)
//                     const phone = page.props?.customer?.contact?.mobile_no || data.contact?.mobile_no;
//                     if (phone) {
//                         localStorage.setItem('auth', JSON.stringify({ phone, authenticated: true }));
//                         window.location.href = route('customer.portal', { phone });
//                     }
//                     toast.success('Customer created successfully!');
//                 },
//                 onError: () => toast.error('Failed to create customer.'),
//             });
//         } else {
//             // Flatten Zod errors for display
//             const fieldErrors: Record<string, string> = {};
//             for (const [key, val] of Object.entries(result.error.flatten().fieldErrors)) {
//                 if (val && val.length > 0) fieldErrors[key] = val[0];
//             }
//             setFormErrors(fieldErrors);
//         }
//     };

//     const handleNext = () => {
//         if (step < 4) setStep(step + 1);
//     };

//     const handleBack = () => {
//         if (step > 1) setStep(step - 1);
//     };

//     const renderStepIndicator = () => (
//         <div className="mb-6 flex items-center justify-center space-x-4">
//             {[1, 2, 3, 4].map((stepNumber) => (
//                 <div key={stepNumber} className="flex items-center">
//                     <div
//                         className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
//                             step >= stepNumber ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600'
//                         } ${step === stepNumber ? 'ring-2 ring-primary ring-offset-2' : ''}`}
//                     >
//                         {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
//                     </div>
//                     {stepNumber < 4 && <div className={`mx-2 h-0.5 transition-all sm:w-24 ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'} `} />}
//                 </div>
//             ))}
//         </div>
//     );

//     return (
//         <CustomerLayout>
//             <Head title="Create Customer" />
//             <div className="mx-auto max-w-2xl space-y-4 pb-10">
//                 <div className="rounded-lg bg-card p-6 shadow-sm">
//                     <h1 className="text-2xl font-bold text-gray-900">Create New Customer</h1>
//                     <p className="mt-1 text-gray-600">Fill in the details step by step</p>
//                 </div>

//                 {renderStepIndicator()}

//                 {/* 1: Personal Information */}
//                 {step === 1 && (
//                     <Card className="border-none shadow-sm">
//                         <CardHeader>
//                             <CardTitle className="flex items-center gap-2">
//                                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
//                                     <User className="h-5 w-5" />
//                                 </div>
//                                 <div>
//                                     <h2 className="text-xl font-semibold">Personal Information</h2>
//                                     <CardDescription className="text-gray-600">Basic personal details of the customer</CardDescription>
//                                 </div>
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                 <FormSelect
//                                     label="Title"
//                                     id="title"
//                                     value={data.title}
//                                     onChange={(value) => setData('title', value as (typeof TitleOptions)[keyof typeof TitleOptions] | undefined)}
//                                     options={mapEnumToOptions(TitleOptions)}
//                                     placeholder="Select title"
//                                     error={formErrors.title}
//                                 />
//                                 <FormInput
//                                     label="First Name *"
//                                     id="first_name"
//                                     value={data.first_name}
//                                     onChange={(e) => setData('first_name', e.target.value)}
//                                     placeholder="Enter first name"
//                                     error={formErrors.first_name}
//                                 />
//                             </div>
//                             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                 <FormInput
//                                     label="Middle Name"
//                                     id="middle_name"
//                                     value={data.middle_name}
//                                     onChange={(e) => setData('middle_name', e.target.value)}
//                                     placeholder="Enter middle name"
//                                     error={formErrors.middle_name}
//                                 />
//                                 <FormInput
//                                     label="Last Name *"
//                                     id="last_name"
//                                     value={data.last_name}
//                                     onChange={(e) => setData('last_name', e.target.value)}
//                                     placeholder="Enter last name"
//                                     error={formErrors.last_name}
//                                 />
//                             </div>
//                             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                 <FormSelect
//                                     label="Gender"
//                                     id="gender"
//                                     value={data.gender}
//                                     onChange={(value) => setData('gender', value as (typeof GenderOptions)[keyof typeof GenderOptions] | undefined)}
//                                     options={mapEnumToOptions(GenderOptions)}
//                                     placeholder="Select gender"
//                                     error={formErrors.gender}
//                                 />
//                                 <FormInput
//                                     label="Date of Birth"
//                                     id="date_of_birth"
//                                     type="date"
//                                     value={data.date_of_birth}
//                                     onChange={(e) => setData('date_of_birth', e.target.value)}
//                                     placeholder="e.g. 19900101"
//                                     error={formErrors.date_of_birth}
//                                 />
//                             </div>
//                             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                 <FormInput
//                                     label="Place of Birth"
//                                     id="place_of_birth"
//                                     value={data.place_of_birth}
//                                     onChange={(e) => setData('place_of_birth', e.target.value)}
//                                     placeholder="Enter place of birth"
//                                     error={formErrors.place_of_birth}
//                                 />
//                                 <FormInput
//                                     label="Nationality"
//                                     id="nationality"
//                                     value={data.nationality}
//                                     onChange={(e) => setData('nationality', e.target.value)}
//                                     placeholder="Enter nationality"
//                                     error={formErrors.nationality}
//                                 />
//                             </div>
//                             <FormInput
//                                 label="Primary Language"
//                                 id="primary_language"
//                                 value={data.primary_language}
//                                 onChange={(e) => setData('primary_language', e.target.value)}
//                                 placeholder="Enter primary language"
//                                 error={formErrors.primary_language}
//                             />
//                         </CardContent>
//                     </Card>
//                 )}

//                 {/* 2: Identification */}
//                 {step === 2 && (
//                     <>
//                         <Card className="border-none shadow-sm">
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2">
//                                     <FileText className="h-5 w-5" />
//                                     Identification
//                                 </CardTitle>
//                                 <CardDescription>Identification documents and numbers</CardDescription>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                     <FormSelect
//                                         label="Identification Type"
//                                         id="identification_type"
//                                         value={data.identification_type}
//                                         onChange={(value) =>
//                                             setData('identification_type', value as (typeof IdTypes)[keyof typeof IdTypes] | undefined)
//                                         }
//                                         options={mapEnumToOptions(IdTypes)}
//                                         placeholder="Select ID type"
//                                         error={formErrors.identification_type}
//                                     />
//                                     <FormInput
//                                         label="Identification Number"
//                                         id="identification_number"
//                                         value={data.identification_number}
//                                         onChange={(e) => setData('identification_number', e.target.value)}
//                                         placeholder="Enter ID number"
//                                         error={formErrors.identification_number}
//                                     />
//                                 </div>
//                             </CardContent>
//                         </Card>
//                         <Card className="border-none shadow-sm">
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2">
//                                     <Phone className="h-5 w-5" />
//                                     Contact Information
//                                 </CardTitle>
//                                 <CardDescription>Phone numbers and email addresses</CardDescription>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                     <FormSelect
//                                         label="Notification Mode"
//                                         id="contact.notification_mode"
//                                         value={data.contact?.notification_mode}
//                                         onChange={(val) => setData('contact', { ...data.contact, notification_mode: val })}
//                                         options={mapEnumToOptions({
//                                             SMS: 'sms',
//                                             EMAIL: 'email',
//                                         })}
//                                         placeholder="Select notification mode"
//                                         error={formErrors['contact.notification_mode']}
//                                     />
//                                     <FormInput
//                                         label="Phone Number"
//                                         id="phone"
//                                         value={data.contact?.mobile_no || ''}
//                                         onChange={(e) => setData('contact', { ...data.contact, mobile_no: e.target.value })}
//                                         placeholder="Enter mobile number"
//                                         error={formErrors['contact.mobile_no']}
//                                     />
//                                     <FormInput
//                                         label="Office Number"
//                                         id="office"
//                                         value={data.contact?.office_no || ''}
//                                         onChange={(e) => setData('contact', { ...data.contact, office_no: e.target.value })}
//                                         placeholder="Enter office number"
//                                         error={formErrors['contact.office_no']}
//                                     />
//                                     <FormInput
//                                         label="Email Address"
//                                         id="email"
//                                         type="email"
//                                         value={data.contact?.email || ''}
//                                         onChange={(e) => setData('contact', { ...data.contact, email: e.target.value })}
//                                         placeholder="Enter email address"
//                                         error={formErrors['contact.email']}
//                                     />
//                                     <FormInput
//                                         label="Home Number"
//                                         id="home"
//                                         value={data.contact?.home_no || ''}
//                                         onChange={(e) => setData('contact', { ...data.contact, home_no: e.target.value })}
//                                         placeholder="Enter home number"
//                                         error={formErrors['contact.home_no']}
//                                     />
//                                     <FormInput
//                                         label="Fax Number"
//                                         id="fax_no"
//                                         value={data.contact?.fax_no || ''}
//                                         onChange={(e) => setData('contact', { ...data.contact, fax_no: e.target.value })}
//                                         placeholder="Enter fax number"
//                                         error={formErrors['contact.fax_no']}
//                                     />
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </>
//                 )}

//                 {/* 4: Address */}
//                 {step === 3 && (
//                     <Card className="border-none shadow-sm">
//                         <CardHeader>
//                             <CardTitle className="flex items-center gap-2">
//                                 <MapPin className="h-5 w-5" />
//                                 Address
//                             </CardTitle>
//                             <CardDescription>Current residential address</CardDescription>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                 <FormSelect
//                                     label="Region"
//                                     id="address.region"
//                                     value={data.address?.region}
//                                     onChange={(val) => setData('address', { ...data.address, region: val, zone: '', woreda: '' })}
//                                     options={regionOptions}
//                                     placeholder="Select region"
//                                     error={formErrors['address.region']}
//                                 />
//                                 <FormSelect
//                                     label="Zone"
//                                     id="address.zone"
//                                     value={data.address?.zone}
//                                     onChange={(val) => setData('address', { ...data.address, zone: val, woreda: '' })}
//                                     options={data.address?.region ? zoneOptionsMap[data.address.region] : []}
//                                     placeholder={data.address?.region ? 'Select zone' : 'First select region'}
//                                     error={formErrors['address.zone']}
//                                 />
//                             </div>
//                             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                 <FormSelect
//                                     label="Woreda"
//                                     id="address.woreda"
//                                     value={data.address?.woreda}
//                                     onChange={(val) => setData('address', { ...data.address, woreda: val })}
//                                     options={data.address?.zone ? woredaOptionsMap[data.address.zone] : []}
//                                     placeholder={data.address?.zone ? 'Select woreda' : 'First select zone'}
//                                     error={formErrors['address.woreda']}
//                                 />
//                                 <FormInput
//                                     label="City"
//                                     id="address.city"
//                                     value={data.address?.city}
//                                     onChange={(e) => setData('address', { ...data.address, city: e.target.value })}
//                                     placeholder="Enter city"
//                                     error={formErrors['address.city']}
//                                 />
//                             </div>
//                             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                 <FormInput
//                                     label="Street Name"
//                                     id="address.street_name"
//                                     value={data.address?.street_name}
//                                     onChange={(e) => setData('address', { ...data.address, street_name: e.target.value })}
//                                     placeholder="Enter street name"
//                                     error={formErrors['address.street_name']}
//                                 />
//                                 <FormInput
//                                     label="Kebele"
//                                     id="address.kebele"
//                                     value={data.address?.kebele}
//                                     onChange={(e) => setData('address', { ...data.address, kebele: e.target.value })}
//                                     placeholder="Enter kebele"
//                                     error={formErrors['address.kebele']}
//                                 />
//                             </div>
//                             <FormInput
//                                 label="House Number"
//                                 id="address.house_no"
//                                 value={data.address?.house_no}
//                                 onChange={(e) => setData('address', { ...data.address, house_no: e.target.value })}
//                                 placeholder="Enter house number"
//                                 error={formErrors['address.house_no']}
//                             />
//                         </CardContent>
//                     </Card>
//                 )}

//                 {/*5: Professional Information */}
//                 {step === 4 && (
//                     <>
//                         <Card className="border-none shadow-sm">
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2">
//                                     <Building className="h-5 w-5" />
//                                     Professional Information
//                                 </CardTitle>
//                                 <CardDescription>Work and educational background</CardDescription>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                     <FormSelect
//                                         label="Occupation"
//                                         id="occupation"
//                                         value={data.occupation}
//                                         onChange={(value) =>
//                                             setData('occupation', value as (typeof OccupationTypes)[keyof typeof OccupationTypes] | undefined)
//                                         }
//                                         options={mapEnumToOptions(OccupationTypes)}
//                                         placeholder="Select occupation"
//                                         error={formErrors.occupation}
//                                     />
//                                     <FormSelect
//                                         label="Education"
//                                         id="education"
//                                         value={data.education}
//                                         onChange={(value) =>
//                                             setData('education', value as (typeof EducationLevels)[keyof typeof EducationLevels] | undefined)
//                                         }
//                                         options={mapEnumToOptions(EducationLevels)}
//                                         placeholder="Select education level"
//                                         error={formErrors.education}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                     <FormSelect
//                                         label="Religion"
//                                         id="religion"
//                                         value={data.religion}
//                                         onChange={(value) =>
//                                             setData('religion', value as (typeof ReligionTypes)[keyof typeof ReligionTypes] | undefined)
//                                         }
//                                         options={mapEnumToOptions(ReligionTypes)}
//                                         placeholder="Select religion"
//                                         error={formErrors.religion}
//                                     />
//                                     <FormSelect
//                                         label="Income Level"
//                                         id="income"
//                                         value={data.income}
//                                         onChange={(value) => setData('income', value as (typeof IncomeLevels)[keyof typeof IncomeLevels] | undefined)}
//                                         options={mapEnumToOptions(IncomeLevels)}
//                                         placeholder="Select income level"
//                                         error={formErrors.income}
//                                     />
//                                 </div>
//                             </CardContent>
//                         </Card>
//                         <Card className="border-none shadow-sm">
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2">Contact Person</CardTitle>
//                                 <CardDescription>Emergency or alternate contacts</CardDescription>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 {contactPersons.map((person, i) => (
//                                     <div key={i} className="space-y-4 rounded-lg border p-4">
//                                         <div className="flex items-center justify-between">
//                                             <h4 className="font-medium">Contact Person {i + 1}</h4>
//                                             <Button type="button" variant="outline" size="sm" onClick={() => removeContactPerson(i)}>
//                                                 Remove
//                                             </Button>
//                                         </div>
//                                         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                             <FormSelect
//                                                 label="Title"
//                                                 id="title1"
//                                                 value={data.title}
//                                                 onChange={(value) =>
//                                                     setData('title', value as (typeof TitleOptions)[keyof typeof TitleOptions] | undefined)
//                                                 }
//                                                 options={mapEnumToOptions(TitleOptions)}
//                                                 placeholder="Select title"
//                                                 error={formErrors.title}
//                                             />
//                                             <FormInput
//                                                 label="First Name"
//                                                 id={`first_name_${i}`}
//                                                 value={person.first_name}
//                                                 onChange={(e) => updateContactPerson(i, 'first_name', e.target.value)}
//                                                 placeholder="Enter first name"
//                                             />
//                                             <FormInput
//                                                 label="Middle Name"
//                                                 id={`middle_name_${i}`}
//                                                 value={person.middle_name}
//                                                 onChange={(e) => updateContactPerson(i, 'middle_name', e.target.value)}
//                                                 placeholder="Enter middle name"
//                                             />
//                                             <FormInput
//                                                 label="Last Name"
//                                                 id={`last_name_${i}`}
//                                                 value={person.last_name}
//                                                 onChange={(e) => updateContactPerson(i, 'last_name', e.target.value)}
//                                                 placeholder="Enter last name"
//                                             />
//                                         </div>
//                                         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                             <FormInput
//                                                 label="Mobile No"
//                                                 id={`mobile_no_${i}`}
//                                                 value={person.mobile_no}
//                                                 onChange={(e) => updateContactPerson(i, 'mobile_no', e.target.value)}
//                                                 placeholder="Enter mobile number"
//                                             />
//                                             <FormInput
//                                                 label="Home No"
//                                                 id={`home_no_${i}`}
//                                                 value={person.home_no}
//                                                 onChange={(e) => updateContactPerson(i, 'home_no', e.target.value)}
//                                                 placeholder="Enter home number"
//                                             />
//                                             <FormInput
//                                                 label="Office No"
//                                                 id={`office_no_${i}`}
//                                                 value={person.office_no}
//                                                 onChange={(e) => updateContactPerson(i, 'office_no', e.target.value)}
//                                                 placeholder="Enter office number"
//                                             />
//                                             <FormInput
//                                                 label="Fax No"
//                                                 id={`fax_no_${i}`}
//                                                 value={person.fax_no}
//                                                 onChange={(e) => updateContactPerson(i, 'fax_no', e.target.value)}
//                                                 placeholder="Enter fax number"
//                                             />
//                                         </div>
//                                     </div>
//                                 ))}
//                                 <Button type="button" variant="outline" onClick={addContactPerson} className="w-full">
//                                     Add Contact Person
//                                 </Button>
//                             </CardContent>
//                         </Card>
//                     </>
//                 )}

//                 <div className="flex justify-between">
//                     <Button variant="outline" onClick={handleBack} disabled={step === 1} className="cursor-pointer hover:opacity-80">
//                         <ArrowLeft className="mr-2 h-4 w-4" />
//                         Back
//                     </Button>

//                     {step < 4 ? (
//                         <Button
//                             type="button"
//                             onClick={handleNext}
//                             disabled={step === 1 && (!data.first_name || !data.last_name)}
//                             className="cursor-pointer bg-primary hover:opacity-90"
//                         >
//                             Next
//                             <ArrowRight className="ml-2 h-4 w-4" />
//                         </Button>
//                     ) : (
//                         <Button type="button" onClick={submit} disabled={processing} className="cursor-pointer bg-primary hover:opacity-90">
//                             Submit Customer
//                             <CheckCircle className="ml-2 h-4 w-4" />
//                         </Button>
//                     )}
//                 </div>
//             </div>
//         </CustomerLayout>
//     );
// }

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerCategories, useCustomerSubcategories, useCustomerTypes } from '@/hooks/use-customer-types';
import { useOccupations } from '@/hooks/use-occupations';
import CustomerLayout from '@/layouts/customer-layout';
import { type BreadcrumbItem } from '@/types';
import { CustomerFormValues, customerSchema, Option } from '@/types/customer';
import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Building, CheckCircle, FileText, Home, MapPin, Phone, User } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';

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
            <Label htmlFor={id} className="font-medium text-gray-700">
                {label}
            </Label>
            <Input
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                type={type}
                className={`${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'} focus:ring-2`}
                {...props}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

// type SelectOption = { label: string; value: string };
type FormSelectProps = {
    label: string;
    id: string;
    value: string | undefined;
    onChange: (value: string) => void;
    // options: SelectOption[];
    options: Option[];
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    loading?: boolean;
};
function FormSelect({ label, id, value, onChange, options, placeholder, error, disabled, loading }: FormSelectProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="font-medium text-gray-700">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger className={`${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'} focus:ring-2`}>
                    {loading ? <SelectValue placeholder="Loading..." /> : <SelectValue placeholder={placeholder} />}
                </SelectTrigger>
                <SelectContent className="bg-white shadow-lg">
                    {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="hover:bg-green-50 focus:bg-green-50">
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

export default function Create() {
    const { occupations, loading, error: occupationError } = useOccupations();
    const [step, setStep] = useState(1);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const { data, setData, post, processing } = useForm<CustomerFormValues>('createCustomer', {
        first_name: '',
        middle_name: '',
        last_name: '',
        title: undefined,
        // title: ReverseTitleMapping[title] || undefined,
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
            notification_mode: '',
            mobile_no: '',
            office_no: '',
            email: '',
            home_no: '',
            fax_no: '',
        },
        contact_person: [],
        customer_type: undefined,
        customer_category: undefined,
        customer_subcategory: undefined,
        customer_level: undefined,
    });
    console.log('🚀 ~ Create ~ data:', data);

    const { types, loading: typesLoading, error: typesError } = useCustomerTypes();
    console.log('🚀 ~ Create ~ types:', types);

    const { categories, loading: categoriesLoading, error: categoriesError } = useCustomerCategories(data.customer_type);
    console.log('Categories', categories);
    const { subcategories, loading: subcategoriesLoading, error: subcategoriesError } = useCustomerSubcategories(data.customer_category);

    const [contactPersons, setContactPersons] = useState(data.contact_person || []);
    useEffect(() => {
        setData('contact_person', contactPersons);
    }, [contactPersons, setData]);
    const addContactPerson = () =>
        setContactPersons((prev) => [
            ...prev,
            { first_name: '', middle_name: '', last_name: '', title: undefined, mobile_no: '', office_no: '', home_no: '', fax_no: '' },
        ]);
    const removeContactPerson = (i: number) => setContactPersons((prev) => prev.filter((_, idx) => idx !== i));
    const updateContactPerson = (i: number, field: string, val: string) =>
        setContactPersons((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Customers', href: '/customers' },
        { title: 'Create', href: '/create/customers' },
    ];
    console.log('data', data);

    // const submit: FormEventHandler = (e) => {
    //     e.preventDefault();
    //     setFormErrors({});
    //     const result = customerSchema.safeParse(data);
    //     console.log('🚀 ~ submit ~ result:', result);
    //     if (result.success) {
    //         setData(result.data);
    //         post(route('customers.store'), {
    //             onSuccess: (page) => {
    //                 const phone = page.props?.customer?.contact?.mobile_no || data.contact?.mobile_no;
    //                 if (phone) {
    //                     localStorage.setItem('auth', JSON.stringify({ phone, authenticated: true }));
    //                     route('customer.portal', { phone });
    //                 }
    //                 toast.success('Customer created successfully!', {
    //                     position: 'top-right',
    //                     className: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    //                 });
    //             },
    //             onError: () =>
    //                 toast.error('Failed to create customer.', {
    //                     position: 'top-right',
    //                     className: 'bg-red-50 text-red-800 border-red-100',
    //                 }),
    //         });
    //     } else {
    //         const fieldErrors: Record<string, string> = {};
    //         for (const [key, val] of Object.entries(result.error.flatten().fieldErrors)) {
    //             if (val && val.length > 0) fieldErrors[key] = val[0];
    //         }
    //         setFormErrors(fieldErrors);
    //         return;
    //     }
    // };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setFormErrors({});
        const result = customerSchema.safeParse(data);

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            for (const [key, val] of Object.entries(result.error.flatten().fieldErrors)) {
                if (val && val.length > 0) fieldErrors[key] = val[0];
            }
            setFormErrors(fieldErrors);
            return;
        }
        // Prepare data for API
        const apiData = {
            ...result.data,
            date_of_birth: result.data.date_of_birth ? result.data.date_of_birth.replace(/-/g, '') : null,
        };
        console.log('API Data', apiData);
        try {
            const response = await axios.post('http://localhost:8000/api/customer/create', apiData);
            console.log('🚀 ~ submit ~ response:', response);

            // const phone = response.data?.contact?.mobile_no || data.contact?.mobile_no;
            // if (phone) {
            //     localStorage.setItem('auth', JSON.stringify({ phone, authenticated: true }));
            //     route('customer.portal', { phone });
            // }

            // toast.success('Customer created successfully!', {
            //     position: 'top-right',
            //     className: 'bg-emerald-50 text-emerald-800 border-emerald-100',
            // });
            if (response.data.success) {
                const customer = response.data.customer;
                const phone = customer?.contact?.mobile_no || data?.contact?.mobile_no || customer?.mobile_no;
                if (!phone) {
                    toast.error('Customer created but phone number not found', {
                        position: 'top-right',
                        className: 'bg-yellow-50 text-yellow-800 border-yellow-100',
                    });
                    return;
                }

                if (phone) {
                    localStorage.setItem(
                        'auth',
                        JSON.stringify({
                            phone,
                            authenticated: true,
                        }),
                    );
                    // // Correct way to pass query params with router.visit()
                    // router.visit(`/customer/portal?phone=${encodeURIComponent(phone)}`);
                    // Use Inertia's router.get() instead of direct visit
                    router.get(
                        route('customer.portal'),
                        {
                            phone: phone,
                        },
                        {
                            preserveState: false,
                        },
                    );
                }

                toast.success(response.data.message, {
                    position: 'top-right',
                    className: 'bg-emerald-50 text-emerald-800 border-emerald-100',
                });
            } else {
                console.log('Error', response.data.message);
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error('Failed to create customer.', {
                position: 'top-right',
                className: 'bg-red-50 text-red-800 border-red-100',
            });
            console.log('Error', error);

            // Handle API validation errors
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setFormErrors(error.response.data.errors || {});
            }
        }
    };

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const renderStepIndicator = () => (
        <div className="mb-6 flex items-center justify-center space-x-0 sm:space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                    <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium transition-all sm:h-10 sm:w-10 ${
                            step >= stepNumber ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-500'
                        } ${step === stepNumber ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                    >
                        {step > stepNumber ? <CheckCircle className="h-5 w-5" /> : stepNumber}
                    </div>
                    {stepNumber < 4 && <div className={`mx-2 h-1 w-16 transition-all ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'}`} />}
                </div>
            ))}
        </div>
    );

    return (
        <CustomerLayout>
            <Head title="Create Customer" />
            <div className="mx-auto max-w-4xl space-y-6 px-4 pb-10 sm:px-6">
                <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 p-6 shadow-sm">
                    <h1 className="text-3xl font-bold text-gray-900">Create New Customer</h1>
                    <p className="mt-2 text-lg text-gray-600">Fill in the customer details step by step</p>
                </div>

                {renderStepIndicator()}

                {/* 1: Personal Information */}
                {step === 1 && (
                    // <Card className="border border-gray-200 shadow-sm">
                    //     <CardHeader className="rounded-t-lg border-b bg-gray-50">
                    //         <CardTitle className="flex items-center gap-3 text-gray-800">
                    //             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                    //                 <User className="h-5 w-5" />
                    //             </div>
                    //             <div>
                    //                 <h2 className="text-xl font-semibold">Personal Information</h2>
                    //                 <CardDescription className="text-gray-400">Basic personal details of the customer</CardDescription>
                    //             </div>
                    //         </CardTitle>
                    //     </CardHeader>
                    //     <CardContent className="space-y-6 p-6">
                    //         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    //             <FormSelect
                    //                 label="Customer Type"
                    //                 id="customer_type"
                    //                 value={data.customer_type}
                    //                 onChange={(val) => {
                    //                     setData('customer_type', val);
                    //                     setData('customer_category', '');
                    //                     setData('customer_subcategory', '');
                    //                 }}
                    //                 options={types}
                    //                 placeholder="Select customer type"
                    //                 error={formErrors.customer_type || typesError}
                    //                 loading={typesLoading}
                    //             />
                    //             <FormSelect
                    //                 label="Customer Category"
                    //                 id="customer_category"
                    //                 value={data.customer_category}
                    //                 onChange={(val) => {
                    //                     setData('customer_category', val);
                    //                     setData('customer_subcategory', '');
                    //                 }}
                    //                 options={categories}
                    //                 placeholder="Select category"
                    //                 error={formErrors.customer_category || categoriesError}
                    //                 loading={categoriesLoading}
                    //             />
                    //             <FormSelect
                    //                 label="Customer Subcategory"
                    //                 id="customer_subcategory"
                    //                 value={data.customer_subcategory}
                    //                 onChange={(val) => setData('customer_subcategory', val)}
                    //                 options={subcategories}
                    //                 placeholder="Select subcategory"
                    //                 error={formErrors.customer_subcategory || subcategoriesError}
                    //                 loading={subcategoriesLoading}
                    //             />
                    //             <FormSelect
                    //                 label="Title"
                    //                 id="title"
                    //                 value={data.title}
                    //                 onChange={(value) => setData('title', value as (typeof TitleOptions)[keyof typeof TitleOptions] | undefined)}
                    //                 options={mapEnumToOptions(TitleOptions)}
                    //                 placeholder="Select title"
                    //                 error={formErrors.title}
                    //             />
                    //             <FormInput
                    //                 label="First Name *"
                    //                 id="first_name"
                    //                 value={data.first_name}
                    //                 onChange={(e) => setData('first_name', e.target.value)}
                    //                 placeholder="Enter first name"
                    //                 error={formErrors.first_name}
                    //             />
                    //             <FormInput
                    //                 label="Middle Name"
                    //                 id="middle_name"
                    //                 value={data.middle_name}
                    //                 onChange={(e) => setData('middle_name', e.target.value)}
                    //                 placeholder="Enter middle name"
                    //                 error={formErrors.middle_name}
                    //             />
                    //             <FormInput
                    //                 label="Last Name *"
                    //                 id="last_name"
                    //                 value={data.last_name}
                    //                 onChange={(e) => setData('last_name', e.target.value)}
                    //                 placeholder="Enter last name"
                    //                 error={formErrors.last_name}
                    //             />
                    //             <FormSelect
                    //                 label="Gender"
                    //                 id="gender"
                    //                 value={data.gender}
                    //                 onChange={(value) => setData('gender', value as (typeof GenderOptions)[keyof typeof GenderOptions] | undefined)}
                    //                 options={mapEnumToOptions(GenderOptions)}
                    //                 placeholder="Select gender"
                    //                 error={formErrors.gender}
                    //             />
                    //             <FormInput
                    //                 label="Date of Birth"
                    //                 id="date_of_birth"
                    //                 type="date"
                    //                 value={data.date_of_birth}
                    //                 onChange={(e) => setData('date_of_birth', e.target.value)}
                    //                 placeholder="e.g. 19900101"
                    //                 error={formErrors.date_of_birth}
                    //             />
                    //             <FormInput
                    //                 label="Place of Birth"
                    //                 id="place_of_birth"
                    //                 value={data.place_of_birth}
                    //                 onChange={(e) => setData('place_of_birth', e.target.value)}
                    //                 placeholder="Enter place of birth"
                    //                 error={formErrors.place_of_birth}
                    //             />
                    //             <FormInput
                    //                 label="Nationality"
                    //                 id="nationality"
                    //                 value={data.nationality}
                    //                 onChange={(e) => setData('nationality', e.target.value)}
                    //                 placeholder="Enter nationality"
                    //                 error={formErrors.nationality}
                    //             />
                    //         </div>
                    //         <div className="w-full md:w-1/2">
                    //             <FormInput
                    //                 label="Primary Language"
                    //                 id="primary_language"
                    //                 value={data.primary_language}
                    //                 onChange={(e) => setData('primary_language', e.target.value)}
                    //                 placeholder="Enter primary language"
                    //                 error={formErrors.primary_language}
                    //             />
                    //         </div>
                    //     </CardContent>
                    // </Card>

                    <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="rounded-t-lg border-b bg-gray-50">
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Personal Information</h2>
                                    <CardDescription className="text-gray-400">Basic personal details of the customer</CardDescription>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Updated Customer Type */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="customer_type">Customer Type *</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                                                data.customer_type === '1' ? 'border-green-500 bg-green-50 shadow-sm' : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {
                                                setData('customer_type', '1');
                                                setData('customer_category', '');
                                                setData('customer_subcategory', '');
                                            }}
                                        >
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                                    data.customer_type === '1' ? 'bg-green-100' : 'bg-gray-100'
                                                }`}
                                            >
                                                <Home className={`h-6 w-6 ${data.customer_type === '1' ? 'text-green-600' : 'text-gray-600'}`} />
                                            </div>
                                            <span className="font-medium">Residential</span>
                                            <span className="text-center text-xs text-gray-500">For home and personal use</span>
                                            <input
                                                type="radio"
                                                id="residential"
                                                name="customer_type"
                                                value="residential"
                                                checked={data.customer_type === '1'}
                                                onChange={() => {}}
                                                className="sr-only"
                                            />
                                        </div>
                                        <div
                                            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                                                data.customer_type === '2' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {
                                                setData('customer_type', '2');
                                                setData('customer_category', '');
                                                setData('customer_subcategory', '');
                                            }}
                                        >
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                                    data.customer_type === '2' ? 'bg-blue-100' : 'bg-gray-100'
                                                }`}
                                            >
                                                <Building
                                                    className={`h-6 w-6 ${data.customer_type === 'enterprise' ? 'text-blue-600' : 'text-gray-600'}`}
                                                />
                                            </div>
                                            <span className="font-medium">Enterprise</span>
                                            <span className="text-center text-xs text-gray-500">For business and organizations</span>
                                            <input
                                                type="radio"
                                                id="enterprise"
                                                name="customer_type"
                                                value="enterprise"
                                                checked={data.customer_type === '2'}
                                                onChange={() => {}}
                                                className="sr-only"
                                            />
                                        </div>
                                    </div>
                                    {formErrors.customer_type && <p className="text-sm font-medium text-destructive">{formErrors.customer_type}</p>}
                                </div>

                                {/* Customer Category and Subcategory */}
                                <>
                                    <FormSelect
                                        label="Customer Category"
                                        id="customer_category"
                                        value={data.customer_category}
                                        onChange={(val) => {
                                            setData('customer_category', val);
                                            setData('customer_subcategory', '');
                                        }}
                                        options={categories}
                                        placeholder="Select category"
                                        error={formErrors.customer_category || categoriesError}
                                        loading={categoriesLoading}
                                    />
                                    <FormSelect
                                        label="Customer Subcategory"
                                        id="customer_subcategory"
                                        value={data.customer_subcategory}
                                        onChange={(val) => setData('customer_subcategory', val)}
                                        options={subcategories}
                                        placeholder="Select subcategory"
                                        error={formErrors.customer_subcategory || subcategoriesError}
                                        loading={subcategoriesLoading}
                                    />
                                    <FormSelect
                                        label="Customer Level"
                                        id="customer_level"
                                        value={data.customer_level || ''}
                                        onChange={(value) => setData('customer_level', value)}
                                        options={[
                                            { label: 'Vcc', value: '1' },
                                            { label: 'Vic', value: '2' },
                                            { label: 'Platinum', value: '3' },
                                            { label: 'Gold', value: '4' },
                                            { label: 'Silver', value: '5' },
                                            { label: 'Bronze', value: '6' },
                                            { label: 'Copper', value: '7' },
                                        ]}
                                        placeholder="Select Customer Level"
                                        error={formErrors.customer_level}
                                    />
                                </>
                                <FormSelect
                                    label="Title"
                                    id="title"
                                    value={data.title || ''}
                                    onChange={(value) => setData('title', value)}
                                    options={[
                                        { label: 'Mr.', value: '1' },
                                        { label: 'Mrs.', value: '2' },
                                        { label: 'Ms.', value: '3' },
                                        { label: 'Engineer', value: '4' },
                                        { label: 'Professor', value: '5' },
                                        { label: 'Doctor', value: '6' },
                                    ]}
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
                                <FormSelect
                                    label="Gender"
                                    id="gender"
                                    value={data.gender || ''}
                                    onChange={(value) => setData('gender', value)}
                                    options={[
                                        { label: 'Male', value: '1' },
                                        { label: 'Female', value: '2' },
                                    ]}
                                    placeholder="Select gender"
                                    error={formErrors.gender}
                                />
                                <FormInput
                                    label="Date of Birth"
                                    id="date_of_birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                    placeholder="e.g. 19900101"
                                    error={formErrors.date_of_birth}
                                />
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
                            <div className="w-full md:w-1/2">
                                <FormInput
                                    label="Primary Language"
                                    id="primary_language"
                                    value={data.primary_language}
                                    onChange={(e) => setData('primary_language', e.target.value)}
                                    placeholder="Enter primary language"
                                    error={formErrors.primary_language}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 2: Identification */}
                {step === 2 && (
                    <div className="space-y-6">
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="rounded-t-lg border-b bg-gray-50">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Identification</h2>
                                        <CardDescription className="text-gray-600">Identification documents and numbers</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* <FormSelect
                                        label="Identification Type"
                                        id="identification_type"
                                        value={data.identification_type}
                                        onChange={(value) =>
                                            setData('identification_type', value as (typeof IdTypes)[keyof typeof IdTypes] | undefined)
                                        }
                                        options={mapEnumToOptions(IdTypes)}
                                        placeholder="Select ID type"
                                        error={formErrors.identification_type}
                                    /> */}
                                    <FormSelect
                                        label="Identification Type"
                                        id="identification_type"
                                        value={data.identification_type || ''}
                                        onChange={(value) => setData('identification_type', value)}
                                        options={[
                                            { label: 'Passport', value: '1' },
                                            { label: 'National ID', value: '2' },
                                            { label: 'Driver License', value: '3' },
                                            { label: 'Student Id', value: '4' },
                                            { label: 'TIN No', value: '5' },
                                            { label: 'Other', value: '6' },
                                            { label: 'House Number', value: '7' },
                                            { label: 'Corporate Letter', value: '8' },
                                            { label: 'Kebele ID', value: '9' },
                                        ]}
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
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="rounded-t-lg border-b bg-gray-50">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Contact Information</h2>
                                        <CardDescription className="text-gray-600">Phone numbers and email addresses</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* <FormSelect
                                        label="Notification Mode"
                                        id="contact.notification_mode"
                                        value={data.contact?.notification_mode}
                                        onChange={(val) => setData('contact', { ...data.contact, notification_mode: val })}
                                        options={mapEnumToOptions(NotificationModes)}
                                        placeholder="Select notification mode"
                                        error={formErrors['contact.notification_mode']}
                                    /> */}

                                    <FormSelect
                                        label="Notification Mode"
                                        id="contact.notification_mode"
                                        value={data.contact?.notification_mode || ''}
                                        onChange={(val) => setData('contact', { ...data.contact, notification_mode: val })}
                                        // onChange={(e) => setData('contact', [{ ...data.contact[0], notification_mode: e.target.value }])}
                                        options={[
                                            { label: 'SMS', value: '1' },
                                            { label: 'Email', value: '2' },
                                            { label: 'Ivr', value: '3' },
                                        ]}
                                        placeholder="Select notification mode"
                                        error={formErrors['contact.notification_mode']}
                                    />
                                    <FormInput
                                        label="Phone Number"
                                        id="phone"
                                        value={data.contact?.mobile_no || ''}
                                        onChange={(e) => setData('contact', { ...data.contact, mobile_no: e.target.value })}
                                        // onChange={(e) => setData('contact', [{ ...data.contact[0], mobile_no: e.target.value }])}
                                        placeholder="Enter mobile number"
                                        error={formErrors['contact.mobile_no']}
                                    />
                                    <FormInput
                                        label="Office Number"
                                        id="office"
                                        value={data.contact?.office_no || ''}
                                        onChange={(e) => setData('contact', { ...data.contact, office_no: e.target.value })}
                                        // onChange={(e) => setData('contact', [{ ...data.contact[0], office_no: e.target.value }])}
                                        placeholder="Enter office number"
                                        error={formErrors['contact.office_no']}
                                    />
                                    <FormInput
                                        label="Email Address"
                                        id="email"
                                        type="email"
                                        value={data.contact?.email || ''}
                                        onChange={(e) => setData('contact', { ...data.contact, email: e.target.value })}
                                        // onChange={(e) => setData('contact', [{ ...data.contact[0], email: e.target.value }])}
                                        placeholder="Enter email address"
                                        error={formErrors['contact.email']}
                                    />
                                    <FormInput
                                        label="Home Number"
                                        id="home"
                                        value={data.contact?.home_no || ''}
                                        onChange={(e) => setData('contact', { ...data.contact, home_no: e.target.value })}
                                        placeholder="Enter home number"
                                        error={formErrors['contact.home_no']}
                                    />
                                    <FormInput
                                        label="Fax Number"
                                        id="fax_no"
                                        value={data.contact?.fax_no || ''}
                                        onChange={(e) => setData('contact', { ...data.contact, fax_no: e.target.value })}
                                        // onChange={(e) => setData('contact', [{ ...data.contact[0], fax_no: e.target.value }])}
                                        placeholder="Enter fax number"
                                        error={formErrors['contact.fax_no']}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 3: Address */}
                {step === 3 && (
                    <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="rounded-t-lg border-b bg-gray-50">
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Address</h2>
                                    <CardDescription className="text-gray-600">Current residential address</CardDescription>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* <FormSelect
                                    label="Region"
                                    id="address.region"
                                    value={data.address?.region}
                                    onChange={(val) => setData('address', { ...data.address, region: val, zone: '', woreda: '' })}
                                    options={regionOptions}
                                    placeholder="Select region"
                                    error={formErrors['address.region']}
                                /> */}
                                <FormSelect
                                    label="Region"
                                    id="address.region"
                                    value={data.address?.region || ''}
                                    onChange={(val) => setData('address', { ...data.address, region: val, zone: '', woreda: '' })}
                                    // onChange={(val) => setData('address', [{ ...data.address[0], region: val, zone: '', woreda: '' }])}
                                    options={[
                                        { label: 'Addis Ababa', value: '1' },
                                        { label: 'Oromia', value: '2' },
                                    ]}
                                    placeholder="Select region"
                                    error={formErrors['address.region']}
                                />
                                {/* <FormSelect
                                    label="Zone"
                                    id="address.zone"
                                    value={data.address?.zone}
                                    onChange={(val) => setData('address', { ...data.address, zone: val, woreda: '' })}
                                    options={data.address?.region ? zoneOptionsMap[data.address.region] : []}
                                    placeholder={data.address?.region ? 'Select zone' : 'First select region'}
                                    error={formErrors['address.zone']}
                                /> */}
                                <FormSelect
                                    label="Zone"
                                    id="address.zone"
                                    value={data.address?.zone || ''}
                                    onChange={(val) => setData('address', { ...data.address, zone: val, woreda: '' })}
                                    // onChange={(val) => setData('address', [{ ...data.address[0], zone: val, woreda: '' }])}
                                    options={[
                                        { label: 'Arsi', value: '3' },
                                        { label: 'Bole', value: '4' },
                                    ]}
                                    placeholder={data.address?.region ? 'Select zone' : 'First select region'}
                                    error={formErrors['address.zone']}
                                />
                                {/* <FormSelect
                                    label="Woreda"
                                    id="address.woreda"
                                    value={data.address?.woreda}
                                    onChange={(val) => setData('address', { ...data.address, woreda: val })}
                                    options={data.address?.zone ? woredaOptionsMap[data.address.zone] : []}
                                    placeholder={data.address?.zone ? 'Select woreda' : 'First select zone'}
                                    error={formErrors['address.woreda']}
                                /> */}
                                <FormSelect
                                    label="Woreda"
                                    id="address.woreda"
                                    value={data.address?.woreda}
                                    onChange={(val) => setData('address', { ...data.address, woreda: val })}
                                    options={[
                                        { label: 'Woreda1', value: '5' },
                                        { label: 'Woreda2', value: '6' },
                                    ]}
                                    placeholder={data.address?.zone ? 'Select woreda' : 'First select zone'}
                                    error={formErrors['address.woreda']}
                                />
                                <FormInput
                                    label="City"
                                    id="address.city"
                                    value={data.address?.city}
                                    onChange={(e) => setData('address', { ...data.address, city: e.target.value })}
                                    placeholder="Enter city"
                                    error={formErrors['address.city']}
                                />
                                <FormInput
                                    label="Street Name"
                                    id="address.street_name"
                                    value={data.address?.street_name}
                                    onChange={(e) => setData('address', { ...data.address, street_name: e.target.value })}
                                    placeholder="Enter street name"
                                    error={formErrors['address.street_name']}
                                />
                                <FormInput
                                    label="Kebele"
                                    id="address.kebele"
                                    value={data.address?.kebele}
                                    onChange={(e) => setData('address', { ...data.address, kebele: e.target.value })}
                                    placeholder="Enter kebele"
                                    error={formErrors['address.kebele']}
                                />
                                <FormInput
                                    label="House Number"
                                    id="address.house_no"
                                    value={data.address?.house_no}
                                    onChange={(e) => setData('address', { ...data.address, house_no: e.target.value })}
                                    placeholder="Enter house number"
                                    error={formErrors['address.house_no']}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 4: Professional Information */}
                {step === 4 && (
                    <div className="space-y-6">
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="rounded-t-lg border-b bg-gray-50">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                        <Building className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Professional Information</h2>
                                        <CardDescription className="text-gray-600">Work and educational background</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* <FormSelect
                                        label="Occupation"
                                        id="occupation"
                                        value={data.occupation}
                                        onChange={(value) =>
                                            setData('occupation', value as (typeof OccupationTypes)[keyof typeof OccupationTypes] | undefined)
                                        }
                                        options={mapEnumToOptions(OccupationTypes)}
                                        placeholder="Select occupation"
                                        error={formErrors.occupation}
                                    /> */}
                                    <FormSelect
                                        label="Occupation"
                                        id="occupation"
                                        value={data.occupation}
                                        onChange={(value) => setData('occupation', value)}
                                        options={occupations}
                                        placeholder={loading ? 'Loading occupations...' : 'Select occupation'}
                                        error={formErrors.occupation || (occupationError ? occupationError : undefined)}
                                        disabled={loading}
                                    />
                                    {/* <FormSelect
                                        label="Education"
                                        id="education"
                                        value={data.education}
                                        onChange={(value) =>
                                            setData('education', value as (typeof EducationLevels)[keyof typeof EducationLevels] | undefined)
                                        }
                                        options={mapEnumToOptions(EducationLevels)}
                                        placeholder="Select education level"
                                        error={formErrors.education}
                                    /> */}
                                    <FormSelect
                                        label="Education"
                                        id="education"
                                        value={data.education || ''}
                                        onChange={(value) => setData('education', value)}
                                        options={[
                                            { label: 'Illiterate', value: '1' },
                                            { label: 'Primary school', value: '2' },
                                            { label: 'Secondary school', value: '3' },
                                            { label: 'Diploma/certificate', value: '4' },
                                            { label: "Bachelor's degree", value: '5' },
                                            { label: "Master's degree and above", value: '6' },
                                            { label: 'Unknown', value: '7' },
                                            { label: 'Master', value: '8' },
                                            { label: 'Doctor', value: '9' },
                                            { label: 'Others', value: '10' },
                                            { label: 'Bachelor', value: '11' },
                                        ]}
                                        placeholder="Select education level"
                                        error={formErrors.education}
                                    />
                                    {/* <FormSelect
                                        label="Religion"
                                        id="religion"
                                        value={data.religion}
                                        onChange={(value) =>
                                            setData('religion', value as (typeof ReligionTypes)[keyof typeof ReligionTypes] | undefined)
                                        }
                                        options={mapEnumToOptions(ReligionTypes)}
                                        placeholder="Select religion"
                                        error={formErrors.religion}
                                    /> */}
                                    <FormSelect
                                        label="Religion"
                                        id="religion"
                                        value={data.religion || ''}
                                        onChange={(value) => setData('religion', value)}
                                        options={[
                                            { label: 'Christianity', value: '1' },
                                            { label: 'Islam', value: '2' },
                                            { label: 'Catholics', value: '3' },
                                            { label: 'Orthodox', value: '4' },
                                            { label: 'Protestant', value: '5' },
                                            { label: 'Other', value: '6' },
                                        ]}
                                        placeholder="Select religion"
                                        error={formErrors.religion}
                                    />
                                    {/* <FormSelect
                                        label="Income Level"
                                        id="income"
                                        value={data.income}
                                        onChange={(value) => setData('income', value as (typeof IncomeLevels)[keyof typeof IncomeLevels] | undefined)}
                                        options={mapEnumToOptions(IncomeLevels)}
                                        placeholder="Select income level"
                                        error={formErrors.income}
                                    /> */}
                                    <FormSelect
                                        label="Income Level"
                                        id="income"
                                        value={data.income}
                                        onChange={(value) => setData('income', value)}
                                        options={[
                                            { label: 'Birr 0-999', value: '1' },
                                            { label: 'Birr 1,000-1,999', value: '2' },
                                            { label: 'Birr 2,000-3,499', value: '3' },
                                            { label: 'Birr 3,500-4,999', value: '4' },
                                            { label: 'Birr 5,000-7,999', value: '5' },
                                            { label: 'Birr 8,000-15,000', value: '6' },
                                            { label: 'Above Birr 15,000', value: '7' },
                                        ]}
                                        placeholder="Select income level"
                                        error={formErrors.income}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        {/* <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="rounded-t-lg border-b bg-gray-50">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Contact Persons</h2>
                                        <CardDescription className="text-gray-600">Emergency or alternate contacts</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                {contactPersons.map((person, i) => (
                                    <div key={i} className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-medium text-gray-800">Contact Person {i + 1}</h4>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeContactPerson(i)}
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormSelect
                                                label="Title"
                                                id="title1"
                                                value={person.title}
                                                onChange={(value) => updateContactPerson(i, 'title', value)}
                                                options={mapEnumToOptions(TitleOptions)}
                                                placeholder="Select title"
                                            />
                                            <FormInput
                                                label="First Name"
                                                id={`first_name_${i}`}
                                                value={person.first_name}
                                                onChange={(e) => updateContactPerson(i, 'first_name', e.target.value)}
                                                placeholder="Enter first name"
                                            />
                                            <FormInput
                                                label="Middle Name"
                                                id={`middle_name_${i}`}
                                                value={person.middle_name}
                                                onChange={(e) => updateContactPerson(i, 'middle_name', e.target.value)}
                                                placeholder="Enter middle name"
                                            />
                                            <FormInput
                                                label="Last Name"
                                                id={`last_name_${i}`}
                                                value={person.last_name}
                                                onChange={(e) => updateContactPerson(i, 'last_name', e.target.value)}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormInput
                                                label="Mobile No"
                                                id={`mobile_no_${i}`}
                                                value={person.mobile_no}
                                                onChange={(e) => updateContactPerson(i, 'mobile_no', e.target.value)}
                                                placeholder="Enter mobile number"
                                            />
                                            <FormInput
                                                label="Home No"
                                                id={`home_no_${i}`}
                                                value={person.home_no}
                                                onChange={(e) => updateContactPerson(i, 'home_no', e.target.value)}
                                                placeholder="Enter home number"
                                            />
                                            <FormInput
                                                label="Office No"
                                                id={`office_no_${i}`}
                                                value={person.office_no}
                                                onChange={(e) => updateContactPerson(i, 'office_no', e.target.value)}
                                                placeholder="Enter office number"
                                            />
                                            <FormInput
                                                label="Fax No"
                                                id={`fax_no_${i}`}
                                                value={person.fax_no}
                                                onChange={(e) => updateContactPerson(i, 'fax_no', e.target.value)}
                                                placeholder="Enter fax number"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addContactPerson}
                                    className="w-full border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                                >
                                    + Add Contact Person
                                </Button>
                            </CardContent>
                        </Card> */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="rounded-t-lg border-b bg-gray-50">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Contact Person</h2>
                                        <CardDescription className="text-gray-600">Emergency or alternate contact</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                {contactPersons.map((person, i) => (
                                    <div key={i} className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-medium text-gray-800">Contact Person</h4>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeContactPerson(i)}
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {/* <FormSelect
                                                label="Title"
                                                id="title1"
                                                value={person.title}
                                                onChange={(value) => updateContactPerson(i, 'title', value)}
                                                options={mapEnumToOptions(TitleOptions)}
                                                placeholder="Select title"
                                            /> */}
                                            <FormSelect
                                                label="Title"
                                                id={`title_${i}`}
                                                value={person.title}
                                                onChange={(value) => updateContactPerson(i, 'title', value)}
                                                options={[
                                                    { label: 'Mr.', value: '1' },
                                                    { label: 'Mrs.', value: '2' },
                                                    { label: 'Ms.', value: '3' },
                                                    { label: 'Engineer', value: '4' },
                                                    { label: 'Professor', value: '5' },
                                                    { label: 'Doctor', value: '6' },
                                                ]}
                                                placeholder="Select title"
                                                error={formErrors.title}
                                            />
                                            <FormInput
                                                label="First Name"
                                                id={`first_name_${i}`}
                                                value={person.first_name}
                                                onChange={(e) => updateContactPerson(i, 'first_name', e.target.value)}
                                                placeholder="Enter first name"
                                            />
                                            <FormInput
                                                label="Middle Name"
                                                id={`middle_name_${i}`}
                                                value={person.middle_name}
                                                onChange={(e) => updateContactPerson(i, 'middle_name', e.target.value)}
                                                placeholder="Enter middle name"
                                            />
                                            <FormInput
                                                label="Last Name"
                                                id={`last_name_${i}`}
                                                value={person.last_name}
                                                onChange={(e) => updateContactPerson(i, 'last_name', e.target.value)}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormInput
                                                label="Mobile No"
                                                id={`mobile_no_${i}`}
                                                value={person.mobile_no}
                                                onChange={(e) => updateContactPerson(i, 'mobile_no', e.target.value)}
                                                placeholder="Enter mobile number"
                                            />
                                            <FormInput
                                                label="Home No"
                                                id={`home_no_${i}`}
                                                value={person.home_no}
                                                onChange={(e) => updateContactPerson(i, 'home_no', e.target.value)}
                                                placeholder="Enter home number"
                                            />
                                            <FormInput
                                                label="Office No"
                                                id={`office_no_${i}`}
                                                value={person.office_no}
                                                onChange={(e) => updateContactPerson(i, 'office_no', e.target.value)}
                                                placeholder="Enter office number"
                                            />
                                            <FormInput
                                                label="Fax No"
                                                id={`fax_no_${i}`}
                                                value={person.fax_no}
                                                onChange={(e) => updateContactPerson(i, 'fax_no', e.target.value)}
                                                placeholder="Enter fax number"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addContactPerson}
                                    disabled={contactPersons.length > 0}
                                    className="w-full border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    + Add Contact Person
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="flex justify-between rounded-lg bg-gray-50 p-4">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1}
                        className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    {step < 4 ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={step === 1 && (!data.first_name || !data.last_name)}
                            className={`flex items-center gap-2 text-white shadow-sm hover:shadow-md`}
                        >
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={submit}
                            disabled={processing}
                            className={`flex items-center gap-2 text-white shadow-sm hover:shadow-md`}
                        >
                            Submit Customer
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}
