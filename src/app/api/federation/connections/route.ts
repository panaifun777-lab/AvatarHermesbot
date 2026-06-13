import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const senderDid = searchParams.get('senderDid')
    const receiverDid = searchParams.get('receiverDid')

    const where: Record<string, unknown> = {}
    if (senderDid) where.senderDid = senderDid
    if (receiverDid) where.receiverDid = receiverDid

    const connections = await db.trustConnection.findMany({
      where,
      include: { sender: true, receiver: true },
      orderBy: { createdAt: 'desc' },
    })

    const stats = {
      total: connections.length,
      avgStrength: connections.length > 0
        ? connections.reduce((sum, c) => sum + c.strength, 0) / connections.length
        : 0,
      byType: {
        collaboration: connections.filter(c => c.connectionType === 'collaboration').length,
        mentorship: connections.filter(c => c.connectionType === 'mentorship').length,
        delegation: connections.filter(c => c.connectionType === 'delegation').length,
        verification: connections.filter(c => c.connectionType === 'verification').length,
      },
    }

    return NextResponse.json({ success: true, data: { connections, stats } })
  } catch (error) {
    console.error('Failed to fetch connections:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch connections' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { senderDid, receiverDid, strength, connectionType } = body

    if (!senderDid || !receiverDid) {
      return NextResponse.json({ success: false, error: 'senderDid and receiverDid are required' }, { status: 400 })
    }

    // Verify both DIDs exist
    const sender = await db.federationDID.findUnique({ where: { did: senderDid } })
    const receiver = await db.federationDID.findUnique({ where: { did: receiverDid } })
    if (!sender) {
      return NextResponse.json({ success: false, error: 'Sender DID not found' }, { status: 404 })
    }
    if (!receiver) {
      return NextResponse.json({ success: false, error: 'Receiver DID not found' }, { status: 404 })
    }

    const connection = await db.trustConnection.create({
      data: {
        senderDid,
        receiverDid,
        strength: strength ?? 0.5,
        connectionType: connectionType || 'collaboration',
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'federation',
        entityType: 'TrustConnection',
        entityId: connection.id,
        details: JSON.stringify({ senderDid, receiverDid, strength }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true, data: { connection } })
  } catch (error) {
    console.error('Failed to create connection:', error)
    return NextResponse.json({ success: false, error: 'Failed to create connection' }, { status: 500 })
  }
}
