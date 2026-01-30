import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { CheckCircle, CreditCard, FileCheck, FileText, HandHelping, MapPin, RadioTower, RouterIcon, ShieldQuestionIcon, User, Wifi } from 'lucide-react';
import { NavUser } from '@/components/nav/nav-user';
import { LogoSwitcher } from './logo-switcher';

interface AppSidebarProps {
    currentStep?: number;
    mode?: 'list' | 'create';
    steps?: Array<{ name: string; icon: any }>;
    props?: React.ComponentProps<typeof Sidebar>;
}

export function AppSidebar({ currentStep = 0, mode = 'list', steps, ...props }: AppSidebarProps) {
    const { url } = usePage();
    const { t } = useTranslation();
    const { state } = useSidebar();

    const items = [
        {
            title: t('nav.services'),
            url: '/services',
            icon: HandHelping,
        },
        {
            title: t('nav.complaints'),
            url: '/complaints',
            icon: ShieldQuestionIcon,
        },
    ];

    const defaultCreateServiceSteps = [
        { name: t('sidebar.steps.service_info'), icon: HandHelping },
        { name: t('sidebar.steps.location_info'), icon: MapPin },
        { name: t('sidebar.steps.device_info'), icon: RouterIcon },
        { name: t('sidebar.steps.review_submit'), icon: FileCheck },
        { name: t('sidebar.steps.payment'), icon: CreditCard },
    ];

    const actualSteps = steps || defaultCreateServiceSteps;

    const getStepDescription = (stepName: string) => {
        if (stepName === t('sidebar.steps.customer_info') || stepName === 'Customer Information') return t('sidebar.steps.customer_info_desc') || 'Create or confirm your profile';
        if (stepName === t('sidebar.steps.service_info') || stepName === 'Service Information') return t('sidebar.steps.service_info_desc') || 'Choose service configuration';
        if (stepName === t('sidebar.steps.location_info') || stepName === 'Location Information') return t('sidebar.steps.location_info_desc') || 'Select and check availability';
        if (stepName === t('sidebar.steps.device_info') || stepName === 'Device Information') return t('sidebar.steps.device_info_desc') || 'Choose your device option';
        if (stepName === t('sidebar.steps.review_submit') || stepName === 'Review & Submit') return t('sidebar.steps.review_submit_desc') || 'Verify details and submit request';
        if (stepName === t('sidebar.steps.payment') || stepName === 'Payment / Subscribe') return t('sidebar.steps.payment_desc') || 'Review charges and proceed';
        return '';
    };

    const isCurrentPath = (itemUrl: string) => {
        return url === itemUrl;
    };

    const displayMode = mode === 'create' || url.startsWith('/services/create') ? 'create' : 'list';

    return (
        <Sidebar collapsible="icon" className="h-screen border-r-2 border-primary" {...props}>
            <SidebarHeader
                className={cn(
                    'mb-2 border-b-2 border-primary rounded-br-xl border-r-2 py-4',
                    state !== 'collapsed' && 'mr-2',
                )}
            >
                <LogoSwitcher />
            </SidebarHeader>
            <SidebarContent
                className={cn(
                    ' border-t-2 border-primary rounded-tr-xl border-r-2',
                    state !== 'collapsed' && 'mr-2',
                )}
            >
                {displayMode === 'create' ? (
                    <SidebarGroup className="py-0">
                        <SidebarGroupContent>
                            {state === 'collapsed' ? (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    {actualSteps.map((step, idx) => {
                                        const status = idx < currentStep ? 'complete' : idx === currentStep ? 'current' : 'upcoming';
                                        const isCompleted = status === 'complete';
                                        const isCurrent = status === 'current';
                                        const Icon = step.icon;

                                        return (
                                            <button
                                                key={step.name}
                                                type="button"
                                                aria-label={step.name}
                                                className={cn(
                                                    'flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full border transition-all duration-200',
                                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                    isCompleted
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : isCurrent
                                                          ? 'text-primary border-primary'
                                                          : 'bg-background text-muted-foreground border-muted',
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle className="h-5 sm:h-6 w-5 sm:w-6" />
                                                ) : (
                                                    <Icon className="h-5 sm:h-6 w-5 sm:w-6" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-4">
                                    {/* Step Counter Header */}
                                    <div className="flex items-center justify-between px-2 pb-6 border-b-2 border-primary mb-6">
                                        <span className="text-sm font-medium text-gray-600">Step</span>
                                        <span className="text-sm font-medium text-gray-800">{currentStep + 1} of {actualSteps.length}</span>
                                    </div>
                                    
                                    {/* Steps List */}
                                    <ol role="list" className="relative space-y-2">
                                        {actualSteps.map((step, idx) => {
                                            const status = idx < currentStep ? 'complete' : idx === currentStep ? 'current' : 'upcoming';
                                            const isCompleted = status === 'complete';
                                            const isCurrent = status === 'current';
                                            const Icon = step.icon;

                                            return (
                                                <li key={step.name} className="relative">
                                                    {/* Connecting line - positioned on the left */}
                                                    {idx < actualSteps.length - 1 && (
                                                        <div
                                                            className={cn(
                                                                'absolute left-[19px] top-[41px] h-[calc(100%-20px)] w-[2px] rounded-full',
                                                                isCompleted ? 'bg-primary' : 'bg-gray-200',
                                                            )}
                                                            aria-hidden="true"
                                                        />
                                                    )}

                                                    <div className="relative flex items-start gap-3 py-3">
                                                        {/* Step icon circle */}
                                                        <div
                                                            className={cn(
                                                                'flex h-10  w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 z-10',
                                                                isCompleted
                                                                    ? 'bg-primary text-white'
                                                                    : isCurrent
                                                                      ? 'border-2 border-primary text-primary bg-white'
                                                                      : 'bg-gray-100 text-gray-400',
                                                            )}
                                                        >
                                                            {isCompleted ? (
                                                                <CheckCircle className="h-5 sm:h-6 w-5 sm:w-6" />
                                                            ) : (
                                                                <Icon className="h-5 sm:h-6 w-5 sm:w-6" />
                                                            )}
                                                        </div>

                                                        {/* Step content */}
                                                        <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                                                            <span
                                                                className={cn(
                                                                    'text-sm font-medium leading-tight',
                                                                    isCompleted
                                                                        ? 'text-primary'
                                                                        : isCurrent
                                                                          ? 'text-gray-900'
                                                                          : 'text-gray-400',
                                                                )}
                                                            >
                                                                {step.name}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'text-xs leading-tight mt-0.5',
                                                                    isCompleted ? 'text-primary/70' : isCurrent ? 'text-gray-500' : 'text-gray-400',
                                                                )}
                                                            >
                                                                {getStepDescription(step.name)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>
                            )}
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => {
                                    const isActive = isCurrentPath(item.url);
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                                                <Link href={item.url}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
                {/* {state !== 'collapsed' && (
                    <div className="flex justify-end py-2">
                        <SidebarTrigger className="h-8 w-8 shrink-0" />
                    </div>
                )}
                {state === 'collapsed' && (
                    <div className="flex justify-end">
                        <SidebarTrigger className="h-8 w-8 shrink-0 py-2" />
                    </div>
                )} */}
            </SidebarContent>
            <SidebarFooter
                className={cn(
                    'border-t-2 border-primary border-r-2 border-primary',
                    state !== 'collapsed' && 'mr-2',
                )}
            >
                <div
                    className={cn(
                        'flex',
                        state === 'collapsed' ? 'justify-center' : 'justify-start px-2',
                    )}
                >
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
