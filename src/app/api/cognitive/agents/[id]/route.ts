import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.agentRole.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.persona !== undefined) updateData.persona = body.persona
    if (body.name !== undefined) updateData.name = body.name
    if (body.capabilities !== undefined) updateData.capabilities = JSON.stringify(body.capabilities)
    if (body.avatar !== undefined) updateData.avatar = body.avatar
    if (body.shardId !== undefined) updateData.shardId = body.shardId
    if (body.lastCycleAt !== undefined) updateData.lastCycleAt = body.lastCycleAt
    if (body.cycleCount !== undefined) updateData.cycleCount = body.cycleCount

    const agent = await db.agentRole.update({
      where: { id },
      data: updateData,
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'cognitive',
        entityType: 'AgentRole',
        entityId: id,
        details: JSON.stringify(updateData),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.agentRole.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Delete all cycles first
    await db.dailyCycle.deleteMany({ where: { agentId: id } })
    // Delete agent
    await db.agentRole.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'cognitive',
        entityType: 'AgentRole',
        entityId: id,
        details: JSON.stringify({ name: existing.name }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
  }
}
