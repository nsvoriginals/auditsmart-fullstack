// app/api/payment/razorpay/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_DETAILS, mapPublicPlanToUserPlan, isPublicPlan } from "@/lib/plans";
import crypto from "crypto";

// B-07: Verify Razorpay signature
function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate plan is valid
    if (!isPublicPlan(plan) || plan === "free") {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // B-07: Verify signature with timing-safe comparison
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET!
    );

    if (!isValid) {
      console.error(`⚠️ Invalid payment signature for order: ${razorpay_order_id}, user: ${session.user.id}`);
      
      // Log failed attempt to AuditLog table (using details as string, not JSON)
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "PAYMENT_VERIFICATION_FAILED",
            details: `OrderId: ${razorpay_order_id}, Plan: ${plan}, Timestamp: ${new Date().toISOString()}`,
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
          },
        });
      } catch (logError) {
        console.error("Failed to log audit:", logError);
      }
      
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Check if payment already processed (prevent double processing)
    const existingPayment = await prisma.payment.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (existingPayment) {
      console.log(`⚠️ Duplicate payment attempt for order: ${razorpay_order_id}`);
      return NextResponse.json(
        { error: "Payment already processed" },
        { status: 409 }
      );
    }

    // Get plan details from single source of truth
    const planDetails = PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS];
    const userRole = mapPublicPlanToUserPlan(plan as any);
    const amount = planDetails.amountInPaise;

    // Calculate subscription end date
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: userRole,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: currentPeriodEnd,
        razorpaySubscriptionId: razorpay_order_id,
      },
      create: {
        userId: session.user.id,
        plan: userRole,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: currentPeriodEnd,
        razorpaySubscriptionId: razorpay_order_id,
      },
    });

    // Update user's role
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: userRole },
    });

    // Record payment
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: amount,
        currency: "INR",
        status: "paid",
        plan: userRole,
      },
    });

    // Log successful upgrade
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PAYMENT_SUCCESS",
        details: `Plan: ${plan}, Amount: ${amount}, OrderId: ${razorpay_order_id}`,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    }).catch(() => {});

    console.log(`✅ Payment verified: ${razorpay_payment_id} | User: ${session.user.id} | Plan: ${plan}`);

    // Return updated user data for session refresh
    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}