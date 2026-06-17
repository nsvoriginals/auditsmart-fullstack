"use client"

import { signOut } from "next-auth/react"
import { IconLogout } from "@tabler/icons-react"
import { useWorkspaceAuth } from "@/components/workspace/lib/use-workspace-auth"
import {
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/workspace/components/ui/sidebar"

export function NavUser() {
    const { isLoaded, isSignedIn, user } = useWorkspaceAuth()

    if (!isLoaded || !isSignedIn || !user) return null

    const displayName = user.name || user.email?.split("@")[0] || "Operator"
    const initial = (displayName[0] || "O").toUpperCase()

    return (
        <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-3 p-2 font-mono uppercase tracking-widest text-xs text-on-surface-variant border-t border-wireframe mt-auto pt-4">
                {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.image}
                        alt={displayName}
                        className="w-8 h-8 rounded-none border border-neon-green/30 object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-none border border-neon-green/30 flex items-center justify-center text-neon-green font-bold bg-neon-green/5">
                        {initial}
                    </div>
                )}
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-neon-green font-bold">{displayName}</span>
                    <span className="truncate text-[9px] opacity-70 tracking-widest normal-case">
                        {user.email}
                    </span>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    title="Sign out"
                    className="text-on-surface-variant hover:text-neon-green transition-colors group-data-[collapsible=icon]:hidden"
                >
                    <IconLogout className="w-4 h-4" />
                </button>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
