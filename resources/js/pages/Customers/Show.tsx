import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CustomerLayout from '@/layouts/customer-layout';
import { BreadcrumbItem } from '@/types';
import { type Customer } from '@/types/customer';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, History, MoreHorizontal, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Show() {
    const {
        props: { customer },
    } = usePage<{ customer: Customer }>();

    const fullName = `${customer.first_name} ${customer.middle_name ? customer.middle_name + ' ' : ''}${customer.last_name} ${customer.contact}`;

    // const handleDelete = () => {
    //     if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
    //         router.delete(`/customers/${customer.id}`);
    //     }
    // };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const calculateAge = (dateOfBirth: string) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const mapContactTypeLabel = (type: string) => {
        const entry = Object.entries(ContactTypes).find(([, v]) => v === type);
        return entry ? entry[0].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : type;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Customers', href: '/customers' },
        { title: `${customer.first_name} ${customer.last_name}`, href: `/customers/${customer.id}` },
    ];

    const surveyRequests: [] = customer || [];

    return (
        <CustomerLayout>
            <Head title={`${customer.first_name} ${customer.last_name}`} />
            <div className="space-y-6 p-6"></div>
            <div>
                <Head title={`Customer - ${fullName}`} />

                <div className="space-y-6">
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{fullName}</h1>
                                {customer.title && <p className="text-gray-600 dark:text-gray-400">{customer.title}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button className="h-8 cursor-pointer" onClick={() => router.visit('/survey-requests/create')}>
                                Add Service
                            </Button>
                            <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="flex justify-between"
                                            onClick={() => router.visit(`/customers/${customer.id}/edit`)}
                                        >
                                            Edit
                                            <Edit className="ml-2 h-4 w-4" />
                                        </DropdownMenuItem>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="flex justify-between text-red-600 focus:text-red-600">
                                                Delete
                                                <Trash2 className="ml-2 h-4 w-4 text-red-500" />
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the customer record.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="cursor-pointer bg-red-600 hover:bg-red-500"
                                            onClick={() => {
                                                router.delete(`/customers/${customer.id}`, {
                                                    onSuccess: () => toast.success('Customer deleted successfully!'),
                                                    onError: () => toast.error('Failed to delete customer.'),
                                                });
                                            }}
                                        >
                                            Continue
                                        </AlertDialogAction>
                                        {/* <AlertDialogAction className="bg-red-600 hover:bg-red-500" onClick={handleDelete}>
                                            Continue
                                        </AlertDialogAction> */}
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Main Information */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Previous Services Section */}
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <History className="h-5 w-5" />
                                        Your Services
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="mb-6">
                                        {surveyRequests.length > 0 ? (
                                            <ul className="mt-4 space-y-2">
                                                {surveyRequests.map((service: any) => (
                                                    <li key={service.id} className="flex items-center justify-between rounded border p-2">
                                                        <span>
                                                            {service.survey_request_number} - {service.survey_type} ({service.status})
                                                        </span>
                                                        <Link href={`/survey-requests/${service.id}`} className="text-sm text-blue-600 underline">
                                                            View
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="mt-24 text-gray-500">You have no services.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Personal Information */}
                            {/* <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Personal Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                                            <p className="text-lg font-semibold">{fullName}</p>
                                        </div>
                                        {customer.gender && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                                                <p className="text-lg">{customer.gender}</p>
                                            </div>
                                        )}
                                    </div>
                                    <hr />

                                    {customer.date_of_birth && (
                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                                                <p className="text-lg">{formatDate(customer.date_of_birth)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</label>
                                                <p className="text-lg">{calculateAge(customer.date_of_birth)} years old</p>
                                            </div>
                                        </div>
                                    )}
                                    <hr />

                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                                        {customer.nationality && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nationality</label>
                                                <p className="text-lg">{customer.nationality}</p>
                                            </div>
                                        )}
                                        {customer.place_of_birth && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Place of Birth</label>
                                                <p className="text-lg">{customer.place_of_birth}</p>
                                            </div>
                                        )}
                                    </div>
                                    <hr />
                                    {customer.primary_language && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Language</label>
                                            <p className="text-lg">{customer.primary_language}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card> */}

                            {/* Contact Information */}
                            {/* <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Phone className="h-5 w-5" />
                                        Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 space-y-4">
                                    {customer.contact?.phone && (
                                        <div className="flex items-center gap-3">
                                            <PhoneIcon className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                                                <p className="text-lg">{customer.contact.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {customer.contact?.secondary_phone && (
                                        <div className="flex items-center gap-3">
                                            <PhoneIcon className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile</label>
                                                <p className="text-lg">{customer.contact.secondary_phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {customer.contact?.email && (
                                        <div className="flex items-center gap-3">
                                            <MailIcon className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                                                <p className="text-lg">{customer.contact.email}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card> */}

                            {/* Address */}
                            {/* {customer.address && Object.values(customer.address).some(Boolean) && (
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Address
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="flex items-start gap-3">
                                            <MapPinIcon className="mt-1 h-5 w-5 text-gray-400" />
                                            <div className="space-y-1">
                                                {customer.address.city && <p className="text-lg">{customer.address.city}</p>}

                                                <p className="text-lg">
                                                    {[customer.address.city, customer.address.woreda, customer.address.zone]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                                {customer.address.region && <p className="text-lg">{customer.address.region}</p>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )} */}

                            {/* Professional Information */}
                            {/* {(customer.occupation || customer.education || customer.religion || customer.income) && (
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building className="h-5 w-5" />
                                            Professional Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                                            {customer.occupation && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupation</label>
                                                    <p className="text-lg">{customer.occupation}</p>
                                                </div>
                                            )}
                                            {customer.education && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Education</label>
                                                    <p className="text-lg">{customer.education}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                                            {customer.religion && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Religion</label>
                                                    <p className="text-lg">{customer.religion}</p>
                                                </div>
                                            )}
                                            {customer.income && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Income Level</label>
                                                    <p>
                                                        <Badge variant="secondary">{customer.income}</Badge>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )} */}

                            {/* Identification */}
                            {/* {(customer.identification_type || customer.identification_number) && (
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Identification
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                                            {customer.identification_type && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Type</label>
                                                    <p className="text-lg">{customer.identification_type}</p>
                                                </div>
                                            )}
                                            {customer.identification_number && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Number</label>
                                                    <p className="font-mono text-lg">{customer.identification_number}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )} */}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Customer Avatar */}
                            <Card className="border-none shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                            <User className="h-12 w-12 text-white" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-semibold">{fullName}</h3>
                                            {customer.title && <p className="text-gray-600 dark:text-gray-400">{customer.title}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contact Persons
                            {customer.contact_persons && customer.contact_persons.length > 0 && (
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Contact Persons
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {customer.contact_persons.map((person, index) => (
                                            <div key={index} className="flex flex-col gap-2 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900/30">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="capitalize">
                                                        {mapContactTypeLabel(person.type)}
                                                    </Badge>
                                                    <span className="text-lg font-semibold">{person.name}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
                                                    {person.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-4 w-4" /> {person.phone}
                                                        </span>
                                                    )}
                                                    {person.relationship && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" /> {person.relationship}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )} */}

                            {/* System Information
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle>System Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer ID</label>
                                        <p className="font-mono text-sm">{customer.id}</p>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                                        <p className="text-sm">
                                            {'created_at' in customer && customer.created_at ? formatDate(customer.created_at) : '-'}
                                        </p>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                                        <p className="text-sm">
                                            {'updated_at' in customer && customer.updated_at ? formatDate(customer.updated_at) : '-'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card> */}
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
