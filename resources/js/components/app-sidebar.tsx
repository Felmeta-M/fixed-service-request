import { RadioTower } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import logo from '@/images/ethio_logo_full.png';
import { Link, usePage } from '@inertiajs/react';
import { NavUser } from './nav-user';

const items = [
    {
        title: 'Services',
        url: '/services',
        icon: RadioTower,
    },
];

export function AppSidebar() {
    const { url } = usePage();

    const isCurrentPath = (itemUrl: string) => {
        return url === itemUrl;
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex">
                    <img src={logo} alt="Company Logo" className="h-12 w-auto" />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Main</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                const isActive = isCurrentPath(item.url);
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive}>
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
