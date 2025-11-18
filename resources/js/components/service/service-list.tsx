// // components/services/ServiceList.tsx
// 'use client';

// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { useSurveyList } from '@/hooks/use-survey-list';
// import { Eye, Play } from 'lucide-react';

// export function ServiceList() {
//     const { surveys, loading } = useSurveyList();

//     const getStatusVariant = (status: string) => {
//         switch (status?.toLowerCase()) {
//             case 'completed':
//                 return 'default';
//             case 'waiting':
//                 return 'secondary';
//             case 'subscribed':
//                 return 'default';
//             case 'cancelled':
//                 return 'destructive';
//             default:
//                 return 'outline';
//         }
//     };

//     if (loading) {
//         return (
//             <Card>
//                 <CardContent className="p-6">
//                     <div className="flex h-32 items-center justify-center">
//                         <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
//                     </div>
//                 </CardContent>
//             </Card>
//         );
//     }

//     return (
//         <div className="space-y-4">
//             {surveys.length === 0 ? (
//                 <Card>
//                     <CardContent className="p-6 text-center">
//                         <div className="mb-4 text-gray-500">No services found</div>
//                         <p className="text-sm text-gray-600">Get started by creating your first service request.</p>
//                     </CardContent>
//                 </Card>
//             ) : (
//                 surveys.map((service) => (
//                     <Card key={service.customer_survey_order_id} className="transition-shadow hover:shadow-md">
//                         <CardHeader className="pb-3">
//                             <div className="flex items-start justify-between">
//                                 <div>
//                                     <CardTitle className="text-lg">
//                                         {service.main_offer_id?.includes('1943913915')
//                                             ? 'Fixed Broadband'
//                                             : service.main_offer_id?.includes('1207609454')
//                                               ? 'Fixed Voice'
//                                               : 'Combo Service'}
//                                     </CardTitle>
//                                     <CardDescription>Order ID: {service.customer_survey_order_id}</CardDescription>
//                                 </div>
//                                 <Badge variant={getStatusVariant(service.status)}>{service.status}</Badge>
//                             </div>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="flex items-center justify-between">
//                                 <div className="text-sm text-gray-600">Created: {new Date(service.created_at).toLocaleDateString()}</div>
//                                 <div className="flex gap-2">
//                                     {service.status?.toLowerCase() === 'completed' && (
//                                         <Button size="sm" className="flex items-center gap-1">
//                                             <Play className="h-4 w-4" />
//                                             Continue
//                                         </Button>
//                                     )}
//                                     <Button size="sm" variant="outline" className="flex items-center gap-1">
//                                         <Eye className="h-4 w-4" />
//                                         View
//                                     </Button>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 ))
//             )}
//         </div>
//     );
// }

// components/services/ServiceList.tsx
'use client';

import SurveyTable from '@/components/survey-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSurveyList } from '@/hooks/use-survey-list';
import { Link } from '@inertiajs/react';
import { AlertCircle, FileText } from 'lucide-react';
import { useEffect } from 'react';

export function ServiceList() {
    const { surveys, loading, error, fetchSurveys, refetch, hasMore, loadMore, total } = useSurveyList();
    console.log('🚀 ~ ServiceList ~ surveys:', surveys);
    useEffect(() => {}, [surveys]);

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center space-x-3 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <div>
                            <p className="font-medium">Error loading services</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (surveys.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">No services found</h3>
                    <p className="mb-4 text-gray-600">Get started by creating your first service request to manage your telecom services.</p>
                    <Link href="/services/new">
                        <Button>Create Your First Service</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <SurveyTable surveys={surveys} loading={loading} onSurveyUpdate={refetch} />
        </div>
    );
}
