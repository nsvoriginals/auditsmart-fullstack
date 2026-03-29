// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./provider";
export const metadata: Metadata = {
  title: "AuditSmart — AI Smart Contract Security",
  description: "Production-grade smart contract auditing powered by Claude Opus, Groq, and Gemini. Find vulnerabilities before attackers do.",
  keywords: "smart contract audit, solidity security, DeFi security, blockchain audit",
  openGraph: {
    title: "AuditSmart — AI Smart Contract Security",
    description: "Find vulnerabilities before attackers do.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}