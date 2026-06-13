import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/avatar/activities - List recent activities (paginated)
export async function GET(req: NextRequest) {
  try {
    let cloneId = req.nextUrl.searchParams.get('cloneId')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

    // Auto-discover first clone if no cloneId provided
    if (!cloneId) {
      const firstClone = await db.avatarClone.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!firstClone) {
        return NextResponse.json({ activities: [], pagination: { total: 0, limit, offset } })
      }
      cloneId = firstClone.id
    }

    const [activities, total] = await Promise.all([
      db.cloneActivity.findMany({
        where: { cloneId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      db.cloneActivity.count({ where: { cloneId } }),
    ])

    return NextResponse.json({
      activities: activities,
      pagination: { total, limit, offset },
    })
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
