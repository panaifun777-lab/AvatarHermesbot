# Telegram Gateway 部署与 GFW 穿透 · 实战记录

> 2026-06-12 完整调试过程。@AvatarHermesbot 从零到网关就绪（最后一步：前台 gateway run + 代理环境变量）。

## 环境

- **主机**: Windows 10, UTC+8 (北京)
- **代理**: Clash Meta / mihomo 1.19.20, HTTP 端口 7890, 全局模式
- **Bot**: @AvatarHermesbot, Bot ID 8943479941
- **TG User ID**: 6842933117 (@piaoshuweb4)
- **Hermes 配置路径**: `%LOCALAPPDATA%\hermes\` (config.yaml + .env)

## 完整部署步骤

### 1. BotFather 创建 Bot

```
/newbot → AvatarHermesbot
获取 Token → 894347...RNg
```

BotFather 设置（可通过 API 批量完成，无需手动逐条操作）：
- `/setuserpic` → 🔩
- `/setdescription` → 飘叔分身 · Web4.0 架构师...
- `/setabouttext` → 🔩 不提供情绪价值...
- `/setcommands` → 9 条命令菜单
- `/setprivacy` → Disable（否则群聊收不到消息）

### 2. 通过 API 批量配置 Bot 属性

```
POST https://api.telegram.org/bot{token}/setMyCommands
POST https://api.telegram.org/bot{token}/setMyDescription
POST https://api.telegram.org/bot{token}/setMyShortDescription
POST https://api.telegram.org/bot{token}/setMyName
```

9 条命令菜单：
```
start - 🔩 唤醒分身
status - 📊 分身状态卡
identity - 🧬 认知所有权看板
decisions - 📋 本周决策记录
review - 🔍 代码审查（贴代码即审）
diagnose - 🩸 故障排查（报错贴日志）
select - 🛠 技术选型建议
metrics - 📈 分身工作量统计
about - ⚡ 关于飘叔 / Web4.0
```

### 3. Hermes 端配置

```powershell
# .env 中写入
TELEGRAM_BOT_TOKEN=894347...RNg
HTTPS_PROXY=http://127.0.0.1:7890
HTTP_PROXY=http://127.0.0.1:7890
NO_PROXY=

# config
hermes config set messaging.telegram.allowed_users "[6842933117]"
```

### 4. 启动 Gateway

```powershell
# 前台模式（推荐 — 继承当前会话的代理环境变量）
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:HTTP_PROXY="http://127.0.0.1:7890"
hermes gateway run

# 后台模式（Windows Scheduled Task — ⚠️ 不继承用户会话环境变量，代理可能不生效）
hermes gateway install  # Y → Y
hermes gateway start
```

## GFW 穿透排查流程

### 症状：Bot 无响应

TG 发 `/start` 无任何反馈。

### 排查步骤（按顺序）

**Step 1: 检查 Gateway 状态**
```powershell
hermes gateway status
# 期望: ✓ Gateway process running
```

**Step 2: 检查日志**
```powershell
type %LOCALAPPDATA%\hermes\logs\gateway.log | findstr -i telegram
```

关键错误模式：
- `httpx.ConnectError` + `Primary api.telegram.org connection failed` → 网络不通
- `DoH discovery yielded no usable IPs` → DNS 被污染
- `Proxy detected; passing explicitly to HTTPXRequest: ...` → 代理已识别

**Step 3: 测试 DNS**
```powershell
nslookup api.telegram.org
# 路由器 DNS (192.168.50.1) 能解析 → DNS 本身OK
# 但 DoH 被 GFW 阻断 → Gateway 自己的 DNS 过不了
```

**Step 4: 扫描代理端口**
```python
import socket
for port in [7890, 7891, 7066, 9090]:
    s = socket.socket()
    s.settimeout(0.5)
    if s.connect_ex(('127.0.0.1', port)) == 0:
        print(f"OPEN: {port}")
    s.close()
```

本案例：7066 未开，7890（HTTP）和 9090（管理面板）开了。

**Step 5: 验证代理能否连通 Telegram**
```python
import socket
ips = ['149.154.167.220', '149.154.167.221', '91.108.56.100']
for ip in ips:
    s = socket.socket()
    s.settimeout(2)
    s.connect(('127.0.0.1', 7890))
    s.send(f"CONNECT {ip}:443 HTTP/1.1\r\nHost: {ip}:443\r\n\r\n".encode())
    resp = s.recv(1024)
    print(f"{ip}: {'ESTABLISHED' if b'200' in resp else 'FAILED'}")
    s.close()
```

本案例：4 个 IP 全通 → 代理工作正常。

**Step 6: 确认代理端口类型**
- 7890 → HTTP 代理 ✅
- 7891 → SOCKS5（未开）
- Clash Meta 的 7066 可能是管理端口，不是代理端口

**Step 7: 前台 vs 后台**
```powershell
# 如果 Scheduled Task 的 Gateway 连不上 → 用前台模式
hermes gateway stop
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:HTTP_PROXY="http://127.0.0.1:7890"
hermes gateway run
# 看到 "Bot started" 或 "polling" → 成功
```

## 已知坑

1. **Windows Scheduled Task 不继承用户会话环境变量** — 代理 env var 写在 .env 里但 Scheduled Task 进程读不到。解决方案：前台 `hermes gateway run`，或修改 Scheduled Task 的启动脚本加上 `set HTTPS_PROXY=...`。

2. **Clash 端口别猜** — 用 `netstat -an | findstr LISTENING` 确认，别依赖用户记忆。7066 ≠ 7890。

3. **DoH DNS 在 GFW 下必挂** — Gateway 自己做 DNS-over-HTTPS 解析，在中国大陆 100% 失败。添加 `api.telegram.org` 到 hosts 文件可缓解，但代理通的话不需要。

4. **全局模式 ≠ 规则模式** — Clash 必须切到 Global，Rule 模式下 Telegram IP 可能不走代理。

5. **HTTP_PROXY vs HTTPS_PROXY** — httpx 可能需要两个都设，且大小写都写上。`NO_PROXY` 要清空。

## 快速验证脚本

部署完成后，在另一个 PowerShell 窗口跑：

```powershell
# 验证代理连通性
curl -x http://127.0.0.1:7890 -I https://api.telegram.org/bot{TOKEN}/getMe 2>&1 | findstr "HTTP"
# 期望: HTTP/2 200
```

如果返回 200 → Gateway 连接 Telegram 的所有前置条件都满足。

## 当前状态（2026-06-13）

- Bot: ✅ 已创建，命令菜单/描述/头像已配置
- Token: ✅ 已写入 .env
- allowed_users: ✅ [6842933117]
- 代理: ✅ Clash Meta 7890 全局模式
- 代理连通性: ✅ 4/4 Telegram IP 通过测试
- Gateway: ⚠️ 需前台 `hermes gateway run` + 代理 env vars
