// app/dashboard/settings/page.tsx — Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./_components/SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  return (
    <SettingsClient
      initialName={session.user.name || ""}
      initialEmail={session.user.email || ""}
    />
  );
}
