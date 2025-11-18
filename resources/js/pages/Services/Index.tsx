// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import AuthLayout from '@/layouts/AuthLayout';
// import { Link, router } from '@inertiajs/react';
// import { AlertCircle, ArrowRight, BarChart3, CheckCircle, Clock, FileText, Package, Phone, Wifi } from 'lucide-react';
// import { useEffect, useMemo, useState } from 'react';

// export default function ServicesPage() {
//     const { surveys, loading, fetchSurveys } = useSurveyList();
//     const [stats, setStats] = useState({
//         total: 0,
//         active: 0,
//         completed: 0,
//         pending: 0,
//     });

//     useEffect(() => {
//         fetchSurveys();
//     }, []);

//     useEffect(() => {
//         if (surveys.length > 0) {
//             const newStats = {
//                 total: surveys.length,
//                 active: surveys.filter((s) => s.status?.toLowerCase() === 'waiting').length,
//                 completed: surveys.filter((s) => s.status?.toLowerCase() === 'completed').length,
//                 pending: surveys.filter((s) => ['waiting', 'approved'].includes(s.status?.toLowerCase())).length,
//             };
//             setStats(newStats);
//         }
//     }, [surveys]);

//     const recentSurveys = useMemo(() => {
//         return surveys.slice(0, 3).map((survey) => ({
//             id: survey.customer_survey_order_id,
//             type: getServiceType(survey.main_offer_id),
//             status: survey.status,
//             date: new Date(survey.created_at).toLocaleDateString(),
//             icon: getServiceIcon(survey.main_offer_id),
//         }));
//     }, [surveys]);

//     const hasActiveSurvey = useMemo(() => {
//         return surveys.some((s) => ['waitingg', 'approvedd'].includes(s.status?.toLowerCase()));
//     }, [surveys]);

//     const serviceTypes = [
//         {
//             id: '1943913915',
//             name: 'Fixed Broadband',
//             description: 'High-speed internet connection for home or business',
//             icon: Wifi,
//             color: 'blue',
//             features: ['Fast internet speeds', 'Reliable connectivity', '24/7 support'],
//         },
//         {
//             id: '1207609454',
//             name: 'Fixed Voice',
//             description: 'Clear telephone service with reliable connectivity',
//             icon: Phone,
//             color: 'green',
//             features: ['Crystal clear calls', 'Unlimited local calls', 'Voicemail included'],
//         },
//         {
//             id: '102647257',
//             name: 'Combo Services',
//             description: 'Bundle of internet and voice services',
//             icon: Package,
//             color: 'purple',
//             features: ['Best value bundle', 'Single bill', 'Integrated services'],
//         },
//     ];

//     function getServiceType(offerId: string) {
//         switch (offerId) {
//             case '1943913915':
//                 return 'Broadband';
//             case '1207609454':
//                 return 'Voice';
//             case '102647257':
//                 return 'Combo';
//             default:
//                 return 'Service';
//         }
//     }

//     function getServiceIcon(offerId: string) {
//         switch (offerId) {
//             case '1943913915':
//                 return Wifi;
//             case '1207609454':
//                 return Phone;
//             case '102647257':
//                 return Package;
//             default:
//                 return FileText;
//         }
//     }

//     function getStatusColor(status: string) {
//         switch (status?.toLowerCase()) {
//             case 'completed':
//                 return 'bg-green-100 text-green-800';
//             case 'waiting':
//                 return 'bg-yellow-100 text-yellow-800';
//             case 'subscribed':
//                 return 'bg-blue-100 text-blue-800';
//             case 'cancelled':
//                 return 'bg-red-100 text-red-800';
//             default:
//                 return 'bg-gray-100 text-gray-800';
//         }
//     }

//     return (
//         <AuthLayout>
//             <div className="min-h-screen">
//                 <main className="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-4">
//                     {/* Header Section */}
//                     <div className="mb-4">
//                         <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
//                             <div className="flex-1">
//                                 <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Welcome to Ethio Telecom Fixed Services</h1>
//                                 <p className="text-md mt-1 max-w-2xl text-gray-600">
//                                     Manage your telecom services, request new connections, and track your orders in one place.
//                                 </p>
//                             </div>
//                             <div className="flex items-center gap-4">
//                                 <Link href="/dashboard">
//                                     <Button variant="outline" className="flex items-center gap-2">
//                                         <BarChart3 className="h-4 w-4" />
//                                         View Dashboard
//                                     </Button>
//                                 </Link>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Quick Stats */}
//                     {/* <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
//                         <Card className="border-0 bg-white shadow-sm">
//                             <CardContent className="p-6">
//                                 <div className="flex items-center">
//                                     <div className="rounded-lg bg-blue-100 p-3">
//                                         <FileText className="h-6 w-6 text-blue-600" />
//                                     </div>
//                                     <div className="ml-4">
//                                         <p className="text-sm font-medium text-gray-600">Total Requests</p>
//                                         <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         <Card className="border-0 bg-white shadow-sm">
//                             <CardContent className="p-6">
//                                 <div className="flex items-center">
//                                     <div className="rounded-lg bg-yellow-100 p-3">
//                                         <Clock className="h-6 w-6 text-yellow-600" />
//                                     </div>
//                                     <div className="ml-4">
//                                         <p className="text-sm font-medium text-gray-600">Active</p>
//                                         <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         <Card className="border-0 bg-white shadow-sm">
//                             <CardContent className="p-6">
//                                 <div className="flex items-center">
//                                     <div className="rounded-lg bg-green-100 p-3">
//                                         <CheckCircle className="h-6 w-6 text-green-600" />
//                                     </div>
//                                     <div className="ml-4">
//                                         <p className="text-sm font-medium text-gray-600">Completed</p>
//                                         <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         <Card className="border-0 bg-white shadow-sm">
//                             <CardContent className="p-6">
//                                 <div className="flex items-center">
//                                     <div className="rounded-lg bg-purple-100 p-3">
//                                         <TrendingUp className="h-6 w-6 text-purple-600" />
//                                     </div>
//                                     <div className="ml-4">
//                                         <p className="text-sm font-medium text-gray-600">Ready to Convert</p>
//                                         <p className="text-2xl font-bold text-gray-900">
//                                             {surveys.filter((s) => s.status?.toLowerCase() === 'completed').length}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </div> */}

//                     <div className="grid gap-8 lg:grid-cols-3">
//                         {/* Service Selection */}
//                         <div className="lg:col-span-2">
//                             <Card className="border-0 shadow-lg">
//                                 <CardHeader className="pb-0">
//                                     <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
//                                         {/* <Plus className="h-6 w-6 text-primary" /> */}
//                                         Request New Service
//                                     </CardTitle>
//                                     <CardDescription className="text-md text-gray-600">Choose from our range of telecom services</CardDescription>
//                                 </CardHeader>
//                                 <CardContent className="p-0">
//                                     <div className="grid gap-6 md:grid-cols-2">
//                                         {serviceTypes.map((service) => {
//                                             const IconComponent = service.icon;
//                                             return (
//                                                 <Card
//                                                     key={service.id}
//                                                     className="cursor-pointer border-2 border-transparent transition-all duration-200 hover:border-primary hover:shadow-lg"
//                                                 >
//                                                     <CardContent className="p-6">
//                                                         <div className="flex items-start gap-4">
//                                                             <div className={`rounded-xl bg-${service.color}-100 p-3`}>
//                                                                 <IconComponent className={`h-6 w-6 text-${service.color}-600`} />
//                                                             </div>
//                                                             <div className="flex-1">
//                                                                 <h3 className="font-semibold text-gray-900">{service.name}</h3>
//                                                                 <p className="mt-1 text-sm text-gray-600">{service.description}</p>
//                                                                 <ul className="mt-3 space-y-1">
//                                                                     {service.features.map((feature, index) => (
//                                                                         <li key={index} className="flex items-center text-xs text-gray-500">
//                                                                             <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
//                                                                             {feature}
//                                                                         </li>
//                                                                     ))}
//                                                                 </ul>
//                                                                 <Button
//                                                                     className="mt-4 w-full"
//                                                                     disabled={hasActiveSurvey}
//                                                                     onClick={() =>
//                                                                         router.visit('/create-survey-requests', {
//                                                                             data: { main_offer_id: service.id },
//                                                                         })
//                                                                     }
//                                                                 >
//                                                                     {hasActiveSurvey ? 'Complete Active Request First' : 'Request Service'}
//                                                                 </Button>
//                                                             </div>
//                                                         </div>
//                                                     </CardContent>
//                                                 </Card>
//                                             );
//                                         })}
//                                     </div>

//                                     {hasActiveSurvey && (
//                                         <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
//                                             <div className="flex items-center">
//                                                 <AlertCircle className="mr-3 h-5 w-5 text-blue-400" />
//                                                 <p className="text-sm text-blue-700">
//                                                     You have an active service request. Complete or cancel it to create a new one.
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </CardContent>
//                             </Card>
//                         </div>

//                         {/* Recent Activity & Quick Actions */}
//                         <div className="space-y-6">
//                             {/* Recent Activity */}
//                             <Card className="border-0 shadow-lg">
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2 text-lg font-semibold">
//                                         <Clock className="h-5 w-5 text-gray-600" />
//                                         Recent Activity
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent>
//                                     {loading ? (
//                                         <div className="flex items-center justify-center py-8">
//                                             <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
//                                         </div>
//                                     ) : recentSurveys.length > 0 ? (
//                                         <div className="space-y-4">
//                                             {recentSurveys.map((survey) => {
//                                                 const IconComponent = survey.icon;
//                                                 return (
//                                                     <div key={survey.id} className="flex items-center justify-between border-b pb-4 last:border-0">
//                                                         <div className="flex items-center gap-3">
//                                                             <div className="rounded-lg bg-gray-100 p-2">
//                                                                 <IconComponent className="h-4 w-4 text-gray-600" />
//                                                             </div>
//                                                             <div>
//                                                                 <p className="text-sm font-medium text-gray-900">{survey.type}</p>
//                                                                 <p className="text-xs text-gray-500">{survey.date}</p>
//                                                             </div>
//                                                         </div>
//                                                         <Badge className={getStatusColor(survey.status)}>{survey.status}</Badge>
//                                                     </div>
//                                                 );
//                                             })}
//                                             <Link href="/dashboard">
//                                                 <Button variant="ghost" className="w-full text-sm">
//                                                     View All Activity
//                                                     <ArrowRight className="ml-2 h-4 w-4" />
//                                                 </Button>
//                                             </Link>
//                                         </div>
//                                     ) : (
//                                         <div className="py-6 text-center">
//                                             <FileText className="mx-auto h-8 w-8 text-gray-300" />
//                                             <p className="mt-2 text-sm text-gray-500">No recent activity</p>
//                                         </div>
//                                     )}
//                                 </CardContent>
//                             </Card>

//                             {/* Quick Actions */}
//                             {/* <Card className="border-0 shadow-lg">
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2 text-lg font-semibold">
//                                         <TrendingUp className="h-5 w-5 text-gray-600" />
//                                         Quick Actions
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="space-y-3">
//                                     <Link href="/dashboard" className="block">
//                                         <Button variant="outline" className="w-full justify-start">
//                                             <BarChart3 className="mr-3 h-4 w-4" />
//                                             View Detailed Dashboard
//                                         </Button>
//                                     </Link>
//                                     <Link href="/support-request" className="block">
//                                         <Button variant="outline" className="w-full justify-start">
//                                             <Users className="mr-3 h-4 w-4" />
//                                             Contact Support
//                                         </Button>
//                                     </Link>
//                                     <Link href="/profile" className="block">
//                                         <Button variant="outline" className="w-full justify-start">
//                                             <MapPin className="mr-3 h-4 w-4" />
//                                             Update Profile
//                                         </Button>
//                                     </Link>
//                                 </CardContent>
//                             </Card> */}
//                         </div>
//                     </div>
//                 </main>
//             </div>
//         </AuthLayout>
//     );
// }

// import { MultiStepService } from '@/components/service/multi-step-service';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import AuthLayout from '@/layouts/AuthLayout';
// import { Link, router } from '@inertiajs/react';
// import { AlertCircle, ArrowRight, BarChart3, Clock, FileText, Package, Phone, Wifi } from 'lucide-react';
// import { useEffect, useMemo, useState } from 'react';

// export default function ServicesPage() {
//     const { surveys, loading, fetchSurveys } = useSurveyList();
//     const [showMultiStep, setShowMultiStep] = useState(false);
//     const [stats, setStats] = useState({
//         total: 0,
//         active: 0,
//         completed: 0,
//         pending: 0,
//     });

//     useEffect(() => {
//         fetchSurveys();
//     }, []);

//     useEffect(() => {
//         if (surveys.length > 0) {
//             const newStats = {
//                 total: surveys.length,
//                 active: surveys.filter((s) => s.status?.toLowerCase() === 'waiting').length,
//                 completed: surveys.filter((s) => s.status?.toLowerCase() === 'completed').length,
//                 pending: surveys.filter((s) => ['waiting', 'approved'].includes(s.status?.toLowerCase())).length,
//             };
//             setStats(newStats);
//         }
//     }, [surveys]);

//     const recentSurveys = useMemo(() => {
//         return surveys.slice(0, 3).map((survey) => ({
//             id: survey.customer_survey_order_id,
//             type: getServiceType(survey.main_offer_id),
//             status: survey.status,
//             date: new Date(survey.created_at).toLocaleDateString(),
//             icon: getServiceIcon(survey.main_offer_id),
//         }));
//     }, [surveys]);

//     const hasActiveSurvey = useMemo(() => {
//         return surveys.some((s) => ['waitingg', 'approvedd'].includes(s.status?.toLowerCase()));
//     }, [surveys]);

//     function getServiceType(offerId: string) {
//         switch (offerId) {
//             case '1943913915':
//                 return 'Broadband';
//             case '1207609454':
//                 return 'Voice';
//             case '102647257':
//                 return 'Combo';
//             default:
//                 return 'Service';
//         }
//     }

//     function getServiceIcon(offerId: string) {
//         switch (offerId) {
//             case '1943913915':
//                 return Wifi;
//             case '1207609454':
//                 return Phone;
//             case '102647257':
//                 return Package;
//             default:
//                 return FileText;
//         }
//     }

//     function getStatusColor(status: string) {
//         switch (status?.toLowerCase()) {
//             case 'completed':
//                 return 'bg-green-100 text-green-800';
//             case 'waiting':
//                 return 'bg-yellow-100 text-yellow-800';
//             case 'subscribed':
//                 return 'bg-blue-100 text-blue-800';
//             case 'cancelled':
//                 return 'bg-red-100 text-red-800';
//             default:
//                 return 'bg-gray-100 text-gray-800';
//         }
//     }

//     // If showing multi-step form, render that instead
//     if (showMultiStep) {
//         return <MultiStepService />;
//     }

//     return (
//         <AuthLayout>
//             <div className="min-h-screen">
//                 <main className="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-4">
//                     {/* Header Section */}
//                     <div className="mb-4">
//                         <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
//                             <div className="flex-1">
//                                 <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Welcome to Ethio Telecom Fixed Services</h1>
//                                 <p className="text-md mt-1 max-w-2xl text-gray-600">
//                                     Manage your telecom services, request new connections, and track your orders in one place.
//                                 </p>
//                             </div>
//                             <div className="flex items-center gap-4">
//                                 <Link href="/dashboard">
//                                     <Button variant="outline" className="flex items-center gap-2">
//                                         <BarChart3 className="h-4 w-4" />
//                                         View Dashboard
//                                     </Button>
//                                 </Link>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="grid gap-8 lg:grid-cols-3">
//                         {/* Service Selection */}
//                         <div className="lg:col-span-2">
//                             <Card className="border-0 shadow-lg">
//                                 <CardHeader className="pb-0">
//                                     <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">Request New Service</CardTitle>
//                                     <CardDescription className="text-md text-gray-600">Choose from our range of telecom services</CardDescription>
//                                 </CardHeader>
//                                 <CardContent className="p-6">
//                                     <div className="py-8 text-center">
//                                         <div className="mx-auto max-w-md">
//                                             <div className="mb-6 rounded-lg bg-blue-50 p-6">
//                                                 <h3 className="mb-2 text-lg font-semibold text-blue-900">New Service Request Wizard</h3>
//                                                 <p className="mb-4 text-blue-700">
//                                                     Use our step-by-step wizard to easily request new telecom services with guided assistance.
//                                                 </p>
//                                                 <Button
//                                                     onClick={() => setShowMultiStep(true)}
//                                                     disabled={hasActiveSurvey}
//                                                     className="w-full bg-blue-600 hover:bg-blue-700"
//                                                     size="lg"
//                                                 >
//                                                     Start Service Request Wizard
//                                                 </Button>
//                                             </div>

//                                             <p className="text-sm text-gray-500">
//                                                 Or continue with{' '}
//                                                 <button
//                                                     onClick={() => router.visit('/create-survey-requests')}
//                                                     className="text-primary hover:underline"
//                                                 >
//                                                     classic form
//                                                 </button>
//                                             </p>
//                                         </div>
//                                     </div>

//                                     {hasActiveSurvey && (
//                                         <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
//                                             <div className="flex items-center">
//                                                 <AlertCircle className="mr-3 h-5 w-5 text-blue-400" />
//                                                 <p className="text-sm text-blue-700">
//                                                     You have an active service request. Complete or cancel it to create a new one.
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </CardContent>
//                             </Card>
//                         </div>

//                         {/* Recent Activity */}
//                         <div className="space-y-6">
//                             <Card className="border-0 shadow-lg">
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2 text-lg font-semibold">
//                                         <Clock className="h-5 w-5 text-gray-600" />
//                                         Recent Activity
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent>
//                                     {loading ? (
//                                         <div className="flex items-center justify-center py-8">
//                                             <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
//                                         </div>
//                                     ) : recentSurveys.length > 0 ? (
//                                         <div className="space-y-4">
//                                             {recentSurveys.map((survey) => {
//                                                 const IconComponent = survey.icon;
//                                                 return (
//                                                     <div key={survey.id} className="flex items-center justify-between border-b pb-4 last:border-0">
//                                                         <div className="flex items-center gap-3">
//                                                             <div className="rounded-lg bg-gray-100 p-2">
//                                                                 <IconComponent className="h-4 w-4 text-gray-600" />
//                                                             </div>
//                                                             <div>
//                                                                 <p className="text-sm font-medium text-gray-900">{survey.type}</p>
//                                                                 <p className="text-xs text-gray-500">{survey.date}</p>
//                                                             </div>
//                                                         </div>
//                                                         <Badge className={getStatusColor(survey.status)}>{survey.status}</Badge>
//                                                     </div>
//                                                 );
//                                             })}
//                                             <Link href="/dashboard">
//                                                 <Button variant="ghost" className="w-full text-sm">
//                                                     View All Activity
//                                                     <ArrowRight className="ml-2 h-4 w-4" />
//                                                 </Button>
//                                             </Link>
//                                         </div>
//                                     ) : (
//                                         <div className="py-6 text-center">
//                                             <FileText className="mx-auto h-8 w-8 text-gray-300" />
//                                             <p className="mt-2 text-sm text-gray-500">No recent activity</p>
//                                         </div>
//                                     )}
//                                 </CardContent>
//                             </Card>
//                         </div>
//                     </div>
//                 </main>
//             </div>
//         </AuthLayout>
//     );
// }

// import { MultiStepService } from '@/components/service/multi-step-service';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import AuthLayout from '@/layouts/AuthLayout';
// import { useEffect } from 'react';

// export default function ServicesPage() {
//     const { fetchSurveys } = useSurveyList();

//     useEffect(() => {
//         fetchSurveys();
//     }, []);

//     return (
//         <AuthLayout>
//             <MultiStepService />
//         </AuthLayout>
//     );
// }

// pages/services/index.tsx
// import ServicesLayout from '@/layouts/ServicesLayout';
// import { Button } from '@/components/ui/button';
// import { Link } from '@inertiajs/react';
// import { Plus } from 'lucide-react';
// import { ServicesSidebar } from '@/components/service/services-sidebar';
// import { ServiceList } from '@/components/service/service-list';

// export default function ServicesPage() {
//   const sidebarContent = <ServicesSidebar mode="list" />;

//   return (
//     <ServicesLayout sidebarContent={sidebarContent}>
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
//             <p className="text-gray-600 mt-2">Manage your telecom services and requests</p>
//           </div>
//           <Link href="/services/new">
//             <Button className="flex items-center gap-2">
//               <Plus className="h-4 w-4" />
//               Create New Service
//             </Button>
//           </Link>
//         </div>

//         {/* Services List */}
//         <ServiceList />
//       </div>
//     </ServicesLayout>
//   );
// }

// pages/services/index.tsx
// import { ServiceList } from '@/components/service/service-list';
// import { ServicesSidebar } from '@/components/service/services-sidebar';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import AuthLayout from '@/layouts/AuthLayout';
// import ServicesLayout from '@/layouts/ServicesLayout';
// import { Link } from '@inertiajs/react';
// import { BarChart3, Plus, RefreshCw } from 'lucide-react';
// import { useEffect } from 'react';

// export default function ServicesPage() {
//     const { surveys, loading, refetch } = useSurveyList();

//     useEffect(() => {
//         refetch();
//     }, []);

//     const sidebarContent = <ServicesSidebar mode="list" />;

//     const recentSurveys = surveys.slice(0, 5);
//     const activeSurveys = surveys.filter((s) => ['waiting', 'completed'].includes(s.status?.toLowerCase())).length;

//     return (
//         <ServicesLayout sidebarContent={sidebarContent}>
//             <div className="mx-auto max-w-6xl">
//                 {/* Header */}
//                 <div className="mb-8 flex items-center justify-between">
//                     <div>
//                         <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
//                         <p className="mt-2 text-gray-600">Manage your telecom services and requests</p>
//                     </div>
//                     <div className="flex items-center gap-3">
//                         <Button variant="outline" onClick={refetch} disabled={loading}>
//                             <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
//                             Refresh
//                         </Button>
//                         <Link href="/services/new">
//                             <Button className="flex items-center gap-2">
//                                 <Plus className="h-4 w-4" />
//                                 Create New Service
//                             </Button>
//                         </Link>
//                     </div>
//                 </div>

//                 {/* Quick Stats */}
//                 <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="text-sm font-medium">Total Services</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold">{surveys.length}</div>
//                             <p className="text-xs text-gray-600">All service requests</p>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold text-blue-600">{activeSurveys}</div>
//                             <p className="text-xs text-gray-600">Waiting or completed</p>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold text-green-600">{recentSurveys.length}</div>
//                             <p className="text-xs text-gray-600">Last 5 requests</p>
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Recent Services */}
//                 {recentSurveys.length > 0 && (
//                     <Card className="mb-8">
//                         <CardHeader>
//                             <CardTitle className="flex items-center gap-2">
//                                 <BarChart3 className="h-5 w-5" />
//                                 Recent Service Requests
//                             </CardTitle>
//                             <CardDescription>Your most recent service activities</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="space-y-4">
//                                 {recentSurveys.map((service) => (
//                                     <div key={service.customer_survey_order_id} className="flex items-center justify-between rounded-lg border p-4">
//                                         <div className="flex items-center space-x-4">
//                                             <div
//                                                 className={`h-3 w-3 rounded-full ${
//                                                     service.status?.toLowerCase() === 'completed'
//                                                         ? 'bg-green-500'
//                                                         : service.status?.toLowerCase() === 'waiting'
//                                                           ? 'bg-yellow-500'
//                                                           : service.status?.toLowerCase() === 'subscribed'
//                                                             ? 'bg-blue-500'
//                                                             : 'bg-gray-500'
//                                                 }`}
//                                             />
//                                             <div>
//                                                 <div className="font-medium">
//                                                     {service.main_offer_id?.includes('1943913915')
//                                                         ? 'Fixed Broadband'
//                                                         : service.main_offer_id?.includes('1207609454')
//                                                           ? 'Fixed Voice'
//                                                           : 'Combo Service'}
//                                                 </div>
//                                                 <div className="text-sm text-gray-600">Order #{service.customer_survey_order_id}</div>
//                                             </div>
//                                         </div>
//                                         <div className="text-right">
//                                             <div
//                                                 className={`rounded-full px-2 py-1 text-xs font-medium ${
//                                                     service.status?.toLowerCase() === 'completed'
//                                                         ? 'bg-green-100 text-green-800'
//                                                         : service.status?.toLowerCase() === 'waiting'
//                                                           ? 'bg-yellow-100 text-yellow-800'
//                                                           : service.status?.toLowerCase() === 'subscribed'
//                                                             ? 'bg-blue-100 text-blue-800'
//                                                             : 'bg-gray-100 text-gray-800'
//                                                 }`}
//                                             >
//                                                 {service.status}
//                                             </div>
//                                             <div className="mt-1 text-xs text-gray-500">{new Date(service.created_at).toLocaleDateString()}</div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}

//                 {/* All Services Table */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>All Service Requests</CardTitle>
//                         <CardDescription>Complete history of your service requests and their status</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         <ServiceList />
//                     </CardContent>
//                 </Card>
//             </div>
//         </ServicesLayout>
//     );
// }

// pages/services/index.tsx
// import { ServiceList } from '@/components/service/service-list';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import ServicesLayout from '@/layouts/ServicesLayout';
// import { Link } from '@inertiajs/react';
// import { BarChart3, Plus, RefreshCw, TrendingUp, Users, Wifi } from 'lucide-react';
// import { useEffect } from 'react';

// export default function ServicesPage() {
//     const { surveys, loading, refetch, total } = useSurveyList();

//     useEffect(() => {
//         refetch();
//     }, []);

//     const recentSurveys = surveys.slice(0, 5);
//     const activeSurveys = surveys.filter((s) => ['waiting', 'completed'].includes(s.status?.toLowerCase())).length;

//     const stats = {
//         total: surveys.length,
//         active: activeSurveys,
//         completed: surveys.filter((s) => s.status?.toLowerCase() === 'completed').length,
//         waiting: surveys.filter((s) => s.status?.toLowerCase() === 'waiting').length,
//     };

//     return (
//         <ServicesLayout>
//             <div className="mx-auto max-w-7xl">
//                 {/* Header */}
//                 <div className="mb-8 flex items-center justify-between">
//                     <div>
//                         <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
//                         <p className="mt-2 text-gray-600">Manage your telecom services and requests</p>
//                     </div>
//                     <div className="flex items-center gap-3">
//                         <Button variant="outline" onClick={refetch} disabled={loading}>
//                             <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
//                             Refresh
//                         </Button>
//                         <Link href="/services/new">
//                             <Button className="flex items-center gap-2">
//                                 <Plus className="h-4 w-4" />
//                                 Create New Service
//                             </Button>
//                         </Link>
//                     </div>
//                 </div>

//                 {/* Quick Stats */}
//                 <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="flex items-center gap-2 text-sm font-medium">
//                                 <Users className="h-4 w-4" />
//                                 Total Services
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold">{stats.total}</div>
//                             <p className="text-xs text-gray-600">All service requests</p>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="flex items-center gap-2 text-sm font-medium">
//                                 <TrendingUp className="h-4 w-4 text-green-600" />
//                                 Active Requests
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold text-green-600">{stats.active}</div>
//                             <p className="text-xs text-gray-600">Waiting or completed</p>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="flex items-center gap-2 text-sm font-medium">
//                                 <BarChart3 className="h-4 w-4 text-blue-600" />
//                                 Completed
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
//                             <p className="text-xs text-gray-600">Ready for subscription</p>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="flex items-center gap-2 text-sm font-medium">
//                                 <Wifi className="h-4 w-4 text-yellow-600" />
//                                 In Progress
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
//                             <p className="text-xs text-gray-600">Awaiting processing</p>
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Recent Services */}
//                 {recentSurveys.length > 0 && (
//                     <Card className="mb-8">
//                         <CardHeader>
//                             <CardTitle className="flex items-center gap-2">
//                                 <BarChart3 className="h-5 w-5" />
//                                 Recent Service Requests
//                             </CardTitle>
//                             <CardDescription>Your most recent service activities</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="space-y-4">
//                                 {recentSurveys.map((service) => (
//                                     <div key={service.customer_survey_order_id} className="flex items-center justify-between rounded-lg border p-4">
//                                         <div className="flex items-center space-x-4">
//                                             <div
//                                                 className={`h-3 w-3 rounded-full ${
//                                                     service.status?.toLowerCase() === 'completed'
//                                                         ? 'bg-green-500'
//                                                         : service.status?.toLowerCase() === 'waiting'
//                                                           ? 'bg-yellow-500'
//                                                           : service.status?.toLowerCase() === 'subscribed'
//                                                             ? 'bg-blue-500'
//                                                             : 'bg-gray-500'
//                                                 }`}
//                                             />
//                                             <div>
//                                                 <div className="font-medium">
//                                                     {service.main_offer_id?.includes('1943913915')
//                                                         ? 'Fixed Broadband'
//                                                         : service.main_offer_id?.includes('1207609454')
//                                                           ? 'Fixed Voice'
//                                                           : 'Combo Service'}
//                                                 </div>
//                                                 <div className="text-sm text-gray-600">Order #{service.customer_survey_order_id}</div>
//                                             </div>
//                                         </div>
//                                         <div className="text-right">
//                                             <div
//                                                 className={`rounded-full px-2 py-1 text-xs font-medium ${
//                                                     service.status?.toLowerCase() === 'completed'
//                                                         ? 'bg-green-100 text-green-800'
//                                                         : service.status?.toLowerCase() === 'waiting'
//                                                           ? 'bg-yellow-100 text-yellow-800'
//                                                           : service.status?.toLowerCase() === 'subscribed'
//                                                             ? 'bg-blue-100 text-blue-800'
//                                                             : 'bg-gray-100 text-gray-800'
//                                                 }`}
//                                             >
//                                                 {service.status}
//                                             </div>
//                                             <div className="mt-1 text-xs text-gray-500">{new Date(service.created_at).toLocaleDateString()}</div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}

//                 {/* All Services Table */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>All Service Requests</CardTitle>
//                         <CardDescription>Complete history of your service requests and their status</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         <ServiceList />
//                     </CardContent>
//                 </Card>
//             </div>
//         </ServicesLayout>
//     );
// }

// pages/services/index.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSurveyList } from '@/hooks/use-survey-list';
import ServicesLayout from '@/layouts/ServicesLayout';
import { BarChart3, TrendingUp, Users, Wifi } from 'lucide-react';
import { useEffect } from 'react';

export default function ServicesPage() {
    const { surveys, loading, refetch, total } = useSurveyList();

    useEffect(() => {
        refetch();
    }, []);

    const recentSurveys = surveys.slice(0, 3);
    const activeSurveys = surveys.filter((s) => ['waiting', 'completed'].includes(s.status?.toLowerCase())).length;

    const stats = {
        total: surveys.length,
        active: activeSurveys,
        completed: surveys.filter((s) => s.status?.toLowerCase() === 'completed').length,
        waiting: surveys.filter((s) => s.status?.toLowerCase() === 'waiting').length,
    };

    return (
        <ServicesLayout>
            {/* Remove max-w constraints and let it take full width */}
            <div className="w-full">
                {/* Header */}
                {/* <div className="mb-8 flex items-center justify-between">
                    <div> */}
                {/* <h1 className="text-xl font-bold text-gray-900">My Services</h1> */}
                {/* <p className="mt-2 text-gray-600">Manage your telecom services and requests</p>
                    </div> */}
                {/* <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={refetch} disabled={loading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Link href="/services/new">
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Create New Service
                            </Button>
                        </Link>
                    </div> */}
                {/* </div> */}

                {/* Quick Stats */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <Users className="h-4 w-4" />
                                Total Services
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-gray-600">All service requests</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Active Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                            <p className="text-xs text-gray-600">Waiting or completed</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <BarChart3 className="h-4 w-4 text-blue-600" />
                                Completed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
                            <p className="text-xs text-gray-600">Ready for subscription</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <Wifi className="h-4 w-4 text-yellow-600" />
                                In Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
                            <p className="text-xs text-gray-600">Awaiting processing</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Services */}
                {/* {recentSurveys.length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Recent Service Requests
                            </CardTitle>
                            <CardDescription>Your most recent service activities</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentSurveys.map((service) => (
                                    <div key={service.customer_survey_order_id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center space-x-4">
                                            <div
                                                className={`h-3 w-3 rounded-full ${
                                                    service.status?.toLowerCase() === 'completed'
                                                        ? ''
                                                        : service.status?.toLowerCase() === 'waiting'
                                                          ? ''
                                                          : service.status?.toLowerCase() === 'subscribed'
                                                            ? 'bg-blue-500'
                                                            : 'bg-gray-500'
                                                }`}
                                            />
                                            <div>
                                                <div className="font-medium">
                                                    {service.main_offer_id?.includes('1943913915')
                                                        ? 'Fixed Broadband'
                                                        : service.main_offer_id?.includes('1207609454')
                                                          ? 'Fixed Voice'
                                                          : 'Combo Service'}
                                                </div>
                                                <div className="text-sm text-gray-600">Order #{service.customer_survey_order_id}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                    service.status?.toLowerCase() === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : service.status?.toLowerCase() === 'waiting'
                                                          ? 'bg-yellow-100 text-yellow-800'
                                                          : service.status?.toLowerCase() === 'subscribed'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {service.status}
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">{new Date(service.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))} */}
                {recentSurveys.length > 0 && (
                    <Card className="mb-8 border border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-900">
                                <BarChart3 className="h-5 w-5 text-indigo-600" />
                                Recent Service Requests
                            </CardTitle>
                            <CardDescription>Your latest service request history</CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-4">
                                {recentSurveys.map((service) => {
                                    const status = service.status?.toLowerCase();

                                    const statusStyles = {
                                        completed: 'bg-green-100 text-green-700 border-green-300',
                                        subscribed: 'bg-blue-100 text-blue-700 border-blue-300',
                                        waiting: 'bg-yellow-100 text-yellow-700 border-yellow-300',
                                        pending: 'bg-orange-100 text-orange-700 border-orange-300',
                                        default: 'bg-gray-100 text-gray-600 border-gray-300',
                                    };

                                    const statusStyle = statusStyles[status] ?? statusStyles.default;

                                    const getServiceType = () => {
                                        if (service.main_offer_id?.includes('1943913915')) return 'Fixed Broadband';
                                        if (service.main_offer_id?.includes('1207609454')) return 'Fixed Voice';
                                        return 'Combo Service';
                                    };

                                    return (
                                        <div
                                            key={service.customer_survey_order_id}
                                            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-sm"
                                        >
                                            {/* Left section */}
                                            <div className="flex items-center gap-4">
                                                <div className="h-3 w-3 rounded-full bg-gray-400">
                                                    <span
                                                        className={`block h-3 w-3 rounded-full ${
                                                            status === 'completed'
                                                                ? 'bg-green-500'
                                                                : status === 'subscribed'
                                                                  ? 'bg-blue-500'
                                                                  : status === 'waiting'
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-gray-400'
                                                        } `}
                                                    />
                                                </div>

                                                <div>
                                                    <p className="font-medium text-gray-900">{getServiceType()}</p>
                                                    <p className="text-sm text-gray-600">Order #{service.customer_survey_order_id}</p>
                                                </div>
                                            </div>

                                            {/* Right Section */}
                                            <div className="text-right">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${statusStyle}`}
                                                >
                                                    {service.status}
                                                </span>
                                                <p className="mt-1 text-xs text-gray-500">{new Date(service.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
                {/* </div>
                        </CardContent>
                    </Card>
                )} */}

                {/* All Services Table */}
                {/* <Card>
                    <CardHeader>
                        <CardTitle>All Service Requests</CardTitle>
                        <CardDescription>Complete history of your service requests and their status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ServiceList />
                    </CardContent>
                </Card> */}
            </div>
        </ServicesLayout>
    );
}
