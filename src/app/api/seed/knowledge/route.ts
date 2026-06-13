import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seedDefaultWings } from '@/lib/memory-seed'

// Safe DB operation wrapper
async function safeDbOp<T>(op: () => Promise<T>): Promise<T | null> {
  try {
    return await op()
  } catch {
    return null
  }
}

// POST /api/seed/knowledge — Seed the knowledge base for the first avatar (飘叔)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, cloneId, force } = body as {
      userId?: string
      cloneId?: string
      force?: boolean
    }

    // Find or create the avatar clone
    let targetCloneId = cloneId

    if (!targetCloneId && userId) {
      // Find user's existing clone
      const user = await safeDbOp(() =>
        db.user.findUnique({
          where: { id: userId },
          include: { clone: true },
        })
      )
      if (user?.clone) {
        targetCloneId = user.clone.id
      }
    }

    // If still no clone, try to find any existing clone (for demo user)
    if (!targetCloneId) {
      const existingClone = await safeDbOp(() =>
        db.avatarClone.findFirst()
      )
      if (existingClone) {
        targetCloneId = existingClone.id
      }
    }

    // If still no clone, create one for the first user
    if (!targetCloneId) {
      const firstUser = await safeDbOp(() => db.user.findFirst())
      if (firstUser) {
        // Read SOUL.md content for persona
        const soulConfig = await safeDbOp(() =>
          db.soulConfig.findFirst({ where: { isActive: true } })
        )
        const persona = soulConfig?.content || '飘叔数字分身 - Web4.0意识主权倡导者'

        const clone = await safeDbOp(() =>
          db.avatarClone.create({
            data: {
              userId: firstUser.id,
              name: '飘叔',
              persona,
              status: 'active',
              level: 1,
              experience: 0,
              totalCycles: 0,
            },
          })
        )
        targetCloneId = clone?.id || null
      }
    }

    if (!targetCloneId) {
      return NextResponse.json(
        { ok: false, error: 'No clone found or created. Please register a user first.' },
        { status: 400 }
      )
    }

    // If force, delete existing wings and re-seed
    if (force) {
      const existingWings = await safeDbOp(() =>
        db.memoryWing.findMany({
          where: { cloneId: targetCloneId },
          select: { id: true },
        })
      )
      if (existingWings && existingWings.length > 0) {
        // Cascade deletes will handle rooms, drawers, tags
        for (const wing of existingWings) {
          await safeDbOp(() => db.memoryWing.delete({ where: { id: wing.id } }))
        }
        // Also clean up KG entities and triples
        await safeDbOp(() => db.kGTriple.deleteMany({ where: { cloneId: targetCloneId } }))
        await safeDbOp(() => db.kGEntity.deleteMany({ where: { cloneId: targetCloneId } }))
      }
    }

    // Seed the knowledge base
    await seedDefaultWings(targetCloneId)

    // Collect seeding results
    const wings = await safeDbOp(() =>
      db.memoryWing.findMany({
        where: { cloneId: targetCloneId },
        include: {
          rooms: {
            include: {
              _count: { select: { drawers: { where: { validTo: null } } } },
            },
          },
        },
        orderBy: { priority: 'desc' },
      })
    )

    const entities = await safeDbOp(() =>
      db.kGEntity.findMany({
        where: { cloneId: targetCloneId },
        select: { id: true, name: true, entityType: true },
      })
    )

    const triples = await safeDbOp(() =>
      db.kGTriple.findMany({
        where: { cloneId: targetCloneId, validTo: null },
        include: {
          subject: { select: { name: true } },
          object: { select: { name: true } },
        },
      })
    )

    const skills = await safeDbOp(() =>
      db.cloneSkill.findMany({
        where: { cloneId: targetCloneId },
        select: { id: true, name: true, level: true, category: true },
      })
    )

    const tunnels = await safeDbOp(() =>
      db.memoryTunnel.findMany({
        where: {
          OR: [
            { roomA: { wing: { cloneId: targetCloneId } } },
            { roomB: { wing: { cloneId: targetCloneId } } },
          ],
        },
        include: {
          roomA: { select: { name: true } },
          roomB: { select: { name: true } },
        },
      })
    )

    // Update the clone persona with SOUL.md content if available
    const soulConfig = await safeDbOp(() =>
      db.soulConfig.findFirst({ where: { isActive: true } })
    )
    if (soulConfig) {
      await safeDbOp(() =>
        db.avatarClone.update({
          where: { id: targetCloneId },
          data: { persona: soulConfig.content },
        })
      )
    }

    // Create audit log
    await safeDbOp(() =>
      db.auditLog.create({
        data: {
          action: force ? 'reseed' : 'seed',
          module: 'memory',
          entityType: 'KnowledgeBase',
          entityId: targetCloneId,
          details: JSON.stringify({
            wings: wings?.length || 0,
            rooms: wings?.reduce((acc, w) => acc + w.rooms.length, 0) || 0,
            drawers: wings?.reduce((acc, w) => acc + w.rooms.reduce((a, r) => a + r._count.drawers, 0), 0) || 0,
            entities: entities?.length || 0,
            triples: triples?.length || 0,
            skills: skills?.length || 0,
            tunnels: tunnels?.length || 0,
            force: !!force,
          }),
        },
      })
    )

    return NextResponse.json({
      ok: true,
      data: {
        cloneId: targetCloneId,
        stats: {
          wings: wings?.length || 0,
          rooms: wings?.reduce((acc, w) => acc + w.rooms.length, 0) || 0,
          drawers: wings?.reduce((acc, w) => acc + w.rooms.reduce((a, r) => a + r._count.drawers, 0), 0) || 0,
          entities: entities?.length || 0,
          triples: triples?.length || 0,
          skills: skills?.length || 0,
          tunnels: tunnels?.length || 0,
        },
        wings: wings?.map(w => ({
          name: w.name,
          priority: w.priority,
          rooms: w.rooms.map(r => ({
            name: r.name,
            drawerCount: r._count.drawers,
          })),
        })),
        entities: entities?.map(e => ({ name: e.name, type: e.entityType })),
        triples: triples?.map(t => ({
          subject: t.subject.name,
          predicate: t.predicate,
          object: t.object.name,
          confidence: t.confidence,
        })),
        skills: skills?.map(s => ({
          name: s.name,
          level: s.level,
          category: s.category,
        })),
        tunnels: tunnels?.map(t => ({
          roomA: t.roomA.name,
          roomB: t.roomB.name,
          sharedTheme: t.sharedTheme,
        })),
      },
    })
  } catch (error) {
    console.error('Knowledge seed API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to seed knowledge base'
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// GET /api/seed/knowledge — Check knowledge base seeding status
export async function GET(req: NextRequest) {
  try {
    const cloneId = req.nextUrl.searchParams.get('cloneId')

    if (!cloneId) {
      // Find any existing clone
      const firstClone = await safeDbOp(() => db.avatarClone.findFirst())
      if (!firstClone) {
        return NextResponse.json({
          ok: true,
          data: { seeded: false, message: 'No clone found' },
        })
      }
      // Recursively call with cloneId
      const url = new URL(req.url)
      url.searchParams.set('cloneId', firstClone.id)
      return GET(new NextRequest(url))
    }

    const wingCount = await safeDbOp(() =>
      db.memoryWing.count({ where: { cloneId } })
    )
    const entityCount = await safeDbOp(() =>
      db.kGEntity.count({ where: { cloneId } })
    )
    const tripleCount = await safeDbOp(() =>
      db.kGTriple.count({ where: { cloneId, validTo: null } })
    )
    const skillCount = await safeDbOp(() =>
      db.cloneSkill.count({ where: { cloneId } })
    )
    const tunnelCount = await safeDbOp(() =>
      db.memoryTunnel.count({
        where: {
          OR: [
            { roomA: { wing: { cloneId } } },
            { roomB: { wing: { cloneId } } },
          ],
        },
      })
    )
    const drawerCount = await safeDbOp(() =>
      db.memoryDrawer.count({
        where: {
          room: { wing: { cloneId } },
          validTo: null,
        },
      })
    )

    const seeded = (wingCount || 0) > 0

    return NextResponse.json({
      ok: true,
      data: {
        seeded,
        cloneId,
        stats: {
          wings: wingCount || 0,
          entities: entityCount || 0,
          triples: tripleCount || 0,
          skills: skillCount || 0,
          tunnels: tunnelCount || 0,
          drawers: drawerCount || 0,
        },
      },
    })
  } catch (error) {
    console.error('Knowledge seed status error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to check knowledge base status' },
      { status: 500 }
    )
  }
}
