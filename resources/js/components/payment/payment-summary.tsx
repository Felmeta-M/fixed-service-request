// components/payment/payment-summary.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, CreditCard, MapPin, Package, Phone, Shield, User, Wifi } from 'lucide-react';

interface PaymentSummaryProps {
    surveyData: any;
    subscriberData: any;
    serviceNumber: string;
    feeData: any;
    customerData: any;
    onPaymentConfirm: () => void;
    loading?: boolean;
}

const serviceTypeMap = {
    '1943913918': { label: 'Internet Service', icon: Wifi, color: 'text-blue-600' },
    '102647257': { label: 'Voice Service', icon: Phone, color: 'text-purple-600' },
    '1207609455': { label: 'Combo Service', icon: Package, color: 'text-green-600' },
};

export function PaymentSummary({
    surveyData,
    subscriberData,
    serviceNumber,
    feeData,
    customerData,
    onPaymentConfirm,
    loading = false,
}: PaymentSummaryProps) {
    // const serviceType = serviceTypeMap[surveyData.main_offer_id] || serviceTypeMap['1943913918'];
    const serviceType = serviceTypeMap['1943913918'] || serviceTypeMap['1943913918'];

    const ServiceIcon = serviceType.icon;

    // Calculate total amount
    const totalAmount =
        feeData?.fees?.reduce((total, fee) => {
            const feeAmount = parseInt(fee.original_fee) / 10000;
            const discount = parseInt(fee.discount_fee) / 10000;
            const taxAmount = fee.taxes?.reduce((taxTotal, tax) => taxTotal + parseInt(tax.fee) / 10000, 0) || 0;
            return total + feeAmount - discount + taxAmount;
        }, 0) || 0;

    const getCustomerInfo = () => {
        if (!customerData?.customer) return { name: 'N/A', phone: 'N/A' };

        const customer = customerData.customer;
        const contact = customerData.contacts?.[0];

        return {
            name: `${customer.first_name || ''} ${customer.middle_name || ''} ${customer.last_name || ''}`.trim(),
            phone: contact?.mobile || 'N/A',
            email: contact?.email || 'N/A',
        };
    };

    const getAddressInfo = () => {
        if (!customerData?.addresses?.[0]) return 'N/A';

        const address = customerData.addresses[0];
        return `${address.address1 || ''} ${address.address2 || ''} ${address.address3 || ''} ${address.address4 || ''}`.trim();
    };

    const customerInfo = getCustomerInfo();
    const addressInfo = getAddressInfo();

    return (
        <div className="min-h-screen py-6">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-4">
                {/* Header */}
                <div className="mb-2 text-start">
                    <h1 className="text-2xl font-bold text-gray-800">Complete Your Payment</h1>
                    <p className="text-lg text-gray-500">Review your order details and proceed to payment</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content - 2/3 width */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Service Details Card */}
                        <Card className="border-none">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg p-2">
                                        <ServiceIcon className={`h-6 w-6 ${serviceType.color}`} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Service Details</CardTitle>
                                        <CardDescription>Your selected service configuration</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <DetailItem label="Service Type" value={serviceType.label} icon={<ServiceIcon className="h-4 w-4" />} />
                                        <DetailItem label="Service Number" value={serviceNumber} highlight />
                                        {/* <DetailItem label="Order ID" value={surveyData.customer_survey_order_id} /> */}
                                    </div>
                                    <div className="space-y-3">
                                        <DetailItem label="Subscription Type" value="New Connection" badge={{ variant: 'default', text: 'New' }} />
                                        <DetailItem label="Order ID" value={'20000455461249'} />
                                        {/* <DetailItem label="Status" value="Ready for Activation" badge={{ variant: 'success', text: 'Active' }} /> */}
                                        {/* <DetailItem label="Activation" value="Immediate after payment" icon={<Clock className="h-4 w-4" />} /> */}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Information Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg p-2">
                                        <User className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Customer Information</CardTitle>
                                        <CardDescription>Your account details</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <DetailItem label="Full Name" value={customerInfo.name} />
                                    <DetailItem label="Phone Number" value={customerInfo.phone} />
                                    <DetailItem label="Email" value={customerInfo.email} />
                                    <DetailItem label="Customer Code" value={subscriberData?.customer_code || 'N/A'} />
                                </div>
                                <div className="pt-2">
                                    <DetailItem label="Installation Address" value={addressInfo} icon={<MapPin className="h-4 w-4" />} fullWidth />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Fee Breakdown Card */}
                        <Card className="border-none">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg p-2">
                                        <CreditCard className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Payment Summary</CardTitle>
                                        <CardDescription>Breakdown of charges and fees</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {feeData?.fees?.map((fee, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="font-medium text-gray-900">{fee.item_name}</span>
                                                    <p className="text-sm text-gray-500">One-time activation fee</p>
                                                </div>
                                                <span className="font-semibold text-gray-900">{parseInt(fee.original_fee) / 10000} ETB</span>
                                            </div>

                                            {/* Discount */}
                                            {parseInt(fee.discount_fee) > 0 && (
                                                <div className="ml-4 flex justify-between text-sm">
                                                    <span className="text-primary">Discount</span>
                                                    <span className="text-primary">-{parseInt(fee.discount_fee) / 10000} ETB</span>
                                                </div>
                                            )}

                                            {/* Taxes */}
                                            {fee.taxes?.map((tax, taxIndex) => (
                                                <div key={taxIndex} className="ml-4 flex justify-between text-sm">
                                                    <span className="text-gray-500">+ {tax.name}</span>
                                                    <span className="text-gray-500">{parseInt(tax.fee) / 10000} ETB</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    <Separator />

                                    {/* Total */}
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                        <span className="text-2xl font-bold text-primary">{totalAmount} ETB</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - 1/3 width */}
                    <div className="space-y-6">
                        {/* Order Summary Card */}
                        <Card className="sticky top-6 border-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Order Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Service</span>
                                        <span className="font-medium">{serviceType.label}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Service Number</span>
                                        <span className="font-medium">{serviceNumber}</span>
                                    </div>
                                    {/* <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Activation</span>
                                        <Badge variant="success" className="text-xs">
                                            Immediate
                                        </Badge>
                                    </div> */}

                                    <Separator />

                                    <div className="flex items-center justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{totalAmount} ETB</span>
                                    </div>

                                    <Button
                                        onClick={onPaymentConfirm}
                                        disabled={loading}
                                        className="h-12 w-full bg-gradient-to-r from-primary to-primary/90 text-lg font-semibold hover:from-primary/90 hover:to-primary"
                                        size="lg"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Processing...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-5 w-5" />
                                                Pay Now
                                            </div>
                                        )}
                                    </Button>

                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Shield className="h-3 w-3" />
                                        <span>Secure payment processed by Telebirr</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Support Card */}
                        <Card className="border-none">
                            <CardContent className="p-4">
                                <div className="text-center">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full">
                                        <Phone className="h-5 w-5 text-primary" />
                                    </div>
                                    <h4 className="font-semibold">Need Help?</h4>
                                    <p className="mt-1 text-sm">Contact our support team for assistance</p>
                                    <p className="mt-2 text-lg font-bold">+251 900 123 456</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component for detail items
function DetailItem({
    label,
    value,
    icon,
    highlight = false,
    fullWidth = false,
    badge,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    highlight?: boolean;
    fullWidth?: boolean;
    badge?: { variant: string; text: string };
}) {
    return (
        <div className={fullWidth ? 'col-span-full' : ''}>
            <label className="mb-1 block text-sm font-medium text-gray-600">{label}</label>
            <div className={`flex items-center gap-2 rounded-lg p-3 ${highlight ? 'border-2 border-primary/20 bg-primary/10' : 'bg-gray-50'}`}>
                {icon && <div className="text-gray-400">{icon}</div>}
                <span className={`flex-1 ${highlight ? 'font-semibold text-primary' : 'text-gray-900'}`}>{value}</span>
                {badge && (
                    <Badge variant={badge.variant as any} className="ml-2">
                        {badge.text}
                    </Badge>
                )}
            </div>
        </div>
    );
}

export default PaymentSummary;
