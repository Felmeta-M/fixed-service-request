import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { usePage } from '@inertiajs/react';
import { FileText, MapPin, User, Wifi } from 'lucide-react';
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
        ...(isNewCustomer ? [{ name: 'Customer Profile', icon: User }] : []),
        { name: 'Service Information', icon: Wifi },
        { name: 'Location Information', icon: MapPin },
        { name: 'Review & Submit', icon: FileText },
    ];

    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <AppSidebar currentStep={currentStep} mode={isServiceCreation ? 'create' : 'list'} steps={steps} />
            <SidebarInset>
                {/* <SiteHeader
                    title={isServiceCreation ? 'Create new service' : headerSegment}
                    isServiceCreation={isServiceCreation}
                    currentStep={currentStep}
                    steps={steps}
                /> */}
                <main className="flex flex-1 flex-col py-2">{children}</main>
                 <Toaster />
            </SidebarInset>
        </SidebarProvider>
    );
}
