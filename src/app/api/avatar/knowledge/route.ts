import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/avatar/knowledge - List shared knowledge, optionally filtered by domain
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get('domain')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = domain ? { domain } : {}

    const [knowledge, total] = await Promise.all([
      db.sharedKnowledge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.sharedKnowledge.count({ where }),
    ])

    // Domain distribution stats
    const domainStats = await db.sharedKnowledge.groupBy({
      by: ['domain'],
      _count: { id: true },
      _avg: { confidence: true },
    })

    const domainDistribution = domainStats.map(stat => ({
      domain: stat.domain,
      count: stat._count.id,
      avgConfidence: stat._avg.confidence ?? 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        knowledge,
        total,
        domainDistribution,
      },
    })
  } catch (error) {
    console.error('Failed to fetch shared knowledge:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shared knowledge' },
      { status: 500 }
    )
  }
}

// POST /api/avatar/knowledge - Add new shared knowledge (from agent cycle insights)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { domain, insight, sourceType, confidence } = body

    if (!domain || !insight || !sourceType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: domain, insight, sourceType' },
        { status: 400 }
      )
    }

    const entry = await db.sharedKnowledge.create({
      data: {
        domain,
        insight,
        sourceType,
        confidence: typeof confidence === 'number' ? Math.max(0, Math.min(1, confidence)) : 0.5,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'avatar',
        entityType: 'SharedKnowledge',
        entityId: entry.id,
        details: JSON.stringify({ domain, sourceType }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      data: entry,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create shared knowledge:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create shared knowledge' },
      { status: 500 }
    )
  }
}

// PATCH /api/avatar/knowledge - Apply knowledge (increment appliedCount)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    const entry = await db.sharedKnowledge.update({
      where: { id },
      data: { appliedCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: entry,
    })
  } catch (error) {
    console.error('Failed to apply shared knowledge:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to apply shared knowledge' },
      { status: 500 }
    )
  }
}
