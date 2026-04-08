"use client";
// components/layout/DashboardNavbar.tsx

import Link from "next/link";
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  HelpCircle,
  CreditCard,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";

interface DashboardNavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    plan?: string;
  };
}

const PLAN_STYLES: Record<string, string> = {
  FREE:       "bg-[var(--elevated)] text-[var(--text-muted)]",
  PRO:        "bg-[var(--brand-faint)] text-[var(--brand)]",
  ENTERPRISE: "bg-[rgba(168,85,247,0.08)] text-[#a855f7]",
};

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "U";
}

export function DashboardNavbar({ user }: DashboardNavbarProps) {
  const plan = (user?.plan || "FREE").toUpperCase();
  const planStyle = PLAN_STYLES[plan] ?? PLAN_STYLES.FREE;

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-4 px-5"
      style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8 text-[var(--text-muted)]"
        onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
            style={{ color: "var(--text-disabled)" }}
          />
          <Input
            type="search"
            placeholder="Search audits…"
            className="pl-9 h-8 text-sm border-0 focus-visible:ring-1"
            style={{
              background: "var(--elevated)",
              color: "var(--text-primary)",
              fontFamily: "'Satoshi', sans-serif",
            }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ background: "var(--brand)" }}
          >
            3
          </span>
        </Button>

        <ThemeToggle />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0 hover:ring-2 hover:ring-[var(--border-strong)]"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className="text-sm font-semibold"
                  style={{
                    background: "var(--brand-faint)",
                    color: "var(--brand)",
                    fontFamily: "'Satoshi', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)", fontFamily: "'Satoshi', sans-serif", fontWeight: 700, letterSpacing: "-0.025em" }}
                >
                  {user?.name || "User"}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}
                >
                  {user?.email}
                </p>
                <span
                  className={`mt-0.5 inline-flex w-fit rounded px-2 py-0.5 text-[11px] font-medium ${planStyle}`}
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                >
                  {plan} Plan
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <User className="mr-2 h-3.5 w-3.5" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing" className="cursor-pointer">
                <CreditCard className="mr-2 h-3.5 w-3.5" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help" className="cursor-pointer">
                <HelpCircle className="mr-2 h-3.5 w-3.5" />
                Help
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}