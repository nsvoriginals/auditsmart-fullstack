import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = "AuditSmart <support@auditsmart.org>";

export async function sendWelcomeEmail(email: string): Promise<void> {
  if (!resend) return;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Welcome to AuditSmart — You're on the list!",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #111;">
          <h2 style="color: #7c3aed;">Welcome to AuditSmart</h2>
          <p>Thanks for subscribing! You'll receive the latest smart contract vulnerability reports and security best practices.</p>
          <p>We'll keep you ahead of threats — no spam, unsubscribe anytime.</p>
          <br/>
          <p style="color: #555;">Stay secure,<br/><strong>The AuditSmart Team</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
          <p style="font-size: 12px; color: #999;">
            You're receiving this because you subscribed at auditsmart.io.
          </p>
        </body>
      </html>
    `,
  });
}
