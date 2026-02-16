import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/use-translation';
import { clearBrowserFootprint } from '@/lib/clear-browser-footprint';
import { router, usePage } from '@inertiajs/react';
import { LogOut, MoreVertical } from 'lucide-react';

interface User {
    id: number;
    customer_code: string;
    name: string;
    phone: string;
}

export function NavUser() {
    const { isMobile, state } = useSidebar();
    const { auth } = usePage().props;
    const user = auth.user as User;
    const { t } = useTranslation();

    const handleLogout = () => {
        clearBrowserFootprint();
        router.post(route('logout'));
    };

    // Generate avatar fallback from name
    const getAvatarFallback = (name?: string) => {
        if (!name) return '';
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton 
                            size="lg" 
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-auto py-3"
                        >
                            <Avatar className="h-10 w-10 rounded-full shrink-0">
                                <AvatarFallback className="rounded-full bg-primary text-white text-sm font-medium">
                                    {getAvatarFallback(user?.name)}
                                </AvatarFallback>
                            </Avatar>
                            {state !== 'collapsed' && (
                                <>
                                    <div className="grid flex-1 text-left leading-tight">
                                        <span className="truncate font-semibold text-gray-900">{user?.name}</span>
                                        <span className="truncate text-sm text-gray-500">{user?.phone}</span>
                                    </div>
                                    <MoreVertical className="ml-auto size-5 text-gray-400" />
                                </>
                            )}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                                <Avatar className="h-10 w-10 rounded-full">
                                    <AvatarFallback className="rounded-full bg-primary text-white text-sm font-medium">
                                        {getAvatarFallback(user?.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left leading-tight">
                                    <span className="truncate font-semibold text-gray-900">{user?.name}</span>
                                    <span className="truncate text-sm text-gray-500">{user?.phone}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <LogOut className="mr-2 size-4" />
                            {t('nav.log_out')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
