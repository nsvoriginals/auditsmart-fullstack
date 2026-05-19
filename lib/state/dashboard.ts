"use client";

import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useEffect } from "react";

export interface DashboardStats {
  totalAudits: number;
  completedAudits: number;
  pendingAudits: number;
  averageScore: number;
  remainingAudits: number | null;
  currentMonthAudits: number;
}

export interface RecentAudit {
  id: string;
  contractName: string;
  status: string;
  score: number | null;
  createdAt: string;
}

export interface DashboardSubscription {
  plan: string;
  status: string;
  currentPeriodEnd?: string | null;
}

export interface DashboardData {
  stats: DashboardStats;
  recentAudits: RecentAudit[];
  subscription: DashboardSubscription;
  fetchedAt: number;
}

const dashboardAtom = atomWithStorage<DashboardData | null>("dashboard-data", null);
const dashboardLoadingAtom = atom(false);
const STALE_MS = 30_000;

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("dashboard fetch failed");
  const json = await res.json();
  return {
    stats: json.stats,
    recentAudits: json.recentAudits ?? [],
    subscription: json.subscription ?? { plan: "FREE", status: "ACTIVE" },
    fetchedAt: Date.now(),
  };
}

export function useDashboard() {
  const [data, setData] = useAtom(dashboardAtom);
  const [loading, setLoading] = useAtom(dashboardLoadingAtom);

  useEffect(() => {
    const isStale = !data || Date.now() - data.fetchedAt > STALE_MS;
    if (!isStale || loading) return;

    setLoading(true);
    fetchDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => {
    setLoading(true);
    return fetchDashboard()
      .then((next) => { setData(next); return next; })
      .finally(() => setLoading(false));
  };

  return { data, loading: loading && !data, refresh };
}
