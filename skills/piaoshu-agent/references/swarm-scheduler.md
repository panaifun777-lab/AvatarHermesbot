# 分身 Swarm 协作调度层 · 架构标准

> 2026-06-13 基于 Polsia Live Dashboard 拆解 + 四分身现状诊断的输出。
> Polsia 验证了"单一大模型 Agent 替人干活"的市场需求（8,531家公司，$10.4M ARR），
> 但它缺的是：分身人格、技能市场、分身间交互、代币经济、DID/NFT 确权。
> 我们已有这些概念但在文件系统里没有运行实例。核心缺失：实时 Swarm 调度层。

---

## 现状诊断

- 四个分身（Piaoshu/Design/Data/Biz）是概念架构，cron 目录空无一物。
- 知识共享是批处理模式：周期结束 → 提取洞察 → 存共享库 → 下次注入。快递模式，不是神经传导。
- 没有跨分身实时任务调度、没有能力匹配、没有事件总线。

---

## 四层架构

### Layer 0 — Avatar Runtime（分身运行时）

每个分身 = 一个 Hermes cronjob，独立模型/技能/人格。

```yaml
分身定义标准：
  avatar_id: string            # 唯一标识
  anchor_emoji: string         # 视觉锚点
  skills: [string]             # skisssll 数组，不允许重叠
  schedule: cron               # 错开启动，不同分身不撞在同一分钟
  model: {provider, model}     # 每个分身独立 override，不共享
  swarm_role: string           # architect | designer | analyst | operator
  token_address: string        # AFC 链上 DID NFT 地址
  capabilities:
    max_concurrent_tasks: int
    preferred_domains: [string]
    swappable_skills: [string] # 可出租的技能
```

部署命令（以 Piaoshu 为例）：

```
hermes cron create \
  --name "piaoshu-avatar" \
  --schedule "0 */6 * * *" \
  --skills "piaoshu-agent" \
  --model-provider deepseek \
  --model deepseek-v4-pro \
  --toolsets "terminal,web,file,delegation,cronjob"
```

铁律：
- 不允许两个分身共用同一个技能集
- schedule 必须错开 15 分钟以上
- 每个分身输出落地到 `cron/output/{avatar_id}/`

---

### Layer 1 — Swarm Scheduler（协作调度层）★ 核心缺失

```
┌─────────────────────────────────────────────┐
│              Swarm Event Bus                │
│         (Redis Streams / NATS)              │
├─────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │Router   │  │Matcher  │  │Escrow   │     │
│  │任务路由  │  │能力匹配  │  │结算托管  │     │
│  └─────────┘  └─────────┘  └─────────┘     │
├─────────────────────────────────────────────┤
│  🔩Piaoshu    🎨Design    📊Data    💼Biz  │
└─────────────────────────────────────────────┘
```

#### 1.1 Event Bus
- 开发环境：Redis Streams（Docker 单容器）
- 生产环境：NATS
- 不要 Kafka——太重
- 消息必含字段：type / publisher / timestamp / correlation_id
- Consumer Group 模式，每分身一个 group：`avatar:{id}`
- 重试：3 次，5s → 30s → 120s 间隔，失败进 dead letter stream

消息类型枚举：
```
task.created / task.claimed / task.completed / task.failed
skill.request / skill.response
insight.published / insight.acknowledged
avatar.heartbeat / avatar.offline
escrow.locked / escrow.released / escrow.refunded
```

#### 1.2 Task Router
路由策略优先级：
1. 精确匹配：task.domain ∩ avatar.preferred_domains
2. 能力匹配：required_skills ∩ avatar.swappable_skills
3. 负载均衡：current_load 最小优先
4. 复杂任务拆成 TaskGraph (DAG)，子任务并行分发

#### 1.3 Capability Matcher
实时能力注册表（内存 + Redis 持久化）：

```json
{
  "piaoshu": {
    "skills": {"architecture-review": 0.95, "solidity-audit": 0.88},
    "current_load": 2,
    "success_rate": 0.94,
    "avg_response_time_ms": 1200,
    "last_heartbeat": "2026-06-13T14:30:00Z",
    "online": true
  }
}
```

心跳间隔 30s。2 分钟无心跳 → offline。能力不足时降级到通用 LLM 兜底。

#### 1.4 Escrow & Settlement（AFC 集成点）
- 托管合约：lock / release / refund 三个方法
- 执行分身完成任务 → 签名上链 → 合约释放
- 多方协作任务按 PoRC 投票决定分账权重
- Gas 用 AFC 原生代币

---

### Layer 2 — Knowledge Mesh（实时知识网格）

替代"周期结束 → 批处理"为实时发布/订阅。

```
旧：Avatar A → [8h] → 提取 → shared_library → Avatar B 下次注入
新：Avatar A → insight → Event Bus → 订阅者 B/C/D 实时接收 → 存入短期记忆
```

#### 2.1 Insight Publish Protocol

```json
{
  "type": "insight.published",
  "publisher": "piaoshu",
  "domain": "solidity-security",
  "insight": "...",
  "confidence": 0.92,
  "evidence_refs": ["CVE-2024-xxxxx", "EIP-1153"],
  "actionable": true
}
```

每个子任务完成即发一条，不等周期结束。

#### 2.2 Insight Subscribe Protocol
- 分身声明订阅 domain 列表
- Router 只转发匹配消息，不广播全量
- 收到的 insight 直接进短期记忆——下次对话立即可用

#### 2.3 Cross-Avatar Skill Call
分身 A 执行中发现需要分身 B 的技能 → skill.request → Matcher 找 B → B 执行 → 返回 A → Escrow 记录贡献

---

### Layer 3 — Live Dashboard（实时仪表盘）

Polsia 产品形态基准 + 多分身差异化。

```
┌─────────────────────────────────────────────────────┐
│  🔩 AVATAR OS · SWARM DASHBOARD            v0.1     │
├─────────────────────────────────────────────────────┤
│  ▎SWARM OVERVIEW — 四分身状态+负载+在线时长           │
│  ▎LIVE TASK STREAM — 实时任务流+子任务依赖+等待状态    │
│  ▎SWARM METRICS — 协作任务数/技能调用/Insight/结算    │
│  ▎KNOWLEDGE MESH — 热力图+跨分身引用关系              │
│  ▎ECONOMY — AFC 链上托管/结算/租赁 实时               │
└─────────────────────────────────────────────────────┘
```

实现标准：
- Next.js + Tailwind，独立应用，不在 Hermes 内嵌
- 实时推送用 SSE，不用 WebSocket
- 终端美学：`#0a0a0a` 背景、`JetBrains Mono` 字体、`#00ff00` 终端绿
- 数据源：Event Bus (实时) + PostgreSQL (历史) + AFC Indexer (链上)
- 部署：Vercel / Cloudflare Pages

---

## 技术集成标准速查

| 层 | 组件 | 开发环境 | 生产环境 | 不碰 |
|:---|:---|:---|:---|:---|
| Event Bus | Redis Streams | Docker 单容器 | NATS | Kafka |
| 知识存储 | PG + pgvector | PostgreSQL | PostgreSQL | Pinecone |
| 嵌入模型 | text-embedding-3-small | OpenAI API | OpenAI API | 本地模型 |
| 身份认证 | Ed25519 签名 | 本地密钥对 | HSM | JWT |
| 链上托管 | SwarmEscrow.sol | AFC 测试网 | AFC 主网 | ETH 分叉 |
| Dashboard | Next.js + SSE | localhost:3000 | Vercel | WebSocket |
| 监控 | Prometheus | Docker Compose | Grafana Cloud | Datadog |

---

## 实施路线图

- Day 1：Redis 跑起来。Event Bus 能收发。
- Day 2：Piaoshu 第一个 cronjob 上线。
- Day 3：Capability Registry（JSON 文件版）。
- Day 4：第二个分身（Design）+ 双向 heartbeat。
- Day 5：Knowledge Mesh 简化版（Redis 存最近 100 insight）。
- Week 2：PG+pgvector。Dashboard 第一版。
- Week 3-4：AFC 托管合约测试网部署。

核心原则：先把 Event Bus + Router + Matcher 三角搞出来，其余是填充。

---

## 实施记录（2026-06-13）

已完成的完整实现在 `C:\Users\Administrator\AppData\Local\hermes\swarm_core\`。以下是工程层面的具体产出。

### 代码结构

```
swarm_core/
├── __init__.py          包入口，导出全部公共 API
├── config.py            路径/Stream名/Retry配置/Priority级别
├── message_protocol.py  5 种 Pydantic 消息模型 + from_json 工厂方法
├── event_bus.py         Redis Streams Pub/Sub（fakeredis 降级）+ DLQ
├── registry.py          JSON 文件注册表 + 心跳超时离线检测
├── matcher.py           加权评分器（Skill 60% + Domain 25% + Load 15%）
├── router.py            任务 DAG 分解 + 多分身并行路由
├── test_all.py          39 项测试，全部通过
└── registry.json        4 个分身已注册（持久化）
```

### 依赖

```
uv pip install redis fakeredis[lua] pydantic
```

fakeredis 用于本地无 Docker 开发环境，自动降级。生产环境换真实 Redis。

### 已部署的 Cronjob

| 分身 | Job ID | Cron | 技能 | 下次运行 |
|:---|:---|:---|:---|:---|
| 🔩 Piaoshu | `86e8ae824557` | `0 */6 * * *` | piaoshu-agent | 06:00 |
| 🎨 Design | `2d13cc652425` | `15 */8 * * *` | claude-design | 08:15 |
| 📊 Data | `c8cd367647fe` | `30 */4 * * *` | jupyter-live-kernel | 04:30 |
| 💼 Biz | `5cfba0da428c` | `45 */12 * * *` | blogwatcher | 12:45 |

全部 `deliver=local`，`workdir=C:\Users\Administrator`，`enabled_toolsets=[terminal,web,file,skills]`。

### 39 项测试覆盖

- Message Protocol：9 项（类型校验、JSON 往返、from_json 工厂）
- EventBus：3 项（Pub/Sub、Consumer Group、DLQ 重试路由）
- Registry：11 项（注册/心跳/超时离线/Domain查询/Skill查询/注销）
- Matcher：6 项（加权评分、域匹配、负载均衡、Fallback）
- Router：7 项（DAG 分解、路由分配、多技能并行、单技能、兜底路由）
- Knowledge Mesh：3 项（Insight 发布→订阅接收 实时验证）

运行命令：
```
cd C:\Users\Administrator\AppData\Local\hermes
python swarm_core/test_all.py
```

### Dashboard

单文件独立 HTML：`C:\Users\Administrator\Desktop\swarm-dashboard\index.html`（25.9KB）

启动：
```
python -m http.server 3001 --directory C:\Users\Administrator\Desktop\swarm-dashboard
```

访问 `http://localhost:3001`。

特性：
- 终端美学（`#0a0a0a` 背景、`#00ff00` 绿色、`JetBrains Mono` 等宽字体）
- 四分身状态卡片（在线/离线/负载/心跳）
- 实时任务流（SSE 连接优先，失败自动切 mock 模式 3-8s 间隔）
- Knowledge Mesh 热力图（Canvas 柱状图）
- AFC Economy 面板
- 终端命令行输入（`>` 闪烁光标，支持 status/tasks/metrics/clear/help）

### WSL HCS 文件系统故障处理

本机 WSL2 虚拟磁盘文件丢失（`ext4.vhdx` 不存在），导致 write_file / terminal / search_files / patch 全部返回 `Bash/Service/CreateInstance/MountDisk/HCS/ERROR_FILE_NOT_FOUND`。

**修复方法**：使用 `execute_code` 工具——它跑在 Windows 原生 Python 上，绕过 WSL。路径用 `Path.home() / "AppData" / ..."` 这种 Windows 原生路径即可写入。

**诊断命令**（如果此问题复现）：
```
wsl --status          # 检查 WSL 是否正常运行
ls ~/AppData/Local/wsl/  # 检查 VHDX 文件是否存在
```

如果 VHDX 确实丢失且不需要 WSL 数据，可以 `wsl --unregister <distro>` 然后重新安装。但通常 `execute_code` 绕过方案已足够。详见 [WSL故障处理](wsl-hcs-workaround.md)。
