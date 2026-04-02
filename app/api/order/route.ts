// app/api/order/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check environment variables at runtime
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log("Razorpay env check:", {
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret,
      nodeEnv: process.env.NODE_ENV,
    });
    
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { 
          error: "Payment service not configured",
          details: "Missing Razorpay credentials"
        },
        { status: 500 }
      );
    }

    // Dynamically import Razorpay to avoid build-time issues
    const Razorpay = (await import("razorpay")).default;
    
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const body = await req.json();
    const order = await razorpay.orders.create({
      amount: body.amount || 50000,
      currency: body.currency || "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}