import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import { ResourceFormValues, resourceSchema } from '@/types/resource';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, MapPin, User } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';

type FormInputProps = {
    label: string;
    id: string;
    value: string | number | null | boolean;
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
    value: string | undefined | boolean;
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

export default function Create() {
    const [step, setStep] = useState(1);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const { data, setData, post, processing } = useForm<ResourceFormValues>('createResource', {
        prod_spec_code: '',
        number_line: null,
        event_code: '',
        cust_id: '',
        cust_name: '',
        longitude: null,
        latitude: null,
        staff_code: '',
        staff_name: '',
        combo_flag: false,
        // timestamp: '',
        cust_addr: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Resource Checks', href: '/resource-checks' },
        { title: 'Create', href: '/resource-checks/create' },
    ];

    const submit: FormEventHandler = (e) => {
        console.log('start');
        e.preventDefault();
        setFormErrors({});
        const result = resourceSchema.safeParse(data);
        console.log(data);
        console.log(result);
        if (result.success) {
            setData(result.data);
            post(route('resource-checks.store'), {
                onSuccess: () => toast.success('Resource checks submitted successfully!'),
                onError: () => toast.error('Failed to submit resource checks.'),
            });
            console.log(result.data);
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
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const renderStepIndicator = () => (
        <div className="mb-8 flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                            step >= stepNumber ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                        } `}
                    >
                        {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                    </div>
                    {stepNumber < 3 && <div className={`mx-2 h-0.5 sm:w-16 ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'} `} />}
                </div>
            ))}
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Submit Resource Check" />
            <div className="mx-auto space-y-6">
                <div className="p-1">
                    <h1 className="text-3xl font-bold text-gray-900">submit Resource Check</h1>
                    <p className="mt-1 text-gray-600">Fill in the details step by step</p>
                </div>

                {renderStepIndicator()}

                {/* 1: Personal Information */}
                {step === 1 && (
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Product and Personal Information
                            </CardTitle>
                            <CardDescription>Basic product and personal details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Product Specification Code *"
                                    id="prod_spec_code"
                                    value={data.prod_spec_code}
                                    onChange={(e) => setData('prod_spec_code', e.target.value)}
                                    placeholder="Enter Product Specification"
                                    error={formErrors.title}
                                />
                                <FormInput
                                    label="Line Number *"
                                    id="number_line"
                                    // type="number"
                                    value={data.number_line}
                                    onChange={(e) => setData('number_line', Number(e.target.value))}
                                    placeholder="Enter line number"
                                    error={formErrors.first_name}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Event Code *"
                                    id="event_code"
                                    value={data.event_code}
                                    onChange={(e) => setData('event_code', e.target.value)}
                                    placeholder="Enter event code"
                                    error={formErrors.event_code}
                                />
                                <FormInput
                                    label="CustomerId *"
                                    id="cust_id"
                                    value={data.cust_id}
                                    onChange={(e) => setData('cust_id', e.target.value)}
                                    placeholder="Enter customer id"
                                    error={formErrors.cust_id}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Customer Name *"
                                    id="cust_name"
                                    value={data.cust_name}
                                    onChange={(e) => setData('cust_name', e.target.value)}
                                    placeholder="Enter customer name"
                                    error={formErrors.cust_name}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Longitude *"
                                    id="longitude"
                                    type="number"
                                    value={data.longitude}
                                    onChange={(e) => setData('longitude', Number(e.target.value))}
                                    placeholder="Enter longitude"
                                    error={formErrors.longitude}
                                />
                                <FormInput
                                    label="Latitude *"
                                    id="latitude"
                                    type="number"
                                    value={data.latitude}
                                    onChange={(e) => setData('latitude', Number(e.target.value))}
                                    placeholder="Enter latitude"
                                    error={formErrors.latitude}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 2: Identification */}
                {step === 2 && (
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Identification
                            </CardTitle>
                            <CardDescription>Identification documents and numbers</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Staff Code"
                                    id="staff_code"
                                    value={data.staff_code}
                                    onChange={(e) => setData('staff_code', e.target.value)}
                                    placeholder="Enter staff code"
                                    error={formErrors.staff_code}
                                />
                                <FormInput
                                    label="Staff Name"
                                    id="staff_name"
                                    value={data.staff_name}
                                    onChange={(e) => setData('staff_name', e.target.value)}
                                    placeholder="Enter staff name"
                                    error={formErrors.staff_name}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Combo FLag"
                                    id="combo_flag"
                                    value={Boolean(data.combo_flag)}
                                    onChange={(e) => setData('combo_flag', Boolean(e.target.value))}
                                    placeholder="Enter t/f for combo flag"
                                    error={formErrors.combo_flag}
                                />

                                {/* <FormInput
                                    label="Time stamp"
                                    id="timestamp"
                                    value={data.timestamp}
                                    onChange={(e) => setData('timestamp', e.target.value)}
                                    placeholder="Enter timestamp"
                                    error={formErrors.timestamp}
                                /> */}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 4: Address */}
                {step === 3 && (
                    <Card className="border-none shadow-sm">
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
                                    label="Address"
                                    id="cust_addr"
                                    value={data.cust_addr}
                                    onChange={(e) => setData('cust_addr', e.target.value)}
                                    placeholder="Enter Address"
                                    error={formErrors['cust_addr']}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1} className="cursor-pointer hover:opacity-80">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    {step < 3 ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={step === 1 && (!data.cust_name || !data.longitude)}
                            className="cursor-pointer bg-primary hover:opacity-90"
                        >
                            Next
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="button" onClick={submit} disabled={processing} className="cursor-pointer bg-primary hover:opacity-90">
                            Submit Request
                            <CheckCircle className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
