import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const BLOCKCHAIN_PORT = '3006'

async function proxyFetch(path: string, options?: RequestInit) {
  const res = await fetch(`http://localhost:${BLOCKCHAIN_PORT}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.json()
}

// POST /api/blockchain/settle — Settle payment on-chain
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { taskId, amount, token, recipient, paymentId } = body

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId is required' }, { status: 400 })
    }

    // Call blockchain service
    const result = await proxyFetch('/api/contract/settle-payment', {
      method: 'POST',
      body: JSON.stringify({ taskId, amount, token, recipient }),
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    // Update payment record in DB if paymentId provided
    if (paymentId) {
      await db.paymentRecord.update({
        where: { id: paymentId },
        data: {
          txHash: result.data.txHash,
          status: 'confirmed',
        },
      })
    }

    // Create OnChainTransaction record
    await db.onChainTransaction.create({
      data: {
        txHash: result.data.txHash,
        txType: 'settle_payment',
        status: 'confirmed',
        blockNumber: result.data.blockNumber,
        gasUsed: result.data.gasUsed,
        fromAddress: result.data.fromAddress,
        toAddress: result.data.toAddress,
        entityId: paymentId || taskId,
        metadata: JSON.stringify({ taskId, amount, token, recipient }),
      },
    })

    // Write audit log
    await db.auditLog.create({
      data: {
        action: 'settle_payment',
        module: 'collaboration',
        entityType: 'PaymentRecord',
        entityId: paymentId || taskId,
        details: JSON.stringify({ txHash: result.data.txHash, blockNumber: result.data.blockNumber, amount, token }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('[blockchain/settle] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to settle payment' }, { status: 500 })
  }
}
