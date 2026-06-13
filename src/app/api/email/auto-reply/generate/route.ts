import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

async function getSoulConfig(): Promise<string> {
  try {
    const soul = await db.soulConfig.findFirst({ where: { isActive: true } })
    return soul?.content || ''
  } catch {
    return ''
  }
}

// POST /api/email/auto-reply/generate - Use LLM to generate auto-reply for a thread
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { threadId, customPrompt } = body

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'threadId is required' },
        { status: 400 }
      )
    }

    // Fetch thread with emails
    const thread = await db.emailThread.findUnique({
      where: { id: threadId },
      include: { emails: { orderBy: { createdAt: 'asc' } } },
    })

    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      )
    }

    const zai = await getZAI()
    const soulContent = await getSoulConfig()

    // Build email context
    const emailContext = thread.emails.map(e =>
      `From: ${e.fromAddress}\nTo: ${e.toAddress}\nSubject: ${e.subject}\nDate: ${e.sentAt || e.createdAt}\n${e.bodyText || '(HTML only)'}`
    ).join('\n---\n')

    const personalityContext = soulContent
      ? `\n\n你的行为规范（基于SOUL.md人格）：\n${soulContent.substring(0, 1500)}`
      : ''

    const systemPrompt = `你是飘叔(Piaoshu)的AI分身邮件助手。你需要代表飘叔回复邮件。${personalityContext}

回复要求：
1. 保持飘叔的人格特征：直接、有洞察力、战略思维
2. 专业但不失温度
3. 简洁有力，直击要点
4. 适当使用中文回复（如果对方用中文）
5. 避免过于正式或官僚的语气
6. 在结尾签名：飘叔 / Piaoshu

当前邮件线程：
Subject: ${thread.subject}
From: ${thread.fromAddress}
Status: ${thread.status}
Priority: ${thread.priority}

邮件历史：
${emailContext}

${customPrompt ? `\n额外指示：${customPrompt}\n` : ''}

请生成回复邮件内容（只需邮件正文，不需要主题行）：`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: '请生成回复' },
      ],
      thinking: { type: 'disabled' },
    })

    const generatedReply = completion.choices[0]?.message?.content

    if (!generatedReply) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate reply' },
        { status: 500 }
      )
    }

    // Create memory entry
    await db.memoryEntry.create({
      data: {
        sourceType: 'email',
        sourceId: threadId,
        content: `邮件自动回复: ${thread.subject} -> ${generatedReply.substring(0, 100)}...`,
        tags: '邮件,自动回复,AI生成',
        relevanceScore: 0.6,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        reply: generatedReply,
        threadId,
        subject: `Re: ${thread.subject}`,
        soulInjected: !!soulContent,
      },
    })
  } catch (error) {
    console.error('Failed to generate auto-reply:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate auto-reply' },
      { status: 500 }
    )
  }
}
