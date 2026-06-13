import { NextRequest, NextResponse } from 'next/server'

const SWARM_PORT = 3007

export async function GET() {
  try {
    const res = await fetch(`http://127.0.0.1:${SWARM_PORT}/api/swarm/messages`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Swarm service unavailable', data: { messages: [], total: 0 } },
      { status: 503 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`http://127.0.0.1:${SWARM_PORT}/api/swarm/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Swarm service unavailable' },
      { status: 503 }
    )
  }
}
