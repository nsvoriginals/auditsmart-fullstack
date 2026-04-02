"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileCode, 
  Eye, 
  History, 
  CreditCard, 
  Settings,
  Shield,
  Zap,
  TrendingUp,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Scan Contract",
    href: "/dashboard/scan",
    icon: FileCode,
    badge: "New",
  },
  {
    label: "Monitor",
    href: "/dashboard/monitor",
    icon: Eye,
  },
  {
    label: "Audit History",
    href: "/dashboard/history",
    icon: History,
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const SidebarContent = () => (
    <aside className="flex h-full flex-col bg-background border-r">
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-2.5 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <span className="text-lg font-bold text-foreground">
          Audit<span className="text-primary">Smart</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto py-6">
        <div className="px-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Main Menu
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive && "text-primary"
                  )} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <Separator />

        <div className="px-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </p>
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-3 px-3 font-normal"
              asChild
            >
              <Link href="/dashboard/scan">
                <Zap className="h-4 w-4" />
                New Audit
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-3 px-3 font-normal"
              asChild
            >
              <Link href="/dashboard/monitor">
                <Eye className="h-4 w-4" />
                Monitor Contract
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Upgrade Section */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Upgrade to Pro
            </span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Get 20 audits/month and advanced features
          </p>
          <Button size="sm" className="w-full" asChild>
            <Link href="/pricing">Upgrade Now</Link>
          </Button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-64 lg:w-72 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-background shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative h-full">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}