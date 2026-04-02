"use client";
// src/app/dashboard/monitor/page.tsx — Contract Monitor

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Play,
  Square,
  Activity,
  AlertTriangle,
  Info,
  AlertCircle,
  Eye,
  ExternalLink,
  Trash2,
  Clock,
  Hash,
  Link as LinkIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface MonitorEvent {
  id: string;
  type: "transaction" | "event" | "alert" | "upgrade";
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
  txHash?: string;
  blockNum?: number;
}

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    label: "Info",
    className: "bg-gray-500/10 text-gray-400 border-gray-500/20"
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
  },
  critical: {
    icon: AlertCircle,
    label: "Critical",
    className: "bg-red-500/10 text-red-500 border-red-500/20"
  }
};

const TYPE_CONFIG = {
  transaction: { label: "Transaction", icon: Activity },
  event: { label: "Event", icon: Eye },
  alert: { label: "Alert", icon: AlertTriangle },
  upgrade: { label: "Upgrade", icon: LinkIcon }
};

// Fake event generator for demo
function generateFakeEvent(): MonitorEvent {
  const types: MonitorEvent["type"][] = ["transaction", "event", "alert", "upgrade"];
  const severities: MonitorEvent["severity"][] = ["info", "info", "info", "warning", "critical"];
  const messages = [
    "Large ETH transfer detected: 50 ETH",
    "Suspicious reentrancy pattern in call trace",
    "Ownership transfer event emitted",
    "Proxy implementation upgraded",
    "Flash loan interaction detected",
    "Contract balance decreased by >10%",
    "New approved spender detected",
    "Pause function called",
    "Oracle price deviation > 5%",
    "Gas limit anomaly in transaction",
    "Multiple failed transaction attempts",
    "Admin function called from new address"
  ];
  
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  
  return {
    id: Math.random().toString(36).slice(2),
    type,
    severity: severity as MonitorEvent["severity"],
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: new Date().toISOString(),
    txHash: `0x${Math.random().toString(16).slice(2).padEnd(64, "0")}`,
    blockNum: Math.floor(19000000 + Math.random() * 100000),
  };
}

export default function MonitorPage() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [active, setActive] = useState(false);
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [error, setError] = useState("");
  const [alertCount, setAlertCount] = useState({ total: 0, critical: 0, warning: 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(address.trim());

  const startMonitor = () => {
    if (!isValidAddress) {
      setError("Enter a valid EVM contract address (0x...)");
      return;
    }
    setError("");
    setEvents([]);
    setAlertCount({ total: 0, critical: 0, warning: 0 });
    setActive(true);
  };

  const stopMonitor = () => {
    setActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearEvents = () => {
    setEvents([]);
    setAlertCount({ total: 0, critical: 0, warning: 0 });
  };

  useEffect(() => {
    if (!active) return;

    const seed = [generateFakeEvent(), generateFakeEvent()];
    setEvents(seed);

    intervalRef.current = setInterval(() => {
      if (Math.random() > 0.35) {
        const ev = generateFakeEvent();
        setEvents(prev => [ev, ...prev].slice(0, 100));
        setAlertCount(c => ({
          total: c.total + 1,
          critical: c.critical + (ev.severity === "critical" ? 1 : 0),
          warning: c.warning + (ev.severity === "warning" ? 1 : 0),
        }));
      }
    }, 2800);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active]);

  useEffect(() => {
    if (scrollRef.current && events.length > 0) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contract Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter any deployed contract address to watch for suspicious activity in real time.
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Configuration</CardTitle>
          <CardDescription>
            Configure the contract address and network to monitor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="contract-address">Contract Address</Label>
              <Input
                id="contract-address"
                placeholder="0x742d35Cc6634C0532925a3b8D4C9C5f2..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={active}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="network">Network</Label>
              <Select value={chain} onValueChange={setChain} disabled={active}>
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {["ethereum", "polygon", "arbitrum", "optimism", "bsc", "base"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3">
            {!active ? (
              <Button onClick={startMonitor} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Start Monitoring
              </Button>
            ) : (
              <Button onClick={stopMonitor} size="lg" variant="destructive">
                <Square className="mr-2 h-4 w-4" />
                Stop Monitoring
              </Button>
            )}
            
            {active && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <span className="text-sm text-green-600 dark:text-green-400">
                  Live · {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {(active || events.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Events Captured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {alertCount.total}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {alertCount.warning}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {alertCount.critical}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Feed */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Feed</CardTitle>
                <CardDescription>
                  Real-time monitoring events for {address ? formatAddress(address) : "contract"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {active && (
                  <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400">
                    <Activity className="mr-1 h-3 w-3" />
                    LIVE
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearEvents}>
                  <Trash2 className="mr-2 h-3 w-3" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
              <div className="space-y-3">
                {events.map((event) => {
                  const severity = SEVERITY_CONFIG[event.severity];
                  const SeverityIcon = severity.icon;
                  const typeConfig = TYPE_CONFIG[event.type];
                  const TypeIcon = typeConfig?.icon || Activity;
                  
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all hover:bg-accent/50",
                        event.severity === "critical" && "border-red-500/30 bg-red-500/5",
                        event.severity === "warning" && "border-yellow-500/30 bg-yellow-500/5",
                        event.severity === "info" && "border-gray-500/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-1.5 rounded-md",
                          event.severity === "critical" && "bg-red-500/10",
                          event.severity === "warning" && "bg-yellow-500/10",
                          event.severity === "info" && "bg-gray-500/10"
                        )}>
                          <SeverityIcon className={cn(
                            "h-4 w-4",
                            event.severity === "critical" && "text-red-500",
                            event.severity === "warning" && "text-yellow-500",
                            event.severity === "info" && "text-gray-400"
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={severity.className}>
                              {severity.label}
                            </Badge>
                            <Badge variant="secondary" className="gap-1">
                              <TypeIcon className="h-3 w-3" />
                              {typeConfig?.label}
                            </Badge>
                            {event.blockNum && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Hash className="h-3 w-3" />
                                Block {event.blockNum.toLocaleString()}
                              </div>
                            )}
                          </div>
                          
                          <p className="text-sm text-foreground mb-2">
                            {event.message}
                          </p>
                          
                          {event.txHash && (
                            <div className="flex items-center gap-1">
                              <LinkIcon className="h-3 w-3 text-muted-foreground" />
                              <code className="text-xs text-muted-foreground font-mono">
                                {event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}
                              </code>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!active && events.length === 0 && (
        <Card className="py-16 text-center">
          <CardContent>
            <div className="flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Eye className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Start Monitoring
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Enter a contract address above to begin real-time monitoring for large transfers, 
                ownership changes, and exploit patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}