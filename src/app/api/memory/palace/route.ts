import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seedDefaultWings } from '@/lib/memory-seed'

// GET /api/memory/palace — Get full memory palace structure for a clone
export async function GET(req: NextRequest) {
  try {
    const cloneId = req.nextUrl.searchParams.get('cloneId')
    if (!cloneId) {
      return NextResponse.json(
        { ok: false, error: 'cloneId is required' },
        { status: 400 }
      )
    }

    // Auto-seed default wings if none exist
    await seedDefaultWings(cloneId)

    const wings = await db.memoryWing.findMany({
      where: { cloneId },
      include: {
        rooms: {
          include: {
            _count: { select: { drawers: { where: { validTo: null } } } },
            drawers: {
              where: { validTo: null },
              orderBy: { importance: 'desc' },
              take: 3,
              select: {
                id: true,
                content: true,
                aaaakSummary: true,
                importance: true,
                sourceType: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { priority: 'desc' },
    })

    // Calculate stats
    const totalRooms = wings.reduce((acc, w) => acc + w.rooms.length, 0)
    const totalDrawers = wings.reduce(
      (acc, w) => acc + w.rooms.reduce((a, r) => a + r._count.drawers, 0),
      0
    )

    // Get tunnel count
    const tunnelCount = await db.memoryTunnel.count({
      where: {
        OR: [
          { roomA: { wing: { cloneId } } },
          { roomB: { wing: { cloneId } } },
        ],
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        wings,
        stats: {
          totalWings: wings.length,
          totalRooms,
          totalDrawers,
          tunnelCount,
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch memory palace:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch memory palace' },
      { status: 500 }
    )
  }
}

// POST /api/memory/palace — Create a new wing or room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, cloneId, wingId } = body

    if (!cloneId) {
      return NextResponse.json(
        { ok: false, error: 'cloneId is required' },
        { status: 400 }
      )
    }

    if (type === 'wing') {
      const { name, wingType, description, priority } = body
      if (!name) {
        return NextResponse.json(
          { ok: false, error: 'name is required for wing' },
          { status: 400 }
        )
      }

      const wing = await db.memoryWing.create({
        data: {
          cloneId,
          name,
          wingType: wingType || 'topic',
          description: description || null,
          priority: priority || 5,
        },
      })

      // Audit log
      await db.auditLog.create({
        data: {
          action: 'create',
          module: 'memory',
          entityType: 'MemoryWing',
          entityId: wing.id,
          details: JSON.stringify({ name, wingType }),
        },
      })

      return NextResponse.json({ ok: true, data: wing }, { status: 201 })
    }

    if (type === 'room') {
      if (!wingId) {
        return NextResponse.json(
          { ok: false, error: 'wingId is required for room' },
          { status: 400 }
        )
      }
      const { name, hallType } = body
      if (!name) {
        return NextResponse.json(
          { ok: false, error: 'name is required for room' },
          { status: 400 }
        )
      }

      const room = await db.memoryRoom.create({
        data: {
          wingId,
          name,
          hallType: hallType || 'facts',
        },
      })

      // Audit log
      await db.auditLog.create({
        data: {
          action: 'create',
          module: 'memory',
          entityType: 'MemoryRoom',
          entityId: room.id,
          details: JSON.stringify({ name, hallType, wingId }),
        },
      })

      return NextResponse.json({ ok: true, data: room }, { status: 201 })
    }

    return NextResponse.json(
      { ok: false, error: 'type must be "wing" or "room"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to create palace element:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create palace element' },
      { status: 500 }
    )
  }
}
