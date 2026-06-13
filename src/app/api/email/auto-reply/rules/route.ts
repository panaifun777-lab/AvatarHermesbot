import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/email/auto-reply/rules - List auto-reply rules
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') || 'demo'

    const rules = await db.autoReplyRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: rules })
  } catch (error) {
    console.error('Failed to fetch auto-reply rules:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auto-reply rules' },
      { status: 500 }
    )
  }
}

// POST /api/email/auto-reply/rules - Create auto-reply rule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, name, description, condition, template, agentId, priority, isEnabled } = body

    if (!userId || !name || !condition || !template) {
      return NextResponse.json(
        { success: false, error: 'userId, name, condition, and template are required' },
        { status: 400 }
      )
    }

    const rule = await db.autoReplyRule.create({
      data: {
        userId,
        name,
        description,
        condition: typeof condition === 'string' ? condition : JSON.stringify(condition),
        template,
        agentId,
        priority: priority || 'normal',
        isEnabled: isEnabled ?? true,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'email',
        entityType: 'AutoReplyRule',
        entityId: rule.id,
        details: JSON.stringify({ name }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true, data: rule }, { status: 201 })
  } catch (error) {
    console.error('Failed to create auto-reply rule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create auto-reply rule' },
      { status: 500 }
    )
  }
}
