import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/media/contents - List contents with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const verticalId = searchParams.get('verticalId')
    const status = searchParams.get('status')
    const contentType = searchParams.get('contentType')

    const where: Record<string, unknown> = {}
    if (verticalId) where.verticalId = verticalId
    if (status) where.status = status
    if (contentType) where.contentType = contentType

    const contents = await db.mediaContent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { vertical: true },
    })
    return NextResponse.json({ contents })
  } catch (error) {
    console.error('Failed to fetch contents:', error)
    return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 })
  }
}

// POST /api/media/contents - Create a new content
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      verticalId, channelId, title, contentType, status,
      contentData, citationUrl, contentHash, onChainTxId,
      schemaMarkup, reachCount, citationCount, aiCitationCount, publishedAt,
    } = body

    if (!verticalId || !title) {
      return NextResponse.json({ error: 'verticalId and title are required' }, { status: 400 })
    }

    const content = await db.mediaContent.create({
      data: {
        verticalId,
        channelId: channelId || null,
        title,
        contentType: contentType || 'article',
        status: status || 'draft',
        contentData: contentData || null,
        citationUrl: citationUrl || null,
        contentHash: contentHash || null,
        onChainTxId: onChainTxId || null,
        schemaMarkup: schemaMarkup || null,
        reachCount: reachCount ?? 0,
        citationCount: citationCount ?? 0,
        aiCitationCount: aiCitationCount ?? 0,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'media',
        entityType: 'MediaContent',
        entityId: content.id,
        details: JSON.stringify({ title, contentType, verticalId }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ content }, { status: 201 })
  } catch (error) {
    console.error('Failed to create content:', error)
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 })
  }
}
