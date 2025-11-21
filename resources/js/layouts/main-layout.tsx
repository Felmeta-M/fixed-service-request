import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

interface ServicesLayoutProps {
    children: ReactNode;
}

const getHeader = (url: string) => {
    return url.split('/')[1].toLowerCase();
};

export default function MainLayout({ children }: ServicesLayoutProps) {
    const page = usePage();
    const header = getHeader(page.url);

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 p-6">
                <div className="flex items-center justify-between bg-white pb-4">
                    <div className="flex items-center">
                        <SidebarTrigger />
                        <div className="ml-1">
                            <h1 className="text-xl font-semibold text-gray-900 capitalize">{header}</h1>
                        </div>
                    </div>
                </div>
                <div className="">{children}</div>
            </main>
        </SidebarProvider>
    );
}
