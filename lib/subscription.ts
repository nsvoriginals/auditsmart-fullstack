// lib/subscription.ts
import { prisma } from './prisma';
import { PLAN_PRICES_PAISE } from './config';

export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE' | 'DEEP_AUDIT';

interface ActivateSubscriptionParams {
  userId: string;
  plan: SubscriptionPlan;
  paymentId: string;
  orderId: string;
}

/**
 * Activate or upgrade a user's subscription after successful payment
 */
export async function activateSubscription({
  userId,
  plan,
  paymentId,
  orderId,
}: ActivateSubscriptionParams) {
  try {
    // Calculate subscription end date (30 days from now)
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSubscription) {
      // Update existing subscription
      const updated = await prisma.subscription.update({
        where: { userId },
        data: {
          plan: plan,
          status: 'ACTIVE',
          currentPeriodEnd,
          razorpaySubscriptionId: orderId,
        },
      });
      
      // Record the payment
      await prisma.payment.create({
        data: {
          userId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          amount: PLAN_PRICES_PAISE[plan.toLowerCase() as keyof typeof PLAN_PRICES_PAISE] || 0,
          currency: 'INR',
          status: 'completed',
          plan: plan,
        },
      });
      
      return { success: true, subscription: updated };
    } else {
      // Create new subscription
      const newSubscription = await prisma.subscription.create({
        data: {
          userId,
          plan: plan,
          status: 'ACTIVE',
          currentPeriodEnd,
          razorpaySubscriptionId: orderId,
        },
      });
      
      // Record the payment
      await prisma.payment.create({
        data: {
          userId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          amount: PLAN_PRICES_PAISE[plan.toLowerCase() as keyof typeof PLAN_PRICES_PAISE] || 0,
          currency: 'INR',
          status: 'completed',
          plan: plan,
        },
      });
      
      return { success: true, subscription: newSubscription };
    }
  } catch (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    
    return subscription || { plan: 'FREE', status: 'ACTIVE' };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { plan: 'FREE', status: 'ACTIVE' };
  }
}

/**
 * Check if user has reached free tier limit
 */
export async function checkFreeTierLimit(userId: string): Promise<boolean> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const auditsThisMonth = await prisma.audit.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  });
  
  return auditsThisMonth >= 3;
}