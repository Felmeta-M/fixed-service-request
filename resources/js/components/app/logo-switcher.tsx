// "use client"

// import * as React from "react"
// import { Link } from "@inertiajs/react"
// import {
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   useSidebar,
//   SidebarTrigger
// } from "@/components/ui/sidebar"
// import logo from "@/images/ethio_logo_full.png"

// export function LogoSwitcher() {
//   const { state } = useSidebar()

//   return (
//     <div className="py-2">
//       <SidebarMenu>
//         <SidebarMenuItem>
//           <SidebarMenuButton
//             size="lg"
//             asChild
//             className="hover:bg-transparent active:bg-transparent"
//           >
//             <Link href={route('services')} className="flex items-center">
//               {state === "collapsed" ? (
//                 <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
//                   <img src="/favicon.ico" alt="Ethio Telecom" className="h-6 w-6" />
//                 </div>
//               ) : (
//                 <img src={logo} alt="Ethio Telecom Logo" className="h-10 w-auto" />
//               )}
//             </Link>
//           </SidebarMenuButton>
//         </SidebarMenuItem>
//       </SidebarMenu>
//       {state !== "collapsed" && (
//           <SidebarTrigger className="h-7 w-7 ml-auto" />
//         )}
        
//     </div>
//   )
// }

"use client"

import * as React from "react"
import { Link } from "@inertiajs/react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import logo from "@/images/ethio_logo_full.png"

export function LogoSwitcher() {
  const { state } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground px-2 py-3"
        >
          <Link href={route('services')} className="flex items-center justify-center w-full">
            {state === "collapsed" ? (
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-accent text-primary-foreground">
                <img src="/favicon.ico" alt="Ethio Telecom" className="h-6 w-6" />
              </div>
            ) : (
              <img src={logo} alt="Ethio Telecom Logo" className="h-11 w-auto max-w-full object-contain" />
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
