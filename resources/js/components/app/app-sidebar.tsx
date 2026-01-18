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
} from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/use-translation';
import logo from '@/images/ethio_logo_full.png';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { CheckCircle, CreditCard, FileText, MapPin, RadioTower, ShieldQuestionIcon, Wifi } from 'lucide-react';
import { NavUser } from '@/components/nav/nav-user';

interface AppSidebarProps {
    currentStep?: number;
    mode?: 'list' | 'create';
    steps?: Array<{ name: string; icon: any }>;
    props?: React.ComponentProps<typeof Sidebar>;
}

export function AppSidebar({ currentStep = 0, mode = 'list', steps, ...props }: AppSidebarProps) {
    const { url } = usePage();
    const { t } = useTranslation();

    const items = [
        {
            title: t('nav.services'),
            url: '/services',
            icon: RadioTower,
        },
        {
            title: t('nav.complaints'),
            url: '/complaints',
            icon: ShieldQuestionIcon,
        },
    ];

    const defaultCreateServiceSteps = [
        { name: t('sidebar.steps.service_info'), icon: Wifi },
        { name: t('sidebar.steps.location_info'), icon: MapPin },
        { name: t('sidebar.steps.review_submit'), icon: FileText },
        { name: t('sidebar.steps.payment'), icon: CreditCard },
    ];

    const actualSteps = steps || defaultCreateServiceSteps;

    const getStepDescription = (stepName: string) => {
        if (stepName === t('sidebar.steps.customer_info')) return t('sidebar.steps.customer_info_desc');
        if (stepName === t('sidebar.steps.service_info')) return t('sidebar.steps.service_info_desc');
        if (stepName === t('sidebar.steps.location_info')) return t('sidebar.steps.location_info_desc');
        if (stepName === t('sidebar.steps.review_submit')) return t('sidebar.steps.review_submit_desc');
        if (stepName === t('sidebar.steps.payment')) return t('sidebar.steps.payment_desc');
        return '';
    };

    const isCurrentPath = (itemUrl: string) => {
        return url === itemUrl;
    };

    const displayMode = mode === 'create' || url.startsWith('/services/create') ? 'create' : 'list';

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <div className="flex p-2">
                    <Link href={route('services')} className="cursor-pointer">
                        <img src={logo} alt="Company Logo" className="h-10 w-auto" />
                    </Link>
                </div>
            </SidebarHeader>
            <SidebarContent>
                {displayMode === 'create' ? (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <ol role="list" className="relative space-y-10 pt-2">
                                {actualSteps.map((step, idx) => {
                                    const status = idx < currentStep ? 'complete' : idx === currentStep ? 'current' : 'upcoming';
                                    const isCompleted = status === 'complete';
                                    const isCurrent = status === 'current';
                                    const Icon = step.icon;

                                    return (
                                        <li key={step.name} className="relative">
                                            {/* Connecting line */}
                                            {idx < actualSteps.length - 1 && (
                                                <div
                                                    className={cn(
                                                        'absolute top-11 left-7 h-10 w-0.5 -translate-y-1',
                                                        isCompleted ? 'bg-primary' : 'bg-gray-200',
                                                    )}
                                                    aria-hidden="true"
                                                />
                                            )}

                                            <div className="relative flex items-center gap-2 pl-2">
                                                {/* Step number/icon */}
                                                <div
                                                    className={cn(
                                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
                                                        isCompleted
                                                            ? 'border-primary bg-primary text-white shadow-sm'
                                                            : isCurrent
                                                              ? 'border-primary text-primary shadow-sm'
                                                              : 'border-gray-300 bg-white text-gray-400',
                                                    )}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle className="h-5 w-5" />
                                                    ) : (
                                                        <Icon className={cn('h-4 w-4', isCurrent ? 'text-primary' : 'text-gray-400')} />
                                                    )}
                                                </div>

                                                {/* Step content */}
                                                <div className="flex min-w-0 flex-1 flex-col pt-1">
                                                    <span
                                                        className={cn(
                                                            'text-sm font-medium transition-colors',
                                                            isCompleted
                                                                ? 'font-semibold text-primary'
                                                                : isCurrent
                                                                  ? 'font-semibold text-gray-900'
                                                                  : 'text-gray-500',
                                                        )}
                                                    >
                                                        {step.name}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'text-xs transition-colors',
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
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : (
                    <SidebarGroup>
                        {/* <SidebarGroupLabel className="text-gray-700">Main</SidebarGroupLabel> */}
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => {
                                    const isActive = isCurrentPath(item.url);
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild isActive={isActive}>
                                                <Link href={item.url} className="flex items-center gap-3">
                                                    <item.icon className="h-4 w-4" />
                                                    <span className="font-medium">{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
