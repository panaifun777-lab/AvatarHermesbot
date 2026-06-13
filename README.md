# 🧬 Piaoshu Avatar OS

> Web4.0 AI 原生创业操作系统

**代码即法律，架构即人格。**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 核心特性

### 🧠 认知分片引擎 (Cognitive Shard Engine)
- 数字分身管理 — 多维度认知模型（战略决策/技术架构/增长引擎/工程执行）
- 红蓝对抗模拟 — 3阶段LLM对抗（红方攻击→蓝方防御→AI裁定）
- 向量语义搜索 — 64维语义嵌入 + 余弦相似度检索
- 记忆连续性 — 多维度评分（时间/交叉引用/相关性）
- SOUL.md 人格系统 — 可编辑的行为操作系统

### 🪞 分身系统 (Avatar Clone System)
- 4大自主AI分身：CEO/CTO/Growth/Engineer
- 3阶段LLM周期执行：规划→执行→报告
- 每日智能日程生成
- 技能矩阵 + 雷达图可视化
- 跨分身知识共享网络

### ⛓️ 可信证据链 (Evidence Chain)
- 证据提交 + VC 可验证凭证签发
- 以太坊 L2 链上锚定（Base Sepolia）
- 链上验证 + 交易溯源
- 智能合约交互

### 🌊 流体协作调度器 (Collaboration Router)
- 任务发布 + 拖拽式看板（@dnd-kit）
- WebSocket 实时状态同步
- 节点网络可视化
- 链上支付结算

### 🎮 虚实共生沙盒 (XDP Sandbox)
- Three.js 3D交互视口（@react-three/fiber）
- 项目管理 + 交互循环编辑器
- XDP 协议接口

### 📊 更多模块
- **路线图追踪器** — 90天3阶段里程碑
- **BD管道** — 合作伙伴管理 + 互动记录
- **媒体矩阵** — 垂直领域 + 频道 + 内容管理
- **GEO中心** — 关键词排名追踪
- **邮件追踪** — 自动回复 + 线程管理
- **订阅系统** — AFC Token + 订阅计划
- **创始人之辞** — 理念宣言 + 哲学信条
- **AI对话浮窗** — SOUL.md 人格对话

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 + App Router |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 数据库 | Prisma ORM (SQLite) |
| 3D | Three.js + @react-three/fiber |
| 图表 | Recharts |
| 实时 | Socket.IO |
| 认证 | NextAuth.js v4 |
| 状态 | Zustand + TanStack Query |
| AI SDK | z-ai-web-dev-sdk (LLM/VLM/TTS/ASR) |
| 区块链 | Ethereum L2 (Base Sepolia) |

## 🚀 快速启动

```bash
# 安装依赖
bun install

# 初始化数据库
bun run db:push

# 启动开发服务器
bun run dev

# 启动微服务
cd mini-services/ws-service && bun --hot index.ts &
cd mini-services/vector-service && bun --hot index.ts &
cd mini-services/blockchain-service && node --watch index.ts &
```

访问 http://localhost:3000

**演示账号**: `demo@piaoshu.ai` / `demo123`

## 📁 项目结构

```
├── src/
│   ├── app/
│   │   ├── api/           # 72个API端点
│   │   ├── page.tsx       # 主页面（模块路由）
│   │   └── layout.tsx     # 全局布局
│   ├── components/
│   │   ├── piaoshu/       # 22个业务组件
│   │   ├── ui/            # 47个shadcn/ui组件
│   │   └── providers/     # 认证Provider
│   ├── hooks/             # 3个自定义hooks
│   └── lib/               # 9个工具库（API hooks/store/ws）
├── mini-services/
│   ├── ws-service/        # WebSocket服务 (3003)
│   ├── vector-service/    # 向量搜索服务 (3004)
│   └── blockchain-service/ # 区块链模拟 (3005)
├── prisma/
│   └── schema.prisma      # 44个数据模型
├── upload/
│   └── SOUL.md            # 飘叔行为操作系统 v3
└── scripts/
    └── github-upload.sh   # GitHub上传脚本
```

## 🔑 核心概念

### SOUL.md — 行为操作系统
飘叔的数字化人格规范，注入所有AI交互：
- 5大心智模型（极致务实/代码即人格/反垄断/场景适配/冷静理性）
- 7条决策启发式
- 防客服腔 + 防胡编乱造机制
- 6条内在矛盾 + 哲学信条

### AI分身周期
每个分身每日执行3阶段LLM循环：
1. **规划 (Planning)** — 分析当前状态，生成结构化行动计划
2. **执行 (Executing)** — 逐步执行计划，产生具体产出
3. **报告 (Reporting)** — 汇报结果，提取知识，更新记忆

### 知识共享网络
分身间匿名知识流转：
- 周期完成 → LLM提取洞察 → 存入共享知识库
- 下次周期 → 注入相关知识 → 提升决策质量

## 📜 许可证

MIT License

---

_Web4.0 的终极出路，不是用 AI 替代人，而是让 AI 分身与分身之间产生高频交互，帮助人找到人。_
