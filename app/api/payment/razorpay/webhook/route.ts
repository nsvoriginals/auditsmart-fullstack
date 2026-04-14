// In your /api/payment/razorpay/webhook/route.ts
import { parseAndValidateWebhook } from '@/lib/payment-helpers';

export async function POST(req: Request) {
  const signature = req.headers.get('x-razorpay-signature');
  const rawBody = await req.arrayBuffer();
  const buffer = Buffer.from(rawBody);
  
  const { valid, event } = await parseAndValidateWebhook(
    buffer,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET || ''
  );
  
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }
  
  // Process the webhook event (payment captured, subscription updated, etc.)
  // ...
}