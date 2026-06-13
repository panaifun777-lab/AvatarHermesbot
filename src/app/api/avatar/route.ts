import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/avatar - Get current user's avatar clone
export async function GET(req: NextRequest) {
  try {
    let userId = req.nextUrl.searchParams.get('userId')

    // Auto-discover: if no userId, find the first user with a clone
    if (!userId) {
      const firstClone = await db.avatarClone.findFirst({
        orderBy: { createdAt: 'asc' },
        include: { user: true },
      })
      if (!firstClone) {
        return NextResponse.json({ clone: null })
      }
      userId = firstClone.userId
    }

    const clone = await db.avatarClone.findUnique({
      where: { userId },
      include: {
        agents: {
          orderBy: { createdAt: 'asc' },
        },
        skills: {
          orderBy: { category: 'asc' },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!clone) {
      return NextResponse.json({ clone: null })
    }

    return NextResponse.json({ clone: clone })
  } catch (error) {
    console.error('Failed to fetch avatar:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch avatar' },
      { status: 500 }
    )
  }
}

// POST /api/avatar - Create new avatar clone
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, name, persona, avatarStyle, avatarUrl } = body

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, error: 'userId and name are required' },
        { status: 400 }
      )
    }

    // Check if user already has a clone
    const existing = await db.avatarClone.findUnique({ where: { userId } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'User already has an avatar clone' },
        { status: 409 }
      )
    }

    const clone = await db.avatarClone.create({
      data: {
        userId,
        name,
        persona: persona || `你是${name}的数字AI分身。`,
        avatarStyle: avatarStyle || 'realistic',
        avatarUrl,
        status: 'active',
        lastActiveAt: new Date(),
      },
      include: {
        agents: true,
        skills: true,
      },
    })

    // Create activity
    await db.cloneActivity.create({
      data: {
        cloneId: clone.id,
        activityType: 'clone_created',
        title: '数字分身创建成功',
        description: `${name}的AI分身已激活`,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'avatar',
        entityType: 'AvatarClone',
        entityId: clone.id,
        details: JSON.stringify({ name }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ clone: clone }, { status: 201 })
  } catch (error) {
    console.error('Failed to create avatar:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create avatar' },
      { status: 500 }
    )
  }
}
