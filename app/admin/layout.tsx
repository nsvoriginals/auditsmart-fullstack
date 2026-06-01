// app/admin/layout.tsx — gates the entire /admin subtree on role=ADMIN.
// Non-admins are sent to /admin/forbidden (which renders a 403 view).
import { getAdminSession } from "@/lib/admin";
import { redirect } from "next/navigation";
import { AdminNav } from "./_components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminSession();
  // Forbidden page lives at /forbidden (outside this layout) so the redirect
  // doesn't get re-gated and loop forever.
  if (!admin) redirect("/forbidden");

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <AdminNav adminEmail={admin.email} />
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px 40px" }}>
        {children}
      </main>
    </div>
  );
}
