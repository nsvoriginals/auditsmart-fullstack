import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Help",
};

// Canonical help content lives at /support — redirect to avoid duplicate pages
export default function HelpPage() {
  redirect("/support");
}
