"use client";
// app/dashboard/page.tsx — Dashboard Overview

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Plus, 
  Eye, 
  Star,
  Zap,
  Brain,
  Sparkles,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Types for dashboard data
interface DashboardStats {
  stats: {
    totalAudits: number;
    completedAudits: number;
    pendingAudits: number;
    averageScore: number;
    remainingAudits: number | null;
    currentMonthAudits: number;
  };
  recentAudits: Array<{
    id: string;
    contractName: string;
    status: string;
    score: number;
    createdAt: string;
  }>;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  };
}

// Helper to get risk level from score
const getRiskLevel = (score: number) => {
  if (score >= 80) return { text: "Critical", variant: "destructive" as const };
  if (score >= 60) return { text: "High", variant: "default" as const, className: "bg-orange-500" };
  if (score >= 35) return { text: "Medium", variant: "secondary" as const };
  if (score >= 10) return { text: "Low", variant: "outline" as const };
  return { text: "Good", variant: "default" as const, className: "bg-green-500" };
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return { icon: CheckCircle, label: "Complete", variant: "default" as const, className: "bg-green-500" };
    case "PROCESSING":
      return { icon: Loader2, label: "Processing", variant: "secondary" as const };
    case "FAILED":
      return { icon: XCircle, label: "Failed", variant: "destructive" as const };
    default:
      return { icon: Clock, label: "Pending", variant: "outline" as const };
  }
};

export default function DashboardOverview() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);
      
      setData(result);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats;
  const recentAudits = data?.recentAudits || [];
  const subscription = data?.subscription;
  const averageScore = stats?.averageScore || 0;
  const riskInfo = getRiskLevel(averageScore);

  // Stat cards configuration
  const statCards = [
    { 
      label: "Total Audits", 
      value: stats?.totalAudits || 0, 
      description: "all time",
      icon: Shield,
      trend: "+12%",
    },
    { 
      label: "Completed", 
      value: stats?.completedAudits || 0, 
      description: "successful audits",
      icon: CheckCircle,
      trend: "+8%",
    },
    { 
      label: "Pending", 
      value: stats?.pendingAudits || 0, 
      description: "in progress",
      icon: Clock,
      trend: "-2%",
    },
    { 
      label: "Security Score", 
      value: averageScore.toFixed(0), 
      description: "/ 100",
      icon: Shield,
      suffix: "%",
    },
  ];

  const getPlanIcon = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "pro": return Zap;
      case "enterprise": return Brain;
      default: return Shield;
    }
  };

  // FIX 1: Add fallback for undefined subscription?.plan
  const PlanIcon = getPlanIcon(subscription?.plan || "free");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="mb-2">Error Loading Dashboard</CardTitle>
          <CardDescription>{error}</CardDescription>
          <Button onClick={() => fetchDashboardData()} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {session?.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s your security audit overview and recent activity.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Plan Badge */}
          <Badge variant="outline" className="gap-2 px-3 py-1.5">
            <PlanIcon className="h-3 w-3" />
            <span className="capitalize">{subscription?.plan?.toLowerCase() || "free"}</span>
          </Badge>
          
          {/* New Audit Button */}
          <Button asChild>
            <Link href="/dashboard/scan">
              <Plus className="mr-2 h-4 w-4" />
              New Audit
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {card.value}{card.suffix || ""}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
                {card.label === "Security Score" && averageScore > 0 && (
                  <div className="mt-3">
                    <Progress value={averageScore} className="h-1.5" />
                    <Badge 
                      variant={riskInfo.variant}
                      className={cn("mt-2 text-xs", riskInfo.className)}
                    >
                      {riskInfo.text} Risk
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Audits - Left Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Audits</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/history">
                    View all
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Your most recent security audit reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAudits.length === 0 ? (
                <div className="py-12 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No audits yet.</p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/scan">
                      Run your first audit
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAudits.map((audit) => {
                    const auditRisk = getRiskLevel(audit.score);
                    const StatusIcon = getStatusConfig(audit.status).icon;
                    const statusConfig = getStatusConfig(audit.status);
                    
                    return (
                      <Link
                        key={audit.id}
                        href={`/dashboard/audit/results/${audit.id}`}
                        className="flex items-center gap-4 p-3 rounded-lg transition-all hover:bg-accent group"
                      >
                        {/* Score Circle */}
                        <div className="flex-shrink-0">
                          <div className="relative inline-flex">
                            <svg className="w-12 h-12 transform -rotate-90">
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                className="text-muted-foreground/20"
                              />
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${(audit.score / 100) * 125.6} 125.6`}
                                className="text-primary"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                              {audit.score}
                            </span>
                          </div>
                        </div>
                        
                        {/* Audit Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-medium truncate text-foreground">
                              {audit.contractName}
                            </p>
                            <Badge 
                              variant={statusConfig.variant}
                              className={cn("gap-1", statusConfig.className)}
                            >
                              <StatusIcon className="h-2.5 w-2.5" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(audit.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {/* Risk Level */}
                        <Badge 
                          variant={auditRisk.variant}
                          className={cn("capitalize", auditRisk.className)}
                        >
                          {auditRisk.text}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Plan & Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle>Plan & Usage</CardTitle>
              <CardDescription>Your current subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">Audits this month</span>
                  <span className="font-medium text-foreground">
                    {stats?.currentMonthAudits || 0}
                    {subscription?.plan === "FREE" && <span className="text-muted-foreground"> / 3</span>}
                  </span>
                </div>
                <Progress 
                  value={subscription?.plan === "FREE" 
                    ? ((stats?.currentMonthAudits || 0) / 3) * 100
                    : ((stats?.currentMonthAudits || 0) / 100) * 100
                  } 
                  className="h-2"
                />
              </div>
              
              {subscription?.plan === "FREE" && stats?.remainingAudits !== null && (
                <div className="p-3 rounded-lg bg-accent">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Remaining free audits
                    </span>
                    {/* FIX 2: Add optional chaining for stats */}
                    <span className="text-lg font-bold text-foreground">
                      {stats?.remainingAudits}
                    </span>
                  </div>
                </div>
              )}
              
              {subscription?.plan === "FREE" ? (
                <Button asChild className="w-full">
                  <Link href="/pricing">
                    <Zap className="mr-2 h-4 w-4" />
                    Upgrade for more audits
                  </Link>
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Renews on {subscription?.currentPeriodEnd 
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard/scan">
                  <Shield className="mr-2 h-4 w-4" />
                  New Security Audit
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard/history">
                  <Eye className="mr-2 h-4 w-4" />
                  View Audit History
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/pricing">
                  <Star className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Security Tip Card */}
          <Card className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">Security Tip</h4>
                  <p className="text-xs text-muted-foreground">
                    Regular audits are crucial for contract security. Run audits after every major update.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}