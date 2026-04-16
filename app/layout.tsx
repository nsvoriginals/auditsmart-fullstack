// src/app/layout.tsx
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/providers/theme-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "AuditSmart — AI Smart Contract Security",
    template: "%s | AuditSmart",
  },
  description:
    "Production-grade smart contract auditing powered by Claude Opus, Groq, and Gemini. Find vulnerabilities before attackers do.",
  keywords: ["smart contract audit", "solidity security", "DeFi security", "blockchain audit", "AI security"],
  authors: [{ name: "AuditSmart", url: "https://auditsmart.io" }],
  creator: "AuditSmart",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AuditSmart — AI Smart Contract Security",
    description: "Find vulnerabilities before attackers do with our AI-powered security audit platform.",
    type: "website",
    url: "https://auditsmart.io",
    siteName: "AuditSmart",
    images: [{ url: "https://auditsmart.io/og-image.png", width: 1200, height: 630, alt: "AuditSmart" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuditSmart — AI Smart Contract Security",
    description: "Production-grade smart contract auditing powered by AI",
    images: ["https://auditsmart.io/twitter-image.png"],
    creator: "@auditsmart1",
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Pre-fetch session on the server so SessionProvider populates its cache
  // immediately — eliminates the client-side GET /api/auth/session round-trip
  // that was causing the ~3s blank-page delay on every navigation.
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Syne + DM Mono from Google — Satoshi loaded via @font-face in globals.css */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0c0c0e" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f5f5f7" media="(prefers-color-scheme: light)" />
        <meta name="color-scheme" content="dark light" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.razorpay.com" />
      </head>
      <body style={{ fontFamily: "'Satoshi', 'Outfit', sans-serif" }}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers session={session}>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontFamily: "'Satoshi', sans-serif",
                  fontSize: "13px",
                },
                success: { iconTheme: { primary: "var(--success)", secondary: "var(--background)" } },
                error:   { iconTheme: { primary: "var(--destructive)", secondary: "var(--background)" } },
              }}
            />
            {process.env.NODE_ENV === "production" && (
              <>
                <SpeedInsights />
                <Analytics />
              </>
            )}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}