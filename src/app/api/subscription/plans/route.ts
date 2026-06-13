import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const plans = await db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceAFC: 'asc' },
      include: {
        _count: { select: { subscriptions: true } },
      },
    })

    const plansWithFeatures = plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features),
      subscriberCount: plan._count.subscriptions,
      _count: undefined,
    }))

    return NextResponse.json({ success: true, data: { plans: plansWithFeatures } })
  } catch (error) {
    console.error('Failed to fetch subscription plans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}
