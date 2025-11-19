import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { CheckCircle, Loader2, MapPin, User, Wifi } from 'lucide-react';
import { useState } from 'react';

interface ReviewSubmitStepProps {
    formData: any;
    onBack: () => void;
}

const serviceTypes = {
    '1943913915': { name: 'Fixed Broadband', icon: Wifi, color: 'blue' },
    '1207609454': { name: 'Fixed Voice', icon: Wifi, color: 'green' },
    '102647257': { name: 'Combo Services', icon: Wifi, color: 'purple' },
};

export function ReviewSubmitStep({ formData, onBack }: ReviewSubmitStepProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const serviceInfo = serviceTypes[formData.serviceType as keyof typeof serviceTypes];

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');

        try {
            // Format the data for API submission
            const submitData = {
                customer_code: formData.customerCode || '828204303', // Get from localStorage
                survey_type: 'EIC08',
                telecom_region: '104',
                oper_type: 'A',
                main_offer_id: formData.serviceType,
                survey_address_info: {
                    region_city: '2',
                    subcity_zone: '11',
                    wereda_town: '141',
                    kebele: '',
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    address: formData.address || '',
                },
                bandwidth: '2048M',
                // bandwidth: formData.bandwidth || '2048M',
                contact_person: formData.contactPerson || 'Customer',
                contact_no: formData.contactNo || '0966778899',
                contact_email: formData.contactEmail || 'customer@ethiotelecom.et',
                completed_date: new Date()
                    .toISOString()
                    .replace(/[-:T.Z]/g, '')
                    .slice(0, 14),
                external_operid: '512',
                customer_type: formData.customerType || 'residential',
            };

            const response = await axios.post('/api/v1/survey/create', submitData);

            if (response.data.success) {
                // Store in localStorage
                const newSurvey = {
                    id: response.data.survey_id || Date.now(),
                    type: serviceInfo.name,
                    status: 'waiting',
                    createdAt: new Date().toISOString(),
                    customerCode: submitData.customer_code,
                    main_offer_id: formData.serviceType,
                };

                const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
                existingSurveys.push(newSurvey);
                localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));

                // Redirect to dashboard
                router.visit('/dashboard');
            } else {
                setError(response.data.message || 'Failed to create service request');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit service request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Review Summary */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Service Details */}
                <Card>
                    <CardContent className="p-6">
                        <div className="mb-4 flex items-center space-x-3">
                            <div className="rounded-lg bg-blue-100 p-2">
                                <Wifi className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Service Details</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Service Type:</span>
                                <span className="font-semibold">{serviceInfo?.name}</span>
                            </div>
                            {formData.bandwidth && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Bandwidth:</span>
                                    <span className="font-semibold">{formData.bandwidth}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Customer Type:</span>
                                <span className="font-semibold capitalize">{formData.customerType || 'residential'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Location Details */}
                <Card>
                    <CardContent className="p-6">
                        <div className="mb-4 flex items-center space-x-3">
                            <div className="rounded-lg bg-green-100 p-2">
                                <MapPin className="h-5 w-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Location</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Latitude:</span>
                                <span className="font-mono font-semibold">{formData.latitude.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Longitude:</span>
                                <span className="font-mono font-semibold">{formData.longitude.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Resource:</span>
                                <Badge className={formData.resourceAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    {formData.resourceAvailable ? 'Available' : 'Not Available'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Details */}
                <Card>
                    <CardContent className="p-6">
                        <div className="mb-4 flex items-center space-x-3">
                            <div className="rounded-lg bg-purple-100 p-2">
                                <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Contact</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Contact Person:</span>
                                <span className="font-semibold">{formData.contactPerson || 'Customer'}</span>
                            </div>
                            {formData.contactNo && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-semibold">{formData.contactNo}</span>
                                </div>
                            )}
                            {formData.contactEmail && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-semibold">{formData.contactEmail}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resource Details */}
            {formData.resourceData && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="mb-4 font-semibold text-gray-900">Resource Details</h3>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                                <span className="text-sm text-gray-600">Available Ports</span>
                                <p className="font-semibold">{formData.resourceData.ava_port}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Distance</span>
                                <p className="font-semibold">{formData.resourceData.distance}m</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Node ID</span>
                                <p className="font-semibold">{formData.resourceData.neid}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Technology</span>
                                <p className="font-semibold">{formData.resourceData.cable_type_desc}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Final Check */}
            {/* <Card className="border-l-4 border-l-green-500 bg-green-50">
                <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-green-800">Ready to Submit</h3>
                            <p className="text-green-700">
                                All required information has been provided. Review the details above and submit your service request.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card> */}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Submit Actions */}
            <div className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={onBack} disabled={submitting}>
                    Back
                </Button>

                <Button onClick={handleSubmit} disabled={submitting || !formData.resourceAvailable} className="bg-green-600 hover:bg-green-700">
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Submit
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
