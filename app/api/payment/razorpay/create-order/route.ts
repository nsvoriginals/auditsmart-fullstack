// app/api/payment/razorpay/create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PLAN_DETAILS, isPublicPlan } from "@/lib/plans";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!isPublicPlan(plan) || plan === "free") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planDetail = PLAN_DETAILS[plan];
    const amount     = planDetail.amountInPaise;
    const receipt    = `${plan}_${session.user.id.slice(-8)}_${Date.now().toString().slice(-8)}`;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: {
        userId: session.user.id,
        plan,
        email: session.user.email || "",
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      key_id:   process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("create-order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 }
    );
  }
}
