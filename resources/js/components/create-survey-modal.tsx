// import { Button } from '@/components/ui/button';
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Select, SelectItem } from '@/components/ui/select';
// import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
// import { useSurveyTypes } from '@/hooks/use-survey-types';
// import React, { Suspense, useEffect, useState } from 'react';
// import { toast } from 'sonner';
// const LocationMap = React.lazy(() => import('@/components/location-map'));

// interface Customer {
//   id: string;
//   code: string;
//   customer_type: 'residential' | 'enterprise';
//   contact?: {
//     name?: string;
//     mobile_no?: string;
//     email?: string;
//   };
//   address?: {
//     city?: string;
//   };
// }

// interface CreateSurveyModalProps {
//     open: boolean;
//     onClose: () => void;
//     customer: Customer;
// }

// export default function CreateSurveyModal({ open, onClose, customer }: CreateSurveyModalProps) {
//     // Survey form state
//     const [form, setForm] = useState({
//         customer_code: customer.code || customer.id || '',
//         survey_type: '',
//         telecom_region: '',
//         oper_type: 'A',
//         main_offer_id: '',
//         bandwidth: '',
//         contact_person: customer.contact?.name || '',
//         contact_no: customer.contact?.mobile_no || '',
//         contact_email: customer.contact?.email || '',
//         completed_date: '',
//         survey_address_info: {
//             address: customer.address?.city || '',
//             latitude: 0,
//             longitude: 0,
//         },
//     });

//     const [errors, setErrors] = useState<Record<string, string>>({});
//     const [loading, setLoading] = useState(false);

//     // Fetch survey types and bandwidths from backend
//     const { types, loading: loadingTypes, error: errorTypes } = useSurveyTypes();
//     const { residentialOptions, enterpriseOptions, loading: loadingBandwidths, error: errorBandwidths } = useBandwidthOptions();

//     // Map location state
//     const [location, setLocation] = useState<{ latitude: number; longitude: number }>({
//         latitude: form.survey_address_info.latitude,
//         longitude: form.survey_address_info.longitude,
//     });

//     useEffect(() => {
//         setForm((prev) => ({
//             ...prev,
//             survey_address_info: {
//                 ...prev.survey_address_info,
//                 latitude: location.latitude,
//                 longitude: location.longitude,
//             },
//         }));
//     }, [location]);

//     // Handle input changes
//     const handleChange = (field: string, value: any) => {
//         setForm((prev) => ({ ...prev, [field]: value }));
//         setErrors((prev) => ({ ...prev, [field]: '' }));
//     };

//     // Handle nested address info
//     const handleAddressChange = (field: string, value: any) => {
//         setForm((prev) => ({
//             ...prev,
//             survey_address_info: { ...prev.survey_address_info, [field]: value },
//         }));
//         setErrors((prev) => ({ ...prev, [field]: '' }));
//     };

//     // Submit survey creation
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setErrors({});
//         try {
//             // Replace with your actual API call
//             await createSurvey(form);
//             toast.success('Survey created successfully!');
//             onClose();
//         } catch (err: any) {
//             setErrors(err?.response?.data?.errors || {});
//             toast.error('Failed to create survey.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <Dialog open={open} onOpenChange={onClose}>
//             <DialogContent>
//                 <DialogHeader>
//                     <DialogTitle>Create New Survey</DialogTitle>
//                 </DialogHeader>
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     <label className="mb-1 block text-sm font-medium text-gray-700">Customer Code</label>
//                     <Input value={form.customer_code} disabled className="w-full" />
//                     <Select label="Survey Type" value={form.survey_type} onValueChange={(val) => handleChange('survey_type', val)} required>
//                         {loadingTypes ? (
//                             <SelectItem value="" disabled>
//                                 Loading...
//                             </SelectItem>
//                         ) : (
//                             types.map((type: any) => (
//                                 <SelectItem key={type.id} value={type.id}>
//                                     {type.name}
//                                 </SelectItem>
//                             ))
//                         )}
//                     </Select>
//                     <Input
//                         label="Telecom Region"
//                         value={form.telecom_region}
//                         onChange={(e) => handleChange('telecom_region', e.target.value)}
//                         required
//                     />
//                     <Select label="Operation Type" value={form.oper_type} onValueChange={(val) => handleChange('oper_type', val)} required>
//                         <SelectItem value="A">New</SelectItem>
//                         <SelectItem value="M">Modify</SelectItem>
//                     </Select>
//                     <Input
//                         label="Main Offer ID"
//                         value={form.main_offer_id}
//                         onChange={(e) => handleChange('main_offer_id', e.target.value)}
//                         required
//                     />
//                     <Select label="Bandwidth" value={form.bandwidth} onValueChange={(val) => handleChange('bandwidth', val)} required>
//                         {loadingBandwidths ? (
//                             <SelectItem value="" disabled>
//                                 Loading...
//                             </SelectItem>
//                         ) : customer.customer_type === 'residential' ? (
//                             residentialOptions.map((bw) => (
//                                 <SelectItem key={bw.value} value={bw.value}>
//                                     {bw.label}
//                                 </SelectItem>
//                             ))
//                         ) : (
//                             enterpriseOptions.map((bw) => (
//                                 <SelectItem key={bw.value} value={bw.value}>
//                                     {bw.label}
//                                 </SelectItem>
//                             ))
//                         )}
//                     </Select>

//                     <Input
//                         label="Contact Person"
//                         value={form.contact_person}
//                         onChange={(e) => handleChange('contact_person', e.target.value)}
//                         required
//                     />
//                     <Input label="Contact No" value={form.contact_no} onChange={(e) => handleChange('contact_no', e.target.value)} required />
//                     <Input
//                         label="Contact Email"
//                         type="email"
//                         value={form.contact_email}
//                         onChange={(e) => handleChange('contact_email', e.target.value)}
//                         required
//                     />
//                     <Input
//                         label="Completed Date"
//                         type="date"
//                         value={form.completed_date}
//                         onChange={(e) => handleChange('completed_date', e.target.value)}
//                         required
//                     />
//                     <Input
//                         label="Survey Address"
//                         value={form.survey_address_info.address}
//                         onChange={(e) => handleAddressChange('address', e.target.value)}
//                         required
//                     />
//                     <div>
//                         <Suspense fallback={<div>Loading map...</div>}>
//                             <LocationMap latitude={location.latitude} longitude={location.longitude} onLocationChange={setLocation} />
//                         </Suspense>
//                     </div>
//                     <DialogFooter>
//                         <Button type="submit" loading={loading}>
//                             Create Survey
//                         </Button>
//                         <Button type="button" variant="outline" onClick={onClose}>
//                             Cancel
//                         </Button>
//                     </DialogFooter>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     );
// }

// // Example API call (replace with your actual API logic)
// async function createSurvey(data: any) {
//     const res = await fetch('/api/survey-requests', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//     });
//     if (!res.ok) throw await res.json();
//     return await res.json();
// }

import FormInput from '@/components/form-input';
import FormSelect from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
import { useSurveyTypes } from '@/hooks/use-survey-types';
import { Customer } from '@/types/customer';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

const LocationMap = Suspense ? Suspense : () => null; // fallback for SSR or lazy import
const LazyLocationMap = () => (
    <Suspense fallback={<div>Loading map...</div>}>
        <LocationMap />
    </Suspense>
);

// interface Customer {
//     id: number | string;
//     code?: string;
//     customer_type: 'residential' | 'enterprise' | string | undefined;
//     contact?: { name?: string; mobile_no?: string; email?: string };
//     address?: { city?: string };
// }

interface CreateSurveyModalProps {
    open: boolean;
    onClose: () => void;
    customer: Customer;
}

export default function CreateSurveyModal({ open, onClose, customer }: CreateSurveyModalProps) {
    const [form, setForm] = useState({
        customer_code: customer.code || customer.id || '',
        survey_type: '',
        telecom_region: '',
        oper_type: 'A',
        main_offer_id: '',
        bandwidth: '',
        contact_person: customer.contact_person?.first_name || '',
        contact_no: customer.contact?.mobile_no || '',
        contact_email: customer.contact?.email || '',
        completed_date: '',
        survey_address_info: {
            address: customer.address?.city || '',
            latitude: 0,
            longitude: 0,
        },
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const { types, loading: loadingTypes, error: errorTypes } = useSurveyTypes();
    const { residentialOptions, enterpriseOptions, loading: loadingBandwidths, error: errorBandwidths } = useBandwidthOptions();

    const [location, setLocation] = useState({ latitude: 0, longitude: 0 });

    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            survey_address_info: {
                ...prev.survey_address_info,
                latitude: location.latitude,
                longitude: location.longitude,
            },
        }));
    }, [location]);

    const handleChange = (field: string, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleAddressChange = (field: string, value: any) => {
        setForm((prev) => ({
            ...prev,
            survey_address_info: { ...prev.survey_address_info, [field]: value },
        }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            await createSurvey(form);
            toast.success('Survey created successfully!');
            onClose();
        } catch (err: any) {
            setErrors(err?.response?.data?.errors || {});
            toast.error('Failed to create survey.');
        } finally {
            setLoading(false);
        }
    };

    const bandwidthOptions = customer.customer_type === 'residential' ? residentialOptions : enterpriseOptions;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Survey</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormInput id="customer_code" label="Customer Code" value={form.customer_code} disabled />

                    <FormSelect
                        id="survey_type"
                        label="Survey Type"
                        value={form.survey_type}
                        onChange={(val) => handleChange('survey_type', val)}
                        options={types}
                        error={errors.survey_type}
                        loading={loadingTypes}
                        placeholder="Select survey type"
                    />

                    <FormInput
                        id="telecom_region"
                        label="Telecom Region"
                        value={form.telecom_region}
                        onChange={(e) => handleChange('telecom_region', e.target.value)}
                        error={errors.telecom_region}
                    />

                    <FormSelect
                        id="oper_type"
                        label="Operation Type"
                        value={form.oper_type}
                        onChange={(val) => handleChange('oper_type', val)}
                        options={[
                            { label: 'New', value: 'A' },
                            { label: 'Modify', value: 'M' },
                        ]}
                        error={errors.oper_type}
                        placeholder="Select operation type"
                    />

                    <FormInput
                        id="main_offer_id"
                        label="Main Offer ID"
                        value={form.main_offer_id}
                        onChange={(e) => handleChange('main_offer_id', e.target.value)}
                        error={errors.main_offer_id}
                    />

                    <FormSelect
                        id="bandwidth"
                        label="Bandwidth"
                        value={form.bandwidth}
                        onChange={(val) => handleChange('bandwidth', val)}
                        options={bandwidthOptions}
                        error={errors.bandwidth}
                        loading={loadingBandwidths}
                        placeholder="Select bandwidth"
                    />

                    <FormInput
                        id="contact_person"
                        label="Contact Person"
                        value={form.contact_person}
                        onChange={(e) => handleChange('contact_person', e.target.value)}
                        error={errors.contact_person}
                    />

                    <FormInput
                        id="contact_no"
                        label="Contact No"
                        value={form.contact_no}
                        onChange={(e) => handleChange('contact_no', e.target.value)}
                        error={errors.contact_no}
                    />

                    <FormInput
                        id="contact_email"
                        label="Contact Email"
                        type="email"
                        value={form.contact_email}
                        onChange={(e) => handleChange('contact_email', e.target.value)}
                        error={errors.contact_email}
                    />

                    <FormInput
                        id="completed_date"
                        label="Completed Date"
                        type="date"
                        value={form.completed_date}
                        onChange={(e) => handleChange('completed_date', e.target.value)}
                        error={errors.completed_date}
                    />

                    <FormInput
                        id="survey_address"
                        label="Survey Address"
                        value={form.survey_address_info.address}
                        onChange={(e) => handleAddressChange('address', e.target.value)}
                        error={errors.survey_address}
                    />

                    <div>
                        <Suspense fallback={<div>Loading map...</div>}>
                            <LocationMap latitude={location.latitude} longitude={location.longitude} onLocationChange={setLocation} />
                        </Suspense>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Survey'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Example API call (replace with your actual API logic)
async function createSurvey(data: any) {
    const res = await fetch('/api/survey-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
}
