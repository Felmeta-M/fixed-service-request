import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customer } from '@/types/customer';
import { Subscriber, SubscriberFormValues, subscriberSchema } from '@/types/subscriber';
import { SurveyRequest } from '@/types/survey';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';

type SubscriberFormProps = {
    subscriber?: Subscriber;
    customers: Pick<Customer, 'id' | 'first_name' | 'last_name'>[];
    surveyRequests: Pick<SurveyRequest, 'id' | 'survey_request_number'>[];
};

export default function SubscriberForm({ subscriber, customers, surveyRequests }: SubscriberFormProps) {
    const [extParamsText, setExtParamsText] = useState<string>(JSON.stringify(subscriber?.account_ext_params));
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const PAYMENT_TYPES = [
        { value: 'prepaid', label: 'Prepaid' },
        { value: 'postpaid', label: 'Postpaid' },
    ];
    const BILL_CYCLES = [
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'yearly', label: 'Yearly' },
    ];
    const PAYMENT_MODES = [
        { value: 'cash', label: 'Cash' },
        { value: 'bank', label: 'Bank' },
        { value: 'mobile', label: 'Mobile' },
    ];

    const { data, setData, post, put, errors, processing } = useForm<SubscriberFormValues>('createSubscriber', {
        customer_survey_order_id: subscriber?.customer_survey_order_id || '',
        customer_code: subscriber?.customer_code || '',
        payment_type: subscriber?.payment_type || '',
        bill_cycle: subscriber?.bill_cycle || '',
        ethio_zone_or_region: subscriber?.ethio_zone_or_region || '',
        collection_center: subscriber?.collection_center || '',
        account_language: subscriber?.account_language || '',
        first_name: subscriber?.first_name || '',
        middle_or_father_name: subscriber?.middle_or_father_name || '',
        last_name: subscriber?.last_name || '',
        enterprise_customer_name: subscriber?.enterprise_customer_name || '',
        credit_class: subscriber?.credit_class || '',
        administrative_region_city: subscriber?.administrative_region_city || '',
        subcity_zone: subscriber?.subcity_zone || '',
        wereda_town: subscriber?.wereda_town || '',
        kebele: subscriber?.kebele || '',
        house_no: subscriber?.house_no || '',
        sms_no: subscriber?.sms_no || '',
        payment_mode: subscriber?.payment_mode || '',
        account_ext_params: subscriber?.account_ext_params || [],
        external_sequence: subscriber?.external_sequence || '',
        network_type: subscriber?.network_type || '',
        sub_type: subscriber?.sub_type || '',
        sub_language: subscriber?.sub_language || '',
        offering_id: subscriber?.offering_id || '',
        effective_mode: subscriber?.effective_mode || '',
        sla_priority: subscriber?.sla_priority || '',
        call_center_access: subscriber?.call_center_access || '',
        external_operid: subscriber?.external_operid || '',
        installment_completed_date: subscriber?.installment_completed_date || '',
        installment_amount: subscriber?.installment_amount || '',
        payment_frequency: subscriber?.payment_frequency || '',
        next_payment_date: subscriber?.next_payment_date || '',
        additional_info: subscriber?.additional_info || '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setFormErrors({});
        let parsedParams: Record<string, unknown>[] = [];
        try {
            const parsed = JSON.parse(extParamsText);
            if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))) {
                parsedParams = parsed as Record<string, unknown>[];
            } else {
                parsedParams = [];
            }
        } catch {
            parsedParams = [];
        }
        let formattedDate = data.installment_completed_date;
        if (data.installment_completed_date) {
            const dt = new Date(data.installment_completed_date);
            formattedDate =
                dt.getFullYear().toString() +
                (dt.getMonth() + 1).toString().padStart(2, '0') +
                dt.getDate().toString().padStart(2, '0') +
                dt.getHours().toString().padStart(2, '0') +
                dt.getMinutes().toString().padStart(2, '0') +
                dt.getSeconds().toString().padStart(2, '0');
        }
        setData('account_ext_params', parsedParams);
        setData('installment_completed_date', formattedDate);
        // Zod validation
        const result = subscriberSchema.safeParse({ ...data, account_ext_params: parsedParams, installment_completed_date: formattedDate });
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            for (const [key, val] of Object.entries(result.error.flatten().fieldErrors)) {
                if (val && val.length > 0) fieldErrors[key] = val[0];
            }
            setFormErrors(fieldErrors);
            console.log('field errors', fieldErrors);
            toast.error('Please fix the form errors.');
            return;
        }
        if (subscriber) {
            put(route('subscribers.update', subscriber.id), {
                onSuccess: () => toast.success('Subscriber updated successfully!'),
                onError: () => toast.error('Failed to update subscriber.'),
            });
        } else {
            post(route('subscribers.store'), {
                onSuccess: () => toast.success('Subscriber created successfully!'),
                onError: () => toast.error('Failed to create subscriber.'),
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle>{subscriber ? 'Edit Subscriber' : 'New Subscriber'}</CardTitle>
                    <CardDescription>Enter subscriber details below.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="customer_survey_order_id">Survey Request</Label>
                        <Select
                            name="customer_survey_order_id"
                            value={data.customer_survey_order_id}
                            onValueChange={(val) => setData('customer_survey_order_id', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a survey" />
                            </SelectTrigger>
                            <SelectContent>
                                {surveyRequests?.map((sr) => (
                                    <SelectItem key={sr.id} value={String(sr.id)}>
                                        {sr.survey_request_number}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.customer_survey_order_id} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="customer_code">Customer Code</Label>
                        <Input id="customer_code" value={data.customer_code} onChange={(e) => setData('customer_code', e.target.value)} />
                        <InputError message={errors.customer_code} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="payment_type">Payment Type</Label>
                        <Select name="payment_type" value={data.payment_type} onValueChange={(val) => setData('payment_type', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_TYPES.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={formErrors.payment_type || errors.payment_type} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="bill_cycle">Bill Cycle</Label>
                        <Select name="bill_cycle" value={data.bill_cycle} onValueChange={(val) => setData('bill_cycle', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select bill cycle" />
                            </SelectTrigger>
                            <SelectContent>
                                {BILL_CYCLES.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={formErrors.bill_cycle || errors.bill_cycle} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="ethio_zone_or_region">Region</Label>
                        <Input
                            id="ethio_zone_or_region"
                            value={data.ethio_zone_or_region}
                            onChange={(e) => setData('ethio_zone_or_region', e.target.value)}
                        />
                        <InputError message={errors.ethio_zone_or_region} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="collection_center">Collection Center</Label>
                        <Input id="collection_center" value={data.collection_center} onChange={(e) => setData('collection_center', e.target.value)} />
                        <InputError message={errors.collection_center} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="account_language">Account Language</Label>
                        <Input id="account_language" value={data.account_language} onChange={(e) => setData('account_language', e.target.value)} />
                        <InputError message={errors.account_language} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input id="first_name" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
                        <InputError message={errors.first_name} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="middle_or_father_name">Middle/Father Name</Label>
                        <Input
                            id="middle_or_father_name"
                            value={data.middle_or_father_name}
                            onChange={(e) => setData('middle_or_father_name', e.target.value)}
                        />
                        <InputError message={errors.middle_or_father_name} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input id="last_name" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                        <InputError message={errors.last_name} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="enterprise_customer_name">Enterprise Name</Label>
                        <Input
                            id="enterprise_customer_name"
                            value={data.enterprise_customer_name}
                            onChange={(e) => setData('enterprise_customer_name', e.target.value)}
                        />
                        <InputError message={errors.enterprise_customer_name} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="credit_class">Credit Class</Label>
                        <Input id="credit_class" value={data.credit_class} onChange={(e) => setData('credit_class', e.target.value)} />
                        <InputError message={errors.credit_class} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="administrative_region_city">City</Label>
                        <Input
                            id="administrative_region_city"
                            value={data.administrative_region_city}
                            onChange={(e) => setData('administrative_region_city', e.target.value)}
                        />
                        <InputError message={errors.administrative_region_city} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="subcity_zone">Subcity</Label>
                        <Input id="subcity_zone" value={data.subcity_zone} onChange={(e) => setData('subcity_zone', e.target.value)} />
                        <InputError message={errors.subcity_zone} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="wereda_town">Wereda</Label>
                        <Input id="wereda_town" value={data.wereda_town} onChange={(e) => setData('wereda_town', e.target.value)} />
                        <InputError message={errors.wereda_town} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="kebele">Kebele</Label>
                        <Input id="kebele" value={data.kebele} onChange={(e) => setData('kebele', e.target.value)} />
                        <InputError message={errors.kebele} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="house_no">House No.</Label>
                        <Input id="house_no" value={data.house_no} onChange={(e) => setData('house_no', e.target.value)} />
                        <InputError message={errors.house_no} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="sms_no">SMS No.</Label>
                        <Input id="sms_no" value={data.sms_no} onChange={(e) => setData('sms_no', e.target.value)} />
                        <InputError message={errors.sms_no} className="mt-2" />
                    </div>

                    <div>
                        <Label htmlFor="payment_mode">Payment Mode</Label>
                        <Select name="payment_mode" value={data.payment_mode} onValueChange={(val) => setData('payment_mode', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment mode" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_MODES.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={formErrors.payment_mode || errors.payment_mode} className="mt-2" />
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6 border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Subscriber Details</CardTitle>
                    <CardDescription>Additional subscriber-specific parameters.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="external_sequence">External Sequence</Label>
                        <Input id="external_sequence" value={data.external_sequence} onChange={(e) => setData('external_sequence', e.target.value)} />
                        <InputError message={errors.external_sequence} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="network_type">Network Type</Label>
                        <Input id="network_type" value={data.network_type} onChange={(e) => setData('network_type', e.target.value)} />
                        <InputError message={errors.network_type} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="sub_type">Subscription Type</Label>
                        <Input id="sub_type" value={data.sub_type} onChange={(e) => setData('sub_type', e.target.value)} />
                        <InputError message={errors.sub_type} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="sub_language">Subscription Language</Label>
                        <Input id="sub_language" value={data.sub_language} onChange={(e) => setData('sub_language', e.target.value)} />
                        <InputError message={errors.sub_language} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="offering_id">Offering ID</Label>
                        <Input id="offering_id" value={data.offering_id} onChange={(e) => setData('offering_id', e.target.value)} />
                        <InputError message={errors.offering_id} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="effective_mode">Effective Mode</Label>
                        <Input id="effective_mode" value={data.effective_mode} onChange={(e) => setData('effective_mode', e.target.value)} />
                        <InputError message={errors.effective_mode} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="sla_priority">SLA Priority</Label>
                        <Input id="sla_priority" value={data.sla_priority} onChange={(e) => setData('sla_priority', e.target.value)} />
                        <InputError message={errors.sla_priority} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="call_center_access">Call Center Access</Label>
                        <Input
                            id="call_center_access"
                            value={data.call_center_access}
                            onChange={(e) => setData('call_center_access', e.target.value)}
                        />
                        <InputError message={errors.call_center_access} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="external_operid">External Operator ID</Label>
                        <Input id="external_operid" value={data.external_operid} onChange={(e) => setData('external_operid', e.target.value)} />
                        <InputError message={errors.external_operid} className="mt-2" />
                    </div>
                    <div className="sm:col-span-2">
                        <Label htmlFor="installment_completed_date">Installment Completed Date</Label>
                        <Input
                            type="datetime-local"
                            id="installment_completed_date"
                            value={data.installment_completed_date || ''}
                            onChange={(e) => setData('installment_completed_date', e.target.value)}
                        />
                        <InputError message={errors.installment_completed_date} className="mt-2" />
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6 border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Account Parameters</CardTitle>
                    <CardDescription>Parameters related to the subscriber's account.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="account_ext_params">Account Parameters</Label>
                        <Input
                            type="text"
                            placeholder="Enter parameters"
                            id="account_ext_params"
                            value={extParamsText}
                            onChange={(e) => setExtParamsText(e.target.value)}
                            className="textarea"
                        />
                        <InputError message={errors.account_ext_params} className="mt-2" />
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6 border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>Details regarding the payment information.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="installment_amount">Installment Amount</Label>
                        <Input
                            id="installment_amount"
                            value={data.installment_amount}
                            onChange={(e) => setData('installment_amount', e.target.value)}
                        />
                        <InputError message={formErrors.installment_amount || errors.installment_amount} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="payment_frequency">Payment Frequency</Label>
                        <Input id="payment_frequency" value={data.payment_frequency} onChange={(e) => setData('payment_frequency', e.target.value)} />
                        <InputError message={formErrors.payment_frequency || errors.payment_frequency} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="next_payment_date">Next Payment Date</Label>
                        <Input
                            type="date"
                            id="next_payment_date"
                            value={data.next_payment_date}
                            onChange={(e) => setData('next_payment_date', e.target.value)}
                        />
                        <InputError message={formErrors.next_payment_date || errors.next_payment_date} className="mt-2" />
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6 border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                    <CardDescription>Any other relevant information.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="additional_info">Additional Info</Label>
                        <Input id="additional_info" value={data.additional_info} onChange={(e) => setData('additional_info', e.target.value)} />
                        <InputError message={formErrors.additional_info || errors.additional_info} className="mt-2" />
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6 border-none shadow-sm">
                <CardFooter>
                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}{' '}
                        {subscriber ? 'Update Subscriber' : 'Create Subscriber'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
