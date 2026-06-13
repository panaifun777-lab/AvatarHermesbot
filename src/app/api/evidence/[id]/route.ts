import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/evidence/[id] - Update an evidence item
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Only allow updating specific fields
    const allowedFields = ['title', 'description', 'evidenceType', 'status', 'rawData', 'contentHash', 'storageRef', 'chainTxHash']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        data[key] = body[key]
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const record = await db.evidenceItem.update({
      where: { id },
      data,
    })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'evidence',
        entityType: 'EvidenceItem',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Failed to update evidence:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/evidence/[id] - Delete an evidence item
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.evidenceItem.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'evidence',
        entityType: 'EvidenceItem',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete evidence:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
