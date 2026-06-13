import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/geo/keywords/[id] - Get single keyword
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const keyword = await db.gEOKeyword.findUnique({
      where: { id },
      include: {
        vertical: true,
        rankings: { orderBy: { capturedAt: 'desc' } },
      },
    })
    if (!keyword) {
      return NextResponse.json({ error: 'GEO keyword not found' }, { status: 404 })
    }
    return NextResponse.json({ keyword })
  } catch (error) {
    console.error('Failed to fetch GEO keyword:', error)
    return NextResponse.json({ error: 'Failed to fetch GEO keyword' }, { status: 500 })
  }
}

// PUT /api/geo/keywords/[id] - Update a keyword
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const allowedFields = [
      'verticalId', 'keyword', 'keywordEn', 'category', 'intent',
      'searchVolume', 'difficulty', 'currentRank', 'targetRank', 'status',
    ]
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        data[key] = body[key]
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const keyword = await db.gEOKeyword.update({ where: { id }, data })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'geo',
        entityType: 'GEOKeyword',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ keyword })
  } catch (error) {
    console.error('Failed to update GEO keyword:', error)
    return NextResponse.json({ error: 'Failed to update GEO keyword' }, { status: 500 })
  }
}

// DELETE /api/geo/keywords/[id] - Delete a keyword
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.gEOKeyword.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'geo',
        entityType: 'GEOKeyword',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete GEO keyword:', error)
    return NextResponse.json({ error: 'Failed to delete GEO keyword' }, { status: 500 })
  }
}
