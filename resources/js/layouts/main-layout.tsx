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
    headerTitle?: string;
    headerSubtitle?: string;
}

const getHeader = (url: string) => {
    return url.split('/')[1].toLowerCase();
};

const STEP_TITLES = [
    { title: 'Service Information', subtitle: 'Choose your service type and configuration' },
    { title: 'Location Information', subtitle: 'Select installation location and check availability' },
    { title: 'Device Information', subtitle: 'Choose your device option' },
    { title: 'Review & Submit', subtitle: 'Verify details and submit your request' },
    { title: 'Payment / Subscribe', subtitle: 'Review charges and proceed to pay or subscribe' },
];

const NEW_CUSTOMER_STEP_TITLES = [{ title: 'Customer Information', subtitle: 'Create your customer profile' }, ...STEP_TITLES];

export default function MainLayout({ children, currentStep = 0, isNewCustomer = false, headerTitle, headerSubtitle }: MainLayoutProps) {
    const page = usePage();
    const headerSegment = getHeader(page.url);

    const isServiceCreation = page.url.startsWith('/services/create');

    const steps = [
        ...(isNewCustomer ? [{ name: 'Customer Information', icon: User }] : []),
        // { name: 'Service Information', icon: BroadbandIcon },
        { name: 'Service Information', icon: Wifi },
        { name: 'Location Information', icon: MapPin },
        { name: 'Device Information', icon: RouterIcon },
        { name: 'Review & Submit', icon: FileText },
        { name: 'Payment / Subscribe', icon: CreditCard },
    ];

    const stepTitles = isNewCustomer ? NEW_CUSTOMER_STEP_TITLES : STEP_TITLES;
    const currentStepInfo = stepTitles[currentStep];

    // Determine header title and subtitle
    const resolvedTitle = headerTitle ?? (isServiceCreation ? (currentStepInfo?.title ?? 'Create New Service') : headerSegment);
    const resolvedSubtitle = headerSubtitle ?? (isServiceCreation ? (currentStepInfo?.subtitle ?? '') : undefined);

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
                {/* Header: green top + bottom lines on desktop, py-4 matches sidebar header padding, mb-2 matches sidebar gap */}
                <div className="md:mb-2 md:rounded-bl-xl md:border-b-2 md:border-l-2 md:border-primary md:py-4">
                    <SiteHeader
                        title={resolvedTitle}
                        subtitle={resolvedSubtitle}
                        isServiceCreation={isServiceCreation}
                        currentStep={currentStep}
                        steps={steps}
                    />
                </div>
                {/* Body: top border to match sidebar content border, no right/bottom borders */}
                <main className="flex max-w-full flex-1 flex-col overflow-x-hidden py-2 md:rounded-tl-xl md:border-t-2 md:border-l-2 md:border-primary">
                    {children}
                </main>
                <Toaster position="top-right" />
            </SidebarInset>
        </SidebarProvider>
    );
}
