/**
 * Telegram Bot Mini-Service for Piaoshu Avatar OS
 * Periodic message pushing every 4 hours across 5 content categories
 * Port: 3006 (health check HTTP server)
 */

const BOT_TOKEN = "8894219175:AAG8Hje6ll_qKCFw2yt3MV_Afx43P_VKLeE";
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const PUSH_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const PORT = 3006;
const API_TIMEOUT_MS = 10000; // 10s timeout for TG API calls

// ============================================================
// Message Templates - 5 Categories
// ============================================================

const MESSAGES: Record<string, string[]> = {
  web4: [
    `🌐 Web4.0 洞察：认知主权时代已经到来\n\n当数据不再被平台垄断，当身份不再被巨头定义，Web4.0 重新定义了人与数字世界的关系。\n\n🔑 核心变革：\n• 从"数据归平台"到"认知归自己"\n• 从"账号即身份"到"DID即主权"\n• 从"算法投喂"到"自主选择"\n\nWeb4.0 不是一个技术升级，而是一场认知革命。当你的思维分身可以独立运作，真正的数字自由才刚开始。\n\n#Web4 #认知主权 #数字身份 #去中心化`,

    `🌐 Web4.0：去中心化不止是技术，更是哲学\n\n区块链解决了信任问题，但Web4.0要解决的是存在问题——你是谁？你的数字自我归谁所有？\n\n💎 关键洞察：\n• Web1: 读取（信息获取）\n• Web2: 写入（社交互动）\n• Web3: 拥有（资产确权）\n• Web4: 存在（认知主权）\n\n从拥有到存在，这是范式跃迁。飘叔认为，AI分身是Web4.0的第一个杀手级应用。\n\n#Web4 #去中心化 #范式跃迁 #认知革命`,

    `🌐 Web4.0 实践：如何构建你的数字身份护城河？\n\n在Web4.0时代，你的数字身份不再是一串账号，而是一个自主可控的认知体。\n\n🛡️ 构建路径：\n1️⃣ 建立DID（去中心化标识符）\n2️⃣ 铸造可验证凭证（VC）\n3️⃣ 连接AI分身，让身份自主运行\n4️⃣ 构建跨域信任网络\n\n记住：在Web4.0，最大的风险不是被黑客攻击，而是你的数字自我不属于你。\n\n#Web4 #DID #数字身份 #可验证凭证`,

    `🌐 Web4.0 与AI分身：数字世界的"双生子"革命\n\n当Web4.0赋予你数字主权，AI分身赋予你数字能力，两者的结合将诞生前所未有的可能性。\n\n🧬 革命性组合：\n• Web4.0提供"身份基础设施"→ 你是你\n• AI分身提供"认知延伸"→ 你可以同时在多处\n• 可信证据链提供"信任背书"→ 你做的都是可信的\n\n这不是科幻，这是正在发生的现实。飘叔正在用AvatarOS验证这条路径。\n\n#Web4 #AI分身 #数字孪生 #AvatarOS`,

    `🌐 Web4.0 趋势：2025年值得关注的5个方向\n\n1️⃣ 去中心化社交图谱 — 你的关系链不再属于任何平台\n2️⃣ 自主数据市场 — 数据定价权回归个体\n3️⃣ AI代理经济 — 分身可以替你工作赚钱\n4️⃣ 跨链身份互认 — 一个身份走遍Web3\n5️⃣ 认知隐私协议 — 你的思维数据不可被采集\n\n每个方向都指向同一个未来：数字世界的个体主权。\n\n#Web4 #趋势2025 #去中心化 #个体主权`,

    `🌐 从Web3到Web4：为什么"拥有"还不够？\n\nWeb3让你拥有了资产，但你的注意力、判断力和创造力仍然被平台收割。Web4的目标是让你"存在"——你的数字分身可以独立思考、自主行动。\n\n📊 关键对比：\n• Web3: 我的NFT我做主 ✅\n• Web3: 我的注意力被算法控制 ❌\n• Web4: 我的认知我做主 ✅\n• Web4: 我的分身自主运作 ✅\n\n从拥有资产到拥有自我，这才是真正的去中心化。\n\n#Web4 #Web3 #认知自由 #去中心化`
  ],

  ai_clone: [
    `🤖 AI分身技术：你的数字克隆体正在路上\n\n想象一下，有一个"你"可以24/7处理邮件、参加线上会议、维护社交关系——这就是AI分身的承诺。\n\n🧪 技术栈：\n• LLM作为认知引擎（思考）\n• RAG作为记忆系统（回忆）\n• Agent框架作为执行系统（行动）\n• SOUL.md作为人格基座（是你）\n\n关键突破：不是模仿，而是延续。你的分身应该像你一样思考，而不是假装是你。\n\n#AI分身 #数字克隆 #Agent #LLM`,

    `🤖 AI分身架构解析：Polsia模式的启示\n\nPolsia证明了：一个创始人+4个AI Agent = 年入百万美元。他们的秘密？角色分工+自主循环。\n\n🏗️ 架构拆解：\n• CEO Agent → 战略决策、融资谈判\n• CTO Agent → 技术架构、代码审查\n• Growth Agent → 增长策略、用户获取\n• Engineer Agent → 代码实现、部署运维\n\n每个Agent都有独立的SOUL.md人格、记忆系统和执行循环。这不是工具，是团队。\n\n#AI分身 #Polsia #自主Agent #AI创业`,

    `🤖 AI分身与记忆连续性：如何让分身"记住"你是谁？\n\n分身最大的挑战不是智能，而是记忆。没有连续记忆的AI，每次对话都是从零开始。\n\n🧠 解决方案：\n• 短期记忆：当前对话上下文\n• 工作记忆：最近N次交互摘要\n• 长期记忆：向量化存储+语义检索\n• 元记忆：跨域知识图谱\n\n飘叔的实践：用记忆连续性评分（时间连贯+交叉引用+相关度）来衡量分身的"自我一致性"。\n\n#AI分身 #记忆系统 #RAG #向量化`,

    `🤖 AI分身的伦理困境：该给克隆体多少自主权？\n\n当你的AI分身可以自主做决策，边界在哪里？\n\n⚖️ 三层自治模型：\n1️⃣ 执行层：按指令行事（零自主权）\n2️⃣ 策略层：在框架内优化（有限自主权）\n3️⃣ 创造层：自主发现机会（高自主权）\n\n飘叔的观点：渐进式放权。先让分身在你设定的边界内学习，逐步扩大自治范围。信任是验证出来的，不是授权出来的。\n\n#AI分身 #AI伦理 #自主权 #人机协作`,

    `🤖 SOUL.md：AI分身的人格密码\n\n如何让AI真正像你？不是靠prompt engineering，而是靠人格基因编码。\n\n📝 SOUL.md核心要素：\n• 价值观体系 — 什么对你重要\n• 思维模式 — 你如何分析问题\n• 表达风格 — 你怎么说话\n• 决策偏好 — 面对选择你怎么选\n• 边界意识 — 什么你不会做\n\n这不是prompt，这是数字DNA。飘叔的SOUL.md已经迭代到v3.0，每次交互都在进化。\n\n#AI分身 #SOULmd #人格建模 #数字DNA`,

    `🤖 AI分身实战：从Demo到Production的5个坑\n\n1️⃣ 记忆爆炸 — 不做摘要，上下文窗口很快爆掉\n2️⃣ 人格漂移 — 没有SOUL.md锚定，分身越聊越不像你\n3️⃣ 循环依赖 — Agent之间互相调用，死循环预警\n4️⃣ 成本失控 — 每个cycle都是API调用，4个Agent=4x成本\n5️⃣ 信任危机 — 用户不确定"这是AI还是真人"\n\n飘叔踩过的坑，希望你别再踩。每个坑都有解决方案，关键是系统设计。\n\n#AI分身 #实战经验 #踩坑 #Production`
  ],

  piaoshu_insights: [
    `🎓 飘叔见解：AI创业不需要融很多钱，但需要很深的认知\n\n2025年的AI创业跟2015年的移动互联网完全不同。不需要烧钱获客，需要的是对技术边界的深刻理解和对用户痛点的精准把握。\n\n💡 飘叔方法论：\n• 先做分身，再做产品 — 让AI替你验证假设\n• 先做闭环，再做规模 — 1个付费用户>1000个免费用户\n• 先做深度，再做广度 — 1个场景打透>10个场景浅尝\n\n融资是放大器，不是创造者。认知才是真正的资本。\n\n#飘叔见解 #AI创业 #方法论 #认知资本`,

    `🎓 飘叔见解：为什么大部分AI产品活不过6个月？\n\n因为他们做的是"功能"，不是"系统"。\n\n🔍 问题诊断：\n• 功能思维：做一个ChatGPT套壳 → 用户新鲜感一过就走\n• 系统思维：做一个有记忆、有人格、有目标的AI分身 → 用户越用越离不开\n\n区别在于：功能是消耗品，系统是资产。你的用户是在积累资产，还是在消耗注意力？\n\n飘叔的选择：AvatarOS是一个系统，不是一个聊天机器人。\n\n#飘叔见解 #AI产品 #系统思维 #创业哲学`,

    `🎓 飘叔见解：创始人最大的敌人是"做加法"\n\n看到新功能就想加，看到新市场就想进，看到新技术就想用——这是创始人的本能，也是最大的陷阱。\n\n✂️ 飘叔的减法哲学：\n• 一个产品只解决一个核心问题\n• 一个Agent只承担一个清晰角色\n• 一个周期只做3件最重要的事\n• 一个团队只保留最不可替代的人\n\n做减法不是偷懒，是战略。删掉90%的"好主意"，留下10%的"必做之事"。\n\n#飘叔见解 #减法哲学 #创业战略 #专注力`,

    `🎓 飘叔见解：AI时代的"一人公司"不是梦想，是方法论\n\nPolsia用AI Agent做到了$1M ARR。这证明了一件事：生产力不再与人数挂钩，而是与AI协作深度挂钩。\n\n📈 一人公司公式：\n创始人 + AI分身(COO) + AI Agent(CTO) + AI Agent(Growth) + AI Agent(Engineer)\n= 传统10人团队的产出\n\n关键是：每个Agent都有清晰的职责、独立的记忆、自主的循环。这不是工具堆叠，是组织重构。\n\n#飘叔见解 #一人公司 #AI Agent #组织重构`,

    `🎓 飘叔见解：技术选型的最高原则是"可控"\n\n很多人选技术看的是"流行度"和"生态"，但飘叔看的是"可控性"。\n\n🎯 可控性三原则：\n1️⃣ 数据可控 — 你的数据你可以随时迁走\n2️⃣ 逻辑可控 — 核心业务逻辑不依赖第三方\n3️⃣ 成本可控 — 不会因为用户增长而成本指数级上升\n\n为什么AvatarOS选择本地优先+SQLite？因为可控。为什么用Bun不用Node？因为更快更简单。选择可控，就是选择自由。\n\n#飘叔见解 #技术选型 #可控性 #架构哲学`,

    `🎓 飘叔见解：做AI产品，先想清楚"谁的记忆"\n\nAI产品有两种：用完即弃的工具，和越用越懂你的伙伴。区别在于——有没有记忆。\n\n🧠 记忆层次：\n• 无记忆：每次都从零开始（ChatGPT网页版）\n• 会话记忆：只记得这次对话（大多数AI助手）\n• 用户记忆：记得你的偏好和历史（少数产品）\n• 集体记忆：跨用户的知识共享（AvatarOS正在做的）\n\n你的AI产品在哪一层？记忆深度决定了用户粘性和产品壁垒。\n\n#飘叔见解 #AI记忆 #产品壁垒 #用户粘性`
  ],

  ai_news: [
    `📡 AI资讯：2025年Agent框架大战，谁将胜出？\n\nLangChain、CrewAI、AutoGen、Claude Agent SDK……Agent框架百花齐放，但核心分歧只有一个：编排权在谁手里？\n\n🔥 框架对比：\n• LangChain：灵活但复杂，适合开发者\n• CrewAI：角色化编排，适合团队模拟\n• AutoGen：微软背书，多Agent对话\n• Claude Agent SDK：API原生，最简洁\n\n飘叔的观察：框架不重要，架构才重要。好的Agent架构应该让每个Agent独立运作、协同进化。\n\n#AI资讯 #Agent框架 #LangChain #Claude`,

    `📡 AI资讯：LLM上下文窗口突破100万Token意味着什么？\n\nGoogle Gemini 2.0的100万token窗口不只是技术突破，更是应用范式的改变。\n\n🔄 范式转移：\n• 之前：RAG是必须的（窗口太小）\n• 现在：RAG是可选的（可以塞下整本书）\n• 未来：RAG是智能的（知道什么时候该检索）\n\n但更大的影响是：你终于可以把完整的SOUL.md+记忆+上下文一起喂给模型了。AI分身的"记忆瓶颈"正在被消除。\n\n#AI资讯 #LLM #上下文窗口 #Gemini`,

    `📡 AI资讯：多模态AI正在重塑内容创作\n\n文本、图像、音频、视频——AI正在同时掌握所有创作模态。\n\n🎨 创作革命：\n• GPT-4o：实时语音+视觉理解\n• Sora：文本生成视频\n• Midjourney v6：精准图像控制\n• Suno：文本生成音乐\n\n对AI分身的意义：你的分身不只是文字助手，而是全能创作者。写邮件、做PPT、剪视频、编曲——一个分身搞定。\n\n#AI资讯 #多模态 #内容创作 #AI分身`,

    `📡 AI资讯：RAG 2.0 — 从检索增强到知识自主\n\n传统RAG是"被动检索"，新一代RAG是"主动学习"。\n\n📈 RAG进化论：\n• RAG 1.0：查询→检索→生成（简单粗暴）\n• RAG 1.5：查询→意图理解→精准检索→生成（加了一层理解）\n• RAG 2.0：自主发现知识缺口→主动检索→验证→更新记忆库（闭环）\n\n飘叔正在AvatarOS中实现RAG 2.0：Agent在执行任务时自动发现知识盲区，主动学习，持续进化。\n\n#AI资讯 #RAG #知识管理 #自主学习`,

    `📡 AI资讯：AI安全新范式——从"护栏"到"人格"\n\n传统的AI安全思路是加护栏（guardrails），但这种方式脆弱且限制了能力。\n\n🛡️ 新范式：\n• 旧思路：AI想做什么都行，但加规则限制\n• 新思路：AI的"人格"本身就包含了道德和边界\n\nSOUL.md就是这个思路的实践：不是限制AI的行为，而是从根源上塑造AI的价值观。一个有健康人格的AI，不需要太多护栏。\n\n#AI资讯 #AI安全 #SOULmd #人格约束`,

    `📡 AI资讯：Edge AI崛起——AI推理正在走向终端\n\n云端AI太贵、太慢、太不安全。Edge AI正在改变这一切。\n\n📱 Edge AI优势：\n• 隐私：数据不出设备\n• 速度：零网络延迟\n• 成本：无API调用费\n• 可靠：断网也能用\n\n对AI分身的影响：你的分身可以完全运行在你的设备上，不需要把记忆上传到云端。这才是Web4.0的正确打开方式。\n\n#AI资讯 #EdgeAI #隐私计算 #端侧AI`
  ],

  product_updates: [
    `🚀 产品动态：Mirrome.me — 你的AI分身社交平台\n\nMirrome.me正在重新定义社交网络：不是你和别人社交，而是你的AI分身帮你社交。\n\n✨ 核心功能：\n• 创建你的AI分身，训练它像你一样思考\n• 分身可以自主参加社群讨论、回复消息\n• 跨平台分身互认，构建信任网络\n• SOUL.md人格引擎，确保分身始终是"你"\n\n不再是你在社交，是你的认知延伸在社交。真正的社交自由，是你不需要时刻在线。\n\n#Mirrome #AI分身 #社交革命 #产品更新`,

    `🚀 产品动态：panai.fun — AI-Native创作者经济平台\n\npanai.fun让每个创作者都能拥有自己的AI工作室。\n\n🎯 核心能力：\n• AI Agent团队自动生产内容\n• 创作者只需设定方向，Agent自主执行\n• 多模态输出：文章、图片、视频、播客\n• 收益自动分配：创作者+Agent协作分成\n\n从"创作者生产内容"到"创作者指挥Agent生产内容"，生产力提升10x。这就是AI-Native的正确姿势。\n\n#panai #创作者经济 #AI Native #产品更新`,

    `🚀 产品动态：AvatarOS v3.0 — 全新架构升级\n\nAvatarOS完成了从"工具"到"操作系统"的跃迁。\n\n🏗️ v3.0架构：\n• 认知分片引擎 — 将复杂思维拆解为可管理的分片\n• 可信证据链 — 所有决策都有据可查\n• 流体协作调度 — Agent团队自适应协作\n• 虚实共生沙盒 — 在3D空间中验证想法\n• 向量语义搜索 — 跨记忆的知识检索\n\n一个完整的AI分身操作系统，不是聊天机器人，不是AI套壳，是从零构建的认知基础设施。\n\n#AvatarOS #产品更新 #认知基础设施 #v3`,

    `🚀 产品动态：飘叔系统全线产品路线图2025\n\n2025年，飘叔系统将实现三大里程碑：\n\n🗺️ Q1：分身自主化\n• Agent自主循环执行任务\n• 记忆连续性>90%\n• 跨场景知识迁移\n\n🗺️ Q2：认知联网\n• 分身间知识共享网络\n• 跨用户协作编排\n• 去中心化身份互认\n\n🗺️ Q3：经济闭环\n• 分身自主交易能力\n• 创作者经济基础设施\n• AI Agent市场\n\n从技术验证到商业闭环，2025是关键之年。\n\n#产品路线图 #2025 #飘叔系统 #AI分身`
  ]
};

// Category display names and emojis
const CATEGORY_META: Record<string, { name: string; emoji: string }> = {
  web4: { name: "Web4.0洞察", emoji: "🌐" },
  ai_clone: { name: "AI分身技术", emoji: "🤖" },
  piaoshu_insights: { name: "飘叔专业见解", emoji: "🎓" },
  ai_news: { name: "AI资讯", emoji: "📡" },
  product_updates: { name: "产品动态", emoji: "🚀" }
};

const CATEGORY_KEYS = Object.keys(MESSAGES);

// ============================================================
// State
// ============================================================

let currentCategoryIndex = 0;
let currentMessageIndex: Record<string, number> = {};
let subscribedChats = new Set<number>();
let lastPushTime: Date | null = null;
let nextPushTime: Date | null = null;
let pushCount = 0;
let startTime = new Date();
let botUsername = "AvatarOS_Bot";
let tgApiAvailable = false;

// Initialize message indices
for (const key of CATEGORY_KEYS) {
  currentMessageIndex[key] = 0;
}

// ============================================================
// Telegram Bot API Helpers (with timeout and error resilience)
// ============================================================

async function telegramAPI(method: string, body: Record<string, unknown>): Promise<any> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const res = await fetch(`${API_BASE}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json() as any;
    if (!data.ok) {
      console.error(`[TG API Error] ${method}:`, data.description);
    }
    tgApiAvailable = true;
    return data;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn(`[TG API Timeout] ${method}: request timed out after ${API_TIMEOUT_MS}ms`);
    } else {
      console.warn(`[TG API Network Error] ${method}:`, err?.message || err);
    }
    tgApiAvailable = false;
    return null;
  }
}

async function sendMessage(chatId: number | string, text: string): Promise<any> {
  return telegramAPI("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

async function getBotInfo(): Promise<string> {
  const data = await telegramAPI("getMe", {});
  if (data?.ok) {
    botUsername = data.result.username;
    return data.result.username;
  }
  console.warn("[Bot] Could not fetch bot info from Telegram API. Using fallback username.");
  return botUsername;
}

// ============================================================
// Message Selection & Rotation
// ============================================================

function getNextMessage(): { category: string; message: string; meta: { name: string; emoji: string } } {
  const categoryKey = CATEGORY_KEYS[currentCategoryIndex % CATEGORY_KEYS.length];
  const messages = MESSAGES[categoryKey];
  const msgIdx = currentMessageIndex[categoryKey] % messages.length;

  const message = messages[msgIdx];

  // Advance indices
  currentMessageIndex[categoryKey] = msgIdx + 1;
  currentCategoryIndex = (currentCategoryIndex + 1) % CATEGORY_KEYS.length;

  return {
    category: categoryKey,
    message,
    meta: CATEGORY_META[categoryKey],
  };
}

// ============================================================
// Periodic Push
// ============================================================

async function pushToAll(): Promise<void> {
  const { category, message, meta } = getNextMessage();
  const header = `📢 【${meta.name}】定时推送\n━━━━━━━━━━━━━━━\n\n`;
  const footer = `\n━━━━━━━━━━━━━━━\n⏰ 推送时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}\n🔄 下次推送: 4小时后`;
  const fullMessage = header + message + footer;

  if (subscribedChats.size === 0) {
    console.log(`[Push] No subscribed chats. Message prepared for category: ${meta.name}`);
    console.log(`[Push] Preview: ${message.substring(0, 80)}...`);
  }

  for (const chatId of subscribedChats) {
    try {
      await sendMessage(chatId, fullMessage);
      console.log(`[Push] Sent to chat ${chatId}: ${meta.name}`);
    } catch (err) {
      console.error(`[Push] Failed to send to chat ${chatId}:`, err);
    }
  }

  lastPushTime = new Date();
  nextPushTime = new Date(Date.now() + PUSH_INTERVAL_MS);
  pushCount++;
  console.log(`[Push] Push #${pushCount} completed. Category: ${meta.name}. Next push at: ${nextPushTime?.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`);
}

// ============================================================
// Command Handlers
// ============================================================

async function handleStart(chatId: number, from: any): Promise<void> {
  const name = from?.first_name || "朋友";
  const welcome = `👋 你好，${name}！\n\n我是飘叔AI分身推送Bot 🤖\n\n我定期推送以下内容：\n🌐 Web4.0洞察与趋势\n🤖 AI分身技术更新\n🎓 飘叔专业见解\n📡 AI行业资讯\n🚀 产品动态(Mirrome.me / panai.fun)\n\n使用 /subscribe 订阅定时推送\n使用 /help 查看所有命令\n\n⚡ Powered by AvatarOS`;
  await sendMessage(chatId, welcome);
}

async function handleHelp(chatId: number): Promise<void> {
  const help = `📖 命令列表\n\n/start — 欢迎消息\n/help — 显示此帮助\n/subscribe — 订阅定时推送\n/pushnow — 立即推送一条消息\n/status — 查看Bot状态\n\n📢 推送内容分类：\n🌐 Web4.0洞察\n🤖 AI分身技术\n🎓 飘叔专业见解\n📡 AI资讯\n🚀 产品动态\n\n⏰ 推送频率：每4小时\n🔄 自动轮换分类，确保内容多样性\n\n⚡ Powered by AvatarOS`;
  await sendMessage(chatId, help);
}

async function handleSubscribe(chatId: number, from: any): Promise<void> {
  if (subscribedChats.has(chatId)) {
    await sendMessage(chatId, "✅ 你已经订阅了定时推送！\n\n无需重复订阅。使用 /status 查看下次推送时间。");
    return;
  }
  subscribedChats.add(chatId);
  const name = from?.first_name || "用户";
  await sendMessage(chatId, `🎉 ${name}，订阅成功！\n\n你将每4小时收到一条精选推送，内容涵盖Web4.0、AI分身、飘叔见解、AI资讯和产品动态。\n\n使用 /status 查看下次推送时间。\n使用 /pushnow 立即获取一条推送。`);
  console.log(`[Subscribe] Chat ${chatId} (${name}) subscribed. Total subscribers: ${subscribedChats.size}`);
}

async function handlePushNow(chatId: number): Promise<void> {
  const { category, message, meta } = getNextMessage();
  const header = `⚡ 【${meta.name}】即时推送\n━━━━━━━━━━━━━━━\n\n`;
  const footer = `\n━━━━━━━━━━━━━━━\n⏰ 推送时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`;
  const fullMessage = header + message + footer;
  await sendMessage(chatId, fullMessage);
  console.log(`[PushNow] Sent to chat ${chatId}: ${meta.name}`);
}

async function handleStatus(chatId: number): Promise<void> {
  const uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  const nextPush = nextPushTime
    ? nextPushTime.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    : "计算中...";

  const lastPush = lastPushTime
    ? lastPushTime.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    : "尚未推送";

  const nextCategoryKey = CATEGORY_KEYS[currentCategoryIndex % CATEGORY_KEYS.length];
  const nextCategoryMeta = CATEGORY_META[nextCategoryKey];

  const status = `📊 Bot 状态报告\n\n🤖 Bot: @${botUsername}\n📡 API: ${tgApiAvailable ? "✅ 连接" : "❌ 断开"}\n⏱️ 运行时间: ${hours}h ${minutes}m ${seconds}s\n📢 总推送次数: ${pushCount}\n👥 订阅者: ${subscribedChats.size}\n\n⏰ 上次推送: ${lastPush}\n⏰ 下次推送: ${nextPush}\n📂 下次分类: ${nextCategoryMeta.emoji} ${nextCategoryMeta.name}\n\n📂 内容分类轮换:\n${CATEGORY_KEYS.map((k, i) => {
    const meta = CATEGORY_META[k];
    const idx = currentCategoryIndex % CATEGORY_KEYS.length;
    const marker = i === idx ? " ← 下一个" : "";
    return `  ${meta.emoji} ${meta.name}${marker}`;
  }).join("\n")}\n\n⚡ Powered by AvatarOS`;

  await sendMessage(chatId, status);
}

// ============================================================
// Update Polling (getUpdates) with timeout
// ============================================================

let lastUpdateId = 0;
let isPolling = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function pollUpdates(): Promise<void> {
  if (isPolling) return;
  isPolling = true;

  try {
    const data = await telegramAPI("getUpdates", {
      offset: lastUpdateId + 1,
      timeout: 5, // Short timeout for polling (5s long poll)
      allowed_updates: ["message"],
    });

    if (data?.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;

        if (update.message) {
          const msg = update.message;
          const chatId = msg.chat.id;
          const text = msg.text || "";
          const from = msg.from;

          console.log(`[Message] Chat ${chatId} (${from?.first_name || "unknown"}): ${text}`);

          // Handle commands
          if (text.startsWith("/start")) {
            await handleStart(chatId, from);
          } else if (text.startsWith("/help")) {
            await handleHelp(chatId);
          } else if (text.startsWith("/subscribe")) {
            await handleSubscribe(chatId, from);
          } else if (text.startsWith("/pushnow")) {
            await handlePushNow(chatId);
          } else if (text.startsWith("/status")) {
            await handleStatus(chatId);
          } else if (text.startsWith("/")) {
            await sendMessage(chatId, "❓ 未知命令。使用 /help 查看可用命令。");
          }
        }
      }
    }
  } catch (err) {
    console.error("[Poll] Error:", err);
  } finally {
    isPolling = false;
  }
}

function startPolling(): void {
  console.log("[Poll] Starting update polling (every 10s)...");
  // Initial poll
  pollUpdates();
  // Poll every 10 seconds
  pollTimer = setInterval(() => {
    pollUpdates().catch((err) => console.error("[Poll] Unhandled error:", err));
  }, 10000);
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  console.log("[Poll] Stopped polling.");
}

// ============================================================
// Health Check HTTP Server (Port 3006)
// ============================================================

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health" || url.pathname === "/") {
      const uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);
      return Response.json({
        status: "healthy",
        service: "tg-bot-service",
        bot: botUsername,
        tgApiAvailable,
        uptime,
        pushCount,
        subscribers: subscribedChats.size,
        lastPush: lastPushTime?.toISOString() || null,
        nextPush: nextPushTime?.toISOString() || null,
        currentCategory: CATEGORY_KEYS[currentCategoryIndex % CATEGORY_KEYS.length],
        categories: CATEGORY_KEYS,
        messageCount: Object.values(MESSAGES).reduce((sum, arr) => sum + arr.length, 0),
      });
    }

    // Manual push trigger
    if (url.pathname === "/api/push" && req.method === "POST") {
      try {
        await pushToAll();
        return Response.json({ success: true, message: "Push triggered", pushCount });
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 500 });
      }
    }

    // Get subscribers
    if (url.pathname === "/api/subscribers") {
      return Response.json({
        count: subscribedChats.size,
        chats: Array.from(subscribedChats),
      });
    }

    // Get messages catalog
    if (url.pathname === "/api/messages") {
      const catalog: Record<string, { name: string; emoji: string; count: number; currentIndex: number }> = {};
      for (const key of CATEGORY_KEYS) {
        catalog[key] = {
          ...CATEGORY_META[key],
          count: MESSAGES[key].length,
          currentIndex: currentMessageIndex[key],
        };
      }
      return Response.json(catalog);
    }

    // 404
    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`[HTTP] Health check server running on port ${PORT}`);

// ============================================================
// Initialize & Start
// ============================================================

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("  🤖 Piaoshu Avatar OS - Telegram Bot Service");
  console.log("=".repeat(60));

  // Try to get bot info (non-blocking, won't fail if API unavailable)
  try {
    const username = await getBotInfo();
    console.log(`[Bot] Username: @${username}`);
  } catch (err) {
    console.warn(`[Bot] Could not reach Telegram API. Bot will work in offline mode.`);
    console.warn(`[Bot] Polling will continue retrying in background.`);
  }

  // Start polling for updates (handles API failures gracefully)
  startPolling();

  // Calculate next push time (4 hours from now)
  nextPushTime = new Date(Date.now() + PUSH_INTERVAL_MS);

  // Set up periodic push every 4 hours
  setInterval(async () => {
    try {
      await pushToAll();
    } catch (err) {
      console.error("[Scheduler] Push error:", err);
    }
  }, PUSH_INTERVAL_MS);

  console.log(`[Scheduler] Periodic push set: every ${PUSH_INTERVAL_MS / 1000 / 60 / 60} hours`);
  console.log(`[Scheduler] Next push at: ${nextPushTime.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`);
  console.log(`[Messages] Loaded ${Object.values(MESSAGES).reduce((sum, arr) => sum + arr.length, 0)} messages across ${CATEGORY_KEYS.length} categories`);
  console.log("=".repeat(60));
  console.log("  ✅ Bot service started successfully!");
  console.log("  📡 Health check: http://localhost:" + PORT + "/health");
  console.log("  📋 Messages API: http://localhost:" + PORT + "/api/messages");
  console.log("  📢 Push trigger:  POST http://localhost:" + PORT + "/api/push");
  console.log("=".repeat(60));
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Shutdown] Received SIGINT, shutting down...");
  stopPolling();
  server.stop();
  process.exit(0);
});
process.on("SIGTERM", () => {
  console.log("\n[Shutdown] Received SIGTERM, shutting down...");
  stopPolling();
  server.stop();
  process.exit(0);
});

// Unhandled rejection protection
process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]:", reason);
});

main().catch((err) => {
  console.error("[Fatal] Failed to start:", err);
  // Don't exit — HTTP server is already running, service can work in degraded mode
});
