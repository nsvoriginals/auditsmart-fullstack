import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { NewsletterEmail } from "@/emails/NewsletterEmail";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "The Fearless <newsletter@thefearless.xyz>";

function unsubscribeUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://thefearless.xyz";
  return `${base}/api/newsletter/unsubscribe?token=${token}`;
}

export async function sendWelcomeEmail(
  email: string,
  unsubscribeToken: string
): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping welcome email");
    return;
  }
  try {
    const html = await render(
      WelcomeEmail({ unsubscribeUrl: unsubscribeUrl(unsubscribeToken) })
    );
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "You're in. Welcome to The Fearless.",
      html,
    });
  } catch (err) {
    console.error("sendWelcomeEmail error:", err);
  }
}

export async function sendNewsletterEmail(
  email: string,
  unsubscribeToken: string,
  subject: string,
  previewText: string,
  bodyHtml: string
): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping newsletter email");
    return;
  }
  try {
    const html = await render(
      NewsletterEmail({
        subject,
        previewText,
        bodyHtml,
        unsubscribeUrl: unsubscribeUrl(unsubscribeToken),
      })
    );
    await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
    });
  } catch (err) {
    console.error("sendNewsletterEmail error:", err);
  }
}
