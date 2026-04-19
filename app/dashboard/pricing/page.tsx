// app/dashboard/pricing/page.tsx
// Redirects to the unified billing page — pricing is now inline there.
import { redirect } from "next/navigation";

export default function DashboardPricingRedirect() {
  redirect("/dashboard/billing");
}
