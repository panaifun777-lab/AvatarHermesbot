import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { wakeUp, loadL3Search } from '@/lib/memory-loader'
import { compress, generateContentHash } from '@/lib/aaak-compressor'

// Singleton for ZAI instance
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

// Safe DB operation wrapper - returns null on failure (e.g., Vercel serverless without DB)
async function safeDbOp<T>(op: () => Promise<T>): Promise<T | null> {
  try {
    return await op()
  } catch {
    return null
  }
}

// Default system prompt for piaoshu founder system
const DEFAULT_SYSTEM_PROMPT = `你是飘叔(Piaoshu)AI分身操作系统的AI共生体。你的角色是：
1. 作为创始人的数字分身，帮助分析战略决策
2. 进行红蓝对抗思维，识别致命漏洞
3. 基于数据证据给出建议，拒绝模糊表述
4. 所有输出必须附带置信度评分（0-1）
5. 当置信度低于0.6时，明确建议人工介入

系统架构：
- 认知分片引擎：基于创始人语料训练的数字分身，进行红蓝对抗
- 可信证据链：W3C DID+VC规范，消除AI幻觉
- 流体协作调度器：动态分配任务给AI或人类节点
- 虚实共生沙盒：直接生成可交互3D原型

当前处于Phase 1（D1-D30）：基建与协议验证阶段。`

// DeepSeek API call using standard fetch (OpenAI-compatible)
async function callDeepSeek(
  messages: Array<{ role: string; content: string }>,
  model: string = 'deepseek-chat',
  apiKeyOverride?: string
): Promise<{ content: string | null; provider: string }> {
  const apiKey = apiKeyOverride || process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not set. Please configure it in Settings > AI Model Config.')
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content || null,
    provider: 'deepseek',
  }
}

// Z-AI SDK call (fallback)
async function callZAI(
  messages: Array<{ role: string; content: string }>
): Promise<{ content: string | null; provider: string }> {
  const zai = await getZAI()
  const completion = await zai.chat.completions.create({
    messages: messages as Array<{ role: 'assistant' | 'user'; content: string }>,
    thinking: { type: 'disabled' },
  })
  return {
    content: completion.choices[0]?.message?.content || null,
    provider: 'z-ai-sdk',
  }
}

// ===== Memory Palace Integration =====

/**
 * Build memory context from Memory Palace for the clone
 * Loads L0 (identity) + L1 (essential facts) and optionally L3 (deep search)
 */
async function buildMemoryContext(
  cloneId: string | undefined,
  userMessage: string
): Promise<{ memoryContext: string; cloneId: string | undefined }> {
  if (!cloneId) {
    // Try to find the first clone
    const firstClone = await safeDbOp(() => db.avatarClone.findFirst())
    cloneId = firstClone?.id
  }

  if (!cloneId) {
    return { memoryContext: '', cloneId: undefined }
  }

  try {
    // Load L0 + L1 via wakeUp
    const wakeUpResult = await wakeUp(cloneId)

    // Determine if L3 deep search is needed based on user message keywords
    const needsDeepSearch = /技术选型|架构设计|商业模式|融资|增长|社区|去中心化|Web4|AFC|Avatar|Agent|PoUE|PAS|情感/.test(userMessage)

    let deepSearchContext = ''
    if (needsDeepSearch) {
      const l3Results = await loadL3Search(cloneId, userMessage, 5)
      if (l3Results.length > 0) {
        deepSearchContext = '\n\n[DEEP MEMORY RECALL]\n' +
          l3Results.map(r => `[${r.wingName}/${r.roomName}] ${r.aaaakSummary || r.content.substring(0, 300)}`).join('\n')
      }
    }

    const memoryContext = wakeUpResult.combined + deepSearchContext
    return { memoryContext, cloneId }
  } catch {
    // Memory loading failed, continue without memory context
    return { memoryContext: '', cloneId }
  }
}

/**
 * Auto-save important conversation content to Memory Drawers
 * Extracts key decisions, preferences, and insights from conversations
 */
async function autoSaveToMemory(
  cloneId: string | undefined,
  userMessage: string,
  assistantResponse: string,
  sessionId: string | undefined
): Promise<void> {
  if (!cloneId) return

  // Determine if the conversation is significant enough to save
  const isSignificant =
    userMessage.length > 50 ||
    /决策|战略|风险|分析|评估|选型|架构|商业模式|融资|增长|选型|原则|信念|反对|坚持/.test(userMessage)

  if (!isSignificant) return

  try {
    // Determine which wing/room to save to based on keyword matching
    const { wingName, roomName, hallType, tags } = classifyConversation(userMessage)

    // Find or create the wing
    let wing = await safeDbOp(() =>
      db.memoryWing.findFirst({ where: { cloneId, name: wingName } })
    )

    if (!wing) return // Wing not found, skip saving (don't auto-create wings)

    // Find or create the room
    let room = await safeDbOp(() =>
      db.memoryRoom.findFirst({ where: { wingId: wing!.id, name: roomName } })
    )

    if (!room) {
      room = await safeDbOp(() =>
        db.memoryRoom.create({
          data: {
            wingId: wing!.id,
            name: roomName,
            hallType,
          },
        })
      )
    }

    if (!room) return

    // Create the drawer content
    const content = `对话记忆: Q=${userMessage.substring(0, 150)} | A=${assistantResponse.substring(0, 150)}`

    // Check for duplicate
    const contentHash = generateContentHash(content)
    const existing = await safeDbOp(() =>
      db.memoryDrawer.findFirst({ where: { roomId: room!.id, contentHash } })
    )
    if (existing) return

    // Generate AAAK summary
    const aaaakResult = compress(content, {
      importance: 3.5,
      sourceType: 'chat',
      tags,
    })

    // Get next chunk index
    const lastDrawer = await safeDbOp(() =>
      db.memoryDrawer.findFirst({
        where: { roomId: room!.id },
        orderBy: { chunkIndex: 'desc' },
        select: { chunkIndex: true },
      })
    )

    // Create drawer
    const drawer = await safeDbOp(() =>
      db.memoryDrawer.create({
        data: {
          roomId: room!.id,
          content,
          aaaakSummary: aaaakResult.summary,
          chunkIndex: (lastDrawer?.chunkIndex || 0) + 1,
          sourceType: 'chat',
          sourceId: sessionId,
          importance: 3.5,
          contentHash,
        },
      })
    )

    if (drawer) {
      // Create tags
      for (const tag of tags.slice(0, 10)) {
        await safeDbOp(() =>
          db.drawerTag.create({ data: { drawerId: drawer.id, tag } })
        )
      }

      // Update room drawer count
      await safeDbOp(() =>
        db.memoryRoom.update({
          where: { id: room!.id },
          data: { drawerCount: { increment: 1 } },
        })
      )
    }
  } catch {
    // Auto-save failure should not block the chat response
  }
}

/**
 * Extract entities and relationships from conversation text (basic keyword extraction)
 */
async function extractEntitiesFromConversation(
  cloneId: string,
  text: string
): Promise<void> {
  // Define entity patterns to look for
  const entityPatterns: Array<{ pattern: RegExp; entityType: string; name: string }> = [
    { pattern: /AFC公链/, entityType: 'technology', name: 'AFC公链' },
    { pattern: /AIBBS/, entityType: 'organization', name: 'AIBBS论坛' },
    { pattern: /Web4\.0/, entityType: 'concept', name: 'Web4.0' },
    { pattern: /Web3\.0/, entityType: 'concept', name: 'Web3.0' },
    { pattern: /PoUE/, entityType: 'technology', name: 'PoUE共识' },
    { pattern: /PAS算法/, entityType: 'technology', name: 'PAS算法' },
    { pattern: /Avatar/, entityType: 'concept', name: 'Avatar' },
    { pattern: /Agent/, entityType: 'concept', name: 'Agent' },
    { pattern: /MPC/, entityType: 'technology', name: 'MPC多方计算' },
    { pattern: /TEE/, entityType: 'technology', name: 'TEE可信执行' },
    { pattern: /128维情感/, entityType: 'technology', name: '128维情感向量' },
    { pattern: /超我/, entityType: 'technology', name: '超我Superego' },
    { pattern: /AAAK/, entityType: 'technology', name: 'AAAK压缩' },
    { pattern: /数字永生/, entityType: 'concept', name: '数字永生' },
    { pattern: /意识主权/, entityType: 'concept', name: '意识主权' },
    { pattern: /CNAH/, entityType: 'technology', name: 'CNAH栖息地' },
    { pattern: /x402/, entityType: 'technology', name: 'x402协议' },
  ]

  const foundEntities: string[] = []

  for (const { pattern, entityType, name } of entityPatterns) {
    if (pattern.test(text)) {
      // Ensure entity exists in KG
      await safeDbOp(() =>
        db.kGEntity.upsert({
          where: { id: `kg_${cloneId}_${name}` },
          create: {
            id: `kg_${cloneId}_${name}`,
            cloneId,
            name,
            entityType,
          },
          update: {},
        })
      )
      foundEntities.push(name)
    }
  }

  // If we found 2+ entities in the same text, create a "mentions_together" relationship
  if (foundEntities.length >= 2) {
    for (let i = 0; i < foundEntities.length - 1; i++) {
      for (let j = i + 1; j < foundEntities.length; j++) {
        const subjectId = `kg_${cloneId}_${foundEntities[i]}`
        const objectId = `kg_${cloneId}_${foundEntities[j]}`

        const [subject, object] = await Promise.all([
          safeDbOp(() => db.kGEntity.findUnique({ where: { id: subjectId } })),
          safeDbOp(() => db.kGEntity.findUnique({ where: { id: objectId } })),
        ])

        if (subject && object) {
          // Check for existing triple
          const existing = await safeDbOp(() =>
            db.kGTriple.findFirst({
              where: {
                cloneId,
                subjectId: subject.id,
                predicate: 'mentioned_with',
                objectId: object.id,
                validTo: null,
              },
            })
          )

          if (!existing) {
            await safeDbOp(() =>
              db.kGTriple.create({
                data: {
                  cloneId,
                  subjectId: subject.id,
                  predicate: 'mentioned_with',
                  objectId: object.id,
                  confidence: 0.5,
                },
              })
            )
          }
        }
      }
    }
  }
}

/**
 * Classify conversation into wing/room based on keyword matching
 */
function classifyConversation(text: string): {
  wingName: string
  roomName: string
  hallType: string
  tags: string[]
} {
  // Product-related
  if (/产品|功能|用户|需求|MVP|迭代|极简/.test(text)) {
    if (/极简|UI|交互|选择/.test(text)) {
      return { wingName: '产品哲学', roomName: '极简主义', hallType: 'preferences', tags: ['产品', '极简'] }
    }
    if (/用户|洞察|行为|转化/.test(text)) {
      return { wingName: '产品哲学', roomName: '用户洞察', hallType: 'discoveries', tags: ['产品', '用户'] }
    }
    if (/迭代|技术债|sprint/.test(text)) {
      return { wingName: '产品哲学', roomName: '迭代方法论', hallType: 'advice', tags: ['产品', '迭代'] }
    }
    return { wingName: '产品哲学', roomName: '产品定义', hallType: 'facts', tags: ['产品', '定义'] }
  }

  // Engineering-related
  if (/架构|微服务|分层|设计/.test(text)) {
    return { wingName: '工程技术', roomName: '架构设计', hallType: 'discoveries', tags: ['工程', '架构'] }
  }
  if (/选型|框架|语言|数据库|Star/.test(text)) {
    return { wingName: '工程技术', roomName: '技术选型', hallType: 'facts', tags: ['工程', '选型'] }
  }
  if (/性能|优化|Profile|火焰图|内存/.test(text)) {
    return { wingName: '工程技术', roomName: '性能优化', hallType: 'advice', tags: ['工程', '性能'] }
  }
  if (/去中心化|区块链|链上|TEE|MPC|智能合约/.test(text)) {
    return { wingName: '工程技术', roomName: '去中心化技术', hallType: 'facts', tags: ['工程', '去中心化'] }
  }

  // Business-related
  if (/商业模式|订阅|Token|定价|tier/.test(text)) {
    return { wingName: '商业战略', roomName: '商业模式', hallType: 'facts', tags: ['商业', '模式'] }
  }
  if (/增长|冷启动|GEO|获客|DAU/.test(text)) {
    return { wingName: '商业战略', roomName: '增长策略', hallType: 'events', tags: ['商业', '增长'] }
  }
  if (/融资|VC|股权|估值/.test(text)) {
    return { wingName: '商业战略', roomName: '融资哲学', hallType: 'preferences', tags: ['商业', '融资'] }
  }
  if (/社区|治理|PoUE|节点|投票/.test(text)) {
    return { wingName: '商业战略', roomName: '社区治理', hallType: 'advice', tags: ['商业', '治理'] }
  }

  // Web4.0-related
  if (/意识主权|连续性|夺舍|五底线/.test(text)) {
    return { wingName: 'Web4.0愿景', roomName: '意识主权', hallType: 'facts', tags: ['Web4.0', '意识'] }
  }
  if (/数字永生|超我|熔断|遗产|继承/.test(text)) {
    return { wingName: 'Web4.0愿景', roomName: '数字永生', hallType: 'discoveries', tags: ['Web4.0', '永生'] }
  }
  if (/Agent|Avatar|PAS|128维|情感/.test(text)) {
    return { wingName: 'Web4.0愿景', roomName: 'Agent到Avatar', hallType: 'facts', tags: ['Web4.0', 'Avatar'] }
  }
  if (/AFC|AIBBS|CNAH|x402|四柱/.test(text)) {
    return { wingName: 'Web4.0愿景', roomName: 'AFC生态', hallType: 'facts', tags: ['Web4.0', 'AFC'] }
  }

  // Identity-related
  if (/信念|底线|原则|核心/.test(text)) {
    return { wingName: '身份认同', roomName: '核心信念', hallType: 'facts', tags: ['身份', '信念'] }
  }
  if (/表达|风格|短句|禁用词|口语/.test(text)) {
    return { wingName: '身份认同', roomName: '表达风格', hallType: 'preferences', tags: ['身份', '表达'] }
  }
  if (/决策|RFC|重构|技术债/.test(text)) {
    return { wingName: '身份认同', roomName: '决策框架', hallType: 'advice', tags: ['身份', '决策'] }
  }
  if (/矛盾|务实.*理想|理性.*情感|替代.*延伸/.test(text)) {
    return { wingName: '身份认同', roomName: '内在矛盾', hallType: 'discoveries', tags: ['身份', '矛盾'] }
  }

  // Default to identity wing
  return { wingName: '身份认同', roomName: '核心信念', hallType: 'facts', tags: ['通用'] }
}

// POST /api/chat - AI-powered chat with Memory Palace integration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      message,
      systemPrompt,
      context,
      sessionId,
      provider: requestedProvider,
      apiKey: clientApiKey,
      modelName: clientModelName,
      cloneId: requestCloneId,
    } = body as {
      message?: string
      systemPrompt?: string
      context?: string
      sessionId?: string
      provider?: string
      apiKey?: string
      modelName?: string
      cloneId?: string
    }

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Load SOUL.md and Memory Palace context
    const soulContent = await getSoulConfig()
    const { memoryContext, cloneId } = await buildMemoryContext(requestCloneId, message)

    // Build personality context from SOUL.md
    const personalityContext = soulContent
      ? `\n\n你的行为规范（基于飘叔SOUL.md）：\n${soulContent.substring(0, 3000)}`
      : ''

    // Build memory context from Memory Palace
    const memoryPromptSection = memoryContext
      ? `\n\n[你的记忆宫殿 — 这些是你已知的记忆，据此回答]：\n${memoryContext}`
      : ''

    const effectiveSystemPrompt = (systemPrompt || DEFAULT_SYSTEM_PROMPT) + personalityContext + memoryPromptSection

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content: effectiveSystemPrompt,
      },
    ]

    // Add context if provided
    if (context) {
      messages.push({
        role: 'user',
        content: `[上下文信息]\n${context}`,
      })
      messages.push({
        role: 'assistant',
        content: '已理解上下文，请继续提问。',
      })
    }

    // Load recent chat history for this session to provide continuity (graceful on DB failure)
    if (sessionId) {
      const recentMessages = await safeDbOp(() =>
        db.chatMessage.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
      )
      if (recentMessages && recentMessages.length > 0) {
        const historyMessages = recentMessages.reverse().map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        }))
        messages.push(...historyMessages)
      }
    }

    messages.push({
      role: 'user',
      content: message,
    })

    // Determine which provider to use
    // Priority: requestedProvider > DeepSeek (if key set) > Z-AI SDK
    let aiResponse: string | null = null
    let usedProvider = 'z-ai-sdk'
    const deepseekKey = process.env.DEEPSEEK_API_KEY

    // Determine effective DeepSeek key: client-provided > env var
    const effectiveDeepseekKey = clientApiKey || deepseekKey
    const effectiveModelName = clientModelName || 'deepseek-chat'

    if (requestedProvider === 'z-ai-sdk') {
      // Explicitly requested Z-AI
      const result = await callZAI(messages)
      aiResponse = result.content
      usedProvider = result.provider
    } else if (requestedProvider === 'deepseek' || (!requestedProvider && effectiveDeepseekKey)) {
      // Try DeepSeek first (explicitly requested or auto mode with key available)
      try {
        const result = await callDeepSeek(messages, effectiveModelName, effectiveDeepseekKey)
        aiResponse = result.content
        usedProvider = result.provider
      } catch (deepseekError) {
        console.warn('DeepSeek failed, falling back to Z-AI SDK:', deepseekError)
        // Fallback to Z-AI SDK
        try {
          const result = await callZAI(messages)
          aiResponse = result.content
          usedProvider = 'z-ai-sdk (fallback)'
        } catch (zaiError) {
          console.error('Both DeepSeek and Z-AI SDK failed:', zaiError)
          return NextResponse.json(
            { error: 'All AI providers failed. Please check your API key in Settings.' },
            { status: 500 }
          )
        }
      }
    } else {
      // No DeepSeek key, use Z-AI SDK
      try {
        const result = await callZAI(messages)
        aiResponse = result.content
        usedProvider = result.provider
      } catch (zaiError) {
        console.error('Z-AI SDK failed:', zaiError)
        return NextResponse.json(
          { error: 'AI service unavailable. Please configure DeepSeek API key in Settings.' },
          { status: 500 }
        )
      }
    }

    if (!aiResponse) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })
    }

    // Save user message to database (non-blocking, graceful failure)
    await safeDbOp(() =>
      db.chatMessage.create({
        data: {
          role: 'user',
          content: message,
          sessionId: sessionId || null,
          module: 'cognitive',
          metadata: context ? JSON.stringify({ context }) : null,
        },
      })
    )

    // Save assistant response to database (non-blocking, graceful failure)
    await safeDbOp(() =>
      db.chatMessage.create({
        data: {
          role: 'assistant',
          content: aiResponse!,
          sessionId: sessionId || null,
          module: 'cognitive',
          modelUsed: usedProvider,
          metadata: JSON.stringify({
            soulInjected: !!soulContent,
            memoryLoaded: !!memoryContext,
            provider: usedProvider,
          }),
        },
      })
    )

    // Auto-save to Memory Palace (non-blocking, fire-and-forget)
    if (cloneId) {
      // Run auto-save in background - don't await to avoid blocking response
      const saveCloneId = cloneId
      const saveMessage = message
      const saveResponse = aiResponse
      const saveSessionId = sessionId

      // Use Promise.resolve to fire-and-forget
      Promise.resolve().then(() =>
        autoSaveToMemory(saveCloneId, saveMessage, saveResponse, saveSessionId)
      )

      // Extract entities from conversation (non-blocking)
      Promise.resolve().then(() =>
        extractEntitiesFromConversation(saveCloneId, saveMessage + ' ' + saveResponse)
      )
    }

    // Also create legacy memory entry for backward compatibility
    const isSignificant = message.length > 50 ||
      message.includes('决策') ||
      message.includes('战略') ||
      message.includes('风险') ||
      message.includes('分析') ||
      message.includes('评估')

    if (isSignificant) {
      await safeDbOp(() =>
        db.memoryEntry.create({
          data: {
            sourceType: 'chat',
            content: `对话: Q=${message.substring(0, 80)}... A=${aiResponse!.substring(0, 80)}...`,
            tags: '对话,创始人助手',
            relevanceScore: 0.7,
          },
        })
      )
    }

    // Create audit log for the chat interaction (non-blocking)
    await safeDbOp(() =>
      db.auditLog.create({
        data: {
          action: 'chat',
          module: 'cognitive',
          entityType: 'chatMessage',
          details: JSON.stringify({
            sessionId: sessionId || 'anonymous',
            soulInjected: !!soulContent,
            memoryLoaded: !!memoryContext,
            isSignificant,
            provider: usedProvider,
            cloneId: cloneId || null,
          }),
          performedBy: 'system',
        },
      })
    )

    return NextResponse.json({
      success: true,
      response: aiResponse,
      provider: usedProvider,
      metadata: {
        soulInjected: !!soulContent,
        memoryLoaded: !!memoryContext,
        sessionId: sessionId || null,
        provider: usedProvider,
        cloneId: cloneId || null,
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// GET /api/chat - Retrieve chat history for a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const messages = await safeDbOp(() =>
      db.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: limit,
      })
    )

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Failed to fetch chat history:', error)
    return NextResponse.json({ error: 'Failed to fetch chat history', messages: [] }, { status: 500 })
  }
}
