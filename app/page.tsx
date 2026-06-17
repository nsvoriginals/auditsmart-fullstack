"use client";
// app/page.tsx — AuditSmart Marketing Homepage

import { useSession } from "@/lib/use-session";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero }                 from "@/components/sections/home/hero";
import { AuditPipeline }        from "@/components/sections/home/audit-pipeline";
import { ExploitIntelligence }  from "@/components/sections/home/exploit-intelligence";
import { MultiChain }           from "@/components/sections/home/multi-chain";
import { GitHubIntegration }    from "@/components/sections/home/github-integration";
import { Enterprise }           from "@/components/sections/home/enterprise";
import { DashboardPreview }     from "@/components/sections/home/dashboard-preview";
import { PricingSection }       from "@/components/sections/home/pricing";
import { CTASection }           from "@/components/sections/home/cta";

export default function HomePage() {
  const { data: session } = useSession();
  const isAuthed = !!session?.user;

  return (
    <>
      <Navbar />

      <main className="relative" id="main">
        <Hero isAuthed={isAuthed} />
        <AuditPipeline />
        <ExploitIntelligence />
        <MultiChain />
        <GitHubIntegration />
        <Enterprise />
        <DashboardPreview />
        <PricingSection />
        <CTASection isAuthed={isAuthed} />
      </main>

      <Footer />
    </>
  );
}
