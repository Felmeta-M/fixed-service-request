import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { usePage } from '@inertiajs/react';
import { FileText, MapPin, Wifi } from 'lucide-react';
import { ReactNode } from 'react';

interface MainLayoutProps {
    children: ReactNode;
    currentStep?: number;
}

const getHeader = (url: string) => {
    return url.split('/')[1].toLowerCase();
};

const createServiceSteps = [
    { name: 'Service Selection', icon: Wifi },
    { name: 'Location Setup', icon: MapPin },
    { name: 'Review & Submit', icon: FileText },
];

export default function MainLayout({ children, currentStep = 0 }: MainLayoutProps) {
    const page = usePage();
    const headerSegment = getHeader(page.url);

    const isServiceCreation = page.url.startsWith('/services/create');

    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <AppSidebar currentStep={currentStep} mode={isServiceCreation ? 'create' : 'list'} />
            <SidebarInset>
                <SiteHeader
                    title={isServiceCreation ? 'Create new service' : headerSegment}
                    isServiceCreation={isServiceCreation}
                    currentStep={currentStep}
                    steps={createServiceSteps}
                />
                <div className="flex flex-1 flex-col">
                    <div>{children}</div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
