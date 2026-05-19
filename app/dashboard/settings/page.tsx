// app/dashboard/settings/page.tsx — Server Component
import { getCachedSession } from "@/lib/session";
import { redirect } from "next/navigation";
import SettingsClient from "./_components/SettingsClient";

export default async function SettingsPage() {
  const session = await getCachedSession();
  if (!session?.user?.id) redirect("/login");

  return (
    <SettingsClient
      initialName={session.user.name || ""}
      initialEmail={session.user.email || ""}
    />
  );
}
