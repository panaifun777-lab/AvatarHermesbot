import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/email/auto-reply/rules/[id] - Update auto-reply rule
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, condition, template, agentId, priority, isEnabled } = body

    const rule = await db.autoReplyRule.findUnique({ where: { id } })
    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (condition !== undefined) updateData.condition = typeof condition === 'string' ? condition : JSON.stringify(condition)
    if (template !== undefined) updateData.template = template
    if (agentId !== undefined) updateData.agentId = agentId
    if (priority !== undefined) updateData.priority = priority
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled

    const updated = await db.autoReplyRule.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to update auto-reply rule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update auto-reply rule' },
      { status: 500 }
    )
  }
}

// DELETE /api/email/auto-reply/rules/[id] - Delete auto-reply rule
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rule = await db.autoReplyRule.findUnique({ where: { id } })
    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      )
    }

    await db.autoReplyRule.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'email',
        entityType: 'AutoReplyRule',
        entityId: id,
        details: JSON.stringify({ name: rule.name }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Failed to delete auto-reply rule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete auto-reply rule' },
      { status: 500 }
    )
  }
}
