// app/api/payment/razorpay/create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { detail: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { plan_type = "deep_audit" } = body;

    // Get Razorpay client
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { detail: "Payment gateway not configured. Contact support." },
        { status: 500 }
      );
    }

    const client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Prices in paise (1 INR = 100 paise)
    const PLAN_PRICES_PAISE = {
      free: 0,
      pro: 290000,      // ₹2,900
      enterprise: 490000, // ₹4,900
      deep_audit: 165000, // ₹1,650
    };

    const amount = PLAN_PRICES_PAISE[plan_type as keyof typeof PLAN_PRICES_PAISE] || 165000;

    // Create order
    const order = await client.orders.create({
      amount: amount,
      currency: "INR",
      notes: {
        user_id: session.user.id,
        plan_type: plan_type,
        email: session.user.email || "",
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: amount,
      currency: "INR",
      key_id: process.env.RAZORPAY_KEY_ID,
      plan_type: plan_type,
    });
    
  } catch (err) {
    console.error("❌ /api/payment/razorpay/create-order error:", err);
    return NextResponse.json(
      { detail: `Payment error: ${String(err)}` },
      { status: 500 }
    );
  }
}