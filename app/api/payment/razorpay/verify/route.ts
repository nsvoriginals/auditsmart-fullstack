// app/api/payment/razorpay/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

    // Verify signature
    const bodyData = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(bodyData)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Map plan to UserRole
    let userRole = "FREE";
    let amount = 0;
    
    if (plan === "pro") {
      userRole = "PREMIUM";
      amount = 299900;
    } else if (plan === "enterprise") {
      userRole = "ENTERPRISE";
      amount = 499900;
    } else if (plan === "deep_audit") {
      userRole = "PREMIUM";
      amount = 165000;
    }

    // Update subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: userRole as any,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        razorpaySubscriptionId: razorpay_order_id,
      },
      create: {
        userId: session.user.id,
        plan: userRole as any,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        razorpaySubscriptionId: razorpay_order_id,
      },
    });

    // Update user's role
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: userRole as any },
    });

    // Record payment
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: amount,
        currency: "INR",
        status: "completed",
        plan: userRole as any,
      },
    });

    // ✅ Return updated user data for session refresh
    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${userRole} plan`,
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