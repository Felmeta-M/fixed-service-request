import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Resource, ResourceFormValues } from '@/types/resource';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FileText, Phone, User } from 'lucide-react';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

type FormInputProps = {
    label: string;
    id: string;
    value: string | number | null | boolean | undefined;
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

export default function Edit() {
    const { props } = usePage<{ check: Resource }>();
    const check = props.check;
    console.log(check);
    const { data, setData, put, processing } = useForm<ResourceFormValues>({
        prod_spec_code: check.prod_spec_code || '',
        number_line: check.number_line || null,
        event_code: check.event_code || '',
        cust_id: check.cust_id || '',
        cust_name: check.cust_name || '',
        longitude: check.longitude || null,
        latitude: check.latitude || null,
        staff_code: check.staff_code || '',
        staff_name: check.staff_name || '',
        combo_flag: check.combo_flag || false,
        // timestamp: '',
        cust_addr: check.cust_addr || '',
    });
    console.log(data);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Customers', href: '/customers' },
        { title: 'Edit', href: `/customers/${check.id}/edit` },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('resource-checks.update', check.id), {
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
                                <FormInput
                                    label=" prod_spec_code"
                                    id="prod_spec_code"
                                    value={data.prod_spec_code}
                                    onChange={(e) => setData('prod_spec_code', e.currentTarget.value)}
                                />
                            </div>

                            <div>
                                <FormInput
                                    label=" number_line"
                                    id="number_line"
                                    type="number"
                                    value={data.number_line}
                                    onChange={(e) => setData('number_line', Number(e.currentTarget.value))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <FormInput
                                    label=" event_code"
                                    id="event_code"
                                    value={data.event_code}
                                    onChange={(e) => setData('event_code', e.currentTarget.value)}
                                />
                            </div>

                            <div className="space-y-2"></div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <FormInput label="cust_id" id="cust_id" value={data.cust_id} onChange={(e) => setData('cust_id', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="cust_name"
                                    id="cust_name"
                                    value={data.cust_name}
                                    onChange={(e) => setData('cust_name', e.target.value)}
                                    placeholder="Enter place of birth"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <FormInput
                                    label="longitude"
                                    id="longitude"
                                    value={Number(data.longitude)}
                                    onChange={(e) => setData('longitude', Number(e.target.value))}
                                    placeholder="Enter nationality"
                                />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="latitude"
                                    id="latitude"
                                    value={Number(data.latitude)}
                                    onChange={(e) => setData('latitude', Number(e.target.value))}
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
                                <FormInput
                                    label="staff_code"
                                    id="staff_code"
                                    value={data.staff_code}
                                    onChange={(e) => setData('staff_code', e.target.value)}
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
                                    label="staff_name"
                                    id="staff_name"
                                    value={data.staff_name}
                                    onChange={(e) => setData('staff_name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormInput
                                    label="combo_flag"
                                    id="combo_flag"
                                    value={data.combo_flag}
                                    onChange={(e) => setData('combo_flag', Boolean(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FormInput
                                label="cust_addr"
                                id="cust_addr"
                                type="cust_addr"
                                value={data.cust_addr}
                                onChange={(e) => setData('cust_addr', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex space-x-2">
                    <Button className="cursor-pointer" type="submit" disabled={processing}>
                        Update
                    </Button>
                    <Link href={route('resource-checks.index')}>
                        <Button className="cursor-pointer" variant="secondary">
                            Cancel
                        </Button>
                    </Link>
                </div>
            </form>
        </AppLayout>
    );
}
