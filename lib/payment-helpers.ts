// lib/payment-helpers.ts
import crypto from 'crypto';
import { config } from './config';

/**
 * Verify Razorpay payment signature
 * This ensures the payment is authentic and not tampered with
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    
    const isValid = expectedSignature === signature;
    if (!isValid) {
      console.error(`⚠️ Signature verification FAILED for order: ${orderId}`);
    }
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * B-07: Verify Razorpay webhook signature
 * This prevents fake plan upgrade attacks
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    if (!webhookSecret) {
      console.error('⚠️ Webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(typeof payload === 'string' ? payload : payload.toString())
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);
    
    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Verify Razorpay payment signature with additional security
 * Includes order amount validation to prevent amount tampering
 */
export function verifyPaymentSignatureWithAmount(
  orderId: string,
  paymentId: string,
  signature: string,
  orderAmount: number,
  expectedAmount: number
): boolean {
  // First verify the signature
  const isValidSignature = verifyRazorpaySignature(orderId, paymentId, signature);
  
  if (!isValidSignature) {
    return false;
  }
  
  // Verify the amount matches what we expected
  if (orderAmount !== expectedAmount) {
    console.error(`⚠️ Amount mismatch: Expected ${expectedAmount}, got ${orderAmount}`);
    return false;
  }
  
  return true;
}

/**
 * Get Razorpay client instance
 */
export function getRazorpayClient() {
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
    console.error('⚠️ Razorpay credentials not configured');
    return null;
  }
  
  try {
    // Dynamic import to avoid server-side issues
    const Razorpay = require('razorpay');
    return new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
  } catch (error) {
    console.error('Failed to initialize Razorpay client:', error);
    return null;
  }
}

/**
 * Format amount for display
 */
export function formatAmount(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(
  amount: number,
  currency: string = 'INR',
  receipt: string
): Promise<any> {
  const client = getRazorpayClient();
  if (!client) {
    throw new Error('Razorpay client not initialized');
  }
  
  try {
    const order = await client.orders.create({
      amount: amount,
      currency: currency,
      receipt: receipt,
      payment_capture: 1, // Auto-capture payment
    });
    
    console.log(`✅ Order created: ${order.id} for amount ${amount}`);
    return order;
  } catch (error) {
    console.error('Failed to create Razorpay order:', error);
    throw error;
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPaymentDetails(paymentId: string): Promise<any> {
  const client = getRazorpayClient();
  if (!client) {
    throw new Error('Razorpay client not initialized');
  }
  
  try {
    const payment = await client.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error(`Failed to fetch payment ${paymentId}:`, error);
    throw error;
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
): Promise<any> {
  const client = getRazorpayClient();
  if (!client) {
    throw new Error('Razorpay client not initialized');
  }
  
  try {
    const refundParams: any = {
      payment_id: paymentId,
    };
    
    if (amount) {
      refundParams.amount = amount;
    }
    
    if (notes) {
      refundParams.notes = notes;
    }
    
    const refund = await client.refunds.create(refundParams);
    console.log(`✅ Refund created for payment: ${paymentId}`);
    return refund;
  } catch (error) {
    console.error(`Failed to refund payment ${paymentId}:`, error);
    throw error;
  }
}

/**
 * Check if webhook is from Razorpay (B-07)
 * Use this middleware in your webhook handler
 */
export function isValidRazorpayWebhook(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!signatureHeader) {
    console.error('⚠️ Missing webhook signature header');
    return false;
  }
  
  if (!webhookSecret || webhookSecret.length === 0) {
    console.error('⚠️ Webhook secret not configured');
    return false;
  }
  
  return verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
}

/**
 * Parse webhook event with validation
 */
export async function parseAndValidateWebhook(
  rawBody: Buffer,
  signature: string | null,
  webhookSecret: string
): Promise<{ valid: boolean; event: any | null }> {
  // Validate signature first
  const isValid = isValidRazorpayWebhook(rawBody, signature, webhookSecret);
  
  if (!isValid) {
    return { valid: false, event: null };
  }
  
  try {
    const event = JSON.parse(rawBody.toString());
    return { valid: true, event };
  } catch (error) {
    console.error('Failed to parse webhook body:', error);
    return { valid: false, event: null };
  }
}