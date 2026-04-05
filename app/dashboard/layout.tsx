// app/dashboard/layout.tsx
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardNavbar
          user={{
            name:  session?.user?.name,
            email: session?.user?.email,
            // @ts-ignore — plan is on extended session
            plan:  session?.user?.plan,
          }}
        />

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "var(--background)" }}
        >
          <div className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}