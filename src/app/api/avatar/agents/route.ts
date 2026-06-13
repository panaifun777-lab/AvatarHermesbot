import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/avatar/agents - List all agents for the clone
export async function GET(req: NextRequest) {
  try {
    let cloneId = req.nextUrl.searchParams.get('cloneId')

    // Auto-discover first clone if no cloneId provided
    if (!cloneId) {
      const firstClone = await db.avatarClone.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!firstClone) {
        return NextResponse.json({ agents: [] })
      }
      cloneId = firstClone.id
    }

    const agents = await db.cloneAgent.findMany({
      where: { cloneId },
      orderBy: { createdAt: 'asc' },
      include: {
        cycles: {
          orderBy: { startedAt: 'desc' },
          take: 3,
        },
        _count: {
          select: { outputs: true },
        },
      },
    })

    return NextResponse.json({ agents: agents })
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

// POST /api/avatar/agents - Add new agent to clone
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cloneId, name, role, persona, avatarUrl, config } = body

    if (!cloneId || !name || !role || !persona) {
      return NextResponse.json(
        { success: false, error: 'cloneId, name, role, and persona are required' },
        { status: 400 }
      )
    }

    // Verify clone exists
    const clone = await db.avatarClone.findUnique({ where: { id: cloneId } })
    if (!clone) {
      return NextResponse.json(
        { success: false, error: 'Avatar clone not found' },
        { status: 404 }
      )
    }

    const agent = await db.cloneAgent.create({
      data: {
        cloneId,
        name,
        role,
        persona,
        avatarUrl,
        config: config ? JSON.stringify(config) : null,
      },
    })

    // Create activity
    await db.cloneActivity.create({
      data: {
        cloneId,
        agentId: agent.id,
        activityType: 'agent_added',
        title: `新代理${name}已加入`,
        description: `角色: ${role}`,
        metadata: JSON.stringify({ role }),
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'avatar',
        entityType: 'CloneAgent',
        entityId: agent.id,
        details: JSON.stringify({ name, role }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ agent: agent }, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
