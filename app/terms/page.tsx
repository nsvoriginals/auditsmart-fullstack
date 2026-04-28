import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "AuditSmart terms of service — your rights and responsibilities when using our platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-24">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <FileText className="w-3 h-3" />
            Legal
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: April 28, 2025</p>
        </div>

        <div className="space-y-10 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of terms</h2>
            <p>
              By accessing or using AuditSmart (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of service</h2>
            <p>
              AuditSmart provides AI-powered smart contract security analysis. Our reports are generated
              automatically and are intended to assist developers in identifying potential vulnerabilities.
              They do not constitute a formal security audit or guarantee the absence of vulnerabilities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Eligibility</h2>
            <p>
              You must be at least 18 years old and capable of forming a legally binding contract to use
              the Service. By using AuditSmart, you represent that you meet these requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Submit contracts containing malicious code designed to exploit our systems</li>
              <li>Resell or redistribute audit reports without authorization</li>
              <li>Attempt to reverse-engineer, scrape, or automate the Service in unauthorized ways</li>
              <li>Use the Service to facilitate illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Payments and refunds</h2>
            <p>
              Paid plans are billed in advance on a monthly or annual basis. Payments are processed by Razorpay.
              All sales are final. We do not offer refunds for partial billing periods. If you believe a charge
              was made in error, contact us within 7 days at{" "}
              <a href="mailto:billing@auditsmart.org" className="text-primary underline underline-offset-2">billing@auditsmart.org</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Intellectual property</h2>
            <p>
              You retain ownership of any smart contract code you submit. By submitting code, you grant
              AuditSmart a limited license to process it solely for the purpose of generating your audit report.
              AuditSmart retains all rights to the platform, its AI models, and generated report formats.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Disclaimer of warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranty of any kind. AI-generated audit reports
              may not identify all vulnerabilities. You are responsible for conducting thorough due diligence
              before deploying any smart contract to production.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, AuditSmart shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Service, including
              losses from deployed smart contracts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Changes to terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of material changes via email.
              Continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Contact</h2>
            <p>
              Questions about these terms? Email{" "}
              <a href="mailto:legal@auditsmart.org" className="text-primary underline underline-offset-2">legal@auditsmart.org</a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
