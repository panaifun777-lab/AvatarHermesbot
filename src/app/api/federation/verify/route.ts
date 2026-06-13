import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { credentialHash, subjectDid } = body

    if (!credentialHash) {
      return NextResponse.json({ success: false, error: 'credentialHash is required' }, { status: 400 })
    }

    // Find the VC
    const vc = await db.federationVC.findUnique({
      where: { credentialHash },
      include: { issuer: true },
    })

    if (!vc) {
      return NextResponse.json({
        success: true,
        data: {
          verified: false,
          reason: 'Credential not found',
          trustScore: 0,
        },
      })
    }

    // Verification checks
    const checks: { name: string; passed: boolean; detail: string }[] = []

    // 1. Check if VC is active
    const isActive = vc.status === 'active'
    checks.push({ name: '凭证状态', passed: isActive, detail: isActive ? '凭证状态正常' : `凭证状态为 ${vc.status}` })

    // 2. Check expiration
    const isNotExpired = !vc.expiresAt || new Date(vc.expiresAt) > new Date()
    checks.push({ name: '有效期', passed: isNotExpired, detail: isNotExpired ? '凭证未过期' : '凭证已过期' })

    // 3. Check issuer trust level
    const issuerTrustLevel = vc.issuer?.trustLevel || 'bronze'
    const trustLevelMap: Record<string, number> = { bronze: 0.25, silver: 0.5, gold: 0.75, platinum: 1.0 }
    const issuerTrustScore = trustLevelMap[issuerTrustLevel] || 0.25
    checks.push({
      name: '签发方信任等级',
      passed: issuerTrustScore >= 0.5,
      detail: `签发方信任等级: ${issuerTrustLevel} (${(issuerTrustScore * 100).toFixed(0)}%)`,
    })

    // 4. Check if issuer is active
    const issuerActive = vc.issuer?.status === 'active'
    checks.push({ name: '签发方状态', passed: issuerActive, detail: issuerActive ? '签发方状态正常' : '签发方已停用' })

    // 5. Subject DID match check (if provided)
    if (subjectDid) {
      const subjectMatch = vc.subjectDid === subjectDid
      checks.push({ name: '主体匹配', passed: subjectMatch, detail: subjectMatch ? '主体DID匹配' : '主体DID不匹配' })
    }

    // 6. Check if VC has been verified before
    const isPreviouslyVerified = !!vc.verifiedAt
    checks.push({
      name: '历史验证',
      passed: isPreviouslyVerified,
      detail: isPreviouslyVerified ? `上次验证: ${vc.verifiedAt?.toISOString()}` : '首次验证',
    })

    // Calculate trust score
    const passedChecks = checks.filter(c => c.passed).length
    const trustScore = Math.round((passedChecks / checks.length) * 100) / 100

    // Mark as verified
    if (trustScore >= 0.5 && !vc.verifiedAt) {
      await db.federationVC.update({
        where: { id: vc.id },
        data: { verifiedAt: new Date() },
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'verify',
        module: 'federation',
        entityType: 'FederationVC',
        entityId: vc.id,
        details: JSON.stringify({ credentialHash, trustScore, checks }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        verified: trustScore >= 0.5,
        trustScore,
        checks,
        vc: {
          id: vc.id,
          vcType: vc.vcType,
          issuerDid: vc.issuerDid,
          subjectDid: vc.subjectDid,
          status: vc.status,
          expiresAt: vc.expiresAt,
          issuer: vc.issuer ? { did: vc.issuer.did, avatarName: vc.issuer.avatarName, trustLevel: vc.issuer.trustLevel } : null,
        },
      },
    })
  } catch (error) {
    console.error('Failed to verify VC:', error)
    return NextResponse.json({ success: false, error: 'Failed to verify VC' }, { status: 500 })
  }
}
