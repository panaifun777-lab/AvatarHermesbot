import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/geo/keywords - List keywords with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const verticalId = searchParams.get('verticalId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (verticalId) where.verticalId = verticalId
    if (category) where.category = category
    if (status) where.status = status

    const keywords = await db.gEOKeyword.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vertical: true,
        rankings: { orderBy: { capturedAt: 'desc' }, take: 5 },
      },
    })
    return NextResponse.json({ keywords })
  } catch (error) {
    console.error('Failed to fetch GEO keywords:', error)
    return NextResponse.json({ error: 'Failed to fetch GEO keywords' }, { status: 500 })
  }
}

// POST /api/geo/keywords - Create a new keyword
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      verticalId, keyword, keywordEn, category, intent,
      searchVolume, difficulty, currentRank, targetRank, status,
    } = body

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    const kw = await db.gEOKeyword.create({
      data: {
        verticalId: verticalId || null,
        keyword,
        keywordEn: keywordEn || null,
        category: category || 'core',
        intent: intent || 'informational',
        searchVolume: searchVolume ?? 0,
        difficulty: difficulty ?? 0,
        currentRank: currentRank ?? null,
        targetRank: targetRank ?? null,
        status: status || 'tracked',
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'geo',
        entityType: 'GEOKeyword',
        entityId: kw.id,
        details: JSON.stringify({ keyword, category }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ keyword: kw }, { status: 201 })
  } catch (error) {
    console.error('Failed to create GEO keyword:', error)
    return NextResponse.json({ error: 'Failed to create GEO keyword' }, { status: 500 })
  }
}
