// app/api/payment/razorpay/create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan, amount } = body;

    // Validate plan
    const validPlans = ["pro", "enterprise", "deep_audit"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // ✅ FIX: Create a short receipt (max 40 characters)
    // Format: {plan}_{userId.slice(0,8)}_{timestamp.slice(-8)}
    const shortUserId = session.user.id.slice(-8);
    const shortTimestamp = Date.now().toString().slice(-8);
    const receipt = `${plan}_${shortUserId}_${shortTimestamp}`;
    
    console.log("Creating order with receipt:", receipt); // Should be ~25-35 chars

    // Create order
    const order = await razorpay.orders.create({
      amount: amount, // Already in paise
      currency: "INR",
      receipt: receipt,
      notes: {
        userId: session.user.id,
        plan: plan,
        email: session.user.email || "",
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 }
    );
  }
}