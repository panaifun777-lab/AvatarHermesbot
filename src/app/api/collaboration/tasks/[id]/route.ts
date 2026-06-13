import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/collaboration/tasks/[id] - Update a collaboration task
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Only allow updating specific fields
    const allowedFields = ['title', 'description', 'status', 'priority', 'complexity', 'category', 'assigneeId', 'assigneeType', 'ciStatus', 'safetyScan', 'reward', 'rewardToken', 'deadline']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        // Convert deadline string to Date if provided
        if (key === 'deadline' && typeof body[key] === 'string') {
          data[key] = new Date(body[key])
        } else {
          data[key] = body[key]
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const record = await db.collaborationTask.update({
      where: { id },
      data,
    })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'collaboration',
        entityType: 'CollaborationTask',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Failed to update collaboration task:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/collaboration/tasks/[id] - Delete a collaboration task
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.collaborationTask.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'collaboration',
        entityType: 'CollaborationTask',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete collaboration task:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
