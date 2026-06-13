import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/bd/partners - List partners with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const verticalId = searchParams.get('verticalId')
    const partnerType = searchParams.get('partnerType')
    const stage = searchParams.get('stage')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (verticalId) where.verticalId = verticalId
    if (partnerType) where.partnerType = partnerType
    if (stage) where.stage = stage
    if (status) where.status = status

    const partners = await db.bDPartner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vertical: true,
        interactions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    return NextResponse.json({ partners })
  } catch (error) {
    console.error('Failed to fetch BD partners:', error)
    return NextResponse.json({ error: 'Failed to fetch BD partners' }, { status: 500 })
  }
}

// POST /api/bd/partners - Create a new BD partner
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      verticalId, name, partnerType, tier, industry, website,
      contactName, contactEmail, contactWechat, status, stage,
      valueScore, notes, bdScriptUsed, lastContactAt,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const partner = await db.bDPartner.create({
      data: {
        verticalId: verticalId || null,
        name,
        partnerType: partnerType || 'data_source',
        tier: tier || 'c',
        industry: industry || null,
        website: website || null,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactWechat: contactWechat || null,
        status: status || 'prospect',
        stage: stage || 'identified',
        valueScore: valueScore ?? 0,
        notes: notes || null,
        bdScriptUsed: bdScriptUsed || null,
        lastContactAt: lastContactAt ? new Date(lastContactAt) : null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'bd',
        entityType: 'BDPartner',
        entityId: partner.id,
        details: JSON.stringify({ name, partnerType: partner.partnerType, stage: partner.stage }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ partner }, { status: 201 })
  } catch (error) {
    console.error('Failed to create BD partner:', error)
    return NextResponse.json({ error: 'Failed to create BD partner' }, { status: 500 })
  }
}
