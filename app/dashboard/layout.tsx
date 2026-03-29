// src/app/dashboard/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="flex" style={{ minHeight: `calc(100vh - var(--nav-height))` }}>
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}