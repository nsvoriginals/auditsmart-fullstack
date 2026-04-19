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
      return NextResponse.json({ detail: "Unauthorized. Please log in." }, { status: 401 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ detail: "Payment gateway not configured." }, { status: 500 });
    }

    const body = await req.json();
    const { plan_type = "deep_audit" } = body;

    if (!isPublicPlan(plan_type)) {
      return NextResponse.json({ detail: "Invalid plan type." }, { status: 400 });
    }

    const planDetail = PLAN_DETAILS[plan_type];
    const amount     = planDetail.amountInPaise;
    const receipt    = `da_${session.user.id.slice(-8)}_${Date.now().toString().slice(-8)}`;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: {
        userId:    session.user.id,
        plan_type,
        email:     session.user.email || "",
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      key_id:   process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan_type,
    });
  } catch (err) {
    console.error("deep/create-order error:", err);
    return NextResponse.json({ detail: "Payment initialization failed." }, { status: 500 });
  }
}
