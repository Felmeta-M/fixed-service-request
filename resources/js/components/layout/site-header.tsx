import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, FileText, LogOut, MapPin, Wifi } from 'lucide-react';
import { MobileStepIndicator } from '@/components/common/mobile-step-indicator';

interface SiteHeaderProps {
    title: string;
    isServiceCreation?: boolean;
    currentStep?: number;
    steps?: Array<{ name: string; icon: any }>;
}

const createServiceSteps = [
    { name: 'Service Information', icon: Wifi },
    { name: 'Location Information', icon: MapPin },
    { name: 'Review & Submit', icon: FileText },
];

export function SiteHeader({ title, isServiceCreation = false, currentStep = 0, steps = createServiceSteps }: SiteHeaderProps) {
    const showMobileSteps = isServiceCreation;

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <>
            <header className="flex h-(--header-height) px-2 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
                <div className="flex w-full items-center gap-1 lg:gap-2 lg:px-6">
                    <SidebarTrigger />

                    {isServiceCreation && (
                        <Link href="/services">
                            <Button variant="ghost" size="sm" className="flex h-8 items-center">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}

                    <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
                    <h1 className="hidden text-base font-medium capitalize md:block">{title}</h1>

                    <div className="ml-auto flex items-center gap-4">
                        {/* additional header buttons or actions */}
                        {/* Mobile title for service creation */}
                        {/* {isServiceCreation && (
                            <h1 className="text-sm text-gray-500 font-medium capitalize md:hidden">
                                Step {currentStep + 1} of {steps.length}
                            </h1>
                        )} */}
                         <Button variant="ghost" size="sm" className="h-8 md:hidden" onClick={handleLogout}>
                            <LogOut className=" h-4 w-4" />
                            Log out
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mobile Step Indicator */}
            {showMobileSteps && (
                <div className="md:hidden">
                    <MobileStepIndicator currentStep={currentStep} steps={steps} />
                </div>
            )}
        </>
    );
}
