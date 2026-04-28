import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "AuditSmart privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-24">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <Lock className="w-3 h-3" />
            Legal
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: April 28, 2025</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-10 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Information we collect</h2>
            <p>
              We collect information you provide directly to us when you create an account, submit smart contracts
              for auditing, make a purchase, or communicate with us. This includes your name, email address,
              payment information (processed by Razorpay — we do not store card numbers), and contract code
              submitted for analysis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. How we use your information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To operate and improve the AuditSmart platform</li>
              <li>To process payments and send transaction confirmations</li>
              <li>To send security reports and account notifications</li>
              <li>To communicate product updates (with your consent)</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Smart contract data</h2>
            <p>
              Contract code you submit for auditing is processed by our AI models (Anthropic Claude, Groq, Google Gemini)
              and is stored to generate your audit report. We do not share your contract code with third parties
              beyond these AI providers, and we do not use your contracts to train our own models.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data retention</h2>
            <p>
              Audit reports and associated contract code are retained for 12 months from the date of generation.
              Account data is retained for the lifetime of your account. You may request deletion of your data
              at any time by emailing <a href="mailto:privacy@auditsmart.org" className="text-primary underline underline-offset-2">privacy@auditsmart.org</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Cookies and analytics</h2>
            <p>
              We use cookies for session management and authentication. We use Vercel Analytics and Ahrefs Analytics
              to understand aggregate site usage. These tools collect anonymized data and do not track you across
              unrelated websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Third-party services</h2>
            <p>We use the following third-party services to operate the platform:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Anthropic, Groq, Google — AI model inference</li>
              <li>Razorpay — payment processing</li>
              <li>Resend — transactional email delivery</li>
              <li>Vercel — hosting and analytics</li>
              <li>Neon / PostgreSQL — database storage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Your rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct, export, or delete your
              personal data. To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@auditsmart.org" className="text-primary underline underline-offset-2">privacy@auditsmart.org</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact</h2>
            <p>
              Questions about this policy? Email{" "}
              <a href="mailto:privacy@auditsmart.org" className="text-primary underline underline-offset-2">privacy@auditsmart.org</a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
