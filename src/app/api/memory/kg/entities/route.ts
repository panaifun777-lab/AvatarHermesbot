import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/memory/kg/entities — List entities with optional type filter
export async function GET(req: NextRequest) {
  try {
    const cloneId = req.nextUrl.searchParams.get('cloneId')
    const entityType = req.nextUrl.searchParams.get('entityType')
    const search = req.nextUrl.searchParams.get('search')

    if (!cloneId) {
      return NextResponse.json(
        { ok: false, error: 'cloneId is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { cloneId }
    if (entityType) where.entityType = entityType
    if (search) where.name = { contains: search }

    const entities = await db.kGEntity.findMany({
      where,
      include: {
        _count: {
          select: {
            subjectTriples: { where: { validTo: null } },
            objectTriples: { where: { validTo: null } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    const formatted = entities.map(e => ({
      id: e.id,
      name: e.name,
      entityType: e.entityType,
      properties: e.properties,
      subjectTripleCount: e._count.subjectTriples,
      objectTripleCount: e._count.objectTriples,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }))

    return NextResponse.json({
      ok: true,
      data: formatted,
    })
  } catch (error) {
    console.error('Failed to fetch KG entities:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch KG entities' },
      { status: 500 }
    )
  }
}

// POST /api/memory/kg/entities — Create or upsert entity
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cloneId, name, entityType, properties } = body

    if (!cloneId || !name) {
      return NextResponse.json(
        { ok: false, error: 'cloneId and name are required' },
        { status: 400 }
      )
    }

    // Check if entity already exists
    const existing = await db.kGEntity.findFirst({
      where: { cloneId, name },
    })

    if (existing) {
      // Update properties if provided
      if (properties) {
        await db.kGEntity.update({
          where: { id: existing.id },
          data: {
            entityType: entityType || existing.entityType,
            properties: typeof properties === 'string' ? properties : JSON.stringify(properties),
          },
        })
      }

      return NextResponse.json({
        ok: true,
        data: { ...existing, status: 'existing' },
      })
    }

    // Create new entity
    const entity = await db.kGEntity.create({
      data: {
        cloneId,
        name,
        entityType: entityType || 'concept',
        properties: properties
          ? typeof properties === 'string' ? properties : JSON.stringify(properties)
          : null,
      },
    })

    return NextResponse.json(
      { ok: true, data: { ...entity, status: 'created' } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create KG entity:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create KG entity' },
      { status: 500 }
    )
  }
}
