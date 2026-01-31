import {
    AppSidebar,
    StepCustomerIcon,
    StepDeviceIcon,
    StepPaymentIcon,
    StepReviewIcon,
    StepServiceIcon,
} from '@/components/app/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { usePage } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
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
        ...(isNewCustomer ? [{ name: 'Customer Information', icon: StepCustomerIcon }] : []),
        { name: 'Service Information', icon: StepServiceIcon },
        { name: 'Location Information', icon: MapPin },
        { name: 'Device Information', icon: StepDeviceIcon },
        { name: 'Review & Submit', icon: StepReviewIcon },
        { name: 'Payment / Subscribe', icon: StepPaymentIcon },
    ];

    return (
        <SidebarProvider
            className="overflow-x-hidden h-screen"
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <AppSidebar currentStep={currentStep} mode={isServiceCreation ? 'create' : 'list'} steps={steps} />
            <SidebarInset className="overflow-x-hidden overflow-y-auto bg-gray-50">
                <div className="md:hidden">
                    <SiteHeader
                        title={isServiceCreation ? 'Create new service' : headerSegment}
                        isServiceCreation={isServiceCreation}
                        currentStep={currentStep}
                        steps={steps}
                    />
                </div>
                <main className="flex max-w-full flex-1 flex-col overflow-x-hidden bg-white">{children}</main>
                <Toaster richColors position="top-right" />
            </SidebarInset>
        </SidebarProvider>
    );
}
