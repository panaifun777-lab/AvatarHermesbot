import { NextResponse } from 'next/server'

const BLOCKCHAIN_PORT = '3006'

async function proxyFetch(path: string, options?: RequestInit) {
  const res = await fetch(`http://localhost:${BLOCKCHAIN_PORT}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.json()
}

// GET /api/blockchain/wallet — Get wallet status
export async function GET() {
  try {
    const data = await proxyFetch('/api/wallet/status')
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ success: false, error: 'Blockchain service unavailable' }, { status: 502 })
  }
}

// POST /api/blockchain/wallet — Connect wallet
export async function POST() {
  try {
    const data = await proxyFetch('/api/wallet/connect', { method: 'POST', body: JSON.stringify({}) })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ success: false, error: 'Blockchain service unavailable' }, { status: 502 })
  }
}
