import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/media/channels - List channels with optional verticalId filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const verticalId = searchParams.get('verticalId')

    const where: Record<string, unknown> = {}
    if (verticalId) where.verticalId = verticalId

    const channels = await db.mediaChannel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { vertical: true },
    })
    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Failed to fetch channels:', error)
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
  }
}

// POST /api/media/channels - Create a new channel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { verticalId, name, platform, url, followers, avgReach, postFrequency, status, avatarUrl } = body

    if (!verticalId || !name || !platform) {
      return NextResponse.json({ error: 'verticalId, name, and platform are required' }, { status: 400 })
    }

    const channel = await db.mediaChannel.create({
      data: {
        verticalId,
        name,
        platform,
        url: url || null,
        followers: followers ?? 0,
        avgReach: avgReach ?? 0,
        postFrequency: postFrequency || 'daily',
        status: status || 'active',
        avatarUrl: avatarUrl || null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'media',
        entityType: 'MediaChannel',
        entityId: channel.id,
        details: JSON.stringify({ name, platform, verticalId }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error('Failed to create channel:', error)
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 })
  }
}
