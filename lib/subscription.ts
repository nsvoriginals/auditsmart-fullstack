// lib/subscription.ts
import { prisma } from './prisma';
import { PLAN_PRICES_PAISE } from './config';
import { UserRole } from '@prisma/client'; // Import the enum

export type SubscriptionPlan = UserRole; // Use the Prisma enum type

interface ActivateSubscriptionParams {
  userId: string;
  plan: SubscriptionPlan;
  paymentId: string;
  orderId: string;
}

export async function activateSubscription({
  userId,
  plan,
  paymentId,
  orderId,
}: ActivateSubscriptionParams) {
  try {
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    // Get price based on plan
    const planKey = plan.toLowerCase() as keyof typeof PLAN_PRICES_PAISE;
    const amount = PLAN_PRICES_PAISE[planKey] || 0;

    if (existingSubscription) {
      const updated = await prisma.subscription.update({
        where: { userId },
        data: {
          plan: plan, // Now this matches the UserRole enum
          status: 'ACTIVE',
          currentPeriodEnd,
          razorpaySubscriptionId: orderId,
        },
      });
      
      await prisma.payment.create({
        data: {
          userId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          amount: amount,
          currency: 'INR',
          status: 'completed',
          plan: plan,
        },
      });
      
      return { success: true, subscription: updated };
    } else {
      const newSubscription = await prisma.subscription.create({
        data: {
          userId,
          plan: plan,
          status: 'ACTIVE',
          currentPeriodEnd,
          razorpaySubscriptionId: orderId,
        },
      });
      
      await prisma.payment.create({
        data: {
          userId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          amount: amount,
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

export async function getUserSubscription(userId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    
    return subscription || { plan: UserRole.FREE, status: 'ACTIVE' };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { plan: UserRole.FREE, status: 'ACTIVE' };
  }
}

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