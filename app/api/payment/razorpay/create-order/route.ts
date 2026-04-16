// app/api/payment/razorpay/create-order/route.ts (fixed)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_AMOUNTS: Record<string, number> = {
  pro: 290000,
  enterprise: 490000,
  deep_audit: 165000,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan, amount } = body;

    const planKey = plan || "deep_audit";
    if (!PLAN_AMOUNTS[planKey]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const resolvedAmount = amount ?? PLAN_AMOUNTS[planKey];
    const receipt = `${planKey}_${session.user.id.slice(-8)}_${Date.now().toString().slice(-8)}`;

    const order = await razorpay.orders.create({
      amount: resolvedAmount,
      currency: "INR",
      receipt,
      notes: {
        userId: session.user.id,
        plan: planKey,
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