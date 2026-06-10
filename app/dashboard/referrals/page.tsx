// app/dashboard/referrals/page.tsx — Server Component (auth gate only).
import { getCachedSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ReferralsClient from "./_components/ReferralsClient";

export const metadata = { title: "Refer & Earn · AuditSmart" };

export default async function ReferralsPage() {
  const session = await getCachedSession();
  if (!session?.user?.id) redirect("/login");

  return <ReferralsClient />;
}
