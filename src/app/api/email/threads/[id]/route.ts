import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/email/threads/[id] - Update thread status, assign agent
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, priority, agentId, autoReplied, labels } = body

    const thread = await db.emailThread.findUnique({ where: { id } })
    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (agentId !== undefined) updateData.agentId = agentId
    if (autoReplied !== undefined) updateData.autoReplied = autoReplied
    if (labels !== undefined) updateData.labels = labels
    if (status === 'replied') updateData.repliedAt = new Date()

    const updated = await db.emailThread.update({
      where: { id },
      data: updateData,
      include: { emails: true },
    })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'email',
        entityType: 'EmailThread',
        entityId: id,
        details: JSON.stringify({ status, agentId }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to update email thread:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update email thread' },
      { status: 500 }
    )
  }
}
