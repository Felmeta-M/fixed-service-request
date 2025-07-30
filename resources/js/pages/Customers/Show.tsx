// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
//     AlertDialogTrigger,
// } from '@/components/ui/alert-dialog';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// import CustomerLayout from '@/layouts/customer-layout';
// import { BreadcrumbItem } from '@/types';
// import { type Customer } from '@/types/customer';
// import { Head, Link, router, usePage } from '@inertiajs/react';
// import { Edit, History, MoreHorizontal, Trash2, User } from 'lucide-react';
// import { toast } from 'sonner';

// export default function Show() {
//     const {
//         props: { customer },
//     } = usePage<{ customer: Customer }>();

//     const fullName = `${customer.first_name} ${customer.middle_name ? customer.middle_name + ' ' : ''}${customer.last_name} ${customer.contact.mobile_no}`;

//     // const handleDelete = () => {
//     //     if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
//     //         router.delete(`/customers/${customer.id}`);
//     //     }
//     // };

//     const formatDate = (dateString: string) => {
//         return new Date(dateString).toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//         });
//     };

//     const calculateAge = (dateOfBirth: string) => {
//         const today = new Date();
//         const birthDate = new Date(dateOfBirth);
//         let age = today.getFullYear() - birthDate.getFullYear();
//         const monthDiff = today.getMonth() - birthDate.getMonth();

//         if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//             age--;
//         }

//         return age;
//     };

//     const mapContactTypeLabel = (type: string) => {
//         const entry = Object.entries(ContactTypes).find(([, v]) => v === type);
//         return entry ? entry[0].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : type;
//     };

//     const breadcrumbs: BreadcrumbItem[] = [
//         { title: 'Customers', href: '/customers' },
//         { title: `${customer.first_name} ${customer.last_name}`, href: `/customers/${customer.id}` },
//     ];

//     const surveyRequests: [] = customer || [];

//     return (
//         <CustomerLayout>
//             <Head title={`${customer.first_name} ${customer.last_name}`} />
//             <div className="space-y-6 p-6"></div>
//             <div>
//                 <Head title={`Customer - ${fullName}`} />

//                 <div className="space-y-6">
//                     <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
//                         <div className="flex items-center gap-4">
//                             <div className="mb-6 text-center">
//                                 <h2 className="text-2xl font-bold">
//                                     Welcome, {customer.first_name} {customer.last_name}!
//                                 </h2>
//                                 <p className="text-lg text-gray-600">Mobile: {customer.contact.mobile_no}</p>
//                             </div>
//                         </div>

//                         <div className="flex items-center gap-2">
//                             <Button className="h-8 cursor-pointer" onClick={() => router.visit('/survey-requests/create')}>
//                                 Add Service
//                             </Button>
//                             <AlertDialog>
//                                 <DropdownMenu>
//                                     <DropdownMenuTrigger asChild>
//                                         <Button variant="outline" size="sm">
//                                             <MoreHorizontal className="h-4 w-4" />
//                                         </Button>
//                                     </DropdownMenuTrigger>
//                                     <DropdownMenuContent align="end">
//                                         <DropdownMenuItem
//                                             className="flex justify-between"
//                                             onClick={() => router.visit(`/customers/${customer.id}/edit`)}
//                                         >
//                                             Edit
//                                             <Edit className="ml-2 h-4 w-4" />
//                                         </DropdownMenuItem>
//                                         <AlertDialogTrigger asChild>
//                                             <DropdownMenuItem className="flex justify-between text-red-600 focus:text-red-600">
//                                                 Delete
//                                                 <Trash2 className="ml-2 h-4 w-4 text-red-500" />
//                                             </DropdownMenuItem>
//                                         </AlertDialogTrigger>
//                                     </DropdownMenuContent>
//                                 </DropdownMenu>

//                                 <AlertDialogContent>
//                                     <AlertDialogHeader>
//                                         <AlertDialogTitle>Are you sure?</AlertDialogTitle>
//                                         <AlertDialogDescription>
//                                             This action cannot be undone. This will permanently delete the customer record.
//                                         </AlertDialogDescription>
//                                     </AlertDialogHeader>
//                                     <AlertDialogFooter>
//                                         <AlertDialogCancel>Cancel</AlertDialogCancel>
//                                         <AlertDialogAction
//                                             className="cursor-pointer bg-red-600 hover:bg-red-500"
//                                             onClick={() => {
//                                                 router.delete(`/customers/${customer.id}`, {
//                                                     onSuccess: () => toast.success('Customer deleted successfully!'),
//                                                     onError: () => toast.error('Failed to delete customer.'),
//                                                 });
//                                             }}
//                                         >
//                                             Continue
//                                         </AlertDialogAction>
//                                         {/* <AlertDialogAction className="bg-red-600 hover:bg-red-500" onClick={handleDelete}>
//                                             Continue
//                                         </AlertDialogAction> */}
//                                     </AlertDialogFooter>
//                                 </AlertDialogContent>
//                             </AlertDialog>
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//                         {/* Main Information */}
//                         <div className="space-y-6 lg:col-span-2">
//                             {/* Previous Services Section */}
//                             <Card className="border-none shadow-sm">
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2">
//                                         <History className="h-5 w-5" />
//                                         Your Services
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="space-y-4">
//                                     <div className="mb-6">
//                                         {surveyRequests.length > 0 ? (
//                                             <ul className="mt-4 space-y-2">
//                                                 {surveyRequests.map((service: any) => (
//                                                     <li key={service.id} className="flex items-center justify-between rounded border p-2">
//                                                         <span>
//                                                             {service.survey_request_number} - {service.survey_type} ({service.status})
//                                                         </span>
//                                                         <Link href={`/survey-requests/${service.id}`} className="text-sm text-blue-600 underline">
//                                                             View
//                                                         </Link>
//                                                     </li>
//                                                 ))}
//                                             </ul>
//                                         ) : (
//                                             <div className="mt-24 text-gray-500">You have no services.</div>
//                                         )}
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                             {/* Personal Information */}
//                             {/* <Card className="border-none shadow-sm">
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2">
//                                         <User className="h-5 w-5" />
//                                         Personal Information
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="space-y-4">
//                                     <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
//                                         <div>
//                                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
//                                             <p className="text-lg font-semibold">{fullName}</p>
//                                         </div>
//                                         {customer.gender && (
//                                             <div>
//                                                 <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
//                                                 <p className="text-lg">{customer.gender}</p>
//                                             </div>
//                                         )}
//                                     </div>
//                                     <hr />

//                                     {customer.date_of_birth && (
//                                         <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
//                                             <div>
//                                                 <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
//                                                 <p className="text-lg">{formatDate(customer.date_of_birth)}</p>
//                                             </div>
//                                             <div>
//                                                 <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</label>
//                                                 <p className="text-lg">{calculateAge(customer.date_of_birth)} years old</p>
//                                             </div>
//                                         </div>
//                                     )}
//                                     <hr />

//                                     <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
//                                         {customer.nationality && (
//                                             <div>
//                                                 <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nationality</label>
//                                                 <p className="text-lg">{customer.nationality}</p>
//                                             </div>
//                                         )}
//                                         {customer.place_of_birth && (
//                                             <div>
//                                                 <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Place of Birth</label>
//                                                 <p className="text-lg">{customer.place_of_birth}</p>
//                                             </div>
//                                         )}
//                                     </div>
//                                     <hr />
//                                     {customer.primary_language && (
//                                         <div>
//                                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Language</label>
//                                             <p className="text-lg">{customer.primary_language}</p>
//                                         </div>
//                                     )}
//                                 </CardContent>
//                             </Card> */}

//                             {/* Contact Information */}
//                             {/* <Card className="border-none shadow-sm">
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2">
//                                         <Phone className="h-5 w-5" />
//                                         Contact Information
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="grid grid-cols-2 space-y-4">
//                                     {customer.contact?.phone && (
//                                         <div className="flex items-center gap-3">
//                                             <PhoneIcon className="h-5 w-5 text-gray-400" />
//                                             <div>
//                                                 <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
//                                                 <p className="text-lg">{customer.contact.phone}</p>
//                                             </div>
//                                         </div>
//                                     )}
//                                     {customer.contact?.secondary_phone && (
//                                         <div className="flex items-center gap-3">
//                                             <PhoneIcon className="h-5 w-5 text-gray-400" />
//                                             <div>
//                                                 <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile</label>
//                                                 <p className="text-lg">{customer.contact.secondary_phone}</p>
//                                             </div>
//                                         </div>
//                                     )}
//                                     {customer.contact?.email && (
//                                         <div className="flex items-center gap-3">
//                                             <MailIcon className="h-5 w-5 text-gray-400" />
//                                             <div>
//                                                 <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
//                                                 <p className="text-lg">{customer.contact.email}</p>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </CardContent>
//                             </Card> */}

//                             {/* Address */}
//                             {/* {customer.address && Object.values(customer.address).some(Boolean) && (
//                                 <Card className="border-none shadow-sm">
//                                     <CardHeader>
//                                         <CardTitle className="flex items-center gap-2">
//                                             <MapPin className="h-5 w-5" />
//                                             Address
//                                         </CardTitle>
//                                     </CardHeader>

//                                     <CardContent>
//                                         <div className="flex items-start gap-3">
//                                             <MapPinIcon className="mt-1 h-5 w-5 text-gray-400" />
//                                             <div className="space-y-1">
//                                                 {customer.address.city && <p className="text-lg">{customer.address.city}</p>}

//                                                 <p className="text-lg">
//                                                     {[customer.address.city, customer.address.woreda, customer.address.zone]
//                                                         .filter(Boolean)
//                                                         .join(', ')}
//                                                 </p>
//                                                 {customer.address.region && <p className="text-lg">{customer.address.region}</p>}
//                                             </div>
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             )} */}

//                             {/* Professional Information */}
//                             {/* {(customer.occupation || customer.education || customer.religion || customer.income) && (
//                                 <Card className="border-none shadow-sm">
//                                     <CardHeader>
//                                         <CardTitle className="flex items-center gap-2">
//                                             <Building className="h-5 w-5" />
//                                             Professional Information
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-4">
//                                         <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
//                                             {customer.occupation && (
//                                                 <div>
//                                                     <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupation</label>
//                                                     <p className="text-lg">{customer.occupation}</p>
//                                                 </div>
//                                             )}
//                                             {customer.education && (
//                                                 <div>
//                                                     <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Education</label>
//                                                     <p className="text-lg">{customer.education}</p>
//                                                 </div>
//                                             )}
//                                         </div>

//                                         <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
//                                             {customer.religion && (
//                                                 <div>
//                                                     <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Religion</label>
//                                                     <p className="text-lg">{customer.religion}</p>
//                                                 </div>
//                                             )}
//                                             {customer.income && (
//                                                 <div>
//                                                     <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Income Level</label>
//                                                     <p>
//                                                         <Badge variant="secondary">{customer.income}</Badge>
//                                                     </p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             )} */}

//                             {/* Identification */}
//                             {/* {(customer.identification_type || customer.identification_number) && (
//                                 <Card className="border-none shadow-sm">
//                                     <CardHeader>
//                                         <CardTitle className="flex items-center gap-2">
//                                             <FileText className="h-5 w-5" />
//                                             Identification
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-4">
//                                         <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
//                                             {customer.identification_type && (
//                                                 <div>
//                                                     <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Type</label>
//                                                     <p className="text-lg">{customer.identification_type}</p>
//                                                 </div>
//                                             )}
//                                             {customer.identification_number && (
//                                                 <div>
//                                                     <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Number</label>
//                                                     <p className="font-mono text-lg">{customer.identification_number}</p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             )} */}
//                         </div>

//                         {/* Sidebar */}
//                         <div className="space-y-6">
//                             {/* Customer Avatar */}
//                             <Card className="border-none shadow-sm">
//                                 <CardContent className="pt-6">
//                                     <div className="flex flex-col items-center space-y-4">
//                                         <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
//                                             <User className="h-12 w-12 text-white" />
//                                         </div>
//                                         <div className="text-center">
//                                             <h3 className="text-xl font-semibold">{fullName}</h3>
//                                             {customer.title && <p className="text-gray-600 dark:text-gray-400">{customer.title}</p>}
//                                         </div>
//                                     </div>
//                                 </CardContent>
//                             </Card>

//                             {/* Contact Persons
//                             {customer.contact_persons && customer.contact_persons.length > 0 && (
//                                 <Card className="border-none shadow-sm">
//                                     <CardHeader>
//                                         <CardTitle className="flex items-center gap-2">
//                                             <Users className="h-5 w-5" />
//                                             Contact Persons
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-4">
//                                         {customer.contact_persons.map((person, index) => (
//                                             <div key={index} className="flex flex-col gap-2 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900/30">
//                                                 <div className="flex items-center gap-2">
//                                                     <Badge variant="secondary" className="capitalize">
//                                                         {mapContactTypeLabel(person.type)}
//                                                     </Badge>
//                                                     <span className="text-lg font-semibold">{person.name}</span>
//                                                 </div>
//                                                 <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
//                                                     {person.phone && (
//                                                         <span className="flex items-center gap-1">
//                                                             <Phone className="h-4 w-4" /> {person.phone}
//                                                         </span>
//                                                     )}
//                                                     {person.relationship && (
//                                                         <span className="flex items-center gap-1">
//                                                             <Users className="h-4 w-4" /> {person.relationship}
//                                                         </span>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </CardContent>
//                                 </Card>
//                             )} */}

//                             {/* System Information
//                             <Card className="border-none shadow-sm">
//                                 <CardHeader>
//                                     <CardTitle>System Information</CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="space-y-3">
//                                     <div className="flex justify-between">
//                                         <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer ID</label>
//                                         <p className="font-mono text-sm">{customer.id}</p>
//                                     </div>
//                                     <hr />
//                                     <div className="flex justify-between">
//                                         <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
//                                         <p className="text-sm">
//                                             {'created_at' in customer && customer.created_at ? formatDate(customer.created_at) : '-'}
//                                         </p>
//                                     </div>
//                                     <hr />
//                                     <div className="flex justify-between">
//                                         <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
//                                         <p className="text-sm">
//                                             {'updated_at' in customer && customer.updated_at ? formatDate(customer.updated_at) : '-'}
//                                         </p>
//                                     </div>
//                                 </CardContent>
//                             </Card> */}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </CustomerLayout>
//     );
// }

// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import CustomerLayout from '@/layouts/customer-layout';
// import { Head, usePage } from '@inertiajs/react';
// import {
//     Building,
//     CheckCircle,
//     Clock,
//     FileText,
//     Home,
//     MapPin,
//     MessageSquare,
//     Package,
//     Pencil,
//     Phone,
//     Plus,
//     Trash,
//     Wifi,
//     XCircle,
// } from 'lucide-react';
// import { useState } from 'react';

// export default function Show() {
//     const { props } = usePage();
//     const customer = props.customer;
//     const surveyRequests = props.surveyRequests || [];
//     const serviceRequests = props.serviceRequests || [];

//     const [showForm, setShowForm] = useState(false);
//     const [editingId, setEditingId] = useState<string | null>(null);
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState(false);
//     const [showFeedbackModal, setShowFeedbackModal] = useState<{ type: 'survey' | 'service'; id: string } | null>(null);
//     const [customerFeedback, setCustomerFeedback] = useState('');
//     const [showPricingModal, setShowPricingModal] = useState<any>(null);

//     // Helper functions for status badges and icons
//     const getStatusBadge = (status: string) => {
//         switch (status) {
//             case 'Waiting':
//                 return (
//                     <Badge variant="secondary">
//                         <Clock className="mr-1 h-3 w-3" />
//                         Waiting
//                     </Badge>
//                 );
//             case 'Completed':
//                 return (
//                     <Badge variant="outline" className="border-blue-500 text-blue-700">
//                         <CheckCircle className="mr-1 h-3 w-3" />
//                         Completed
//                     </Badge>
//                 );
//             case 'Approved':
//                 return (
//                     <Badge variant="default" className="bg-green-600">
//                         <CheckCircle className="mr-1 h-3 w-3" />
//                         Approved
//                     </Badge>
//                 );
//             case 'Cancelled':
//                 return (
//                     <Badge variant="destructive">
//                         <XCircle className="mr-1 h-3 w-3" />
//                         Cancelled
//                     </Badge>
//                 );
//             default:
//                 return <Badge>{status}</Badge>;
//         }
//     };

//     const getServiceIcon = (serviceType: string) => {
//         switch (serviceType) {
//             case 'voice':
//                 return <Phone className="h-4 w-4" />;
//             case 'internet':
//                 return <Wifi className="h-4 w-4" />;
//             case 'combo':
//                 return <Package className="h-4 w-4" />;
//             default:
//                 return <FileText className="h-4 w-4" />;
//         }
//     };

//     // Survey form logic (edit/create/cancel/delete) would use Inertia actions

//     return (
//         <CustomerLayout>
//             <Head title={`Customer Portal - ${customer.first_name} ${customer.last_name}`} />
//             <div className="min-h-screen bg-gray-50">
//                 <div className="container mx-auto px-6 py-6">
//                     <span className="text-md text-gray-600">
//                         Welcome, {customer.first_name} {customer.last_name} ({customer.contact.mobile_no})
//                     </span>
//                 </div>

//                 <div className="container mx-auto px-4 py-8">
//                     <div className="mx-auto max-w-6xl">
//                         {error && (
//                             <Alert className="mb-6" variant="destructive">
//                                 <AlertDescription>{error}</AlertDescription>
//                             </Alert>
//                         )}

//                         {success && (
//                             <Alert className="mb-6">
//                                 <CheckCircle className="mr-2 h-4 w-4" />
//                                 <AlertDescription>Survey request submitted successfully!</AlertDescription>
//                             </Alert>
//                         )}

//                         <div className="grid gap-8 lg:grid-cols-2">
//                             {/* Survey Management Section */}
//                             <div>
//                                 <div className="mb-6 flex items-center justify-between">
//                                     <h2 className="text-xl font-semibold">Survey Requests</h2>
//                                     <Button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700">
//                                         {showForm ? (
//                                             'Hide Form'
//                                         ) : (
//                                             <>
//                                                 <Plus className="mr-2 h-4 w-4" /> New Survey
//                                             </>
//                                         )}
//                                     </Button>
//                                 </div>

//                                 {/* Survey List */}
//                                 <div className="space-y-4">
//                                     {surveyRequests.length === 0 ? (
//                                         <Card>
//                                             <CardContent className="py-8 text-center">
//                                                 <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400" />
//                                                 <p className="text-gray-600">No survey requests yet</p>
//                                                 <p className="text-sm text-gray-500">Use the "New Survey" button above to get started</p>
//                                             </CardContent>
//                                         </Card>
//                                     ) : (
//                                         surveyRequests.map((request: any) => (
//                                             <Card key={request.id} className="overflow-hidden">
//                                                 <CardContent className="p-0">
//                                                     <div className="flex items-center justify-between border-b bg-gray-50 p-4">
//                                                         <div className="flex items-center gap-3">
//                                                             <MapPin className="h-5 w-5 text-gray-500" />
//                                                             <div>
//                                                                 <h3 className="font-semibold">#{request.transactionNumber}</h3>
//                                                                 <p className="text-xs text-gray-500">
//                                                                     Created: {new Date(request.createdAt).toLocaleDateString()}
//                                                                 </p>
//                                                             </div>
//                                                         </div>
//                                                         <div>{getStatusBadge(request.status)}</div>
//                                                     </div>
//                                                     <div className="p-4">
//                                                         <div className="mb-4 grid gap-4 md:grid-cols-2">
//                                                             <div>
//                                                                 <p className="text-sm font-medium">Name</p>
//                                                                 <p className="text-sm text-gray-600">{request.name}</p>
//                                                             </div>
//                                                             <div>
//                                                                 <p className="text-sm font-medium">Customer Type</p>
//                                                                 <Badge variant={request.customerType === 'enterprise' ? 'default' : 'secondary'}>
//                                                                     {request.customerType === 'enterprise' ? (
//                                                                         <Building className="mr-1 h-3 w-3" />
//                                                                     ) : (
//                                                                         <Home className="mr-1 h-3 w-3" />
//                                                                     )}
//                                                                     {request.customerType}
//                                                                 </Badge>
//                                                             </div>
//                                                             <div>
//                                                                 <p className="text-sm font-medium">Service Type</p>
//                                                                 <div className="flex items-center gap-1">
//                                                                     {getServiceIcon(request.serviceDetails.serviceType)}
//                                                                     <span className="text-sm text-gray-600 capitalize">
//                                                                         {request.serviceDetails.serviceType}
//                                                                         {request.serviceDetails.serviceType === 'internet' &&
//                                                                             ` (${request.serviceDetails.internetBandwidth}Mbps)`}
//                                                                     </span>
//                                                                 </div>
//                                                             </div>
//                                                             <div>
//                                                                 <p className="text-sm font-medium">Request Type</p>
//                                                                 <p className="text-sm text-gray-600 capitalize">
//                                                                     {request.serviceDetails.requestType}
//                                                                 </p>
//                                                             </div>
//                                                         </div>
//                                                         <div className="mb-4">
//                                                             <p className="text-sm font-medium">Address</p>
//                                                             <p className="text-sm text-gray-600">{request.address}</p>
//                                                         </div>
//                                                         {/* Feedback, Pricing, Actions */}
//                                                         <div className="flex justify-end gap-2 border-t pt-2">
//                                                             <Button size="sm" variant="outline" onClick={() => setEditingId(request.id)}>
//                                                                 <Pencil className="mr-1 h-3 w-3" />
//                                                                 Edit
//                                                             </Button>
//                                                             <Button
//                                                                 size="sm"
//                                                                 variant="destructive"
//                                                                 onClick={() => {
//                                                                     /* handle delete */
//                                                                 }}
//                                                             >
//                                                                 <Trash className="mr-1 h-3 w-3" />
//                                                                 Delete
//                                                             </Button>
//                                                             <Button
//                                                                 size="sm"
//                                                                 variant="outline"
//                                                                 onClick={() => setShowFeedbackModal({ type: 'survey', id: request.id })}
//                                                             >
//                                                                 <MessageSquare className="mr-1 h-3 w-3" />
//                                                                 Add Feedback
//                                                             </Button>
//                                                         </div>
//                                                     </div>
//                                                 </CardContent>
//                                             </Card>
//                                         ))
//                                     )}
//                                 </div>
//                             </div>

//                             {/* Service Requests Section */}
//                             <div>
//                                 {serviceRequests.length > 0 && (
//                                     <div>
//                                         <h2 className="mb-6 text-xl font-semibold">Your Service Requests</h2>
//                                         <div className="space-y-4">
//                                             {serviceRequests.map((request: any) => (
//                                                 <Card key={request.id} className="overflow-hidden">
//                                                     <CardContent className="p-0">
//                                                         <div className="flex items-center justify-between border-b bg-gray-50 p-4">
//                                                             <div className="flex items-center gap-3">
//                                                                 <FileText className="h-5 w-5 text-gray-500" />
//                                                                 <div>
//                                                                     <h3 className="font-semibold">Survey: #{request.surveyReference}</h3>
//                                                                     <p className="text-xs text-gray-500">
//                                                                         Created: {new Date(request.createdAt).toLocaleDateString()}
//                                                                     </p>
//                                                                 </div>
//                                                             </div>
//                                                             <div>{getStatusBadge(request.status)}</div>
//                                                         </div>
//                                                         <div className="p-4">
//                                                             <div className="mb-4 grid gap-4 md:grid-cols-2">
//                                                                 <div>
//                                                                     <p className="text-sm font-medium">Customer Type</p>
//                                                                     <p className="text-sm text-gray-600 capitalize">{request.customerType}</p>
//                                                                 </div>
//                                                                 {request.pricing && (
//                                                                     <div>
//                                                                         <p className="text-sm font-medium">Pricing</p>
//                                                                         <p className="text-sm text-gray-600">
//                                                                             Monthly: ETB {request.pricing.monthlyFee} | Setup: ETB{' '}
//                                                                             {request.pricing.setupFee}
//                                                                         </p>
//                                                                     </div>
//                                                                 )}
//                                                             </div>
//                                                             {/* Feedback, Actions */}
//                                                             <div className="flex justify-end gap-2 border-t pt-2">
//                                                                 <Button
//                                                                     size="sm"
//                                                                     variant="outline"
//                                                                     onClick={() => setShowFeedbackModal({ type: 'service', id: request.id })}
//                                                                 >
//                                                                     <MessageSquare className="mr-1 h-3 w-3" />
//                                                                     Add Feedback
//                                                                 </Button>
//                                                             </div>
//                                                         </div>
//                                                     </CardContent>
//                                                 </Card>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Feedback Modal */}
//                 {showFeedbackModal && (
//                     <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
//                         <Card className="w-full max-w-md">
//                             <CardHeader>
//                                 <CardTitle>Add Your Feedback</CardTitle>
//                                 <CardDescription>
//                                     Share your experience with this {showFeedbackModal.type === 'survey' ? 'survey' : 'service request'}
//                                 </CardDescription>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 <div className="space-y-2">
//                                     <Label htmlFor="customerFeedback">Your Feedback</Label>
//                                     <Textarea
//                                         id="customerFeedback"
//                                         value={customerFeedback}
//                                         onChange={(e) => setCustomerFeedback(e.target.value)}
//                                         placeholder="Share your thoughts, suggestions, or concerns..."
//                                         rows={4}
//                                     />
//                                 </div>
//                                 <div className="flex gap-2">
//                                     <Button
//                                         onClick={() => {
//                                             /* handle feedback submit */
//                                         }}
//                                         className="flex-1"
//                                         disabled={!customerFeedback.trim()}
//                                     >
//                                         Submit Feedback
//                                     </Button>
//                                     <Button
//                                         variant="outline"
//                                         onClick={() => {
//                                             setShowFeedbackModal(null);
//                                             setCustomerFeedback('');
//                                         }}
//                                     >
//                                         Cancel
//                                     </Button>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </div>
//                 )}
//             </div>

//             {/* survey request section */}
//             <div></div>
//         </CustomerLayout>
//     );
// }

import LocationMap from '@/components/location-map';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CustomerLayout from '@/layouts/customer-layout';
import { Head, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building,
    CheckCircle,
    Clock,
    FileText,
    Home,
    Loader2,
    MapPin,
    MessageSquare,
    Package,
    Pencil,
    Phone,
    Plus,
    Trash,
    Wifi,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

// TODO: Replace this stub with your actual LocationMap component or dynamic import
// const LocationMap = (props: any) => <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100">Loading map...</div>;

interface ServiceDetails {
    serviceType: 'voice' | 'internet' | 'combo';
    requestType: 'new' | 'upgrade' | 'downgrade';
    internetBandwidth?: 1 | 3 | 5 | 10 | 20;
}
interface PricingField {
    id: string;
    name: string;
    amount: number;
    description?: string;
    timeBasedRates?: boolean;
}
interface PricingBreakdown {
    fields?: PricingField[];
    customFields?: PricingField[];
    laborCost: number;
    wiringCost: number;
    serviceFee: number;
    miscellaneous: number;
    subtotal: number;
    vat: number;
    totalFee: number;
}

interface SurveyRequest {
    id: string;
    transactionNumber: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phoneNumber: string;
    additionalNotes: string;
    customerType: 'residential' | 'enterprise';
    serviceDetails: ServiceDetails;
    status: 'Waiting' | 'Completed' | 'Cancelled' | 'Approved';
    createdAt: string;
    adminFeedback?: string;
    customerFeedback?: string;
    pricingBreakdown?: PricingBreakdown;
    approvedByCustomer?: boolean;
}
interface SurveyFormData {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phoneNumber: string;
    additionalNotes: string;
    customerType: 'residential' | 'enterprise';
    serviceDetails: ServiceDetails;
}

export default function Show() {
    const { props } = usePage();
    const [isLoading, setIsLoading] = useState(false);

    const customer = props.customer;
    const surveyRequests = props.surveyRequests || [];
    const serviceRequests = props.serviceRequests || [];

    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState<{ type: 'survey' | 'service'; id: string } | null>(null);
    const [customerFeedback, setCustomerFeedback] = useState('');
    const [showPricingModal, setShowPricingModal] = useState<any>(null);
    const [formData, setFormData] = useState<SurveyFormData>({
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
        phoneNumber: '',
        additionalNotes: '',
        customerType: 'residential',
        serviceDetails: {
            serviceType: 'internet',
            requestType: 'new',
            internetBandwidth: 5,
        },
    });
    if (!props.customer) {
        return (
            <CustomerLayout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading customer data...</span>
                </div>
            </CustomerLayout>
        );
    }
    if (props.error) {
        return (
            <CustomerLayout>
                <div className="container mx-auto p-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{props.error.message || 'Failed to load customer data'}</AlertDescription>
                    </Alert>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </CustomerLayout>
        );
    }

    // Helper functions for status badges and icons
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Waiting':
                return (
                    <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Waiting
                    </Badge>
                );
            case 'Completed':
                return (
                    <Badge variant="outline" className="border-blue-500 text-blue-700">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                    </Badge>
                );
            case 'Approved':
                return (
                    <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approved
                    </Badge>
                );
            case 'Cancelled':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Cancelled
                    </Badge>
                );
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getServiceIcon = (serviceType: string) => {
        switch (serviceType) {
            case 'voice':
                return <Phone className="h-4 w-4" />;
            case 'internet':
                return <Wifi className="h-4 w-4" />;
            case 'combo':
                return <Package className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const canCreateNewSurvey = () => {
        const waitingOrCompletedSurveys = surveyRequests.filter(
            (survey) => survey.status === 'Waiting' || survey.status === 'Completed' || survey.status === 'Approved',
        );
        return waitingOrCompletedSurveys.length === 0;
    };

    const handleLocationSelect = (lat: number, lng: number, address: string) => {
        setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: address || prev.address,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.latitude || !formData.longitude) {
            setError('Please select a location on the map');
            setLoading(false);
            return;
        }

        // Check if user can create new survey
        if (!editingId && !canCreateNewSurvey()) {
            setError('You cannot create a new survey while you have an active survey');
            setLoading(false);
            return;
        }

        // Simulate API call
        setTimeout(() => {
            const transactionNumber = `SUR${Date.now()}`;
            const surveyRequest: SurveyRequest = {
                id: editingId || Date.now().toString(),
                transactionNumber: editingId
                    ? surveyRequests.find((r) => r.id === editingId)?.transactionNumber || transactionNumber
                    : transactionNumber,
                status: 'Waiting',
                createdAt: editingId
                    ? surveyRequests.find((r) => r.id === editingId)?.createdAt || new Date().toISOString()
                    : new Date().toISOString(),
                ...formData,
            };

            // Load all surveys, update/add current user's survey, then save back
            let allSurveys = JSON.parse(localStorage.getItem('surveyRequests') || '[]');

            if (editingId) {
                allSurveys = allSurveys.map((req: SurveyRequest) => (req.id === editingId ? surveyRequest : req));
            } else {
                allSurveys.push(surveyRequest);
            }

            localStorage.setItem('surveyRequests', JSON.stringify(allSurveys));

            // Update local state with user's surveys only
            const userSurveys = allSurveys.filter((survey: SurveyRequest) => survey.phoneNumber === formData.phoneNumber);
            //   setSurveyRequests(userSurveys)

            setLoading(false);
            setSuccess(true);
            setShowForm(false);
            setEditingId(null);

            // Reset form after success
            setTimeout(() => {
                setSuccess(false);
                setFormData({
                    name: '',
                    address: '',
                    latitude: 0,
                    longitude: 0,
                    phoneNumber: formData.phoneNumber,
                    additionalNotes: '',
                    customerType: 'residential',
                    serviceDetails: {
                        serviceType: 'internet',
                        requestType: 'new',
                        internetBandwidth: 5,
                    },
                });
            }, 2000);
        }, 1000);
    };

    // Survey form logic (edit/create/cancel/delete) would use Inertia actions

    return (
        <CustomerLayout>
            <Head title={`Customer Portal - ${customer.first_name} ${customer.last_name}`} />
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-6 py-6">
                    <span className="text-md text-gray-600">
                        Welcome, {customer.first_name} {customer.last_name} ({customer.contact.mobile_no})
                    </span>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="mx-auto max-w-6xl">
                        {error && (
                            <Alert className="mb-6" variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="mb-6">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <AlertDescription>Survey request submitted successfully!</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-8 lg:grid-cols-2">
                            {/* Survey Management Section */}
                            <div>
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">Survey Requests</h2>
                                    <Button onClick={() => setShowForm(!showForm)} className="cursor-pointer bg-primary hover:bg-green-500">
                                        {showForm ? (
                                            'Hide Form'
                                        ) : (
                                            <>
                                                <Plus className="mr-2 h-4 w-4" /> New Survey
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Survey List */}
                                <div className="space-y-4">
                                    {surveyRequests.length === 0 ? (
                                        <Card>
                                            <CardContent className="py-8 text-center">
                                                <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                <p className="text-gray-600">No survey requests yet</p>
                                                <p className="text-sm text-gray-500">Use the "New Survey" button above to get started</p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        surveyRequests.map((request: any) => (
                                            <Card key={request.id} className="overflow-hidden">
                                                <CardContent className="p-0">
                                                    <div className="flex items-center justify-between border-b bg-gray-50 p-4">
                                                        <div className="flex items-center gap-3">
                                                            <MapPin className="h-5 w-5 text-gray-500" />
                                                            <div>
                                                                <h3 className="font-semibold">#{request.transactionNumber}</h3>
                                                                <p className="text-xs text-gray-500">
                                                                    Created: {new Date(request.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div>{getStatusBadge(request.status)}</div>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="mb-4 grid gap-4 md:grid-cols-2">
                                                            <div>
                                                                <p className="text-sm font-medium">Name</p>
                                                                <p className="text-sm text-gray-600">{request.name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">Customer Type</p>
                                                                <Badge variant={request.customerType === 'enterprise' ? 'default' : 'secondary'}>
                                                                    {request.customerType === 'enterprise' ? (
                                                                        <Building className="mr-1 h-3 w-3" />
                                                                    ) : (
                                                                        <Home className="mr-1 h-3 w-3" />
                                                                    )}
                                                                    {request.customerType}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">Service Type</p>
                                                                <div className="flex items-center gap-1">
                                                                    {getServiceIcon(request.serviceDetails.serviceType)}
                                                                    <span className="text-sm text-gray-600 capitalize">
                                                                        {request.serviceDetails.serviceType}
                                                                        {request.serviceDetails.serviceType === 'internet' &&
                                                                            ` (${request.serviceDetails.internetBandwidth}Mbps)`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">Request Type</p>
                                                                <p className="text-sm text-gray-600 capitalize">
                                                                    {request.serviceDetails.requestType}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="mb-4">
                                                            <p className="text-sm font-medium">Address</p>
                                                            <p className="text-sm text-gray-600">{request.address}</p>
                                                        </div>
                                                        {/* Feedback, Pricing, Actions */}
                                                        <div className="flex justify-end gap-2 border-t pt-2">
                                                            <Button size="sm" variant="outline" onClick={() => setEditingId(request.id)}>
                                                                <Pencil className="mr-1 h-3 w-3" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    /* handle delete */
                                                                }}
                                                            >
                                                                <Trash className="mr-1 h-3 w-3" />
                                                                Delete
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setShowFeedbackModal({ type: 'survey', id: request.id })}
                                                            >
                                                                <MessageSquare className="mr-1 h-3 w-3" />
                                                                Add Feedback
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>

                                {/* Service Requests Section */}
                                <div>
                                    {serviceRequests.length > 0 && (
                                        <div>
                                            <h2 className="mb-6 text-xl font-semibold">Your Service Requests</h2>
                                            <div className="space-y-4">
                                                {serviceRequests.map((request: any) => (
                                                    <Card key={request.id} className="overflow-hidden">
                                                        <CardContent className="p-0">
                                                            <div className="flex items-center justify-between border-b bg-gray-50 p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <FileText className="h-5 w-5 text-gray-500" />
                                                                    <div>
                                                                        <h3 className="font-semibold">Survey: #{request.surveyReference}</h3>
                                                                        <p className="text-xs text-gray-500">
                                                                            Created: {new Date(request.createdAt).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div>{getStatusBadge(request.status)}</div>
                                                            </div>
                                                            <div className="p-4">
                                                                <div className="mb-4 grid gap-4 md:grid-cols-2">
                                                                    <div>
                                                                        <p className="text-sm font-medium">Customer Type</p>
                                                                        <p className="text-sm text-gray-600 capitalize">{request.customerType}</p>
                                                                    </div>
                                                                    {request.pricing && (
                                                                        <div>
                                                                            <p className="text-sm font-medium">Pricing</p>
                                                                            <p className="text-sm text-gray-600">
                                                                                Monthly: ETB {request.pricing.monthlyFee} | Setup: ETB{' '}
                                                                                {request.pricing.setupFee}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Feedback, Actions */}
                                                                <div className="flex justify-end gap-2 border-t pt-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => setShowFeedbackModal({ type: 'service', id: request.id })}
                                                                    >
                                                                        <MessageSquare className="mr-1 h-3 w-3" />
                                                                        Add Feedback
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Survey Form Section */}
                            <div>
                                {showForm && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <MapPin className="h-5 w-5" />
                                                {editingId ? 'Edit Survey Request' : 'New Survey Request'}
                                            </CardTitle>
                                            <CardDescription>
                                                Please provide your location details and service requirements to check availability in your area
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleSubmit} className="space-y-6">
                                                <div className="space-y-4">
                                                    {/* <div className="space-y-2">
                                                        <Label htmlFor="name">Full Name *</Label>
                                                        <Input
                                                            id="name"
                                                            value={`${customer.first_name} ${customer.last_name}`}
                                                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                                            required
                                                        />
                                                    </div> */}

                                                    {/* <div className="space-y-2">
                                                        <Label htmlFor="phone"> Phone Number *</Label>
                                                        <Input
                                                            id="phone"
                                                            type="tel"
                                                            value={customer.contact.mobile_no}
                                                            onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                                                            placeholder="+251911234567 or 0911234567"
                                                            required
                                                        />
                                                    </div> */}

                                                    {/* <div className="space-y-2">
                                                        <Label htmlFor="customerType">Customer Type *</Label>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div
                                                                className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                                                                    formData.customerType === 'residential'
                                                                        ? 'border-green-500 bg-green-50 shadow-sm'
                                                                        : 'hover:bg-gray-50'
                                                                }`}
                                                                onClick={() => setFormData((prev) => ({ ...prev, customerType: 'residential' }))}
                                                            >
                                                                <div
                                                                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                                                        formData.customerType === 'residential' ? 'bg-green-100' : 'bg-gray-100'
                                                                    }`}
                                                                >
                                                                    <Home
                                                                        className={`h-6 w-6 ${formData.customerType === 'residential' ? 'text-green-600' : 'text-gray-600'}`}
                                                                    />
                                                                </div>
                                                                <span className="font-medium">Residential</span>
                                                                <span className="text-center text-xs text-gray-500">For home and personal use</span>
                                                                <input
                                                                    type="radio"
                                                                    id="residential"
                                                                    name="customerType"
                                                                    value="residential"
                                                                    checked={formData.customerType === 'residential'}
                                                                    onChange={() => {}}
                                                                    className="sr-only"
                                                                />
                                                            </div>
                                                            <div
                                                                className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                                                                    formData.customerType === 'enterprise'
                                                                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                                        : 'hover:bg-gray-50'
                                                                }`}
                                                                onClick={() => setFormData((prev) => ({ ...prev, customerType: 'enterprise' }))}
                                                            >
                                                                <div
                                                                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                                                        formData.customerType === 'enterprise' ? 'bg-blue-100' : 'bg-gray-100'
                                                                    }`}
                                                                >
                                                                    <Building
                                                                        className={`h-6 w-6 ${formData.customerType === 'enterprise' ? 'text-blue-600' : 'text-gray-600'}`}
                                                                    />
                                                                </div>
                                                                <span className="font-medium">Enterprise</span>
                                                                <span className="text-center text-xs text-gray-500">
                                                                    For business and organizations
                                                                </span>
                                                                <input
                                                                    type="radio"
                                                                    id="enterprise"
                                                                    name="customerType"
                                                                    value="enterprise"
                                                                    checked={formData.customerType === 'enterprise'}
                                                                    onChange={() => {}}
                                                                    className="sr-only"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div> */}

                                                    <div className="space-y-6 rounded-lg border bg-gradient-to-br from-gray-50 to-white p-6">
                                                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                                                            <FileText className="h-5 w-5 text-gray-600" />
                                                            Service Details
                                                        </h3>

                                                        <div className="space-y-4">
                                                            <Label htmlFor="serviceType" className="text-base">
                                                                Service Type *
                                                            </Label>
                                                            <div className="grid grid-cols-3 gap-4">
                                                                <div
                                                                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                                                                        formData.serviceDetails.serviceType === 'voice'
                                                                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                                                                            : 'hover:bg-gray-50'
                                                                    }`}
                                                                    onClick={() =>
                                                                        setFormData((prev) => ({
                                                                            ...prev,
                                                                            serviceDetails: { ...prev.serviceDetails, serviceType: 'voice' },
                                                                        }))
                                                                    }
                                                                >
                                                                    <div
                                                                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                                                            formData.serviceDetails.serviceType === 'voice'
                                                                                ? 'bg-purple-100'
                                                                                : 'bg-gray-100'
                                                                        }`}
                                                                    >
                                                                        <Phone
                                                                            className={`h-6 w-6 ${formData.serviceDetails.serviceType === 'voice' ? 'text-purple-600' : 'text-gray-600'}`}
                                                                        />
                                                                    </div>
                                                                    <span className="font-medium">Fixed Voice Line</span>
                                                                    <span className="text-center text-xs text-gray-500">
                                                                        Traditional phone service
                                                                    </span>
                                                                    <input
                                                                        type="radio"
                                                                        id="voice"
                                                                        name="serviceType"
                                                                        value="voice"
                                                                        checked={formData.serviceDetails.serviceType === 'voice'}
                                                                        onChange={() => {}}
                                                                        className="sr-only"
                                                                    />
                                                                </div>

                                                                <div
                                                                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                                                                        formData.serviceDetails.serviceType === 'internet'
                                                                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                                            : 'hover:bg-gray-50'
                                                                    }`}
                                                                    onClick={() =>
                                                                        setFormData((prev) => ({
                                                                            ...prev,
                                                                            serviceDetails: { ...prev.serviceDetails, serviceType: 'internet' },
                                                                        }))
                                                                    }
                                                                >
                                                                    <div
                                                                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                                                            formData.serviceDetails.serviceType === 'internet'
                                                                                ? 'bg-blue-100'
                                                                                : 'bg-gray-100'
                                                                        }`}
                                                                    >
                                                                        <Wifi
                                                                            className={`h-6 w-6 ${formData.serviceDetails.serviceType === 'internet' ? 'text-blue-600' : 'text-gray-600'}`}
                                                                        />
                                                                    </div>
                                                                    <span className="font-medium">Internet</span>
                                                                    <span className="text-center text-xs text-gray-500">
                                                                        High-speed internet access
                                                                    </span>
                                                                    <input
                                                                        type="radio"
                                                                        id="internet"
                                                                        name="serviceType"
                                                                        value="internet"
                                                                        checked={formData.serviceDetails.serviceType === 'internet'}
                                                                        onChange={() => {}}
                                                                        className="sr-only"
                                                                    />
                                                                </div>

                                                                <div
                                                                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                                                                        formData.serviceDetails.serviceType === 'combo'
                                                                            ? 'border-green-500 bg-green-50 shadow-sm'
                                                                            : 'hover:bg-gray-50'
                                                                    }`}
                                                                    onClick={() =>
                                                                        setFormData((prev) => ({
                                                                            ...prev,
                                                                            serviceDetails: { ...prev.serviceDetails, serviceType: 'combo' },
                                                                        }))
                                                                    }
                                                                >
                                                                    <div
                                                                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                                                            formData.serviceDetails.serviceType === 'combo'
                                                                                ? 'bg-green-100'
                                                                                : 'bg-gray-100'
                                                                        }`}
                                                                    >
                                                                        <Package
                                                                            className={`h-6 w-6 ${formData.serviceDetails.serviceType === 'combo' ? 'text-green-600' : 'text-gray-600'}`}
                                                                        />
                                                                    </div>
                                                                    <span className="font-medium">Combo</span>
                                                                    <span className="text-center text-xs text-gray-500">Voice + Internet bundle</span>
                                                                    <input
                                                                        type="radio"
                                                                        id="combo"
                                                                        name="serviceType"
                                                                        value="combo"
                                                                        checked={formData.serviceDetails.serviceType === 'combo'}
                                                                        onChange={() => {}}
                                                                        className="sr-only"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {(formData.serviceDetails.serviceType === 'internet' ||
                                                            formData.serviceDetails.serviceType === 'combo') && (
                                                            <div className="space-y-4">
                                                                <Label htmlFor="bandwidth" className="text-base">
                                                                    Internet Bandwidth *
                                                                </Label>
                                                                <div className="grid grid-cols-5 gap-2">
                                                                    {[1, 3, 5, 10, 20].map((speed) => (
                                                                        <div
                                                                            key={speed}
                                                                            className={`flex cursor-pointer flex-col items-center rounded-lg border p-3 transition-all ${
                                                                                formData.serviceDetails.internetBandwidth === speed
                                                                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                                                    : 'hover:bg-gray-50'
                                                                            }`}
                                                                            onClick={() =>
                                                                                setFormData((prev) => ({
                                                                                    ...prev,
                                                                                    serviceDetails: {
                                                                                        ...prev.serviceDetails,
                                                                                        internetBandwidth: speed as 1 | 3 | 5 | 10 | 20,
                                                                                    },
                                                                                }))
                                                                            }
                                                                        >
                                                                            <span className="text-lg font-bold">{speed}</span>
                                                                            <span className="text-xs">Mbps</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600"></div>
                                                                <div className="flex justify-between text-xs text-gray-500">
                                                                    <span>Basic</span>
                                                                    <span>Standard</span>
                                                                    <span>Premium</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-4">
                                                            <Label htmlFor="requestType" className="text-base">
                                                                Request Type *
                                                            </Label>
                                                            <div className="grid grid-cols-3 gap-4">
                                                                <div
                                                                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
                                                                        formData.serviceDetails.requestType === 'new'
                                                                            ? 'border-green-500 bg-green-50 shadow-sm'
                                                                            : 'hover:bg-gray-50'
                                                                    }`}
                                                                    onClick={() =>
                                                                        setFormData((prev) => ({
                                                                            ...prev,
                                                                            serviceDetails: { ...prev.serviceDetails, requestType: 'new' },
                                                                        }))
                                                                    }
                                                                >
                                                                    <div
                                                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                                                            formData.serviceDetails.requestType === 'new'
                                                                                ? 'bg-green-100'
                                                                                : 'bg-gray-100'
                                                                        }`}
                                                                    >
                                                                        <Plus
                                                                            className={`h-4 w-4 ${formData.serviceDetails.requestType === 'new' ? 'text-green-600' : 'text-gray-600'}`}
                                                                        />
                                                                    </div>
                                                                    <span className="font-medium">New</span>
                                                                    <span className="text-xs text-gray-500">First-time setup</span>
                                                                    <input
                                                                        type="radio"
                                                                        id="new"
                                                                        name="requestType"
                                                                        value="new"
                                                                        checked={formData.serviceDetails.requestType === 'new'}
                                                                        onChange={() => {}}
                                                                        className="sr-only"
                                                                    />
                                                                </div>

                                                                <div
                                                                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
                                                                        formData.serviceDetails.requestType === 'upgrade'
                                                                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                                            : 'hover:bg-gray-50'
                                                                    }`}
                                                                    onClick={() =>
                                                                        setFormData((prev) => ({
                                                                            ...prev,
                                                                            serviceDetails: { ...prev.serviceDetails, requestType: 'upgrade' },
                                                                        }))
                                                                    }
                                                                >
                                                                    <div
                                                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                                                            formData.serviceDetails.requestType === 'upgrade'
                                                                                ? 'bg-blue-100'
                                                                                : 'bg-gray-100'
                                                                        }`}
                                                                    >
                                                                        <ArrowRight
                                                                            className={`h-4 w-4 ${formData.serviceDetails.requestType === 'upgrade' ? 'text-blue-600' : 'text-gray-600'}`}
                                                                        />
                                                                    </div>
                                                                    <span className="font-medium">Upgrade</span>
                                                                    <span className="text-xs text-gray-500">Improve service</span>
                                                                    <input
                                                                        type="radio"
                                                                        id="upgrade"
                                                                        name="requestType"
                                                                        value="upgrade"
                                                                        checked={formData.serviceDetails.requestType === 'upgrade'}
                                                                        onChange={() => {}}
                                                                        className="sr-only"
                                                                    />
                                                                </div>

                                                                <div
                                                                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
                                                                        formData.serviceDetails.requestType === 'downgrade'
                                                                            ? 'border-orange-500 bg-orange-50 shadow-sm'
                                                                            : 'hover:bg-gray-50'
                                                                    }`}
                                                                    onClick={() =>
                                                                        setFormData((prev) => ({
                                                                            ...prev,
                                                                            serviceDetails: { ...prev.serviceDetails, requestType: 'downgrade' },
                                                                        }))
                                                                    }
                                                                >
                                                                    <div
                                                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                                                            formData.serviceDetails.requestType === 'downgrade'
                                                                                ? 'bg-orange-100'
                                                                                : 'bg-gray-100'
                                                                        }`}
                                                                    >
                                                                        <ArrowLeft
                                                                            className={`h-4 w-4 ${formData.serviceDetails.requestType === 'downgrade' ? 'text-orange-600' : 'text-gray-600'}`}
                                                                        />
                                                                    </div>
                                                                    <span className="font-medium">Downgrade</span>
                                                                    <span className="text-xs text-gray-500">Reduce service</span>
                                                                    <input
                                                                        type="radio"
                                                                        id="downgrade"
                                                                        name="requestType"
                                                                        value="downgrade"
                                                                        checked={formData.serviceDetails.requestType === 'downgrade'}
                                                                        onChange={() => {}}
                                                                        className="sr-only"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="address">Address *</Label>
                                                        <Textarea
                                                            id="address"
                                                            value={formData.address}
                                                            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                                                            placeholder="Enter your complete address"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="latitude">Latitude</Label>
                                                            <Input
                                                                id="latitude"
                                                                type="number"
                                                                step="any"
                                                                value={formData.latitude || ''}
                                                                onChange={(e) =>
                                                                    setFormData((prev) => ({
                                                                        ...prev,
                                                                        latitude: Number.parseFloat(e.target.value) || 0,
                                                                    }))
                                                                }
                                                                placeholder="9.000000"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="longitude">Longitude</Label>
                                                            <Input
                                                                id="longitude"
                                                                type="number"
                                                                step="any"
                                                                value={formData.longitude || ''}
                                                                onChange={(e) =>
                                                                    setFormData((prev) => ({
                                                                        ...prev,
                                                                        longitude: Number.parseFloat(e.target.value) || 0,
                                                                    }))
                                                                }
                                                                placeholder="38.000000"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h2>Location Selection</h2>
                                                        <div>
                                                            <Label className="text-base font-semibold">Select Location on Map *</Label>
                                                            <p className="mb-4 text-sm text-gray-600">
                                                                Click on the map to select your exact location.
                                                            </p>
                                                            <LocationMap
                                                                onLocationSelect={handleLocationSelect}
                                                                initialLat={formData.latitude || 9.0192}
                                                                initialLng={formData.longitude || 38.7525}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* <div>
                                                        <Label className="text-base font-semibold">Select Location on Map *</Label>
                                                        <p className="mb-4 text-sm text-gray-600">Click on the map to select your exact location.</p>
                                                        <LocationMap
                                                            onLocationSelect={handleLocationSelect}
                                                            initialLat={formData.latitude || 9.0192}
                                                            initialLng={formData.longitude || 38.7525}
                                                        />
                                                    </div> */}

                                                    <div className="space-y-2">
                                                        <Label htmlFor="notes">Additional Notes</Label>
                                                        <Textarea
                                                            id="notes"
                                                            value={formData.additionalNotes}
                                                            onChange={(e) => setFormData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
                                                            placeholder="Any additional information"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-4 border-t pt-6">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowForm(false);
                                                            setEditingId(null);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                                                        {loading ? 'Submitting...' : editingId ? 'Update Survey' : 'Submit Survey'}
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Add Your Feedback</CardTitle>
                            <CardDescription>
                                Share your experience with this {showFeedbackModal.type === 'survey' ? 'survey' : 'service request'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerFeedback">Your Feedback</Label>
                                <Textarea
                                    id="customerFeedback"
                                    value={customerFeedback}
                                    onChange={(e) => setCustomerFeedback(e.target.value)}
                                    placeholder="Share your thoughts, suggestions, or concerns..."
                                    rows={4}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        /* handle feedback submit */
                                    }}
                                    className="flex-1"
                                    disabled={!customerFeedback.trim()}
                                >
                                    Submit Feedback
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowFeedbackModal(null);
                                        setCustomerFeedback('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* </div> */}

            {/* survey request section */}
            <div></div>
        </CustomerLayout>
    );
}
