import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/avatar/agents/[id] - Update agent
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.cloneAgent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.persona !== undefined) updateData.persona = body.persona
    if (body.name !== undefined) updateData.name = body.name
    if (body.role !== undefined) updateData.role = body.role
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl
    if (body.config !== undefined) updateData.config = JSON.stringify(body.config)
    if (body.level !== undefined) updateData.level = body.level
    if (body.experience !== undefined) updateData.experience = body.experience
    if (body.cycleCount !== undefined) updateData.cycleCount = body.cycleCount
    if (body.lastCycleAt !== undefined) updateData.lastCycleAt = body.lastCycleAt

    const agent = await db.cloneAgent.update({
      where: { id },
      data: updateData,
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'avatar',
        entityType: 'CloneAgent',
        entityId: id,
        details: JSON.stringify(updateData),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true, data: agent })
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

// DELETE /api/avatar/agents/[id] - Remove agent
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.cloneAgent.findUnique({
      where: { id },
      include: { clone: true },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Delete related outputs first
    await db.agentOutput.deleteMany({ where: { agentId: id } })
    // Delete related cycles and their outputs
    const cycles = await db.agentCycle.findMany({ where: { agentId: id } })
    for (const cycle of cycles) {
      await db.agentOutput.deleteMany({ where: { cycleId: cycle.id } })
    }
    await db.agentCycle.deleteMany({ where: { agentId: id } })
    // Delete agent
    await db.cloneAgent.delete({ where: { id } })

    // Create activity
    await db.cloneActivity.create({
      data: {
        cloneId: existing.cloneId,
        activityType: 'agent_removed',
        title: `代理${existing.name}已移除`,
        description: `角色: ${existing.role}`,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'avatar',
        entityType: 'CloneAgent',
        entityId: id,
        details: JSON.stringify({ name: existing.name }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}
