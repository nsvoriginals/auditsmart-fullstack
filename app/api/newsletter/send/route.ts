import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewsletterEmail } from "@/lib/resend";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.NEWSLETTER_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, previewText, bodyHtml } = body as {
      subject?: string;
      previewText?: string;
      bodyHtml?: string;
    };

    if (!subject || !previewText || !bodyHtml) {
      return NextResponse.json(
        { error: "subject, previewText, and bodyHtml are required." },
        { status: 400 }
      );
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true, unsubscribeToken: true },
    });

    let sent = 0;
    for (const sub of subscribers) {
      await sendNewsletterEmail(
        sub.email,
        sub.unsubscribeToken,
        subject,
        previewText,
        bodyHtml
      );
      sent++;
      if (sent < subscribers.length) await sleep(100);
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("Newsletter send error:", error);
    return NextResponse.json(
      { error: "Failed to send newsletter." },
      { status: 500 }
    );
  }
}
