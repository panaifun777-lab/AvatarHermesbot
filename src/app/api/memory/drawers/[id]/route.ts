import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/memory/drawers/[id] — Get a single drawer
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const drawer = await db.memoryDrawer.findUnique({
      where: { id },
      include: {
        room: {
          select: {
            name: true,
            hallType: true,
            wing: { select: { name: true, cloneId: true } },
          },
        },
        tags: true,
      },
    })

    if (!drawer) {
      return NextResponse.json(
        { ok: false, error: 'Drawer not found' },
        { status: 404 }
      )
    }

    // Increment access count
    await db.memoryDrawer.update({
      where: { id },
      data: {
        accessCount: { increment: 1 },
        lastAccessed: new Date(),
      },
    })

    return NextResponse.json({ ok: true, data: drawer })
  } catch (error) {
    console.error('Failed to fetch drawer:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch drawer' },
      { status: 500 }
    )
  }
}

// PATCH /api/memory/drawers/[id] — Update a drawer
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const drawer = await db.memoryDrawer.findUnique({ where: { id } })
    if (!drawer) {
      return NextResponse.json(
        { ok: false, error: 'Drawer not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    // Invalidation: set validTo to mark as no longer current
    if (body.invalidate) {
      updateData.validTo = new Date()
    }

    // Update importance
    if (body.importance !== undefined) {
      updateData.importance = Math.max(1, Math.min(5, body.importance))
    }

    // Update emotional weight
    if (body.emotionalWeight !== undefined) {
      updateData.emotionalWeight = body.emotionalWeight
    }

    // Update AAAK summary
    if (body.aaaakSummary !== undefined) {
      updateData.aaaakSummary = body.aaaakSummary
    }

    // Update content (re-hash)
    if (body.content !== undefined) {
      updateData.content = body.content
      // Re-generate content hash
      const { generateContentHash } = await import('@/lib/aaak-compressor')
      updateData.contentHash = generateContentHash(body.content)
    }

    const updated = await db.memoryDrawer.update({
      where: { id },
      data: updateData,
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'memory',
        entityType: 'MemoryDrawer',
        entityId: id,
        details: JSON.stringify(updateData),
      },
    })

    return NextResponse.json({ ok: true, data: updated })
  } catch (error) {
    console.error('Failed to update drawer:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update drawer' },
      { status: 500 }
    )
  }
}

// DELETE /api/memory/drawers/[id] — Delete a drawer
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const drawer = await db.memoryDrawer.findUnique({ where: { id } })
    if (!drawer) {
      return NextResponse.json(
        { ok: false, error: 'Drawer not found' },
        { status: 404 }
      )
    }

    // Delete drawer (cascade deletes tags)
    await db.memoryDrawer.delete({ where: { id } })

    // Decrement room drawer count
    await db.memoryRoom.update({
      where: { id: drawer.roomId },
      data: { drawerCount: { decrement: 1 } },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'memory',
        entityType: 'MemoryDrawer',
        entityId: id,
        details: JSON.stringify({ roomId: drawer.roomId }),
      },
    })

    return NextResponse.json({ ok: true, data: { deleted: true } })
  } catch (error) {
    console.error('Failed to delete drawer:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to delete drawer' },
      { status: 500 }
    )
  }
}
