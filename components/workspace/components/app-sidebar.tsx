"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HelpModal } from "@/components/workspace/components/help-modal"
import {
    IconCamera,
    IconDatabase,
    IconFileAi,
    IconFileDescription,
    IconFileWord,
    IconReport,
} from "@tabler/icons-react"
import { GaugeIcon } from "@/components/workspace/components/icons/guage"
import { FlaskIcon } from "@/components/workspace/components/icons/audit_lab"
import { RocketIcon } from "@/components/workspace/components/icons/rocket"
import { SquareStackIcon } from "@/components/workspace/components/icons/history"
import { SettingsIcon } from "@/components/workspace/components/icons/settings"
import { SearchIcon } from "@/components/workspace/components/icons/search"
import { CircleHelpIcon } from "@/components/workspace/components/icons/help"

import { NavDocuments } from "@/components/workspace/components/nav-documents"
import { NavMain } from "@/components/workspace/components/nav-main"
import { NavSecondary } from "@/components/workspace/components/nav-secondary"
import { NavUser } from "@/components/workspace/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/workspace/components/ui/sidebar"
const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Dashboard",
            url: "/workspace",
            icon: GaugeIcon,
        },
        {
            title: "Optimizations",
            url: "/workspace/optimizations",
            icon: RocketIcon,
        },
        {
            title: "History",
            url: "/workspace/history",
            icon: SquareStackIcon,
        },
    ],
    navClouds: [
        {
            title: "Capture",
            icon: IconCamera,
            isActive: true,
            url: "#",
            items: [
                {
                    title: "Active Proposals",
                    url: "#",
                },
                {
                    title: "Archived",
                    url: "#",
                },
            ],
        },
        {
            title: "Proposal",
            icon: IconFileDescription,
            url: "#",
            items: [
                {
                    title: "Active Proposals",
                    url: "#",
                },
                {
                    title: "Archived",
                    url: "#",
                },
            ],
        },
        {
            title: "Prompts",
            icon: IconFileAi,
            url: "#",
            items: [
                {
                    title: "Active Proposals",
                    url: "#",
                },
                {
                    title: "Archived",
                    url: "#",
                },
            ],
        },
    ],
    navSecondary: [
        {
            title: "Settings",
            icon: SettingsIcon,
            action: "settings" as const,
        },
        {
            title: "Get Help",
            icon: CircleHelpIcon,
            action: "help" as const,
        },
        // {
        //     title: "Search",
        //     url: "#",
        //     icon: SearchIcon,
        // },
    ],
    documents: [
        {
            name: "Data Library",
            url: "#",
            icon: IconDatabase,
        },
        {
            name: "Reports",
            url: "#",
            icon: IconReport,
        },
        {
            name: "Word Assistant",
            url: "#",
            icon: IconFileWord,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const router = useRouter()
    const [helpOpen, setHelpOpen] = useState(false)

    useEffect(() => {
        if (!helpOpen) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setHelpOpen(false)
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [helpOpen])

    const handleSecondaryAction = (action: "settings" | "help") => {
        if (action === "settings") {
            router.push("/dashboard/settings")
        } else {
            setHelpOpen(true)
        }
    }

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:p-1.5! mb-6 hover:bg-transparent hover:text-current"
                        >
                            <a href="/workspace" className="flex items-center gap-3">

                                <span className="font-heading text-lg font-bold tracking-tight uppercase text-neon-green">SENTINEL_OS</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="font-mono">
                <NavMain items={data.navMain} />
                <NavSecondary
                    items={data.navSecondary}
                    className="mt-auto"
                    onAction={handleSecondaryAction}
                />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        </Sidebar>
    )
}
