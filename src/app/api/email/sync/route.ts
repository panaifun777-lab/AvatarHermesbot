import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/email/sync - Simulate syncing emails (creates demo threads)
export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {}
    try {
      body = await req.json()
    } catch {
      // Empty body is fine
    }
    const userId = (body.userId as string) || 'demo'

    // Check if threads already exist for this user
    const existingCount = await db.emailThread.count({ where: { userId } })
    if (existingCount > 0) {
      // Just update lastSyncAt on config
      const config = await db.emailConfig.findFirst({ where: { userId } })
      if (config) {
        await db.emailConfig.update({
          where: { id: config.id },
          data: { lastSyncAt: new Date() },
        })
      }
      return NextResponse.json({
        success: true,
        data: { synced: 0, message: '已有邮件数据，同步完成' },
      })
    }

    // Create demo email threads with messages
    const now = new Date()
    const demoThreads = [
      {
        fromAddress: 'zhang.wei@techcorp.cn',
        toAddress: 'piaoshu@founder.ai',
        subject: '关于下一轮战略合作的提议',
        snippet: '飘叔你好，我是TechCorp的张伟，我们对贵公司在AI分身领域的技术非常感兴趣...',
        status: 'unread',
        priority: 'high',
        labels: '["商务合作","战略"]',
        receivedAt: new Date(now.getTime() - 30 * 60 * 1000),
        messages: [
          {
            fromAddress: 'zhang.wei@techcorp.cn',
            toAddress: 'piaoshu@founder.ai',
            subject: '关于下一轮战略合作的提议',
            bodyText: '飘叔你好，\n\n我是TechCorp的张伟，我们对贵公司在AI分身领域的技术非常感兴趣。我们想探讨一下在以下方面的合作可能：\n\n1. 企业级AI分身解决方案\n2. 认知引擎的技术授权\n3. 联合开发行业垂直应用\n\n能否安排一个线上会议，详细讨论合作细节？\n\n期待您的回复。\n\n张伟\nTechCorp 战略合作部',
            sentAt: new Date(now.getTime() - 30 * 60 * 1000),
          },
        ],
      },
      {
        fromAddress: 'li.na@investor.com',
        toAddress: 'piaoshu@founder.ai',
        subject: 'Re: Pre-A轮融资进展更新',
        snippet: '飘叔，关于Pre-A轮的进展，我们内部已完成初步评估，对项目方向表示认可...',
        status: 'replied',
        priority: 'urgent',
        agentId: 'ceo-agent',
        labels: '["融资","投资"]',
        receivedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        messages: [
          {
            fromAddress: 'li.na@investor.com',
            toAddress: 'piaoshu@founder.ai',
            subject: 'Re: Pre-A轮融资进展更新',
            bodyText: '飘叔，\n\n关于Pre-A轮的进展，我们内部已完成初步评估，对项目方向表示认可。\n\n几点需要确认：\n1. 估值区间是否可在3000-5000万？\n2. 技术壁垒的可验证性如何保障？\n3. 12个月的里程碑计划能否提前至9个月？\n\n建议本周内安排一次深度交流。\n\n李娜\n星辰资本',
            sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          },
          {
            fromAddress: 'piaoshu@founder.ai',
            toAddress: 'li.na@investor.com',
            subject: 'Re: Pre-A轮融资进展更新',
            bodyText: '李娜，\n\n感谢反馈。估值区间可以讨论，技术壁垒我们有可信证据链和链上验证来保障。9个月里程碑需要重新评估技术路线图。\n\n周三下午3点可以安排深度交流。\n\n飘叔',
            sentAt: new Date(now.getTime() - 90 * 60 * 1000),
            isAutoReply: false,
            aiGenerated: true,
          },
        ],
      },
      {
        fromAddress: 'support@cloudservices.io',
        toAddress: 'piaoshu@founder.ai',
        subject: 'Your monthly infrastructure report - February 2026',
        snippet: 'Your infrastructure usage summary for February 2026. Total compute hours: 2,847...',
        status: 'read',
        priority: 'low',
        labels: '["系统报告","基础设施"]',
        receivedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        messages: [
          {
            fromAddress: 'support@cloudservices.io',
            toAddress: 'piaoshu@founder.ai',
            subject: 'Your monthly infrastructure report - February 2026',
            bodyText: 'Your infrastructure usage summary for February 2026.\n\nTotal compute hours: 2,847\nGPU usage: 1,203 hours\nStorage: 4.2 TB\nNetwork transfer: 12.8 TB\n\nEstimated cost: $3,847.20\n\nNo anomalies detected. All services running optimally.',
            sentAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          },
        ],
      },
      {
        fromAddress: 'wang.fang@design.studio',
        toAddress: 'piaoshu@founder.ai',
        subject: '品牌升级方案初稿 - 请审阅',
        snippet: '飘叔好，附件是品牌升级方案的初稿，包含Logo优化、色彩系统和UI组件库更新...',
        status: 'unread',
        priority: 'normal',
        labels: '["设计","品牌"]',
        receivedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        messages: [
          {
            fromAddress: 'wang.fang@design.studio',
            toAddress: 'piaoshu@founder.ai',
            subject: '品牌升级方案初稿 - 请审阅',
            bodyText: '飘叔好，\n\n附件是品牌升级方案的初稿，包含以下内容：\n\n1. Logo优化 - 保留闪电符号，增加科技感渐变\n2. 色彩系统 - 从纯绿转向绿+青的双色系\n3. UI组件库更新 - 新增暗色模式设计规范\n4. 品牌声浪 - 简化核心信息，突出"AI共生体"定位\n\n期望在本周五前收到反馈，以便进入设计执行阶段。\n\n王芳\nDesign Studio',
            sentAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
          },
        ],
      },
      {
        fromAddress: 'chen.hao@university.edu',
        toAddress: 'piaoshu@founder.ai',
        subject: '演讲邀请 - AI与创业未来峰会',
        snippet: '尊敬的飘叔，诚挚邀请您作为主题演讲嘉宾出席"AI与创业未来"峰会...',
        status: 'unread',
        priority: 'normal',
        labels: '["演讲","活动"]',
        receivedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        messages: [
          {
            fromAddress: 'chen.hao@university.edu',
            toAddress: 'piaoshu@founder.ai',
            subject: '演讲邀请 - AI与创业未来峰会',
            bodyText: '尊敬的飘叔，\n\n诚挚邀请您作为主题演讲嘉宾出席"AI与创业未来"峰会。\n\n时间：2026年4月15日\n地点：上海国际会议中心\n主题建议：AI分身如何重构创始人工作范式\n\n峰会预计500+创业者参加，媒体覆盖30+家。\n\n期待您的确认！\n\n陈浩\n峰会组委会',
            sentAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          },
        ],
      },
      {
        fromAddress: 'hr@piaoshu.ai',
        toAddress: 'piaoshu@founder.ai',
        subject: '本周团队周报汇总 - 第9周',
        snippet: '飘叔，本周团队进展汇总：工程团队完成v0.2核心模块开发，增长团队新用户增长23%...',
        status: 'read',
        priority: 'normal',
        labels: '["内部","周报"]',
        receivedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        messages: [
          {
            fromAddress: 'hr@piaoshu.ai',
            toAddress: 'piaoshu@founder.ai',
            subject: '本周团队周报汇总 - 第9周',
            bodyText: '飘叔，\n\n本周团队进展汇总：\n\n工程团队：\n- 完成v0.2核心模块开发\n- 修复关键Bug 12个\n- 部署Pipeline优化\n\n增长团队：\n- 新用户增长23%\n- 日活环比+15%\n- 完成A/B测试方案3组\n\n运营团队：\n- 内容发布8篇\n- 社区互动率提升18%\n\n待决策事项：\n1. 是否启动下一轮招聘？\n2. 服务器扩容时机\n\n详细数据见附件。',
            sentAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        ],
      },
      {
        fromAddress: 'legal@lawfirm.cn',
        toAddress: 'piaoshu@founder.ai',
        subject: '合同审核反馈 - 数据隐私协议v2',
        snippet: '飘叔，关于数据隐私协议v2，我们发现3处需要修改的条款，涉及跨境数据传输...',
        status: 'unread',
        priority: 'high',
        labels: '["法律","合同"]',
        receivedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
        messages: [
          {
            fromAddress: 'legal@lawfirm.cn',
            toAddress: 'piaoshu@founder.ai',
            subject: '合同审核反馈 - 数据隐私协议v2',
            bodyText: '飘叔，\n\n关于数据隐私协议v2，我们发现3处需要修改的条款：\n\n1. 第7.3条 - 跨境数据传输条款需补充标准合同条款\n2. 第9.1条 - 数据保留期限需与最新法规对齐\n3. 附录B - 数据处理者义务描述过于宽泛\n\n建议尽快安排会议逐条审核，避免影响产品上线时间表。\n\n赵律师\n明法律师事务所',
            sentAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
          },
        ],
      },
      {
        fromAddress: 'mark.spam@unknown-promo.com',
        toAddress: 'piaoshu@founder.ai',
        subject: '🎉 恭喜您中奖！立即领取您的大奖！',
        snippet: '亲爱的用户，恭喜您被选中为我们的幸运大奖得主...',
        status: 'ignored',
        priority: 'low',
        labels: '["垃圾邮件"]',
        receivedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        messages: [
          {
            fromAddress: 'mark.spam@unknown-promo.com',
            toAddress: 'piaoshu@founder.ai',
            subject: '🎉 恭喜您中奖！立即领取您的大奖！',
            bodyText: '亲爱的用户，恭喜您被选中为我们的幸运大奖得主！请点击链接领取...',
            sentAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          },
        ],
      },
    ]

    let syncedCount = 0
    for (const threadData of demoThreads) {
      const { messages, ...threadFields } = threadData

      const thread = await db.emailThread.create({
        data: {
          userId,
          ...threadFields,
        },
      })

      for (const msg of messages) {
        await db.emailMessage.create({
          data: {
            threadId: thread.id,
            fromAddress: msg.fromAddress,
            toAddress: msg.toAddress,
            subject: msg.subject,
            bodyText: msg.bodyText || null,
            sentAt: msg.sentAt || null,
            isAutoReply: msg.isAutoReply ?? false,
            aiGenerated: msg.aiGenerated ?? false,
          },
        })
      }
      syncedCount++
    }

    // Also create demo auto-reply rules
    const demoRules = [
      {
        userId,
        name: '商务合作自动回复',
        description: '对包含"合作"关键词的邮件自动回复',
        condition: JSON.stringify({ field: 'subject', operator: 'contains', value: '合作' }),
        template: '您好，感谢您对飘叔Piaoshu的关注。我们已收到您的合作提案，将在24小时内安排专人与您联系。\n\n飘叔 / Piaoshu',
        priority: 'high',
        isEnabled: true,
        matchCount: 7,
      },
      {
        userId,
        name: '投资融资自动回复',
        description: '对包含"融资""投资"关键词的邮件自动回复',
        condition: JSON.stringify({ field: 'subject', operator: 'contains', value: '融资' }),
        template: '您好，感谢对飘叔Piaoshu的投资兴趣。我们的融资资料将在确认后发送给您。请提供您的机构名称和投资阶段偏好。\n\n飘叔 / Piaoshu',
        priority: 'urgent',
        agentId: 'ceo-agent',
        isEnabled: true,
        matchCount: 3,
      },
      {
        userId,
        name: '垃圾邮件过滤',
        description: '自动忽略垃圾推广邮件',
        condition: JSON.stringify({ field: 'from', operator: 'contains', value: 'promo' }),
        template: '',
        priority: 'low',
        isEnabled: true,
        matchCount: 15,
      },
    ]

    for (const rule of demoRules) {
      await db.autoReplyRule.create({ data: rule })
    }

    // Update config lastSyncAt
    const config = await db.emailConfig.findFirst({ where: { userId } })
    if (config) {
      await db.emailConfig.update({
        where: { id: config.id },
        data: { lastSyncAt: new Date() },
      })
    }

    await db.auditLog.create({
      data: {
        action: 'sync',
        module: 'email',
        entityType: 'EmailThread',
        details: JSON.stringify({ syncedCount }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      data: { synced: syncedCount, rulesCreated: demoRules.length },
    })
  } catch (error) {
    console.error('Failed to sync emails:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync emails' },
      { status: 500 }
    )
  }
}
