import { NextResponse } from 'next/server'

const SWARM_PORT = 3007

export async function GET() {
  try {
    const res = await fetch(`http://127.0.0.1:${SWARM_PORT}/api/swarm/status`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Swarm service unavailable', data: { initialized: false, agentCount: 0, taskStats: { pending: 0, assigned: 0, inProgress: 0, completed: 0 }, avgWorkload: 0, messageCount: 0 } },
      { status: 503 }
    )
  }
}
