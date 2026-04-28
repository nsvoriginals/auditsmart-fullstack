import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Report",
};

// Audit reports are accessed through the dashboard
export default function ReportPage() {
  redirect("/dashboard/audit");
}
