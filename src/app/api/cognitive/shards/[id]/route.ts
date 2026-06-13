import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/cognitive/shards/[id] - Update a cognitive shard
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Only allow updating specific fields
    const allowedFields = ['status', 'confidence', 'name', 'shardType', 'description', 'modelBase', 'loraAdapter', 'lastTrained']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        data[key] = body[key]
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const record = await db.cognitiveShard.update({
      where: { id },
      data,
    })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'cognitive',
        entityType: 'CognitiveShard',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Failed to update cognitive shard:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/cognitive/shards/[id] - Delete a cognitive shard
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.cognitiveShard.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'cognitive',
        entityType: 'CognitiveShard',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete cognitive shard:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
