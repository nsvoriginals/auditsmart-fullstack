// app/api/payment/razorpay/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapPublicPlanToUserPlan, isPublicPlan } from "@/lib/plans";
import crypto from "crypto";

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text(); // ⚠️ MUST use .text() not .json()
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error("❌ Webhook: Missing signature or secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error("❌ Webhook: Invalid signature");
      
      // Log attempt
      await prisma.auditLog.create({
        data: {
          userId: "system",
          action: "WEBHOOK_SIGNATURE_FAILED",
          details: `IP: ${req.headers.get("x-forwarded-for")}`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      }).catch(() => {});
      
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log(`📦 Webhook received: ${event.event}`);

    // Handle different event types
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
        
      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;
        
      case "subscription.charged":
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;
        
      case "subscription.cancelled":
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
        
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handlePaymentCaptured(payment: any) {
  const { order_id, id: payment_id, notes, amount } = payment;
  
  // Check if already processed
  const existing = await prisma.payment.findFirst({
    where: { razorpayOrderId: order_id },
  });

  if (existing?.status === "paid") {
    console.log(`⚠️ Payment ${order_id} already processed`);
    return;
  }

  const userId = notes?.userId;
  const plan   = notes?.plan;

  if (!userId || !plan) {
    console.error(`❌ Missing userId or plan in notes for order ${order_id}`);
    return;
  }

  const userRole = isPublicPlan(plan) ? mapPublicPlanToUserPlan(plan) : "PREMIUM";
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Update everything in a transaction
  await prisma.$transaction([
    // Update/create subscription
    prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: userRole,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd,
        razorpaySubscriptionId: order_id,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        plan: userRole,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd,
        razorpaySubscriptionId: order_id,
      },
    }),
    
    // Update user role
    prisma.user.update({
      where: { id: userId },
      data: { role: userRole },
    }),
    
    // Record payment
    prisma.payment.upsert({
      where: { razorpayOrderId: order_id },
      update: {
        razorpayPaymentId: payment_id,
        status: "paid",
      },
      create: {
        userId,
        razorpayOrderId: order_id,
        razorpayPaymentId: payment_id,
        amount: amount,
        currency: "INR",
        status: "paid",
        plan: userRole,
      },
    }),
    
    // Log success
    prisma.auditLog.create({
      data: {
        userId,
        action: "WEBHOOK_PAYMENT_SUCCESS",
        details: `Order: ${order_id}, Plan: ${plan}, Amount: ₹${(amount/100).toFixed(2)} INR`,
      },
    }),
  ]);

  console.log(`✅ Webhook processed payment for user ${userId}`);
}

async function handlePaymentFailed(payment: any) {
  const { order_id, notes } = payment;
  const userId = notes?.userId;
  
  await prisma.payment.updateMany({
    where: { razorpayOrderId: order_id },
    data: { status: "failed" },
  });

  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "WEBHOOK_PAYMENT_FAILED",
        details: `Order: ${order_id}`,
      },
    });
  }
  
  console.log(`❌ Payment failed for order ${order_id}`);
}

async function handleSubscriptionCharged(subscription: any) {
  // Handle recurring payments if you implement subscriptions
  console.log(`💰 Subscription charged: ${subscription.id}`);
}

async function handleSubscriptionCancelled(subscription: any) {
  const { notes } = subscription;
  const userId = notes?.userId;
  
  if (userId) {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { userId },
        data: { status: "CANCELLED" },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: "FREE" },
      }),
    ]);
    
    console.log(`🛑 Subscription cancelled for user ${userId}`);
  }
}

// Razorpay sends a GET request to verify webhook URL
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "Webhook endpoint active" });
}