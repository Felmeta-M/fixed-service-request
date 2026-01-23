import { AppSidebar } from '@/components/app/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { usePage } from '@inertiajs/react';
import { CreditCard, FileText, MapPin, RouterIcon, User, Wifi } from 'lucide-react';
import { ReactNode } from 'react';

interface MainLayoutProps {
    children: ReactNode;
    currentStep?: number;
    isNewCustomer?: boolean;
}

const getHeader = (url: string) => {
    return url.split('/')[1].toLowerCase();
};

export default function MainLayout({ children, currentStep = 0, isNewCustomer = false }: MainLayoutProps) {
    const page = usePage();
    const headerSegment = getHeader(page.url);

    const isServiceCreation = page.url.startsWith('/services/create');

    const steps = [
        ...(isNewCustomer ? [{ name: 'Customer Information', icon: User }] : []),
        { name: 'Service Information', icon: Wifi },
        { name: 'Location Information', icon: MapPin },
        { name: 'Device Information', icon: RouterIcon },
        { name: 'Review & Submit', icon: FileText },
        { name: 'Payment / Subscribe', icon: CreditCard },
    ];

    return (
        <SidebarProvider
            className="overflow-x-hidden"
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
            >
            <AppSidebar currentStep={currentStep} mode={isServiceCreation ? 'create' : 'list'} steps={steps} />
            <SidebarInset className="overflow-x-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <div className='sm:hidden'>
                            <SiteHeader
                                title={isServiceCreation ? 'Create new service' : headerSegment}
                                isServiceCreation={isServiceCreation}
                                currentStep={currentStep}
                                steps={steps}
                            />
                        </div>
                    </div>
                </header>
                <main className="flex flex-1 flex-col py-2 max-w-full overflow-x-hidden">{children}</main>
                <Toaster position="top-center" />
            </SidebarInset>
        </SidebarProvider>
    );
}
