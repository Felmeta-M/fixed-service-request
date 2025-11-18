// // import { NavFooter } from '@/components/nav-footer';
// // import { NavMain } from '@/components/nav-main';
// // import { NavUser } from '@/components/nav-user';
// // import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
// // import { type NavItem } from '@/types';
// // import { Link } from '@inertiajs/react';
// // import { BookOpen, BoxesIcon, CheckSquare, Folder, LayoutGrid, UserPlus, Users } from 'lucide-react';
// // import AppLogo from './app-logo';

// // const mainNavItems: NavItem[] = [
// //     {
// //         title: 'Dashboard',
// //         href: '/dashboard',
// //         icon: LayoutGrid,
// //     },
// //     {
// //         title: 'Customers',
// //         href: '/customers',
// //         icon: Users,
// //     },
// //     {
// //         title: 'Survey Requests',
// //         href: '/survey-requests',
// //         icon: CheckSquare,
// //     },
// //     {
// //         title: 'Subscribers',
// //         href: '/subscribers',
// //         icon: UserPlus,
// //     },
// //     {
// //         title: 'Resource Checks',
// //         href: '/resource-checks',
// //         icon: BoxesIcon,
// //     },
// // ];

// // const footerNavItems: NavItem[] = [
// //     {
// //         title: 'Repository',
// //         href: 'https://github.com/laravel/react-starter-kit',
// //         icon: Folder,
// //     },
// //     {
// //         title: 'Documentation',
// //         href: 'https://laravel.com/docs/starter-kits#react',
// //         icon: BookOpen,
// //     },
// // ];

// // export function AppSidebar() {
// //     return (
// //         <Sidebar collapsible="icon" variant="inset">
// //             <SidebarHeader>
// //                 <SidebarMenu>
// //                     <SidebarMenuItem>
// //                         <SidebarMenuButton size="lg" asChild>
// //                             <Link href="/dashboard" prefetch>
// //                                 <AppLogo />
// //                             </Link>
// //                         </SidebarMenuButton>
// //                     </SidebarMenuItem>
// //                 </SidebarMenu>
// //             </SidebarHeader>

// //             <SidebarContent>
// //                 <NavMain items={mainNavItems} />
// //             </SidebarContent>

// //             <SidebarFooter>
// //                 <NavFooter items={footerNavItems} className="mt-auto" />
// //                 {/* <NavUser /> */}
// //             </SidebarFooter>
// //         </Sidebar>
// //     );
// // }

// // components/app-sidebar.tsx
// 'use client';

// import {
//     Sidebar,
//     SidebarContent,
//     SidebarGroup,
//     SidebarGroupContent,
//     SidebarGroupLabel,
//     SidebarMenu,
//     SidebarMenuButton,
//     SidebarMenuItem,
// } from '@/components/ui/sidebar';
// import { Link, usePage } from '@inertiajs/react';
// import { BarChart3, CheckCircle, FileText, MapPin, Package, Phone, Wifi } from 'lucide-react';

// // Menu items for services list view
// const servicesMenuItems = [
//     {
//         title: 'Dashboard',
//         url: '/dashboard',
//         icon: BarChart3,
//     },
//     // {
//     //     title: 'All Services',
//     //     url: '/services',
//     //     icon: FileText,
//     // },
//     // {
//     //     title: 'Active Services',
//     //     url: '#active',
//     //     icon: CheckCircle,
//     // },
//     // {
//     //     title: 'Pending Requests',
//     //     url: '#pending',
//     //     icon: Calendar,
//     // },
//     // {
//     //     title: 'Service History',
//     //     url: '#history',
//     //     icon: FileText,
//     // },
// ];

// // Service types for quick access
// const serviceTypes = [
//     {
//         title: 'Fixed Broadband',
//         url: '/services/new?type=broadband',
//         icon: Wifi,
//         description: 'High-speed internet',
//     },
//     {
//         title: 'Fixed Voice',
//         url: '/services/new?type=voice',
//         icon: Phone,
//         description: 'Telephone services',
//     },
//     {
//         title: 'Combo Services',
//         url: '/services/new?type=combo',
//         icon: Package,
//         description: 'Bundle packages',
//     },
// ];

// // Steps for service creation
// const createServiceSteps = [
//     {
//         name: 'Service Selection',
//         description: 'Choose service type and configuration',
//         icon: Wifi,
//     },
//     {
//         name: 'Location Setup',
//         description: 'Select installation location',
//         icon: MapPin,
//     },
//     {
//         name: 'Review & Submit',
//         description: 'Verify details and submit',
//         icon: FileText,
//     },
// ];

// interface AppSidebarProps {
//     currentStep?: number;
//     mode?: 'list' | 'create';
// }

// export function AppSidebar({ currentStep = 0, mode = 'list' }: AppSidebarProps) {
//     const { url } = usePage();

//     // Determine mode based on current URL
//     const currentMode = url.includes('/services/new') ? 'create' : 'list';
//     const displayMode = mode === 'create' ? 'create' : currentMode;

//     if (displayMode === 'create') {
//         const steps = createServiceSteps.map((step, index) => ({
//             ...step,
//             status: index < currentStep ? 'complete' : index === currentStep ? 'current' : 'upcoming',
//         }));

//         return (
//             <Sidebar>
//                 <SidebarContent>
//                     <SidebarGroup>
//                         <SidebarGroupLabel>Service Setup Progress</SidebarGroupLabel>
//                         <SidebarGroupContent>
//                             <SidebarMenu>
//                                 {steps.map((step, stepIdx) => {
//                                     const IconComponent = step.icon;
//                                     const isCompleted = step.status === 'complete';
//                                     const isCurrent = step.status === 'current';

//                                     return (
//                                         <SidebarMenuItem key={step.name}>
//                                             <SidebarMenuButton asChild isActive={isCurrent}>
//                                                 <div className="mt-15 flex cursor-default items-start space-x-3 p-3">
//                                                     <div
//                                                         className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
//                                                             isCompleted
//                                                                 ? 'border-green-500 bg-green-500 text-white'
//                                                                 : isCurrent
//                                                                   ? 'border-primary bg-primary text-white'
//                                                                   : 'border-gray-300 bg-white text-gray-400'
//                                                         }`}
//                                                     >
//                                                         {isCompleted ? <CheckCircle className="h-4 w-4" /> : stepIdx + 1}
//                                                     </div>
//                                                     <div className="min-w-0 flex-1">
//                                                         <p
//                                                             className={`text-sm font-medium ${
//                                                                 isCompleted ? 'text-green-700' : isCurrent ? 'text-primary' : 'text-gray-600'
//                                                             }`}
//                                                         >
//                                                             {step.name}
//                                                         </p>
//                                                         <p className="mt-1 text-xs text-gray-500">{step.description}</p>
//                                                     </div>
//                                                 </div>
//                                             </SidebarMenuButton>
//                                         </SidebarMenuItem>
//                                     );
//                                 })}
//                             </SidebarMenu>
//                         </SidebarGroupContent>
//                     </SidebarGroup>

//                     {/* <SidebarGroup>
//                         <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
//                         <SidebarGroupContent>
//                             <SidebarMenu>
//                                 <SidebarMenuItem>
//                                     <SidebarMenuButton asChild>
//                                         <Link href="/dashboard">
//                                             <BarChart3 className="h-4 w-4" />
//                                             <span>View Dashboard</span>
//                                         </Link>
//                                     </SidebarMenuButton>
//                                 </SidebarMenuItem>
//                                 <SidebarMenuItem>
//                                     <SidebarMenuButton asChild>
//                                         <Link href="/services">
//                                             <FileText className="h-4 w-4" />
//                                             <span>All Services</span>
//                                         </Link>
//                                     </SidebarMenuButton>
//                                 </SidebarMenuItem>
//                             </SidebarMenu>
//                         </SidebarGroupContent>
//                     </SidebarGroup> */}
//                 </SidebarContent>

//                 {/* <SidebarFooter className="border-t p-4">
//                     <div className="space-y-2">
//                         <div className="text-xs text-gray-500">
//                             Step {currentStep + 1} of {steps.length}
//                         </div>
//                         <div className="h-2 w-full rounded-full bg-gray-200">
//                             <div
//                                 className="h-2 rounded-full bg-primary transition-all duration-300"
//                                 style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
//                             />
//                         </div>
//                     </div>
//                 </SidebarFooter> */}
//             </Sidebar>
//         );
//     }

//     // List mode sidebar
//     return (
//         <Sidebar>
//             <SidebarContent>
//                 {/* Quick Stats */}
//                 <SidebarGroup>
//                     <SidebarGroupLabel>Overview</SidebarGroupLabel>
//                     {/* <SidebarGroupContent>
//                         <div className="rounded-lg  p-3">
//                             <h3 className="text-sm font-medium">Quick Actions</h3>
//                             <p className="mt-1 text-xs ">Manage your services efficiently</p>
//                         </div>
//                     </SidebarGroupContent> */}
//                 </SidebarGroup>

//                 {/* Navigation Menu */}
//                 <SidebarGroup>
//                     <SidebarGroupLabel>Navigation</SidebarGroupLabel>
//                     <SidebarGroupContent>
//                         <SidebarMenu>
//                             {servicesMenuItems.map((item) => {
//                                 const IconComponent = item.icon;
//                                 return (
//                                     <SidebarMenuItem key={item.title}>
//                                         <SidebarMenuButton asChild isActive={url === item.url}>
//                                             <Link href={item.url}>
//                                                 <IconComponent className="h-4 w-4" />
//                                                 <span>{item.title}</span>
//                                             </Link>
//                                         </SidebarMenuButton>
//                                     </SidebarMenuItem>
//                                 );
//                             })}
//                         </SidebarMenu>
//                     </SidebarGroupContent>
//                 </SidebarGroup>

//                 {/* Quick Service Creation */}
//                 {/* <SidebarGroup>
//                     <SidebarGroupLabel>Create New Service</SidebarGroupLabel>
//                     <SidebarGroupContent>
//                         <SidebarMenu>
//                             {serviceTypes.map((service) => {
//                                 const IconComponent = service.icon;
//                                 return (
//                                     <SidebarMenuItem key={service.title}>
//                                         <SidebarMenuButton asChild>
//                                             <Link href={service.url} className="flex items-start">
//                                                 <IconComponent className="mt-0.5 h-4 w-4" />
//                                                 <div className="min-w-0 flex-1">
//                                                     <span className="text-sm font-medium">{service.title}</span>
//                                                     <p className="mt-0.5 text-xs text-gray-500">{service.description}</p>
//                                                 </div>
//                                                 <Plus className="h-4 w-4 text-gray-400" />
//                                             </Link>
//                                         </SidebarMenuButton>
//                                     </SidebarMenuItem>
//                                 );
//                             })}
//                         </SidebarMenu>
//                     </SidebarGroupContent>
//                 </SidebarGroup> */}

//                 {/* Service Status */}
//                 {/* <SidebarGroup>
//                     <SidebarGroupLabel>Service Status</SidebarGroupLabel>
//                     <SidebarGroupContent>
//                         <div className="space-y-2 px-3">
//                             <div className="flex items-center justify-between text-sm">
//                                 <div className="flex items-center space-x-2">
//                                     <div className="h-2 w-2 rounded-full bg-green-500"></div>
//                                     <span className="text-gray-600">Active</span>
//                                 </div>
//                                 <span className="font-semibold">12</span>
//                             </div>
//                             <div className="flex items-center justify-between text-sm">
//                                 <div className="flex items-center space-x-2">
//                                     <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
//                                     <span className="text-gray-600">Pending</span>
//                                 </div>
//                                 <span className="font-semibold">5</span>
//                             </div>
//                             <div className="flex items-center justify-between text-sm">
//                                 <div className="flex items-center space-x-2">
//                                     <div className="h-2 w-2 rounded-full bg-blue-500"></div>
//                                     <span className="text-gray-600">Completed</span>
//                                 </div>
//                                 <span className="font-semibold">23</span>
//                             </div>
//                         </div>
//                     </SidebarGroupContent>
//                 </SidebarGroup> */}
//             </SidebarContent>

//             {/* <SidebarFooter className="border-t p-4">
//                 <div className="space-y-3">
//                     <Link href="/services/new">
//                         <Button className="flex w-full items-center gap-2">
//                             <Plus className="h-4 w-4" />
//                             Create New Service
//                         </Button>
//                     </Link>
//                     <div className="flex justify-between text-xs text-gray-500">
//                         <span>Total Services</span>
//                         <span className="font-semibold">40</span>
//                     </div>
//                 </div>
//             </SidebarFooter> */}
//         </Sidebar>
//     );
// }

// components/app-sidebar.tsx
'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, CheckCircle, FileText, MapPin, Package, Phone, Wifi } from 'lucide-react';

// Steps for service creation
const createServiceSteps = [
    {
        name: 'Service Selection',
        // description: 'Choose service type and configuration',
        icon: Wifi,
    },
    {
        name: 'Location Setup',
        // description: 'Select installation location',
        icon: MapPin,
    },
    {
        name: 'Review & Submit',
        // description: 'Verify details and submit',
        icon: FileText,
    },
];

interface AppSidebarProps {
    currentStep?: number;
    mode?: 'list' | 'create';
}

export function AppSidebar({ currentStep = 0, mode = 'list' }: AppSidebarProps) {
    const { url } = usePage();

    // Determine mode based on current URL
    const currentMode = url.includes('/services/new') ? 'create' : 'list';
    const displayMode = mode === 'create' ? 'create' : currentMode;

    if (displayMode === 'create') {
        const steps = createServiceSteps.map((step, index) => ({
            ...step,
            status: index < currentStep ? 'complete' : index === currentStep ? 'current' : 'upcoming',
        }));

        return (
            <Sidebar className="mt-16">
                <SidebarContent>
                    <SidebarGroup>
                        {/* <SidebarGroupLabel>Service Setup Progress</SidebarGroupLabel> */}
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {steps.map((step, stepIdx) => {
                                    const IconComponent = step.icon;
                                    const isCompleted = step.status === 'complete';
                                    const isCurrent = step.status === 'current';

                                    return (
                                        <SidebarMenuItem key={step.name}>
                                            <SidebarMenuButton asChild isActive={isCurrent}>
                                                <div className="relative flex min-h-[80px] cursor-default items-start space-x-3 p-3">
                                                    {/* Progress connector line */}
                                                    {stepIdx < steps.length - 1 && (
                                                        <div
                                                            className={`absolute top-8 left-6 h-6 w-0.5 ${
                                                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                                            }`}
                                                            style={{ marginLeft: '-1px' }}
                                                        />
                                                    )}

                                                    {/* Step indicator */}
                                                    <div className="relative z-10 flex-shrink-0">
                                                        <div
                                                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                                                isCompleted
                                                                    ? 'border-green-500 bg-green-500 text-white'
                                                                    : isCurrent
                                                                      ? 'border-primary bg-primary text-white'
                                                                      : 'border-gray-300 bg-white text-gray-400'
                                                            }`}
                                                        >
                                                            {isCompleted ? <CheckCircle className="h-4 w-4" /> : stepIdx + 1}
                                                        </div>
                                                    </div>

                                                    {/* Step content */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <IconComponent
                                                                className={`h-4 w-4 ${
                                                                    isCompleted ? 'text-green-500' : isCurrent ? 'text-primary' : 'text-gray-400'
                                                                }`}
                                                            />
                                                            <p
                                                                className={`text-sm font-medium ${
                                                                    isCompleted ? 'text-green-700' : isCurrent ? 'text-primary' : 'text-gray-600'
                                                                }`}
                                                            >
                                                                {step.name}
                                                            </p>
                                                        </div>
                                                        {/* <p className="mt-1 text-xs break-words text-gray-500">{step.description}</p> */}
                                                    </div>
                                                </div>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {/* Progress summary */}
                    {/* <SidebarGroup>
                        <SidebarGroupLabel>Progress Summary</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <div className="space-y-2 p-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Completion</span>
                                    <span className="font-semibold">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-200">
                                    <div
                                        className="h-2 rounded-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                    />
                                </div>
                                <div className="text-center text-xs text-gray-500">
                                    Step {currentStep + 1} of {steps.length}
                                </div>
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup> */}
                </SidebarContent>
            </Sidebar>
        );
    }

    // List mode sidebar
    return (
        <Sidebar className="mt-14">
            <SidebarContent>
                {/* Navigation Menu */}
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={url === '/dashboard'}>
                                    <Link href="/dashboard">
                                        <BarChart3 className="h-4 w-4" />
                                        <span>Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Service Types */}
                <SidebarGroup>
                    <SidebarGroupLabel>Service Types</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <div className="space-y-2 px-3">
                            <div className="flex items-center space-x-2 text-sm">
                                <Wifi className="h-4 w-4" />
                                <span className="text-gray-600">Fixed Broadband</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <Phone className="h-4 w-4" />
                                <span className="text-gray-600">Fixed Voice</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <Package className="h-4 w-4" />
                                <span className="text-gray-600">Combo Services</span>
                            </div>
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
