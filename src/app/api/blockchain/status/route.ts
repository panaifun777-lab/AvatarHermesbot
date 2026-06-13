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

// GET /api/blockchain/status — Get network status, wallet info, and recent transactions
export async function GET() {
  try {
    const [networkData, walletData, contractsData] = await Promise.all([
      proxyFetch('/api/network'),
      proxyFetch('/api/wallet/status'),
      proxyFetch('/api/contracts'),
    ])

    // Get recent on-chain transactions from DB
    const recentTxs = await db.onChainTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        network: networkData.success ? networkData.data : null,
        wallet: walletData.success ? walletData.data : null,
        contracts: contractsData.success ? contractsData.data : null,
        recentTransactions: recentTxs,
      },
    })
  } catch (error) {
    console.error('[blockchain/status] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get blockchain status' }, { status: 500 })
  }
}
