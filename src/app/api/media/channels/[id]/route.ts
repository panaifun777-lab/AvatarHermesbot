import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/media/channels/[id] - Get single channel
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const channel = await db.mediaChannel.findUnique({
      where: { id },
      include: { vertical: true },
    })
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }
    return NextResponse.json({ channel })
  } catch (error) {
    console.error('Failed to fetch channel:', error)
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 })
  }
}

// PUT /api/media/channels/[id] - Update a channel
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const allowedFields = ['verticalId', 'name', 'platform', 'url', 'followers', 'avgReach', 'postFrequency', 'status', 'avatarUrl', 'lastPostAt']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'lastPostAt' && typeof body[key] === 'string') {
          data[key] = new Date(body[key])
        } else {
          data[key] = body[key]
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const channel = await db.mediaChannel.update({ where: { id }, data })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'media',
        entityType: 'MediaChannel',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ channel })
  } catch (error) {
    console.error('Failed to update channel:', error)
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 })
  }
}

// DELETE /api/media/channels/[id] - Delete a channel
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.mediaChannel.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'media',
        entityType: 'MediaChannel',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete channel:', error)
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 })
  }
}
