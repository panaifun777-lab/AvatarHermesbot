import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }
    if (type) {
      where.type = type
    }

    const transactions = await db.aFCTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const total = await db.aFCTransaction.count({ where })

    // Calculate summary
    const summary = await db.aFCTransaction.aggregate({
      where: { userId, status: 'confirmed' },
      _sum: { amount: true },
      _count: true,
    })

    const topUpTotal = await db.aFCTransaction.aggregate({
      where: { userId, type: 'top_up', status: 'confirmed' },
      _sum: { amount: true },
    })

    const spentTotal = await db.aFCTransaction.aggregate({
      where: { userId, type: { in: ['subscription_payment', 'skill_purchase', 'cycle_payment'] }, status: 'confirmed' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        total,
        summary: {
          totalTransactions: summary._count,
          netAmount: summary._sum.amount ?? 0,
          topUpTotal: topUpTotal._sum.amount ?? 0,
          spentTotal: Math.abs(spentTotal._sum.amount ?? 0),
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch AFC transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AFC transactions' },
      { status: 500 }
    )
  }
}
