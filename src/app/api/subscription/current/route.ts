import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      // Return default free plan info if no userId
      const freePlan = await db.subscriptionPlan.findUnique({ where: { name: 'free' } })
      return NextResponse.json({
        success: true,
        data: {
          subscription: null,
          plan: freePlan ? { ...freePlan, features: JSON.parse(freePlan.features) } : null,
          afcBalance: 0,
          afcUsed: 0,
        },
      })
    }

    // Get the most recent active subscription
    const subscription = await db.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'past_due'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    })

    if (!subscription) {
      const freePlan = await db.subscriptionPlan.findUnique({ where: { name: 'free' } })
      return NextResponse.json({
        success: true,
        data: {
          subscription: null,
          plan: freePlan ? { ...freePlan, features: JSON.parse(freePlan.features) } : null,
          afcBalance: 0,
          afcUsed: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          ...subscription,
          plan: undefined,
        },
        plan: {
          ...subscription.plan,
          features: JSON.parse(subscription.plan.features),
        },
        afcBalance: subscription.afcBalance,
        afcUsed: subscription.afcUsed,
      },
    })
  } catch (error) {
    console.error('Failed to fetch current subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch current subscription' },
      { status: 500 }
    )
  }
}
