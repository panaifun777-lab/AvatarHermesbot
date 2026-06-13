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

// POST /api/blockchain/anchor — Anchor evidence on-chain
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { evidenceId, contentHash, metadata } = body

    if (!evidenceId) {
      return NextResponse.json({ success: false, error: 'evidenceId is required' }, { status: 400 })
    }

    // Call blockchain service
    const result = await proxyFetch('/api/contract/anchor-evidence', {
      method: 'POST',
      body: JSON.stringify({ evidenceId, contentHash: contentHash || `0x${evidenceId}`, metadata }),
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    // Update evidence status to 'onchain' in DB
    const updatedEvidence = await db.evidenceItem.update({
      where: { id: evidenceId },
      data: {
        status: 'onchain',
        chainTxHash: result.data.txHash,
        updatedAt: new Date(),
      },
    })

    // Create OnChainTransaction record
    await db.onChainTransaction.create({
      data: {
        txHash: result.data.txHash,
        txType: 'anchor_evidence',
        status: 'confirmed',
        blockNumber: result.data.blockNumber,
        gasUsed: result.data.gasUsed,
        fromAddress: result.data.fromAddress,
        toAddress: result.data.toAddress,
        entityId: evidenceId,
        metadata: JSON.stringify({ contentHash: result.data.contentHash, anchorTimestamp: result.data.anchorTimestamp }),
      },
    })

    // Write audit log
    await db.auditLog.create({
      data: {
        action: 'anchor_evidence',
        module: 'evidence',
        entityType: 'EvidenceItem',
        entityId: evidenceId,
        details: JSON.stringify({ txHash: result.data.txHash, blockNumber: result.data.blockNumber, gasUsed: result.data.gasUsed }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        evidence: updatedEvidence,
      },
    })
  } catch (error) {
    console.error('[blockchain/anchor] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to anchor evidence' }, { status: 500 })
  }
}
