import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/media/verticals - List all verticals
export async function GET() {
  try {
    const verticals = await db.mediaVertical.findMany({
      orderBy: { priority: 'desc' },
      include: {
        _count: { select: { channels: true, contents: true, partners: true, keywords: true } },
      },
    })
    return NextResponse.json({ verticals })
  } catch (error) {
    console.error('Failed to fetch verticals:', error)
    return NextResponse.json({ error: 'Failed to fetch verticals' }, { status: 500 })
  }
}

// POST /api/media/verticals - Create a new vertical
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, icon, color, description, status, priority } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const vertical = await db.mediaVertical.create({
      data: {
        name,
        slug,
        icon: icon || null,
        color: color || null,
        description: description || null,
        status: status || 'active',
        priority: priority ?? 0,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'media',
        entityType: 'MediaVertical',
        entityId: vertical.id,
        details: JSON.stringify({ name, slug }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ vertical }, { status: 201 })
  } catch (error) {
    console.error('Failed to create vertical:', error)
    return NextResponse.json({ error: 'Failed to create vertical' }, { status: 500 })
  }
}
