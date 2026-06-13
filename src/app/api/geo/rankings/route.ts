import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/geo/rankings - List rankings with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keywordId = searchParams.get('keywordId')
    const source = searchParams.get('source')

    const where: Record<string, unknown> = {}
    if (keywordId) where.keywordId = keywordId
    if (source) where.source = source

    const rankings = await db.gEORanking.findMany({
      where,
      orderBy: { capturedAt: 'desc' },
      include: { keyword: true },
    })
    return NextResponse.json({ rankings })
  } catch (error) {
    console.error('Failed to fetch GEO rankings:', error)
    return NextResponse.json({ error: 'Failed to fetch GEO rankings' }, { status: 500 })
  }
}

// POST /api/geo/rankings - Create a new ranking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { keywordId, rank, aiCitation, citationUrl, source, capturedAt } = body

    if (!keywordId || rank === undefined) {
      return NextResponse.json({ error: 'keywordId and rank are required' }, { status: 400 })
    }

    const ranking = await db.gEORanking.create({
      data: {
        keywordId,
        rank,
        aiCitation: aiCitation ?? false,
        citationUrl: citationUrl || null,
        source: source || 'google',
        capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
      },
    })

    // Update the keyword's currentRank
    await db.gEOKeyword.update({
      where: { id: keywordId },
      data: { currentRank: rank },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'geo',
        entityType: 'GEORanking',
        entityId: ranking.id,
        details: JSON.stringify({ keywordId, rank, source }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ ranking }, { status: 201 })
  } catch (error) {
    console.error('Failed to create GEO ranking:', error)
    return NextResponse.json({ error: 'Failed to create GEO ranking' }, { status: 500 })
  }
}
