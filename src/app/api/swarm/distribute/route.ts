import { NextResponse } from 'next/server'

const SWARM_PORT = 3007

export async function POST() {
  try {
    const res = await fetch(`http://127.0.0.1:${SWARM_PORT}/api/swarm/distribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
