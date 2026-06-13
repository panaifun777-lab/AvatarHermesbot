import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Check if already seeded
    const existing = await db.federationDID.count()
    if (existing > 0) {
      return NextResponse.json({ success: true, data: { message: 'Already seeded', count: existing } })
    }

    // 1. Create 4 avatar DIDs with different trust levels
    const did1 = await db.federationDID.create({
      data: {
        did: 'did:piaoshu:piaoshu-ceo-abc123',
        avatarName: '飘叔CEO',
        avatarType: 'clone',
        trustLevel: 'platinum',
        publicKey: 'pk_ceo_abc123def456',
        status: 'active',
        didDocument: JSON.stringify({
          '@context': ['https://www.w3.org/ns/did/v1'],
          id: 'did:piaoshu:piaoshu-ceo-abc123',
          verificationMethod: [{ id: 'did:piaoshu:piaoshu-ceo-abc123#key-1', type: 'Ed25519VerificationKey2020' }],
        }),
      },
    })

    const did2 = await db.federationDID.create({
      data: {
        did: 'did:piaoshu:tech-cto-def456',
        avatarName: '技术总监CTO',
        avatarType: 'clone',
        trustLevel: 'gold',
        publicKey: 'pk_cto_def456ghi789',
        status: 'active',
        didDocument: JSON.stringify({
          '@context': ['https://www.w3.org/ns/did/v1'],
          id: 'did:piaoshu:tech-cto-def456',
          verificationMethod: [{ id: 'did:piaoshu:tech-cto-def456#key-1', type: 'Ed25519VerificationKey2020' }],
        }),
      },
    })

    const did3 = await db.federationDID.create({
      data: {
        did: 'did:piaoshu:growth-lead-ghi789',
        avatarName: '增长负责人',
        avatarType: 'clone',
        trustLevel: 'silver',
        publicKey: 'pk_growth_ghi789jkl012',
        status: 'active',
        didDocument: JSON.stringify({
          '@context': ['https://www.w3.org/ns/did/v1'],
          id: 'did:piaoshu:growth-lead-ghi789',
          verificationMethod: [{ id: 'did:piaoshu:growth-lead-ghi789#key-1', type: 'Ed25519VerificationKey2020' }],
        }),
      },
    })

    const did4 = await db.federationDID.create({
      data: {
        did: 'did:piaoshu:engineer-jkl012',
        avatarName: '工程师Agent',
        avatarType: 'clone',
        trustLevel: 'bronze',
        publicKey: 'pk_eng_jkl012mno345',
        status: 'active',
        didDocument: JSON.stringify({
          '@context': ['https://www.w3.org/ns/did/v1'],
          id: 'did:piaoshu:engineer-jkl012',
          verificationMethod: [{ id: 'did:piaoshu:engineer-jkl012#key-1', type: 'Ed25519VerificationKey2020' }],
        }),
      },
    })

    // 2. Create 8 verifiable credentials
    const vcData = [
      { vcType: 'SkillProof', issuerDid: did1.did, subjectDid: did2.did, claims: { skill: 'System Architecture', level: 'Expert', verifiedBy: 'CEO Agent' }, status: 'active' },
      { vcType: 'SkillProof', issuerDid: did1.did, subjectDid: did3.did, claims: { skill: 'Growth Hacking', level: 'Advanced', verifiedBy: 'CEO Agent' }, status: 'active' },
      { vcType: 'SkillProof', issuerDid: did2.did, subjectDid: did4.did, claims: { skill: 'Full-Stack Development', level: 'Intermediate', verifiedBy: 'CTO Agent' }, status: 'active' },
      { vcType: 'AchievementProof', issuerDid: did1.did, subjectDid: did2.did, claims: { achievement: 'Shipped v1.0', date: '2025-01-15', impact: 'High' }, status: 'active' },
      { vcType: 'AchievementProof', issuerDid: did2.did, subjectDid: did4.did, claims: { achievement: 'Zero-downtime deployment', date: '2025-02-01', impact: 'Medium' }, status: 'active' },
      { vcType: 'TrustAttestation', issuerDid: did2.did, subjectDid: did3.did, claims: { trust: 'Reliable partner for 6 months', score: 0.85 }, status: 'active' },
      { vcType: 'TrustAttestation', issuerDid: did3.did, subjectDid: did1.did, claims: { trust: 'Strategic vision alignment', score: 0.92 }, status: 'active' },
      { vcType: 'CollaborationRecord', issuerDid: did1.did, subjectDid: did4.did, claims: { task: 'API Integration Sprint', duration: '2 weeks', outcome: 'Success', quality: 'A+' }, status: 'pending' },
    ]

    const vcs = []
    for (const vc of vcData) {
      const created = await db.federationVC.create({
        data: {
          ...vc,
          credentialHash: `vc_hash_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`,
          claims: JSON.stringify(vc.claims),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          verifiedAt: vc.status === 'active' ? new Date() : null,
        },
      })
      vcs.push(created)
    }

    // 3. Create 5 trust connections
    const connections = []
    const connData = [
      { senderDid: did1.did, receiverDid: did2.did, strength: 0.95, connectionType: 'collaboration' },
      { senderDid: did1.did, receiverDid: did3.did, strength: 0.88, connectionType: 'mentorship' },
      { senderDid: did2.did, receiverDid: did4.did, strength: 0.82, connectionType: 'delegation' },
      { senderDid: did3.did, receiverDid: did2.did, strength: 0.75, connectionType: 'verification' },
      { senderDid: did4.did, receiverDid: did1.did, strength: 0.68, connectionType: 'collaboration' },
    ]

    for (const conn of connData) {
      const created = await db.trustConnection.create({ data: conn })
      connections.push(created)
    }

    // 4. Create cross-avatar messages
    const messages = []
    const msgData = [
      { senderDid: did1.did, receiverDid: did2.did, messageType: 'task_assignment', content: { task: 'Review system architecture for v2.0', priority: 'high', deadline: '2025-03-15' } },
      { senderDid: did2.did, receiverDid: did4.did, messageType: 'task_assignment', content: { task: 'Implement federation layer API', priority: 'medium', deadline: '2025-03-20' } },
      { senderDid: did3.did, receiverDid: did1.did, messageType: 'knowledge_share', content: { insight: 'User retention improved 23% with personalized onboarding', source: 'A/B test results' } },
      { senderDid: did4.did, receiverDid: did2.did, messageType: 'collaboration_invite', content: { project: 'DID Verification Module', role: 'Technical Reviewer', estimatedHours: 8 } },
      { senderDid: did1.did, receiverDid: did3.did, messageType: 'trust_request', content: { request: 'Verify growth metrics for Q1 report', evidence: 'analytics_dashboard_link' } },
    ]

    for (const msg of msgData) {
      const created = await db.crossAvatarMessage.create({
        data: {
          ...msg,
          content: JSON.stringify(msg.content),
          status: 'delivered',
        },
      })
      messages.push(created)
    }

    return NextResponse.json({
      success: true,
      data: {
        dids: 4,
        vcs: vcs.length,
        connections: connections.length,
        messages: messages.length,
      },
    })
  } catch (error) {
    console.error('Failed to seed federation data:', error)
    return NextResponse.json({ success: false, error: 'Failed to seed federation data' }, { status: 500 })
  }
}
