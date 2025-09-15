import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customer } from '@/types/customer';
import { SurveyRequest, SurveyRequestFormValues } from '@/types/survey';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

type SurveyRequestFormProps = {
    surveyRequest?: SurveyRequest;
    customers: Pick<Customer, 'id' | 'first_name' | 'last_name'>[];
};

export default function SurveyRequestForm({ surveyRequest, customers }: SurveyRequestFormProps) {
    const { props } = usePage();
    const queryParams = new URLSearchParams(window.location.search);
    const servicesFromQuery = queryParams.get('services')?.split(',') || [];
    const { data, setData, post, put, errors, processing } = useForm<SurveyRequestFormValues>('createSurvey', {
        customer_id: surveyRequest?.customer_id || undefined,
        customer_code: surveyRequest?.customer_code || '',
        survey_type: surveyRequest?.survey_type || '',
        telecom_region: surveyRequest?.telecom_region || '',
        operation_type: surveyRequest?.operation_type || '',
        main_offer_id: surveyRequest?.main_offer_id || '',
        bandwidth: surveyRequest?.bandwidth || '',
        contact_person: surveyRequest?.contact_person || '',
        contact_no: surveyRequest?.contact_no || '',
        contact_email: surveyRequest?.contact_email || '',
        sec_contact_person: surveyRequest?.sec_contact_person || '',
        sec_contact_no: surveyRequest?.sec_contact_no || '',
        sec_contact_email: surveyRequest?.sec_contact_email || '',
        status: surveyRequest?.status || 'Pending',
        completed_date: surveyRequest?.completed_date || new Date().toISOString(),
        services: surveyRequest?.services || servicesFromQuery,
    });
    // Set default survey type based on services
    useEffect(() => {
        if (servicesFromQuery.length > 0 && !surveyRequest) {
            if (servicesFromQuery.includes('COMBO')) {
                setData('survey_type', 'Combo Installation');
            } else if (servicesFromQuery.includes('FL')) {
                setData('survey_type', 'FL Installation');
            } else if (servicesFromQuery.includes('FBB')) {
                setData('survey_type', 'FBB Installation');
            }
        }
    }, [servicesFromQuery, surveyRequest]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (surveyRequest) {
            put(route('survey-requests.update', surveyRequest.id));
        } else {
            post(route('survey-requests.store'));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/*Main Details */}
                <div className="lg:col-span-2">
                    <Card className="shadom-sm border-none">
                        <CardHeader>
                            <CardTitle>Survey Details</CardTitle>
                            <CardDescription>Provide the main details for the survey request.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="customer_id">Customer</Label>
                                <Select
                                    name="customer_id"
                                    value={data.customer_id ? String(data.customer_id) : ''}
                                    onValueChange={(value) => setData('customer_id', Number(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((customer) => (
                                            <SelectItem key={customer.id} value={String(customer.id)}>
                                                {customer.first_name} {customer.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.customer_id} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="customer_code">Customer Code</Label>
                                <Input id="customer_code" value={data.customer_code} onChange={(e) => setData('customer_code', e.target.value)} />
                                <InputError message={errors.customer_code} className="mt-2" />
                            </div>

                            {/* <div>
                                <Label htmlFor="customer_survey_order_id">Survey Request Number</Label>
                                <Input
                                    id="customer_survey_order_id"
                                    value={data.customer_survey_order_id}
                                    onChange={(e) => setData('customer_survey_order_id', e.target.value)}
                                    disabled={!!surveyRequest}
                                />
                                <InputError message={errors.customer_survey_order_id} className="mt-2" />
                            </div> */}
                            <div>
                                <Label htmlFor="survey_type">Survey Type</Label>
                                <Select name="survey_type" value={data.survey_type} onValueChange={(value) => setData('survey_type', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a survey type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="change">Change</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.survey_type} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="telecom_region">Telecom Region</Label>
                                <Input id="telecom_region" value={data.telecom_region} onChange={(e) => setData('telecom_region', e.target.value)} />
                                <InputError message={errors.telecom_region} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="operation_type">Operation Type</Label>
                                <Input id="operation_type" value={data.operation_type} onChange={(e) => setData('operation_type', e.target.value)} />
                                <InputError message={errors.operation_type} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="main_offer_id">Main Offer ID</Label>
                                <Input id="main_offer_id" value={data.main_offer_id} onChange={(e) => setData('main_offer_id', e.target.value)} />
                                <InputError message={errors.main_offer_id} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="bandwidth">Bandwidth</Label>
                                <Input id="bandwidth" value={data.bandwidth} onChange={(e) => setData('bandwidth', e.target.value)} />
                                <InputError message={errors.bandwidth} className="mt-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-8 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>Primary and secondary contact details.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="contact_person">Primary Contact Person</Label>
                                <Input id="contact_person" value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} />
                                <InputError message={errors.contact_person} className="mt-2" />
                            </div>
                            <div>
                                <Label htmlFor="contact_no">Primary Contact No.</Label>
                                <Input id="contact_no" value={data.contact_no} onChange={(e) => setData('contact_no', e.target.value)} />
                                <InputError message={errors.contact_no} className="mt-2" />
                            </div>
                            <div className="sm:col-span-2">
                                <Label htmlFor="contact_email">Primary Contact Email</Label>
                                <Input
                                    type="email"
                                    id="contact_email"
                                    value={data.contact_email}
                                    onChange={(e) => setData('contact_email', e.target.value)}
                                />
                                <InputError message={errors.contact_email} className="mt-2" />
                            </div>
                            <hr className="sm:col-span-2" />
                            <div>
                                <Label htmlFor="sec_contact_person">Secondary Contact Person</Label>
                                <Input
                                    id="sec_contact_person"
                                    value={data.sec_contact_person}
                                    onChange={(e) => setData('sec_contact_person', e.target.value)}
                                />
                                <InputError message={errors.sec_contact_person} className="mt-2" />
                            </div>
                            <div>
                                <Label htmlFor="sec_contact_no">Secondary Contact No.</Label>
                                <Input id="sec_contact_no" value={data.sec_contact_no} onChange={(e) => setData('sec_contact_no', e.target.value)} />
                                <InputError message={errors.sec_contact_no} className="mt-2" />
                            </div>
                            <div className="sm:col-span-2">
                                <Label htmlFor="sec_contact_email">Secondary Contact Email</Label>
                                <Input
                                    type="email"
                                    id="sec_contact_email"
                                    value={data.sec_contact_email}
                                    onChange={(e) => setData('sec_contact_email', e.target.value)}
                                />
                                <InputError message={errors.sec_contact_email} className="mt-2" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={processing} className="cursor-pointer">
                                {surveyRequest ? 'Update Request' : 'Create Request'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Status and Actions */}
                {/* <div className="lg:col-span-1">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Status & Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" value={data.status} onValueChange={(value) => setData('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                            <div>
                                <Label htmlFor="completed_date">Completed Date</Label>
                                <Input
                                    type="date"
                                    id="completed_date"
                                    value={data.completed_date}
                                    onChange={(e) => setData('completed_date', e.target.value)}
                                />
                                <InputError message={errors.completed_date} className="mt-2" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={processing} className="cursor-pointer">
                                {surveyRequest ? 'Update Request' : 'Create Request'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div> */}
            </div>
        </form>
    );
}
