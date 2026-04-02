"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  FileCode, 
  Eye, 
  History, 
  CreditCard, 
  Star, 
  LogOut,
  Shield,
  Zap,
  TrendingUp,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

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
];

interface UserLimits {
  plan: string;
  auditsThisMonth: number;
  remainingAudits: number | null;
  limit: number | null;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUserLimits();
  }, [session]);

  const fetchUserLimits = async () => {
    try {
      const response = await fetch("/api/user/limits");
      const data = await response.json();
      if (response.ok) {
        setUserLimits(data);
      }
    } catch (error) {
      console.error("Failed to fetch limits:", error);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "premium":
        return "bg-blue-500";
      case "enterprise":
        return "bg-purple-500";
      case "free":
      default:
        return "bg-green-500";
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "premium":
        return Zap;
      case "enterprise":
        return TrendingUp;
      default:
        return Shield;
    }
  };

  const plan = session?.user?.role || userLimits?.plan || "FREE";
  const PlanIcon = getPlanIcon(plan);
  const planColor = getPlanColor(plan);
  
  const usagePercentage = userLimits?.limit 
    ? (userLimits.auditsThisMonth / userLimits.limit) * 100 
    : 0;
  
  const remainingText = userLimits?.remainingAudits === null 
    ? "Unlimited" 
    : `${userLimits?.remainingAudits || 0} left`;

  const SidebarContent = () => (
    <aside className="flex flex-col h-full bg-card border-r">
      {/* Logo */}
      <div className="p-5 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">
            Audit<span className="text-primary">Smart</span>
          </span>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "User"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <PlanIcon className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium capitalize text-primary">
                {plan.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="text-xs font-medium px-4 pb-2 uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2 mx-2 rounded-md transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-primary/10 text-primary"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}

        <div className="my-3 mx-4 h-px bg-border" />

        <p className="text-xs font-medium px-4 pb-2 uppercase tracking-wider text-muted-foreground">
          Account
        </p>
        <Link
          href="/dashboard/pricing"
          className="flex items-center gap-3 px-4 py-2 mx-2 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Star className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">Upgrade Plan</span>
          {plan === "FREE" && (
            <Badge variant="secondary" className="ml-auto text-xs">
              Pro
            </Badge>
          )}
        </Link>
      </nav>

      {/* Theme Toggle & Usage Stats */}
      <div className="p-4 border-t space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Monthly Usage</span>
            <span className="text-xs font-medium text-foreground">
              {userLimits?.auditsThisMonth || 0} / {userLimits?.limit || 3} audits
            </span>
          </div>
          <Progress value={Math.min(100, usagePercentage)} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {remainingText} this month
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card border shadow-sm"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
