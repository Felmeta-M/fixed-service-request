import { MobileStepIndicator } from '@/components/common/mobile-step-indicator';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, FileText, LogOut, MapPin, RouterIcon, Wifi } from 'lucide-react';

interface SiteHeaderProps {
    title: string;
    subtitle?: string;
    isServiceCreation?: boolean;
    currentStep?: number;
    steps?: Array<{ name: string; icon: any }>;
}

const createServiceSteps = [
    { name: 'Service Information', icon: Wifi },
    // { name: 'Service Information', icon: BroadbandIcon },
    { name: 'Location Information', icon: MapPin },
    { name: 'Device Information', icon: RouterIcon },
    { name: 'Review & Submit', icon: FileText },
];

export function SiteHeader({ title, subtitle, isServiceCreation = false, currentStep = 0, steps = createServiceSteps }: SiteHeaderProps) {
    const showMobileSteps = isServiceCreation;

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <>
            <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:border-b-0">
                <div className="flex w-full items-center gap-1 lg:gap-2 lg:px-6">
                    <SidebarTrigger />

                    <Link
                        href={isServiceCreation ? '/services' : '/'}
                        className="hidden items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 md:flex"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>

                    {isServiceCreation && (
                        <Link href="/services" className="md:hidden">
                            <Button variant="ghost" size="sm" className="flex h-8 items-center">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}

                    <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
                    <div className="hidden md:block">
                        <h1 className="text-base font-semibold capitalize">{title}</h1>
                        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        {isServiceCreation && (
                            <div className="hidden text-xs text-gray-500 sm:block md:hidden">
                                Step {currentStep + 1} of {steps.length}
                            </div>
                        )}
                        <Button variant="ghost" size="sm" className="h-8" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            <span className="sr-only">Log out</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mobile Step Indicator */}
            {showMobileSteps && (
                <div className="border-b border-gray-200 md:hidden">
                    <MobileStepIndicator currentStep={currentStep} steps={steps} />
                </div>
            )}
        </>
    );
}
