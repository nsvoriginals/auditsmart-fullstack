"use client";

import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useEffect } from "react";

export interface UserLimits {
  plan: string;
  remaining: number | null;
  limit: number | null;
  auditsThisMonth: number;
  canAudit: boolean;
  isUnlimited: boolean;
  fetchedAt: number;
}

// Persist between page reloads so back-navigation is instant. 60s TTL.
const limitsAtom = atomWithStorage<UserLimits | null>("user-limits", null);
const inflightAtom = atom<Promise<UserLimits> | null>(null);

const STALE_MS = 30_000;

async function fetchLimits(): Promise<UserLimits> {
  const res = await fetch("/api/user/limits", { cache: "no-store" });
  if (!res.ok) throw new Error("limits fetch failed");
  const data = await res.json();
  return {
    plan: (data.plan ?? "FREE").toUpperCase(),
    remaining: data.remaining ?? null,
    limit: data.limit ?? null,
    auditsThisMonth: data.auditsThisMonth ?? 0,
    canAudit: data.canAudit ?? true,
    isUnlimited: data.isUnlimited ?? false,
    fetchedAt: Date.now(),
  };
}

export function useUserLimits(seed?: Partial<UserLimits>) {
  const [limits, setLimits] = useAtom(limitsAtom);
  const [inflight, setInflight] = useAtom(inflightAtom);

  useEffect(() => {
    const isStale = !limits || Date.now() - limits.fetchedAt > STALE_MS;
    if (!isStale || inflight) return;

    const p = fetchLimits()
      .then((next) => {
        setLimits(next);
        return next;
      })
      .finally(() => setInflight(null));
    setInflight(p);
  }, [limits, inflight, setLimits, setInflight]);

  useEffect(() => {
    const handler = () => {
      const p = fetchLimits()
        .then((next) => {
          setLimits(next);
          return next;
        })
        .finally(() => setInflight(null));
      setInflight(p);
    };
    window.addEventListener("plan-upgraded", handler);
    return () => window.removeEventListener("plan-upgraded", handler);
  }, [setLimits, setInflight]);

  // Merge seed (server-rendered) with cached/fetched (client) — seed wins until we have fresher data
  const merged: UserLimits = {
    plan:            limits?.plan            ?? (seed?.plan?.toUpperCase() ?? "FREE"),
    remaining:       limits?.remaining       ?? seed?.remaining       ?? null,
    limit:           limits?.limit           ?? seed?.limit           ?? null,
    auditsThisMonth: limits?.auditsThisMonth ?? seed?.auditsThisMonth ?? 0,
    canAudit:        limits?.canAudit        ?? seed?.canAudit        ?? true,
    isUnlimited:     limits?.isUnlimited     ?? seed?.isUnlimited     ?? false,
    fetchedAt:       limits?.fetchedAt       ?? 0,
  };

  return merged;
}
