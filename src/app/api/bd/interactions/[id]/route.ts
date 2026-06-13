import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/bd/interactions/[id] - Get single interaction
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const interaction = await db.bDInteraction.findUnique({
      where: { id },
      include: { partner: true },
    })
    if (!interaction) {
      return NextResponse.json({ error: 'BD interaction not found' }, { status: 404 })
    }
    return NextResponse.json({ interaction })
  } catch (error) {
    console.error('Failed to fetch BD interaction:', error)
    return NextResponse.json({ error: 'Failed to fetch BD interaction' }, { status: 500 })
  }
}

// PUT /api/bd/interactions/[id] - Update an interaction
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const allowedFields = ['partnerId', 'type', 'subject', 'content', 'outcome', 'nextAction', 'followUpDate']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'followUpDate' && typeof body[key] === 'string') {
          data[key] = new Date(body[key])
        } else {
          data[key] = body[key]
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const interaction = await db.bDInteraction.update({ where: { id }, data })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'bd',
        entityType: 'BDInteraction',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ interaction })
  } catch (error) {
    console.error('Failed to update BD interaction:', error)
    return NextResponse.json({ error: 'Failed to update BD interaction' }, { status: 500 })
  }
}

// DELETE /api/bd/interactions/[id] - Delete an interaction
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.bDInteraction.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'bd',
        entityType: 'BDInteraction',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete BD interaction:', error)
    return NextResponse.json({ error: 'Failed to delete BD interaction' }, { status: 500 })
  }
}
