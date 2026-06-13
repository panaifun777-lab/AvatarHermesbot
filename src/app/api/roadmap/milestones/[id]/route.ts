import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/roadmap/milestones/[id] - Update a milestone
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Only allow updating specific fields
    const allowedFields = ['title', 'description', 'status', 'targetDate', 'order']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        // Convert targetDate string to Date if provided
        if (key === 'targetDate' && typeof body[key] === 'string') {
          data[key] = new Date(body[key])
        } else {
          data[key] = body[key]
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const record = await db.milestone.update({
      where: { id },
      data,
    })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'roadmap',
        entityType: 'Milestone',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Failed to update milestone:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
