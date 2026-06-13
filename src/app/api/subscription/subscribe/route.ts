import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planId, paymentMethod = 'afc_base', walletAddress } = body

    if (!userId || !planId) {
      return NextResponse.json(
        { success: false, error: 'userId and planId are required' },
        { status: 400 }
      )
    }

    // Get the plan
    const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Free plan doesn't need payment
    if (plan.name === 'free') {
      // Deactivate any existing subscription
      await db.userSubscription.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'cancelled' },
      })

      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      const subscription = await db.userSubscription.create({
        data: {
          userId,
          planId: plan.id,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          afcBalance: 0,
          afcUsed: 0,
          paymentMethod,
          walletAddress,
          autoRenew: true,
        },
        include: { plan: true },
      })

      // Update user plan
      await db.user.update({
        where: { id: userId },
        data: { plan: 'free' },
      })

      return NextResponse.json({
        success: true,
        data: {
          subscription,
          message: '已切换到免费版',
        },
      })
    }

    // For paid plans, check AFC balance or handle payment
    const existingSub = await db.userSubscription.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

    const currentBalance = existingSub?.afcBalance ?? 0

    if (paymentMethod === 'afc_base' && currentBalance < plan.priceAFC) {
      return NextResponse.json(
        { success: false, error: `AFC余额不足。需要 ${plan.priceAFC} AFC，当前余额 ${currentBalance} AFC` },
        { status: 400 }
      )
    }

    // Call blockchain service for on-chain tx (simulated)
    let txHash: string | null = null
    try {
      const blockchainRes = await fetch(
        `http://localhost:3006/api/contract/settle-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: `subscription_${plan.name}`,
            amount: plan.priceAFC,
            token: 'AFC',
            recipient: '0xAFC_Payment_Contract000000000000000000000',
          }),
        }
      )
      const blockchainData = await blockchainRes.json()
      if (blockchainData.success) {
        txHash = blockchainData.data.txHash
      }
    } catch {
      // Blockchain service unavailable, still proceed with off-chain record
      console.warn('Blockchain service unavailable, recording off-chain')
    }

    // Deactivate existing subscription
    await db.userSubscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled' },
    })

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    // Create new subscription with deducted balance
    const newBalance = paymentMethod === 'afc_base' ? currentBalance - plan.priceAFC : 0
    const subscription = await db.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        afcBalance: newBalance,
        afcUsed: paymentMethod === 'afc_base' ? plan.priceAFC : 0,
        paymentMethod,
        walletAddress,
        autoRenew: true,
      },
      include: { plan: true },
    })

    // Create AFC transaction record (debit)
    await db.aFCTransaction.create({
      data: {
        userId,
        type: 'subscription_payment',
        amount: -plan.priceAFC,
        txHash,
        status: txHash ? 'confirmed' : 'pending',
        description: `订阅${plan.displayName} - ${plan.priceAFC} AFC/月`,
        metadata: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          paymentMethod,
          periodStart: now.toISOString(),
          periodEnd: periodEnd.toISOString(),
        }),
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'subscribe',
        module: 'subscription',
        entityType: 'UserSubscription',
        entityId: subscription.id,
        details: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          priceAFC: plan.priceAFC,
          paymentMethod,
          txHash,
        }),
        performedBy: userId,
      },
    })

    // Update user plan
    await db.user.update({
      where: { id: userId },
      data: { plan: plan.name === 'starter' ? 'starter' : plan.name === 'pro' ? 'pro' : plan.name },
    })

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          ...subscription,
          plan: {
            ...subscription.plan,
            features: JSON.parse(subscription.plan.features),
          },
        },
        txHash,
        message: `已成功订阅${plan.displayName}`,
      },
    })
  } catch (error) {
    console.error('Failed to subscribe:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}
