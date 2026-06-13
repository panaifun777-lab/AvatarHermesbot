import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, paymentMethod = 'afc_base' } = body

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'userId and positive amount are required' },
        { status: 400 }
      )
    }

    // Validate payment method
    const validMethods = ['afc_base', 'usdt_base', 'usdc_base', 'credit_card']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      )
    }

    // For blockchain payments, call blockchain service
    let txHash: string | null = null
    let paymentAddress: string | null = null

    if (paymentMethod === 'afc_base' || paymentMethod === 'usdt_base' || paymentMethod === 'usdc_base') {
      try {
        // Connect wallet first if needed
        const walletRes = await fetch('http://localhost:3006/api/wallet/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        const walletData = await walletRes.json()
        if (walletData.success) {
          paymentAddress = walletData.data.address
        }

        // Simulate on-chain payment
        const tokenSymbol = paymentMethod === 'afc_base' ? 'AFC' : paymentMethod === 'usdt_base' ? 'USDT' : 'USDC'
        const blockchainRes = await fetch('http://localhost:3006/api/contract/settle-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: `afc_topup_${Date.now()}`,
            amount: paymentMethod === 'afc_base' ? amount : amount / 10, // Convert USDT to AFC at 0.1 USDT/AFC
            token: tokenSymbol,
          }),
        })
        const blockchainData = await blockchainRes.json()
        if (blockchainData.success) {
          txHash = blockchainData.data.txHash
        }
      } catch {
        console.warn('Blockchain service unavailable for top-up')
      }
    }

    // Create AFC transaction (credit)
    const afcAmount = paymentMethod === 'afc_base' ? amount : Math.floor(amount / 10) // 1 AFC = 0.1 USDT
    const transaction = await db.aFCTransaction.create({
      data: {
        userId,
        type: 'top_up',
        amount: afcAmount,
        txHash,
        status: txHash ? 'confirmed' : 'pending',
        description: `充值 ${afcAmount} AFC via ${paymentMethod === 'afc_base' ? 'AFC on Base' : paymentMethod === 'usdt_base' ? 'USDT on Base' : paymentMethod === 'usdc_base' ? 'USDC on Base' : 'Credit Card'}`,
        metadata: JSON.stringify({
          paymentMethod,
          originalAmount: amount,
          afcAmount,
          paymentAddress,
          rate: '1 AFC = 0.1 USDT',
        }),
      },
    })

    // Update user's subscription AFC balance
    const existingSub = await db.userSubscription.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

    if (existingSub) {
      await db.userSubscription.update({
        where: { id: existingSub.id },
        data: {
          afcBalance: { increment: afcAmount },
        },
      })
    } else {
      // Create a free subscription if none exists
      const freePlan = await db.subscriptionPlan.findUnique({ where: { name: 'free' } })
      if (freePlan) {
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + 1)
        await db.userSubscription.create({
          data: {
            userId,
            planId: freePlan.id,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            afcBalance: afcAmount,
            afcUsed: 0,
            paymentMethod,
            autoRenew: true,
          },
        })
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'top_up',
        module: 'subscription',
        entityType: 'AFCTransaction',
        entityId: transaction.id,
        details: JSON.stringify({
          amount: afcAmount,
          paymentMethod,
          txHash,
        }),
        performedBy: userId,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        newBalance: (existingSub?.afcBalance ?? 0) + afcAmount,
        paymentAddress,
        txHash,
        message: `成功充值 ${afcAmount} AFC`,
      },
    })
  } catch (error) {
    console.error('Failed to top up AFC:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process AFC top-up' },
      { status: 500 }
    )
  }
}
