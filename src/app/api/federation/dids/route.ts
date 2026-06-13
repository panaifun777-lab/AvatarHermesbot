import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const dids = await db.federationDID.findMany({
      include: {
        credentials: true,
        sentConnections: true,
        receivedConnections: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const stats = {
      total: dids.length,
      active: dids.filter(d => d.status === 'active').length,
      trustLevels: {
        bronze: dids.filter(d => d.trustLevel === 'bronze').length,
        silver: dids.filter(d => d.trustLevel === 'silver').length,
        gold: dids.filter(d => d.trustLevel === 'gold').length,
        platinum: dids.filter(d => d.trustLevel === 'platinum').length,
      },
    }

    return NextResponse.json({ success: true, data: { dids, stats } })
  } catch (error) {
    console.error('Failed to fetch DIDs:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch DIDs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { avatarName, avatarType, trustLevel } = body

    if (!avatarName) {
      return NextResponse.json({ success: false, error: 'avatarName is required' }, { status: 400 })
    }

    // Generate DID
    const did = `did:piaoshu:${avatarName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`
    const publicKey = `pk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`

    // Create DID Document
    const didDocument = JSON.stringify({
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: did,
      verificationMethod: [{
        id: `${did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: publicKey,
      }],
      authentication: [`${did}#key-1`],
      service: [{
        id: `${did}#piaoshu`,
        type: 'PiaoshuAvatar',
        serviceEndpoint: `https://piaoshu.ai/avatars/${did}`,
      }],
    })

    const didRecord = await db.federationDID.create({
      data: {
        did,
        avatarName,
        avatarType: avatarType || 'clone',
        trustLevel: trustLevel || 'bronze',
        publicKey,
        didDocument,
        status: 'active',
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'federation',
        entityType: 'FederationDID',
        entityId: didRecord.id,
        details: JSON.stringify({ did, avatarName }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true, data: { did: didRecord } })
  } catch (error) {
    console.error('Failed to create DID:', error)
    return NextResponse.json({ success: false, error: 'Failed to create DID' }, { status: 500 })
  }
}
