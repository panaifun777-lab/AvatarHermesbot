import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/avatar/outputs - List agent outputs
export async function GET(req: NextRequest) {
  try {
    let cloneId = req.nextUrl.searchParams.get('cloneId')
    const agentId = req.nextUrl.searchParams.get('agentId')
    const outputType = req.nextUrl.searchParams.get('outputType')
    const status = req.nextUrl.searchParams.get('status')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

    // Auto-discover first clone if no cloneId provided
    if (!cloneId) {
      const firstClone = await db.avatarClone.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!firstClone) {
        return NextResponse.json({ outputs: [], pagination: { total: 0, limit, offset } })
      }
      cloneId = firstClone.id
    }

    // Get agent IDs for this clone
    const agents = await db.cloneAgent.findMany({
      where: { cloneId },
      select: { id: true },
    })
    const agentIds = agents.map((a) => a.id)

    // If specific agentId provided, verify it belongs to this clone
    if (agentId && !agentIds.includes(agentId)) {
      return NextResponse.json(
        { success: false, error: 'Agent does not belong to this clone' },
        { status: 403 }
      )
    }

    const where: Record<string, unknown> = {}
    if (agentId) {
      where.agentId = agentId
    } else {
      where.agentId = { in: agentIds }
    }
    if (outputType) where.outputType = outputType
    if (status) where.status = status

    const [outputs, total] = await Promise.all([
      db.agentOutput.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
        include: {
          agent: {
            select: { id: true, name: true, role: true },
          },
          cycle: {
            select: { id: true, phase: true, startedAt: true },
          },
        },
      }),
      db.agentOutput.count({ where }),
    ])

    return NextResponse.json({
      outputs: outputs,
      pagination: { total, limit, offset },
    })
  } catch (error) {
    console.error('Failed to fetch outputs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch outputs' },
      { status: 500 }
    )
  }
}
