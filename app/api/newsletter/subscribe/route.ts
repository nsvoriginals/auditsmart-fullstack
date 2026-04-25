import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/resend";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ success: true, message: "You're already subscribed!" });
      }
      // Re-activate if previously unsubscribed
      const updated = await prisma.newsletterSubscriber.update({
        where: { email },
        data: { isActive: true, subscribedAt: new Date() },
      });
      sendWelcomeEmail(email, updated.unsubscribeToken).catch((err) =>
        console.error("Welcome email failed:", err)
      );
      return NextResponse.json({
        success: true,
        message: "Welcome back! Check your inbox.",
      });
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email,
        unsubscribeToken: crypto.randomUUID(),
      },
    });

    sendWelcomeEmail(email, subscriber.unsubscribeToken).catch((err) =>
      console.error("Welcome email failed:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully! Check your inbox.",
    });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
