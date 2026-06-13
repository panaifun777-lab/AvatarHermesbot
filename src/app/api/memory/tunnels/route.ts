import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { discoverTunnels, persistTunnels } from '@/lib/tunnel-discovery'

// GET /api/memory/tunnels — List tunnels for a clone
export async function GET(req: NextRequest) {
  try {
    const cloneId = req.nextUrl.searchParams.get('cloneId')
    if (!cloneId) {
      return NextResponse.json(
        { ok: false, error: 'cloneId is required' },
        { status: 400 }
      )
    }

    const autoDiscover = req.nextUrl.searchParams.get('autoDiscover') === 'true'

    // Optionally auto-discover tunnels before listing
    let newTunnels = 0
    if (autoDiscover) {
      newTunnels = await persistTunnels(cloneId)
    }

    const tunnels = await db.memoryTunnel.findMany({
      where: {
        OR: [
          { roomA: { wing: { cloneId } } },
          { roomB: { wing: { cloneId } } },
        ],
      },
      include: {
        roomA: {
          select: {
            name: true,
            hallType: true,
            wing: { select: { name: true, id: true } },
          },
        },
        roomB: {
          select: {
            name: true,
            hallType: true,
            wing: { select: { name: true, id: true } },
          },
        },
      },
      orderBy: { strength: 'desc' },
    })

    return NextResponse.json({
      ok: true,
      data: {
        tunnels,
        autoDiscovered: newTunnels,
      },
    })
  } catch (error) {
    console.error('Failed to fetch tunnels:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch tunnels' },
      { status: 500 }
    )
  }
}

// POST /api/memory/tunnels — Create a tunnel between two rooms
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { roomAId, roomBId, sharedTheme } = body

    if (!roomAId || !roomBId) {
      return NextResponse.json(
        { ok: false, error: 'roomAId and roomBId are required' },
        { status: 400 }
      )
    }

    // Verify rooms exist and belong to different wings
    const [roomA, roomB] = await Promise.all([
      db.memoryRoom.findUnique({
        where: { id: roomAId },
        include: { wing: true },
      }),
      db.memoryRoom.findUnique({
        where: { id: roomBId },
        include: { wing: true },
      }),
    ])

    if (!roomA || !roomB) {
      return NextResponse.json(
        { ok: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    if (roomA.wingId === roomB.wingId) {
      return NextResponse.json(
        { ok: false, error: 'Tunnels can only connect rooms in different wings' },
        { status: 400 }
      )
    }

    // Check for existing tunnel
    const existing = await db.memoryTunnel.findFirst({
      where: {
        OR: [
          { roomAId, roomBId },
          { roomAId: roomBId, roomBId: roomAId },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Tunnel already exists', data: existing },
        { status: 409 }
      )
    }

    const strength = roomA.drawerCount + roomB.drawerCount

    const tunnel = await db.memoryTunnel.create({
      data: {
        roomAId,
        roomBId,
        sharedTheme: sharedTheme || `${roomA.name}↔${roomB.name}`,
        strength: Math.max(1, strength),
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'memory',
        entityType: 'MemoryTunnel',
        entityId: tunnel.id,
        details: JSON.stringify({
          roomA: `${roomA.wing.name}/${roomA.name}`,
          roomB: `${roomB.wing.name}/${roomB.name}`,
          sharedTheme,
        }),
      },
    })

    return NextResponse.json({ ok: true, data: tunnel }, { status: 201 })
  } catch (error) {
    console.error('Failed to create tunnel:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create tunnel' },
      { status: 500 }
    )
  }
}
