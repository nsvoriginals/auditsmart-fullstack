// app/dashboard/layout.tsx
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userId  = (session?.user as any)?.id as string | undefined;
  const plan    = ((session?.user as any)?.plan || "FREE").toUpperCase() as string;

  // Fetch audit limits once on the server so the sidebar never needs a
  // client-side /api/user/limits round-trip on every page navigation.
  let auditsRemaining: number | null = null;
  let maxAudits = 3;

  if (userId) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const used = await prisma.audit.count({
        where: { userId, createdAt: { gte: startOfMonth } },
      });

      if (plan === "ENTERPRISE" || plan === "ADMIN") {
        auditsRemaining = null; // unlimited
        maxAudits       = 999;
      } else if (plan === "PREMIUM") {
        maxAudits       = 20;
        auditsRemaining = Math.max(0, 20 - used);
      } else {
        maxAudits       = 3;
        auditsRemaining = Math.max(0, 3 - used);
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
