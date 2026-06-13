import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/memory/kg — Query knowledge graph for current facts about an entity
export async function GET(req: NextRequest) {
  try {
    const cloneId = req.nextUrl.searchParams.get('cloneId')
    const entityId = req.nextUrl.searchParams.get('entityId')
    const entityName = req.nextUrl.searchParams.get('entityName')
    const asOf = req.nextUrl.searchParams.get('asOf')
    const predicate = req.nextUrl.searchParams.get('predicate')

    if (!cloneId) {
      return NextResponse.json(
        { ok: false, error: 'cloneId is required' },
        { status: 400 }
      )
    }

    // Resolve entity
    let entity = null
    if (entityId) {
      entity = await db.kGEntity.findUnique({ where: { id: entityId } })
    } else if (entityName) {
      entity = await db.kGEntity.findFirst({
        where: { cloneId, name: entityName },
      })
    }

    if (!entity && (entityId || entityName)) {
      return NextResponse.json(
        { ok: false, error: 'Entity not found' },
        { status: 404 }
      )
    }

    // Query triples
    const where: Record<string, unknown> = {
      cloneId,
    }

    if (entity) {
      where.OR = [
        { subjectId: entity.id },
        { objectId: entity.id },
      ]
    }

    if (predicate) {
      where.predicate = predicate
    }

    // Temporal filtering
    if (asOf) {
      const asOfDate = new Date(asOf)
      where.validFrom = { lte: asOfDate }
      where.OR = (where.OR as Record<string, unknown>[]).map(cond => ({
        ...cond,
        validFrom: { lte: asOfDate },
        OR: [
          { validTo: null },
          { validTo: { gte: asOfDate } },
        ],
      }))
    } else {
      // Current facts only
      where.validTo = null
    }

    const triples = await db.kGTriple.findMany({
      where,
      include: {
        subject: { select: { name: true, entityType: true } },
        object: { select: { name: true, entityType: true } },
      },
      orderBy: { confidence: 'desc' },
      take: 50,
    })

    // Format results
    const facts = triples.map(t => ({
      id: t.id,
      subject: t.subject.name,
      subjectType: t.subject.entityType,
      predicate: t.predicate,
      object: t.object.name,
      objectType: t.object.entityType,
      validFrom: t.validFrom,
      validTo: t.validTo,
      isCurrent: t.validTo === null,
      confidence: t.confidence,
      sourceDrawerId: t.sourceDrawerId,
    }))

    return NextResponse.json({
      ok: true,
      data: {
        entity: entity ? {
          id: entity.id,
          name: entity.name,
          type: entity.entityType,
        } : null,
        facts,
        isHistorical: !!asOf,
      },
    })
  } catch (error) {
    console.error('Failed to query knowledge graph:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to query knowledge graph' },
      { status: 500 }
    )
  }
}

// POST /api/memory/kg — Add a triple to knowledge graph
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cloneId, subjectName, predicate, objectName, confidence, sourceDrawerId, entityType } = body

    if (!cloneId || !subjectName || !predicate || !objectName) {
      return NextResponse.json(
        { ok: false, error: 'cloneId, subjectName, predicate, and objectName are required' },
        { status: 400 }
      )
    }

    // Get or create subject entity
    const subject = await db.kGEntity.upsert({
      where: {
        id: `kg_${cloneId}_${subjectName}`,
      },
      create: {
        cloneId,
        name: subjectName,
        entityType: (entityType?.subject as string) || 'concept',
      },
      update: {},
    })

    // Get or create object entity
    const object = await db.kGEntity.upsert({
      where: {
        id: `kg_${cloneId}_${objectName}`,
      },
      create: {
        cloneId,
        name: objectName,
        entityType: (entityType?.object as string) || 'concept',
      },
      update: {},
    })

    // Check for existing unexpired triple with same S+P (dedup / contradiction)
    const existingTriple = await db.kGTriple.findFirst({
      where: {
        cloneId,
        subjectId: subject.id,
        predicate,
        validTo: null,
      },
    })

    if (existingTriple) {
      if (existingTriple.objectId === object.id) {
        // Same fact already exists — return it
        return NextResponse.json({
          ok: true,
          data: {
            triple: existingTriple,
            status: 'duplicate',
            message: 'This fact already exists in the knowledge graph',
          },
        })
      } else {
        // Contradiction: same subject+predicate but different object
        // Invalidate old fact (set validTo = now)
        await db.kGTriple.update({
          where: { id: existingTriple.id },
          data: { validTo: new Date() },
        })
      }
    }

    // Create new triple
    const triple = await db.kGTriple.create({
      data: {
        cloneId,
        subjectId: subject.id,
        predicate,
        objectId: object.id,
        confidence: confidence || 1.0,
        sourceDrawerId: sourceDrawerId || null,
      },
      include: {
        subject: { select: { name: true, entityType: true } },
        object: { select: { name: true, entityType: true } },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'memory',
        entityType: 'KGTriple',
        entityId: triple.id,
        details: JSON.stringify({
          subject: subjectName,
          predicate,
          object: objectName,
          hadContradiction: !!existingTriple,
        }),
      },
    })

    return NextResponse.json(
      {
        ok: true,
        data: {
          triple,
          status: existingTriple ? 'contradiction_resolved' : 'created',
          invalidatedTripleId: existingTriple?.id || null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to add KG triple:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to add KG triple' },
      { status: 500 }
    )
  }
}
