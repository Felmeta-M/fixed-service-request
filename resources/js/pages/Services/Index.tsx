// import { ServiceList } from '@/components/service/service-list';
// import { Button } from '@/components/ui/button';
// import MainLayout from '@/layouts/main-layout';
// import { Link } from '@inertiajs/react';
// import { Plus } from 'lucide-react';

// export default function ServicesPage() {
//     return (
//         <MainLayout>
//             <div className="w-full">
//                 <div className="mb-4 flex items-center justify-between">
//                     <div className="space-y-0.5">
//                         <h3 className="text-lg">All Service Requests</h3>
//                         <p className="text-gray-400">Complete history of your service requests and their status</p>
//                     </div>
//                     <div className="">
//                         <Link href="/services/new">
//                             <Button size="sm" className="">
//                                 <Plus className="mr-2 h-4 w-4" />
//                                 New Service Request
//                             </Button>
//                         </Link>
//                     </div>
//                 </div>
//                 <div>
//                     <ServiceList />
//                 </div>
//             </div>
//         </MainLayout>
//     );
// }

import { ServiceList } from '@/components/service/service-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainLayout from '@/layouts/main-layout';
import { Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function ServicesPage() {
    const [globalFilter, setGlobalFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const { props } = usePage();
    const user = props.auth?.user;
    console.log('🚀 ~ ServicesPage ~ user:', user);

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h3 className="text-lg">All Service Requests</h3>
                        <p className="text-gray-400">Complete history of your service requests and their status</p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-1 items-center gap-2">
                                <Input
                                    placeholder="Search surveys..."
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="max-w-sm"
                                />
                                {/* <Button variant="outline" size="icon" title="Refresh surveys">
                                    <RefreshCw className="h-4 w-4" />
                                </Button> */}
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="rounded-md border px-2 py-1 text-sm focus:ring focus:ring-indigo-300"
                                >
                                    <option value="">All Types</option>
                                    <option value="1943913918">🌐 Internet</option>
                                    <option value="102647257">📞 Voice</option>
                                    <option value="1207609455">📦 Combo</option>
                                </select>

                                {/* <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="rounded-md border px-2 py-1 text-sm focus:ring focus:ring-indigo-300"
                                >
                                    <option value="">All Status</option>
                                    {Object.values(ServiceProvisionStatus).map((s, i) => (
                                        <option key={i} value={s.label.toLowerCase()}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select> */}
                            </div>
                        </div>
                        <Link href="/services/new">
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                New Service Request
                            </Button>
                        </Link>
                    </div>
                </div>

                <ServiceList globalFilter={globalFilter} typeFilter={typeFilter} statusFilter={statusFilter} />
            </div>
        </MainLayout>
    );
}
