import { NextResponse } from 'next/server'

const BLOCKCHAIN_PORT = '3006'

async function proxyFetch(path: string, options?: RequestInit) {
  const res = await fetch(`http://localhost:${BLOCKCHAIN_PORT}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.json()
}

// POST /api/blockchain/verify — Verify evidence on-chain
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { txHash } = body

    if (!txHash) {
      return NextResponse.json({ success: false, error: 'txHash is required' }, { status: 400 })
    }

    const result = await proxyFetch('/api/contract/verify-evidence', {
      method: 'POST',
      body: JSON.stringify({ txHash }),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[blockchain/verify] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to verify evidence' }, { status: 500 })
  }
}
