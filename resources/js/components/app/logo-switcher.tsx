"use client"

import * as React from "react"
import { Link } from "@inertiajs/react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import logo from "@/images/ethio_logo_full.png"

export function LogoSwitcher() {
  const { state } = useSidebar()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link href={route('services')} className="flex items-center">
                {state === "collapsed" ? (
                  <div className="bg-accent text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src="/favicon1.ico" alt="Ethio Telecom" className="h-5 w-5" />
                  </div>
                ) : (
                  <img src={logo} alt="Ethio Telecom Logo" className="h-9 w-auto" />
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {state !== "collapsed" && (
          <SidebarTrigger className="h-7 w-7 ml-auto" />
        )}
      </div>
      {state === "collapsed" && (
        <div className="flex justify-center">
          <SidebarTrigger className="h-7 w-7" />
        </div>
      )}
    </div>
  )
}
