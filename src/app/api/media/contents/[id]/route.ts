import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/media/contents/[id] - Get single content
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const content = await db.mediaContent.findUnique({
      where: { id },
      include: { vertical: true },
    })
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Failed to fetch content:', error)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}

// PUT /api/media/contents/[id] - Update a content
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const allowedFields = [
      'verticalId', 'channelId', 'title', 'contentType', 'status',
      'contentData', 'citationUrl', 'contentHash', 'onChainTxId',
      'schemaMarkup', 'reachCount', 'citationCount', 'aiCitationCount', 'publishedAt',
    ]
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'publishedAt' && typeof body[key] === 'string') {
          data[key] = new Date(body[key])
        } else {
          data[key] = body[key]
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const content = await db.mediaContent.update({ where: { id }, data })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'media',
        entityType: 'MediaContent',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Failed to update content:', error)
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }
}

// DELETE /api/media/contents/[id] - Delete a content
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.mediaContent.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'media',
        entityType: 'MediaContent',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete content:', error)
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
  }
}
