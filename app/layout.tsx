// src/app/layout.tsx
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/providers/theme-provider";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "AuditSmart — AI Smart Contract Security",
    template: "%s | AuditSmart"
  },
  description: "Production-grade smart contract auditing powered by Claude Opus, Groq, and Gemini. Find vulnerabilities before attackers do.",
  keywords: ["smart contract audit", "solidity security", "DeFi security", "blockchain audit", "AI security", "Claude Opus"],
  authors: [{ name: "AuditSmart", url: "https://auditsmart.io" }],
  creator: "AuditSmart",
  publisher: "AuditSmart",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "AuditSmart — AI Smart Contract Security",
    description: "Find vulnerabilities before attackers do with our AI-powered security audit platform.",
    type: "website",
    url: "https://auditsmart.io",
    siteName: "AuditSmart",
    images: [
      {
        url: "https://auditsmart.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "AuditSmart - AI Smart Contract Security",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuditSmart — AI Smart Contract Security",
    description: "Production-grade smart contract auditing powered by AI",
    images: ["https://auditsmart.io/twitter-image.png"],
    creator: "@auditsmart",
    site: "@auditsmart",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  category: "technology",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Preload Amiamie font */}
        <link 
          rel="preload" 
          href="/fonts/Amiamie-Regular.ttf" 
          as="font" 
          type="font/ttf" 
          crossOrigin="anonymous"
        />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#0F0E47" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="color-scheme" content="dark light" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* DNS prefetch */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://api.razorpay.com" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                },
                success: {
                  iconTheme: {
                    primary: "#10b981",
                    secondary: "var(--background)",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "var(--background)",
                  },
                },
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