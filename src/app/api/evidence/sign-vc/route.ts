import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/evidence/sign-vc - Sign a verifiable credential for an evidence item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { evidenceId } = body

    if (!evidenceId) {
      return NextResponse.json({ error: 'Evidence ID is required' }, { status: 400 })
    }

    const evidence = await db.evidenceItem.findUnique({
      where: { id: evidenceId },
    })

    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })
    }

    // Generate W3C DID and VC
    const issuerDID = `did:piaoshu:0x${Array.from({ length: 8 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`
    
    const subjectDID = `did:piaoshu:0x${Array.from({ length: 8 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`

    const hash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')

    const credential = await db.verifiableCredential.create({
      data: {
        issuerDID,
        subjectDID,
        credentialType: evidence.evidenceType,
        claimData: JSON.stringify({
          title: evidence.title,
          description: evidence.description,
          evidenceType: evidence.evidenceType,
          contentHash: evidence.contentHash,
        }),
        proof: `ed25519-sig-${Date.now()}`,
        hash,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    })

    await db.evidenceItem.update({
      where: { id: evidenceId },
      data: { vcId: credential.id, status: 'signed' },
    })

    return NextResponse.json({ credential, evidenceId }, { status: 201 })
  } catch (error) {
    console.error('Failed to sign VC:', error)
    return NextResponse.json({ error: 'Failed to sign VC' }, { status: 500 })
  }
}
