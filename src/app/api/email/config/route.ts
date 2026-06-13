import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/email/config - Get email configuration
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') || 'demo'
    const config = await db.emailConfig.findFirst({
      where: { userId },
    })

    if (!config) {
      return NextResponse.json({ success: true, data: null })
    }

    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('Failed to fetch email config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email config' },
      { status: 500 }
    )
  }
}

// POST /api/email/config - Create or update email configuration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      emailaddress,
      imapHost,
      imapPort,
      smtpHost,
      smtpPort,
      isEnabled,
      autoReplyEnabled,
      autoReplyTemplate,
      trackingEnabled,
    } = body

    if (!userId || !emailaddress) {
      return NextResponse.json(
        { success: false, error: 'userId and emailaddress are required' },
        { status: 400 }
      )
    }

    const existing = await db.emailConfig.findFirst({ where: { userId } })

    let config
    if (existing) {
      config = await db.emailConfig.update({
        where: { id: existing.id },
        data: {
          emailaddress,
          imapHost,
          imapPort: imapPort || 993,
          smtpHost,
          smtpPort: smtpPort || 587,
          isEnabled: isEnabled ?? existing.isEnabled,
          autoReplyEnabled: autoReplyEnabled ?? existing.autoReplyEnabled,
          autoReplyTemplate,
          trackingEnabled: trackingEnabled ?? existing.trackingEnabled,
        },
      })
    } else {
      config = await db.emailConfig.create({
        data: {
          userId,
          emailaddress,
          imapHost,
          imapPort: imapPort || 993,
          smtpHost,
          smtpPort: smtpPort || 587,
          isEnabled: isEnabled ?? false,
          autoReplyEnabled: autoReplyEnabled ?? false,
          autoReplyTemplate,
          trackingEnabled: trackingEnabled ?? true,
        },
      })
    }

    await db.auditLog.create({
      data: {
        action: existing ? 'update' : 'create',
        module: 'email',
        entityType: 'EmailConfig',
        entityId: config.id,
        details: JSON.stringify({ emailaddress }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('Failed to save email config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save email config' },
      { status: 500 }
    )
  }
}
