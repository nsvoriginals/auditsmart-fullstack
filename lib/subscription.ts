// lib/subscription.ts
import { prisma } from './prisma';
import { PLAN_PRICES_PAISE } from './config';
import { PLAN_LIMITS } from './plans';
import { UserRole } from '@prisma/client';

export type SubscriptionPlan = UserRole;

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

    const planKey = plan.toLowerCase() as keyof typeof PLAN_PRICES_PAISE;
    const amount = PLAN_PRICES_PAISE[planKey] || 0;

    if (existingSubscription) {
      const updated = await prisma.subscription.update({
        where: { userId },
        data: {
          plan,
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
          amount,
          currency: 'INR',
          status: 'completed',
          plan,
        },
      });

      return { success: true, subscription: updated };
    } else {
      const newSubscription = await prisma.subscription.create({
        data: {
          userId,
          plan,
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
          amount,
          currency: 'INR',
          status: 'completed',
          plan,
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

/**
 * FIX: Was hardcoded to `>= 3` which contradicts PLAN_LIMITS.FREE = 10.
 * Now reads directly from PLAN_LIMITS so a single source of truth controls
 * the free-tier cap. Also counts all-time audits for FREE (lifetime limit),
 * not just this month.
 */
export async function checkFreeTierLimit(userId: string): Promise<boolean> {
  const freeLimit = PLAN_LIMITS.FREE; // 10 — single source of truth

  const totalAudits = await prisma.audit.count({
    where: { userId },
  });

  return totalAudits >= freeLimit;
}

/**
 * Generic limit checker for any plan — use this for non-FREE plans
 * where the limit resets monthly.
 */
export async function checkMonthlyAuditLimit(
  userId: string,
  planLimit: number
): Promise<{ exceeded: boolean; used: number; limit: number }> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const used = await prisma.audit.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  });

  return { exceeded: used >= planLimit, used, limit: planLimit };
}