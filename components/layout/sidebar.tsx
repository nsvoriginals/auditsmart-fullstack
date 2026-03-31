// components/layout/Sidebar.tsx
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
        return "from-blue-500 to-blue-600";
      case "enterprise":
        return "from-purple-500 to-purple-600";
      case "free":
      default:
        return "from-green-500 to-green-600";
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
    <aside className="sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl font-bold" style={{ color: "var(--frost)" }}>
            Audit<span className="text-[var(--plum-light)]">Smart</span>
          </span>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] flex items-center justify-center text-white font-semibold text-sm">
              {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[var(--bg-card)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "User"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <PlanIcon className="w-3 h-3" style={{ color: "var(--plum-light)" }} />
              <span className="text-xs font-medium capitalize" style={{ color: "var(--plum-light)" }}>
                {plan.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="text-xs font-medium px-4 pb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
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
              className={`sidebar-item group ${
                isActive ? "active" : ""
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${
                isActive ? "text-[var(--plum-light)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
              }`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="divider mx-4 my-3" />

        <p className="text-xs font-medium px-4 pb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Account
        </p>
        <Link
          href="/dashboard/pricing"
          className="sidebar-item group"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Star className="w-4 h-4 text-[var(--text-muted)] group-hover:text-yellow-500" />
          <span>Upgrade Plan</span>
          {plan === "FREE" && (
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
              Pro
            </span>
          )}
        </Link>
      </nav>

      {/* Usage Stats */}
      <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Monthly Usage</span>
            <span className="text-xs font-medium" style={{ color: "var(--frost)" }}>
              {userLimits?.auditsThisMonth || 0} / {userLimits?.limit || 3} audits
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, usagePercentage)}%`,
                background: `linear-gradient(90deg, var(--plum), var(--plum-light))`,
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
            {remainingText} this month
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="btn btn-ghost btn-sm w-full mt-2 flex items-center justify-center gap-2"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--bg-card)" }}
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