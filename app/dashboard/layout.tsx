// app/dashboard/layout.tsx
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { getCachedSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getAuditCounts = unstable_cache(
  async (userId: string) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const [monthly, total] = await Promise.all([
      prisma.audit.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
      prisma.audit.count({ where: { userId } }),
    ]);
    return { monthly, total };
  },
  ["dashboard-audit-counts"],
  { revalidate: 60 }
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();
  const userId  = session?.user?.id as string | undefined;
  const plan    = (session?.user?.plan || session?.user?.role || "FREE").toUpperCase() as string;

  let auditsRemaining: number | null = null;
  let maxAudits = 3;

  if (userId) {
    try {
      const { monthly, total } = await getAuditCounts(userId);

      if (plan === "ADMIN") {
        auditsRemaining = null;
        maxAudits       = 999;
      } else if (plan === "ENTERPRISE") {
        maxAudits       = 20;
        auditsRemaining = Math.max(0, 20 - monthly);
      } else if (plan === "PREMIUM") {
        maxAudits       = 15;
        auditsRemaining = Math.max(0, 15 - monthly);
      } else {
        // FREE: lifetime limit of 3
        maxAudits       = 3;
        auditsRemaining = Math.max(0, 3 - total);
      }
    } catch {
      // Non-fatal — sidebar will show 0 as fallback
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar
        user={{
          name:           session?.user?.name,
          email:          session?.user?.email,
          plan,
          auditsRemaining: auditsRemaining ?? undefined,
          maxAudits,
        }}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardNavbar
          user={{
            name:  session?.user?.name,
            email: session?.user?.email,
            plan,
          }}
        />

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
