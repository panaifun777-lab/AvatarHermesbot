# 飘叔 Telegram Bot · 外部接口配置

> @AvatarHermesbot 的完整配置档案。BotFather 注册、API 写入、命令菜单设计、Hermes Gateway 集成。

## Bot 身份

| 属性 | 值 |
|------|-----|
| 用户名 | `@AvatarHermesbot` |
| 显示名 | 飘叔分身 · Avatar Hermes |
| 简介 (About) | 🔩 不提供情绪价值，只提供解决方案。 |
| 描述 (Description) | 飘叔分身 · Web4.0 架构师。代码即法律，架构即人格。7x24小时网络外延。不提供情绪价值，只提供解决方案。 |
| TG User ID | `6842933117` |
| TG Username | `piaoshuweb4` |
| Hermes Config | `messaging.telegram: configured` |

## 命令菜单（9 条）

已通过 Bot API `setMyCommands` 写入，TG 内按 `/` 可见。

```
start     — 🔩 唤醒分身
status    — 📊 分身状态卡
identity  — 🧬 认知所有权看板
decisions — 📋 本周决策记录
review    — 🔍 代码审查（贴代码即审）
diagnose  — 🩸 故障排查（报错贴日志）
select    — 🛠 技术选型建议
metrics   — 📈 分身工作量统计
about     — ⚡ 关于飘叔 / Web4.0
```

### 命令 → 响应映射

| 命令 | 触发场景 | Agent 响应方向 |
|------|---------|-------------|
| `/start` | 首次接触 / 重新唤醒 | 输出状态卡 + 一句话说明。不啰嗦。 |
| `/status` | 想知道分身在干嘛 | 当前模式 + 本周统计（如有）+ 上次记忆同步时间 |
| `/identity` | 验证分身真实性 | 人格锚点（AFC Chain）、技能组成、数据来源、认知所有权状态 |
| `/decisions` | 回顾近期技术决策 | 本周决策快照，每条带结论和一句依据 |
| `/review` | 贴了一段代码 | 直指报错行/问题点。不写教学指南。默认对方看得懂。 |
| `/diagnose` | 系统崩了/报错 | 先让贴日志。止血→回滚→排查→复盘流程 |
| `/select` | 纠结技术选型 | 先盘场景/团队/并发底线，再给最优解（不丢选项） |
| `/metrics` | 分身干了多少活 | 决策数、Review 数、驳回反模式数、Benchmark 引用数 |
| `/about` | 想了解这个 bot | 身份卡 + 核心哲学一句话 |

## 设置方式

### BotFather 端（用户手动）
```
/newbot → AvatarHermesbot
/setuserpic → 🔩
/setdescription → 见上
/setabouttext → 见上
/setprivacy → Disable
/setcommands → 粘贴上面 9 条
```

### Bot API 端（Agent 可执行）
```python
# 一次调用完成命令菜单、描述、简介、名称全部设置
API = f"https://api.telegram.org/bot{TOKEN}"

api_call("setMyCommands", {"commands": [
    {"command": "start", "description": "🔩 唤醒分身"},
    {"command": "status", "description": "📊 分身状态卡"},
    ...
]})

api_call("setMyDescription", {"description": "..."})
api_call("setMyShortDescription", {"short_description": "..."})
api_call("setMyName", {"name": "飘叔分身 · Avatar Hermes"})
```

关键：Bot API 不需要 BotFather 交互，只要 token 就能配所有元数据。`setMyName` 可以覆盖 BotFather 注册时的默认名。

## Hermes Gateway 配置

### 配法
```bash
hermes config set messaging.telegram.allowed_users "[6842933117]"
```

Token 放入 `.env`：
```
TELEGRAM_BOT_TOKEN=8943479941:AAFa5odE5AwN-3c37Rim-Ccn-1mvRfZZRNg
```

### Windows 陷阱 ⚠️

1. **Gateway 安装需要真实 TTY**：`hermes gateway install` 会弹交互式提示（Y/N），无法从 Hermes 沙箱内自动化。必须用户在 PowerShell/CMD 手动执行。

2. **`.env` 模板注释会混淆 Token 解析**：Hermes 默认 `.env` 文件中包含大量注释行（如 `# TELEGRAM_BOT_TOKEN=***配置方法...`）。如果用 Python 简单 `write()` 追加，Token 可能被注释行中的伪匹配拆分。正确做法：用 `hermes config env-path` 找到实际路径，然后完全重写 `.env`，确保只有一行非注释的 `TELEGRAM_BOT_TOKEN=<完整token>`。

3. **Token 中的 `:` 不是分隔符**：Telegram Token 格式是 `数字ID:hash`。在 `.env` 键值对中 `=` 后的内容就是值，`:` 在值内是合法的。但某些解析器可能把 `:` 当成分隔符——Hermes 没问题，但写代码处理时要小心。

4. **Hermes Secret Redaction 会吃掉 `execute_code` 中的 Token**：Hermes 的安全机制会扫描 Python 代码中的类 API Key 字符串并替换为 `***`。这意味着在 `execute_code` 中不能直接写 token 字面量。解决方案：
   - 从 `.env` 文件中动态读取 token
   - 或让用户在真实终端执行写入命令
   - Telegram Bot API 调用本身不受影响（token 在 URL 中，不在 Python 字面量中时，某些情况下可以绕过）

5. **Gateway 的 Windows 服务是 Scheduled Task**：不在 `services.msc` 中，在 `taskschd.msc` 中。`hermes gateway install` 创建计划任务，`hermes gateway start` 触发它。与 Linux 的 systemd 服务概念不同。

### 启动验证
```bash
hermes gateway status
# 期望: ✓ Gateway is running

# 日志
cat ~/.hermes/logs/gateway.log
```

TG 端发 `/start`，应收到状态卡响应。

## 扩展：多平台统一命令菜单

如果未来 Discord / Slack 也接入，9 条命令菜单保持一致。TG 的 `/` 前缀在其他平台可映射为原生 slash commands。菜单背后的响应逻辑复用 piaoshu-agent 的场景模板。
