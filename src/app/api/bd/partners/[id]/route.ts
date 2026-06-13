import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/bd/partners/[id] - Get single BD partner
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const partner = await db.bDPartner.findUnique({
      where: { id },
      include: {
        vertical: true,
        interactions: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!partner) {
      return NextResponse.json({ error: 'BD partner not found' }, { status: 404 })
    }
    return NextResponse.json({ partner })
  } catch (error) {
    console.error('Failed to fetch BD partner:', error)
    return NextResponse.json({ error: 'Failed to fetch BD partner' }, { status: 500 })
  }
}

// PUT /api/bd/partners/[id] - Update a BD partner
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const allowedFields = [
      'verticalId', 'name', 'partnerType', 'tier', 'industry', 'website',
      'contactName', 'contactEmail', 'contactWechat', 'status', 'stage',
      'valueScore', 'notes', 'bdScriptUsed', 'lastContactAt',
    ]
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'lastContactAt' && typeof body[key] === 'string') {
          data[key] = new Date(body[key])
        } else {
          data[key] = body[key]
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const partner = await db.bDPartner.update({ where: { id }, data })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'bd',
        entityType: 'BDPartner',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ partner })
  } catch (error) {
    console.error('Failed to update BD partner:', error)
    return NextResponse.json({ error: 'Failed to update BD partner' }, { status: 500 })
  }
}

// DELETE /api/bd/partners/[id] - Delete a BD partner
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.bDPartner.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'bd',
        entityType: 'BDPartner',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete BD partner:', error)
    return NextResponse.json({ error: 'Failed to delete BD partner' }, { status: 500 })
  }
}
