// // // layouts/ServicesLayout.tsx
// // 'use client';

// // import { ReactNode } from 'react';
// // import AuthLayout from './AuthLayout';

// // interface ServicesLayoutProps {
// //     children: ReactNode;
// //     sidebarContent: ReactNode;
// // }

// // export default function ServicesLayout({ children, sidebarContent }: ServicesLayoutProps) {
// //     return (
// //         <AuthLayout>
// //         <div className="flex min-h-screen bg-gray-50">
// //             {/* Fixed Sidebar */}
// //             <div className="fixed top-15 left-0 z-10 h-full w-80 overflow-y-auto border-r border-gray-200 bg-white">{sidebarContent}</div>

// //             {/* Main Content */}
// //             <div className="ml-80 flex-1">
// //                 <div className="p-6">{children}</div>
// //             </div>
// //         </div>
// //         </AuthLayout>
// //     );
// // }

// // layouts/ServicesLayout.tsx
// // 'use client';

// // import { AppSidebar } from '@/components/app-sidebar';
// // import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
// // import { ReactNode } from 'react';
// // import AuthLayout from './AuthLayout';

// // interface ServicesLayoutProps {
// //     children: ReactNode;
// // }

// // export default function ServicesLayout({ children }: ServicesLayoutProps) {
// //     return (
// //         <AuthLayout>
// //             <SidebarProvider>
// //                 <div className="flex min-h-screen bg-gray-50">
// //                     <AppSidebar />
// //                     <main className="w-full flex-1">
// //                         <div className="flex items-center border-b bg-white p-4">
// //                             <SidebarTrigger />
// //                             <div className="ml-4">
// //                                 <h1 className="text-xl font-semibold text-gray-900">Services Management</h1>
// //                             </div>
// //                         </div>
// //                         <div className="max-w-screen p-6">{children}</div>
// //                     </main>
// //                 </div>
// //             </SidebarProvider>
// //         </AuthLayout>
// //     );
// // }

// // layouts/ServicesLayout.tsx
// 'use client';

// import { AppSidebar } from '@/components/app-sidebar';
// import { Button } from '@/components/ui/button';
// import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
// import { Link } from '@inertiajs/react';
// import { Plus } from 'lucide-react';
// import { ReactNode } from 'react';
// import AuthLayout from './AuthLayout';

// interface ServicesLayoutProps {
//     children: ReactNode;
// }

// export default function ServicesLayout({ children }: ServicesLayoutProps) {
//     return (
//         <AuthLayout>
//             <SidebarProvider>
//                 {/* <div className="min-h-screen bg-gray-50"> */}
//                 <AppSidebar />
//                 <main className="flex-1 p-6">
//                     <div className="flex items-center justify-between bg-white pb-4">
//                         <div className="flex items-center">
//                             <SidebarTrigger />
//                             <div className="ml-4">
//                                 <h1 className="text-xl font-semibold text-gray-900">Services</h1>
//                             </div>
//                         </div>
//                         <Link href="/services/new">
//                             <Button className="flex items-center gap-2">
//                                 <Plus className="h-4 w-4" />
//                                 Create New Service
//                             </Button>
//                         </Link>
//                     </div>
//                     <div className="">{children}</div>
//                 </main>
//                 {/* </div> */}
//             </SidebarProvider>
//         </AuthLayout>
//     );
// }

// layouts/ServicesLayout.tsx
'use client';

import { MultistepSidebar } from '@/components/multistep-sidebar';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { ReactNode } from 'react';
import AuthLayout from './AuthLayout';
interface ServicesLayoutProps {
    children: ReactNode;
    isCreatingService?: boolean;
    currentStep?: number;
    onStepChange?: (step: number) => void;
}

export default function ServicesLayout({ children, isCreatingService = false, currentStep, onStepChange }: ServicesLayoutProps) {
    return (
        <AuthLayout>
            <SidebarProvider>
                {/* <div className="flex min-h-screen bg-gray-50"> */}
                <MultistepSidebar currentStep={currentStep} mode={isCreatingService ? 'create' : 'list'} />

                <main className="flex-1 p-6">
                    <div className="flex items-center justify-between bg-white pb-4">
                        <div className="flex items-center">
                            <SidebarTrigger />
                            <div className="ml-4">
                                <h1 className="text-xl font-semibold text-gray-900">Services</h1>
                            </div>
                        </div>
                        <Link href="/services/new">
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Create New Service
                            </Button>
                        </Link>
                    </div>
                    <div className="">{children}</div>
                </main>
                {/* </div> */}
            </SidebarProvider>
        </AuthLayout>
    );
}
