import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/bd/interactions - List interactions with optional partnerId filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const partnerId = searchParams.get('partnerId')

    const where: Record<string, unknown> = {}
    if (partnerId) where.partnerId = partnerId

    const interactions = await db.bDInteraction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { partner: true },
    })
    return NextResponse.json({ interactions })
  } catch (error) {
    console.error('Failed to fetch BD interactions:', error)
    return NextResponse.json({ error: 'Failed to fetch BD interactions' }, { status: 500 })
  }
}

// POST /api/bd/interactions - Create a new interaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { partnerId, type, subject, content, outcome, nextAction, followUpDate } = body

    if (!partnerId || !type || !subject) {
      return NextResponse.json({ error: 'partnerId, type, and subject are required' }, { status: 400 })
    }

    const interaction = await db.bDInteraction.create({
      data: {
        partnerId,
        type,
        subject,
        content: content || null,
        outcome: outcome || null,
        nextAction: nextAction || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
    })

    // Update partner's lastContactAt
    await db.bDPartner.update({
      where: { id: partnerId },
      data: { lastContactAt: new Date() },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'bd',
        entityType: 'BDInteraction',
        entityId: interaction.id,
        details: JSON.stringify({ partnerId, type, subject }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ interaction }, { status: 201 })
  } catch (error) {
    console.error('Failed to create BD interaction:', error)
    return NextResponse.json({ error: 'Failed to create BD interaction' }, { status: 500 })
  }
}
