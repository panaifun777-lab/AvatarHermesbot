import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { compress, generateContentHash, compressAAAK, computeHash, isDuplicate } from '@/lib/aaak-compressor'

// GET /api/memory/drawers — List drawers with optional filter, search, and pagination
export async function GET(req: NextRequest) {
  try {
    const roomId = req.nextUrl.searchParams.get('roomId')
    const wingId = req.nextUrl.searchParams.get('wingId')
    const cloneId = req.nextUrl.searchParams.get('cloneId')
    const sourceType = req.nextUrl.searchParams.get('sourceType')
    const search = req.nextUrl.searchParams.get('search')
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10), 100)
    const validOnly = req.nextUrl.searchParams.get('validOnly') !== 'false'

    const where: Record<string, unknown> = {}
    if (validOnly) where.validTo = null
    if (sourceType) where.sourceType = sourceType
    if (search) where.content = { contains: search }

    if (roomId) {
      where.roomId = roomId
    } else if (wingId) {
      where.room = { wingId }
    } else if (cloneId) {
      where.room = { wing: { cloneId } }
    } else {
      return NextResponse.json(
        { ok: false, error: 'roomId, wingId, or cloneId is required' },
        { status: 400 }
      )
    }

    const [drawers, total] = await Promise.all([
      db.memoryDrawer.findMany({
        where,
        orderBy: { importance: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          room: {
            select: {
              name: true,
              hallType: true,
              wing: { select: { name: true } },
            },
          },
          tags: true,
        },
      }),
      db.memoryDrawer.count({ where }),
    ])

    return NextResponse.json({
      ok: true,
      data: {
        drawers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch drawers:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch drawers' },
      { status: 500 }
    )
  }
}

// POST /api/memory/drawers — Create a new drawer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { roomId, content, sourceType, sourceId, importance, tags } = body

    if (!roomId || !content) {
      return NextResponse.json(
        { ok: false, error: 'roomId and content are required' },
        { status: 400 }
      )
    }

    // Verify room exists
    const room = await db.memoryRoom.findUnique({
      where: { id: roomId },
    })
    if (!room) {
      return NextResponse.json(
        { ok: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    // Generate content hash for dedup
    const contentHash = generateContentHash(content)

    // Check for duplicate content in this room
    const existing = await db.memoryDrawer.findFirst({
      where: { roomId, contentHash },
    })
    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Duplicate content detected', data: { existingId: existing.id } },
        { status: 409 }
      )
    }

    // Generate AAAK summary
    const aaaakResult = compress(content, {
      importance: importance || 3,
      sourceType: sourceType || 'manual',
      entities: body.entities,
      topic: body.topic,
      emotions: body.emotions,
      flags: body.flags,
    })

    // Get next chunk index for this room
    const lastDrawer = await db.memoryDrawer.findFirst({
      where: { roomId },
      orderBy: { chunkIndex: 'desc' },
      select: { chunkIndex: true },
    })

    // Create drawer and update room drawer count
    const drawer = await db.memoryDrawer.create({
      data: {
        roomId,
        content,
        aaaakSummary: aaaakResult.summary,
        chunkIndex: (lastDrawer?.chunkIndex || 0) + 1,
        sourceType: sourceType || 'manual',
        sourceId: sourceId || null,
        importance: importance || 3.0,
        emotionalWeight: body.emotionalWeight || 0.0,
        contentHash,
      },
    })

    // Increment room drawer count
    await db.memoryRoom.update({
      where: { id: roomId },
      data: { drawerCount: { increment: 1 } },
    })

    // Create tags if provided
    if (tags && Array.isArray(tags)) {
      for (const tag of tags.slice(0, 10)) {
        await db.drawerTag.create({
          data: { drawerId: drawer.id, tag },
        })
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'memory',
        entityType: 'MemoryDrawer',
        entityId: drawer.id,
        details: JSON.stringify({
          roomId,
          sourceType,
          aaaakTokens: aaaakResult.tokens,
        }),
      },
    })

    return NextResponse.json(
      {
        ok: true,
        data: {
          drawer,
          aaaak: aaaakResult,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create drawer:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create drawer' },
      { status: 500 }
    )
  }
}
