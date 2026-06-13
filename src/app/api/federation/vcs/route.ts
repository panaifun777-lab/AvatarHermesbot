import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const vcType = searchParams.get('vcType')
    const status = searchParams.get('status')
    const issuerDid = searchParams.get('issuerDid')

    const where: Record<string, unknown> = {}
    if (vcType) where.vcType = vcType
    if (status) where.status = status
    if (issuerDid) where.issuerDid = issuerDid

    const vcs = await db.federationVC.findMany({
      where,
      include: { issuer: true },
      orderBy: { createdAt: 'desc' },
    })

    const stats = {
      total: vcs.length,
      active: vcs.filter(v => v.status === 'active').length,
      pending: vcs.filter(v => v.status === 'pending').length,
      revoked: vcs.filter(v => v.status === 'revoked').length,
      byType: {
        SkillProof: vcs.filter(v => v.vcType === 'SkillProof').length,
        AchievementProof: vcs.filter(v => v.vcType === 'AchievementProof').length,
        TrustAttestation: vcs.filter(v => v.vcType === 'TrustAttestation').length,
        CollaborationRecord: vcs.filter(v => v.vcType === 'CollaborationRecord').length,
      },
    }

    return NextResponse.json({ success: true, data: { vcs, stats } })
  } catch (error) {
    console.error('Failed to fetch VCs:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch VCs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vcType, issuerDid, subjectDid, claims, expiresAt } = body

    if (!vcType || !issuerDid || !subjectDid) {
      return NextResponse.json({ success: false, error: 'vcType, issuerDid, subjectDid are required' }, { status: 400 })
    }

    // Verify issuer DID exists
    const issuer = await db.federationDID.findUnique({ where: { did: issuerDid } })
    if (!issuer) {
      return NextResponse.json({ success: false, error: 'Issuer DID not found' }, { status: 404 })
    }

    // Generate credential hash
    const credentialHash = `vc_hash_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`

    const vc = await db.federationVC.create({
      data: {
        vcType,
        issuerDid,
        subjectDid,
        credentialHash,
        claims: claims ? JSON.stringify(claims) : '{}',
        status: 'active',
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        verifiedAt: new Date(),
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'federation',
        entityType: 'FederationVC',
        entityId: vc.id,
        details: JSON.stringify({ vcType, issuerDid, subjectDid, credentialHash }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true, data: { vc } })
  } catch (error) {
    console.error('Failed to issue VC:', error)
    return NextResponse.json({ success: false, error: 'Failed to issue VC' }, { status: 500 })
  }
}
