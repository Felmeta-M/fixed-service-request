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

// import { ServiceList } from '@/components/service/service-list';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import MainLayout from '@/layouts/main-layout';
// import { Link, usePage } from '@inertiajs/react';
// import { Plus } from 'lucide-react';
// import { useState } from 'react';

// export default function ServicesPage() {
//     const [globalFilter, setGlobalFilter] = useState('');
//     const [typeFilter, setTypeFilter] = useState('');
//     const [statusFilter, setStatusFilter] = useState('');

//     const { props } = usePage();
//     const user = props.auth?.user;
//     console.log('🚀 ~ ServicesPage ~ user:', user);

//     return (
//         <MainLayout>
//             <div className="w-full space-y-6">
//                 <div className="flex items-center justify-between">
//                     <div className="space-y-0.5">
//                         <h3 className="text-lg">All Service Requests</h3>
//                         <p className="text-gray-400">Complete history of your service requests and their status</p>
//                     </div>
//                     <div className="flex items-center justify-between gap-4">
//                         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                             <div className="flex flex-1 items-center gap-2">
//                                 <Input
//                                     placeholder="Search surveys..."
//                                     value={globalFilter}
//                                     onChange={(e) => setGlobalFilter(e.target.value)}
//                                     className="max-w-sm"
//                                 />
//                                 {/* <Button variant="outline" size="icon" title="Refresh surveys">
//                                     <RefreshCw className="h-4 w-4" />
//                                 </Button> */}
//                             </div>

//                             <div className="flex items-center gap-3">
//                                 <select
//                                     value={typeFilter}
//                                     onChange={(e) => setTypeFilter(e.target.value)}
//                                     className="rounded-md border px-2 py-1 text-sm focus:ring focus:ring-indigo-300"
//                                 >
//                                     <option value="">All Types</option>
//                                     <option value="1943913918">🌐 Internet</option>
//                                     <option value="102647257">📞 Voice</option>
//                                     <option value="1207609455">📦 Combo</option>
//                                 </select>

//                                 {/* <select
//                                     value={statusFilter}
//                                     onChange={(e) => setStatusFilter(e.target.value)}
//                                     className="rounded-md border px-2 py-1 text-sm focus:ring focus:ring-indigo-300"
//                                 >
//                                     <option value="">All Status</option>
//                                     {Object.values(ServiceProvisionStatus).map((s, i) => (
//                                         <option key={i} value={s.label.toLowerCase()}>
//                                             {s.label}
//                                         </option>
//                                     ))}
//                                 </select> */}
//                             </div>
//                         </div>
//                         <Link href="/services/new">
//                             <Button size="sm">
//                                 <Plus className="mr-2 h-4 w-4" />
//                                 New Service Request
//                             </Button>
//                         </Link>
//                     </div>
//                 </div>

//                 <ServiceList globalFilter={globalFilter} typeFilter={typeFilter} statusFilter={statusFilter} />
//             </div>
//         </MainLayout>
//     );
// }

import { ServiceList } from '@/components/service/service-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainLayout from '@/layouts/main-layout';
import { ServiceProvisionStatus } from '@/lib/status-map';
import { Link } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Filter, Plus, X } from 'lucide-react';
import { useState } from 'react';

export default function ServicesPage() {
    const [globalFilter, setGlobalFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        type: '',
        status: '',
    });

    const handleApplyFilters = () => {
        setAppliedFilters({
            type: typeFilter,
            status: statusFilter,
        });
        setShowAdvancedFilters(false);
    };

    const handleClearFilters = () => {
        setTypeFilter('');
        setStatusFilter('');
        setAppliedFilters({
            type: '',
            status: '',
        });
        setShowAdvancedFilters(false);
    };

    const hasActiveFilters = appliedFilters.type || appliedFilters.status;

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <div className="flex flex-col items-center justify-between lg:flex-row">
                    <div className="space-y-0.5">
                        <h3 className="text-lg">All Service Requests</h3>
                        <p className="sm:text-md text-sm text-gray-400">Complete history of your service requests and their status</p>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-1 items-center gap-2">
                                <Input
                                    placeholder="Search surveys..."
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Advanced Filter Toggle Button */}
                                <Button
                                    variant={hasActiveFilters ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className="flex items-center gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                    {hasActiveFilters && <span className="flex h-2 w-2 rounded-full bg-primary-foreground" />}
                                    {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>

                                {/* Clear Filters Button - Only show when filters are active */}
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearFilters}
                                        className="flex items-center gap-1 text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                        <Link href="/services/new">
                            <Button size="sm">
                                <Plus className="h-4 w-4" />
                                New Service Request
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Advanced Filters - Expandable Section */}
                    {showAdvancedFilters && (
                        <div className="flex items-end justify-between gap-4 border-t pt-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {/* Type Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Service Type</label>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">All Types</option>
                                        <option value="1943913918">🌐 Internet</option>
                                        <option value="102647257">📞 Voice</option>
                                        <option value="1207609455">📦 Combo</option>
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">All Status</option>
                                        {Object.values(ServiceProvisionStatus).map((s, i) => (
                                            <option key={i} value={s.label.toLowerCase()}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Apply/Cancel Buttons */}
                            <div className="flex items-center gap-2">
                                <Button variant="default" size="sm" onClick={handleApplyFilters} className="flex items-center gap-2">
                                    Apply
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Active Filters Badges */}
                    {hasActiveFilters && !showAdvancedFilters && (
                        <div className="flex flex-wrap gap-2 border-t pt-3">
                            {appliedFilters.type && (
                                <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                                    Type:{' '}
                                    {appliedFilters.type === '1943913918' ? 'Internet' : appliedFilters.type === '102647257' ? 'Voice' : 'Combo'}
                                    <button
                                        onClick={() => {
                                            setTypeFilter('');
                                            setAppliedFilters((prev) => ({ ...prev, type: '' }));
                                        }}
                                        className="ml-1 rounded-full hover:bg-primary/20"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            {appliedFilters.status && (
                                <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                                    Status: {appliedFilters.status.charAt(0).toUpperCase() + appliedFilters.status.slice(1)}
                                    <button
                                        onClick={() => {
                                            setStatusFilter('');
                                            setAppliedFilters((prev) => ({ ...prev, status: '' }));
                                        }}
                                        className="ml-1 rounded-full hover:bg-primary/20"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <ServiceList globalFilter={globalFilter} typeFilter={appliedFilters.type} statusFilter={appliedFilters.status} />
            </div>
        </MainLayout>
    );
}
