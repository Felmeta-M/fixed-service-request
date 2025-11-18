// import { BandwidthSelector } from '@/components/survey/bandwidth-selector';
// import { Badge } from '@/components/ui/badge';
// import { Card, CardContent } from '@/components/ui/card';
// import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
// import { CheckCircle, Package, Phone, Wifi } from 'lucide-react';

// interface ServiceSelectionStepProps {
//     formData: any;
//     onUpdate: (data: any) => void;
// }

// const serviceTypes = [
//     {
//         id: '1943913915',
//         name: 'Fixed Broadband',
//         description: 'High-speed internet connection for home or business',
//         icon: Wifi,
//         color: 'blue',
//         features: ['Fast internet speeds', 'Reliable connectivity', '24/7 support'],
//     },
//     {
//         id: '1207609454',
//         name: 'Fixed Voice',
//         description: 'Clear telephone service with reliable connectivity',
//         icon: Phone,
//         color: 'green',
//         features: ['Crystal clear calls', 'Unlimited local calls', 'Voicemail included'],
//     },
//     {
//         id: '102647257',
//         name: 'Combo Services',
//         description: 'Bundle of internet and voice services',
//         icon: Package,
//         color: 'purple',
//         features: ['Best value bundle', 'Single bill', 'Integrated services'],
//     },
// ];

// export function ServiceSelectionStep({ formData, onUpdate }: ServiceSelectionStepProps) {
//     const { residentialOptions, enterpriseOptions, loading: loadingBandwidths } = useBandwidthOptions();

//     const handleServiceSelect = (serviceId: string) => {
//         onUpdate({ serviceType: serviceId });
//     };

//     const handleBandwidthChange = (value: string, numericValue: number, type: string) => {
//         onUpdate({
//             bandwidth: value,
//             bandwidthNumericValue: numericValue,
//             customerType: type,
//         });
//     };

//     return (
//         <div className="space-y-6">
//             {/* Service Type Selection */}
//             <div>
//                 <h3 className="mb-4 text-lg font-semibold text-gray-900">Choose Service Type</h3>
//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//                     {serviceTypes.map((service) => {
//                         const IconComponent = service.icon;
//                         const isSelected = formData.serviceType === service.id;

//                         return (
//                             <Card
//                                 key={service.id}
//                                 className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-lg ${
//                                     isSelected
//                                         ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-md'
//                                         : 'border-gray-200 hover:border-gray-300'
//                                 } `}
//                                 onClick={() => handleServiceSelect(service.id)}
//                             >
//                                 <CardContent className="p-6">
//                                     <div className="flex items-start space-x-4">
//                                         <div
//                                             className={`rounded-xl p-3 ${isSelected ? 'bg-primary text-white' : `bg-${service.color}-100 text-${service.color}-600`} `}
//                                         >
//                                             <IconComponent className="h-6 w-6" />
//                                         </div>
//                                         <div className="flex-1">
//                                             <h3 className={`font-semibold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>{service.name}</h3>
//                                             <p className="mt-1 text-sm text-gray-600">{service.description}</p>
//                                             <ul className="mt-3 space-y-1">
//                                                 {service.features.map((feature, index) => (
//                                                     <li key={index} className="flex items-center text-xs text-gray-500">
//                                                         <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
//                                                         {feature}
//                                                     </li>
//                                                 ))}
//                                             </ul>
//                                         </div>
//                                     </div>
//                                     {isSelected && (
//                                         <div className="mt-3 flex items-center justify-end">
//                                             <Badge className="bg-green-100 text-green-800">Selected</Badge>
//                                         </div>
//                                     )}
//                                 </CardContent>
//                             </Card>
//                         );
//                     })}
//                 </div>
//             </div>

//             {/* Bandwidth Selection (Only for Broadband) */}
//             {formData.serviceType === '1943913915' && (
//                 <div className="mt-6">
//                     <h3 className="mb-4 text-lg font-semibold text-gray-900">Select Bandwidth</h3>
//                     <BandwidthSelector
//                         residentialOptions={residentialOptions}
//                         enterpriseOptions={enterpriseOptions}
//                         loading={loadingBandwidths}
//                         selectedBandwidth={formData.bandwidth}
//                         onBandwidthChange={handleBandwidthChange}
//                     />
//                 </div>
//             )}

//             {/* Selection Summary */}
//             {formData.serviceType && (
//                 <Card className="border-l-4 border-l-green-500 bg-green-50">
//                     <CardContent className="p-4">
//                         <div className="flex items-center justify-between">
//                             <div>
//                                 <p className="font-semibold text-green-800">Service Selected</p>
//                                 <p className="text-sm text-green-700">
//                                     {serviceTypes.find((s) => s.id === formData.serviceType)?.name}
//                                     {formData.bandwidth && ` • ${formData.bandwidth}`}
//                                 </p>
//                             </div>
//                             <CheckCircle className="h-5 w-5 text-green-500" />
//                         </div>
//                     </CardContent>
//                 </Card>
//             )}
//         </div>
//     );
// }

import { BandwidthSelector } from '@/components/survey/bandwidth-selector';
import { Card, CardContent } from '@/components/ui/card';
import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
import { AlertCircle, CheckCircle, Package, Phone, Wifi } from 'lucide-react';

interface ServiceSelectionStepProps {
    formData: any;
    onUpdate: (data: any) => void;
    hasActiveSurvey: boolean;
}

const serviceTypes = [
    {
        id: '1943913915',
        name: 'Fixed Broadband',
        description: 'High-speed internet connection for home or business',
        icon: Wifi,
        color: 'blue',
        // features: ['Fast internet speeds', 'Reliable connectivity', '24/7 support'],
    },
    {
        id: '1207609454',
        name: 'Fixed Voice',
        description: 'Clear telephone service with reliable connectivity',
        icon: Phone,
        color: 'green',
        // features: ['Crystal clear calls', 'Unlimited local calls', 'Voicemail included'],
    },
    {
        id: '102647257',
        name: 'Combo Services',
        description: 'Bundle of internet and voice services',
        icon: Package,
        color: 'purple',
        // features: ['Best value bundle', 'Single bill', 'Integrated services'],
    },
];

export function ServiceSelectionStep({ formData, onUpdate, hasActiveSurvey }: ServiceSelectionStepProps) {
    const { residentialOptions, enterpriseOptions, loading: loadingBandwidths } = useBandwidthOptions();

    const handleServiceSelect = (serviceId: string) => {
        if (hasActiveSurvey) return; // Prevent selection if there's an active survey
        onUpdate({ serviceType: serviceId });
    };

    const handleBandwidthChange = (value: string, numericValue: number, type: string) => {
        onUpdate({
            bandwidth: value,
            bandwidthNumericValue: numericValue,
            customerType: type,
        });
    };

    return (
        <div className="w-full space-y-6">
            {/* Welcome Message */}
            {/* <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Welcome to Service Setup</h2>
                <p className="mt-2 text-gray-600">Let's get you connected with Ethio Telecom's premium fixed services</p>
            </div> */}
            {/* Service Type Selection */}
            {/* <div> */}
            {/* <h3 className="mb-4 text-lg font-semibold text-gray-900">Choose Your Service</h3> */}
            {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {serviceTypes.map((service) => {
                        const IconComponent = service.icon;
                        const isSelected = formData.serviceType === service.id;
                        const isDisabled = hasActiveSurvey;

                        return (
                            <Card
                                key={service.id}
                                className={`cursor-pointer border-2 transition-all duration-200 ${
                                    isSelected
                                        ? 'shadow-md'
                                        : isDisabled
                                          ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-60'
                                          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                                } `}
                                onClick={() => !isDisabled && handleServiceSelect(service.id)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start space-x-4">
                                        <div
                                            className={`rounded-xl p-3 ${
                                                isSelected
                                                    ? 'text-primary'
                                                    : isDisabled
                                                      ? 'bg-gray-300 text-gray-500' */}
            {/* : // : `bg-${service.color}-100 text-${service.color}-600` */}
            {/* ` text-${service.color}-600`
                                            } `}
                                        >
                                            <IconComponent className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3
                                                className={`font-semibold ${
                                                    isSelected ? 'text-primary' : isDisabled ? 'text-gray-500' : 'text-gray-900'
                                                } `}
                                            >
                                                {service.name}
                                            </h3>
                                            <p className={`mt-1 text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>{service.description}</p>
                                            <ul className="mt-3 space-y-1">
                                                {service.features.map((feature, index) => (
                                                    <li key={index} className="flex items-center text-xs text-gray-500">
                                                        <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="mt-3 flex items-center justify-end">
                                            <Badge variant="outline" className="bg-white text-green-600">
                                                Selected
                                            </Badge>
                                        </div>
                                    )}
                                    {isDisabled && !isSelected && (
                                        <div className="mt-3 flex items-center justify-end">
                                            <Badge variant="outline" className="bg-gray-100 text-gray-500">
                                                Unavailable
                                            </Badge>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div> */}
            <div className="mt-6 grid grid-cols-1 gap-y-6 md:grid-cols-3 md:gap-x-4">
                {serviceTypes.map((service) => {
                    const Icon = service.icon;
                    const isSelected = formData.serviceType === service.id;

                    return (
                        <label
                            key={service.id}
                            onClick={() => !hasActiveSurvey && handleServiceSelect(service.id)}
                            className={`group relative flex cursor-pointer flex-col rounded-lg border bg-white p-5 transition ${hasActiveSurvey ? 'cursor-not-allowed border-gray-300 bg-gray-100 opacity-50' : ''} ${isSelected ? 'border-gray-300 ring-1 ring-primary' : 'border-gray-300 hover:border-gray-400 hover:shadow-md'} `}
                        >
                            {/* hidden input for accessibility */}
                            <input
                                type="radio"
                                name="serviceType"
                                value={service.id}
                                checked={isSelected}
                                onChange={() => {}}
                                className="absolute inset-0 cursor-pointer opacity-0"
                                disabled={hasActiveSurvey}
                            />

                            <div className="flex items-start gap-2">
                                <div className={`rounded-xl p-3 ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
                                    <Icon className="h-6 w-6" />
                                </div>

                                <div className="flex-1">
                                    <h4 className={`font-semibold ${isSelected ? '' : ''}`}>{service.name}</h4>
                                    <p className="mt-1 text-xs text-gray-500">{service.description}</p>

                                    {/* <ul className="mt-3 space-y-1">
                                        {service.features.map((feature, i) => (
                                            <li key={i} className="flex items-center text-xs text-gray-500">
                                                <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul> */}
                                </div>
                            </div>

                            {isSelected && <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-primary" />}
                        </label>
                    );
                })}
            </div>
            {/* Bandwidth Selection (Only for Broadband) */}
            {formData.serviceType === '1943913915' && !hasActiveSurvey && (
                <div className="mt-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Select Your Bandwidth</h3>
                    <BandwidthSelector
                        residentialOptions={residentialOptions}
                        enterpriseOptions={enterpriseOptions}
                        loading={loadingBandwidths}
                        selectedBandwidth={formData.bandwidth}
                        onBandwidthChange={handleBandwidthChange}
                    />
                </div>
            )}
            {/* Selection Summary */}
            {/* {formData.serviceType && !hasActiveSurvey && (
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-green-800">Service Selected</p>
                                <p className="text-sm">
                                    {serviceTypes.find((s) => s.id === formData.serviceType)?.name}
                                    {formData.bandwidth && ` • ${formData.bandwidth}`}
                                </p> */}
            {/* <p className="mt-1 text-xs text-green-600">Ready to proceed to location setup</p> */}
            {/* </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            )} */}
            {/* Active Survey Warning */}
            {hasActiveSurvey && (
                <Card className="bg-gray-50">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="font-semibold text-blue-800">Active Service Request</p>
                                <p className="text-sm text-blue-700">
                                    You currently have an active service request in progress. Please complete or cancel your existing request before
                                    creating a new one.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
