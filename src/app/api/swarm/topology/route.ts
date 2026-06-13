import { NextResponse } from 'next/server'

const SWARM_PORT = 3007

export async function GET() {
  try {
    const res = await fetch(`http://127.0.0.1:${SWARM_PORT}/api/swarm/topology`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Swarm service unavailable', data: { topology: null } },
      { status: 503 }
    )
  }
}
