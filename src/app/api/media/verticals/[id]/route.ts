import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/media/verticals/[id] - Get single vertical
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const vertical = await db.mediaVertical.findUnique({
      where: { id },
      include: {
        channels: true,
        contents: true,
        partners: true,
        keywords: true,
      },
    })
    if (!vertical) {
      return NextResponse.json({ error: 'Vertical not found' }, { status: 404 })
    }
    return NextResponse.json({ vertical })
  } catch (error) {
    console.error('Failed to fetch vertical:', error)
    return NextResponse.json({ error: 'Failed to fetch vertical' }, { status: 500 })
  }
}

// PUT /api/media/verticals/[id] - Update a vertical
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const allowedFields = ['name', 'slug', 'icon', 'color', 'description', 'status', 'priority']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        data[key] = body[key]
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const vertical = await db.mediaVertical.update({ where: { id }, data })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'media',
        entityType: 'MediaVertical',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ vertical })
  } catch (error) {
    console.error('Failed to update vertical:', error)
    return NextResponse.json({ error: 'Failed to update vertical' }, { status: 500 })
  }
}

// DELETE /api/media/verticals/[id] - Delete a vertical
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.mediaVertical.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'media',
        entityType: 'MediaVertical',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete vertical:', error)
    return NextResponse.json({ error: 'Failed to delete vertical' }, { status: 500 })
  }
}
