import { MultistepSidebar } from '@/components/multistep-sidebar';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';
interface ServicesLayoutProps {
    children: ReactNode;
    isCreatingService?: boolean;
    currentStep?: number;
    onStepChange?: (step: number) => void;
}

export default function ServicesLayout({ children, isCreatingService = false, currentStep, onStepChange }: ServicesLayoutProps) {
    return (
        <SidebarProvider>
            <MultistepSidebar currentStep={currentStep} mode={isCreatingService ? 'create' : 'list'} />

            <main className="flex-1 p-6">
                <div className="flex items-center justify-between bg-white pb-4">
                    <div className="flex items-center">
                        <SidebarTrigger />
                        <Link href="/services">
                            <Button variant="ghost" className="flex items-center">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="">
                            <h1 className="text-xl font-semibold text-gray-900">Create new service</h1>
                        </div>
                    </div>
                </div>
                <div>{children}</div>
            </main>
        </SidebarProvider>
    );
}
