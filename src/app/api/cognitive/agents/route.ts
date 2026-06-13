import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const agents = await db.agentRole.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        cycles: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    })
    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, persona, capabilities } = body

    if (!name) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 })
    }

    const agent = await db.agentRole.create({
      data: {
        name,
        persona: persona || `${name}分身 - 自动化AI代理`,
        capabilities: capabilities ? JSON.stringify(capabilities) : null,
        status: 'idle',
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'cognitive',
        entityType: 'AgentRole',
        entityId: agent.id,
        details: JSON.stringify({ name }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }
}
