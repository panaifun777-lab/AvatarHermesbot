import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/agent-api/endpoints/[id] - Get single endpoint
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const endpoint = await db.agentAPIEndpoint.findUnique({ where: { id } })
    if (!endpoint) {
      return NextResponse.json({ error: 'Agent API endpoint not found' }, { status: 404 })
    }
    return NextResponse.json({ endpoint })
  } catch (error) {
    console.error('Failed to fetch agent API endpoint:', error)
    return NextResponse.json({ error: 'Failed to fetch agent API endpoint' }, { status: 500 })
  }
}

// PUT /api/agent-api/endpoints/[id] - Update an endpoint
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const allowedFields = [
      'name', 'path', 'method', 'description', 'requestSchema', 'responseSchema',
      'authRequired', 'rateLimit', 'status', 'callCount', 'lastCalledAt',
    ]
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'lastCalledAt' && typeof body[key] === 'string') {
          data[key] = new Date(body[key])
        } else {
          data[key] = body[key]
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const endpoint = await db.agentAPIEndpoint.update({ where: { id }, data })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'agent-api',
        entityType: 'AgentAPIEndpoint',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ endpoint })
  } catch (error) {
    console.error('Failed to update agent API endpoint:', error)
    return NextResponse.json({ error: 'Failed to update agent API endpoint' }, { status: 500 })
  }
}

// DELETE /api/agent-api/endpoints/[id] - Delete an endpoint
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.agentAPIEndpoint.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'agent-api',
        entityType: 'AgentAPIEndpoint',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete agent API endpoint:', error)
    return NextResponse.json({ error: 'Failed to delete agent API endpoint' }, { status: 500 })
  }
}
