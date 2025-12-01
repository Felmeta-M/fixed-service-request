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
import { router, usePage } from '@inertiajs/react';
import { LogOut, MoreVertical } from 'lucide-react';

interface User {
    id: number;
    customer_code: string;
    name: string;
    phone: string;
}

export function NavUser() {
    const { isMobile } = useSidebar();
    const { auth } = usePage().props;
    const user = auth.user as User;

    // const user: User = {
    //     id: 6,
    //     customer_code: '828204303',
    //     name: 'zcppbx zcp',
    //     phone: '935117912',
    // };
    const handleLogout = () => {
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
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarFallback className="rounded-lg bg-primary text-white">{getAvatarFallback(user?.name)}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user?.name}</span>
                                <span className="truncate text-xs text-muted-foreground">{user?.phone}</span>
                            </div>
                            <MoreVertical className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarFallback className="rounded-lg bg-primary text-white">{getAvatarFallback(user?.name)}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user?.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user?.customer_code}</span>
                                    {/* <span className="truncate text-xs text-muted-foreground">{user.phone}</span> */}
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <UserCircle className="mr-2 size-4" />
                                Account
                            </DropdownMenuItem>
                        </DropdownMenuGroup> */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 size-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
