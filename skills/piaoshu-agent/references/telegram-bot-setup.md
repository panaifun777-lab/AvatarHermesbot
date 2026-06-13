# Telegram Bot 接入指南

> @AvatarHermesbot 的完整接入流程。从零到上线，含 GFW 代理排障。

## 前置条件

- Hermes Agent 已安装
- Telegram 账号
- 能翻墙的代理（Clash Meta / V2Ray / 路由器）
- 代理端口已知（默认 Clash mixed: 7890）

---

## 第一步：创建 Bot

通过 Telegram Bot API 完成全部设置，无需 BotFather 交互：

```
API: https://api.telegram.org/bot<TOKEN>
```

```python
# 设置命令菜单
setMyCommands → 9条自定义命令

# 设置个人信息
setMyName → 飘叔分身 · Avatar Hermes
setMyDescription → 飘叔分身 · Web4.0 架构师...
setMyShortDescription → 🔩 代码即法律，架构即人格
```

命令菜单模板：
```json
[
  {"command": "start", "description": "🔩 唤醒分身"},
  {"command": "status", "description": "📊 分身状态卡"},
  {"command": "identity", "description": "🧬 认知所有权看板"},
  {"command": "about", "description": "⚡ 关于飘叔 / Web4.0"},
  {"command": "review", "description": "🔍 代码审查（贴代码即审）"},
  {"command": "diagnose", "description": "🩸 故障排查（报错贴日志）"},
  {"command": "select", "description": "🛠 技术选型建议"},
  {"command": "decisions", "description": "📋 本周决策记录"},
  {"command": "metrics", "description": "📈 分身工作量统计"}
]
```

---

## 第二步：配置 Hermes Gateway

### 写入 .env

```powershell
# 追加令牌到 .env
Add-Content "$env:LOCALAPPDATA\hermes\.env" "TELEGRAM_BOT_TOKEN=894347...RNg"
```

### 允许用户

```yaml
# config.yaml
messaging:
  telegram:
    allowed_users: [6842933117]
```

**⚠️ 注意**：用 YAML 内联列表格式 `[6842933117]`，不要加引号。`allowed_users: '[6842933117]'` 是字符串不是列表，Gateway 会报 `Unauthorized user`。

TG 用户 ID 获取：给 `@userinfobot` 发消息。

---

## 第三步：代理配置（墙内必须）

### 检测代理类型

Clash Meta 控制面板：`http://127.0.0.1:9090`

```python
# 通过 Clash API 查看配置
GET /configs → port/mode/socks-port
GET /proxies → 当前节点和延迟
```

**典型端口**：
| 端口 | 类型 |
|------|------|
| 7890 | Mixed (HTTP+SOCKS5) |
| 9090 | Admin API（不是代理！） |

### 写入代理到 .env

```bash
HTTPS_PROXY=http://127.0.0.1:7890
HTTP_PROXY=http://127.0.0.1:7890
ALL_PROXY=http://127.0.0.1:7890
NO_PROXY=
```

同时写大小写变体（`https_proxy`, `http_proxy`），覆盖不同库的识别方式。

### Clash Meta 常见问题

**GLOBAL 组选了 DIRECT**（最常见）：
```python
# 通过 API 切换到节点
PUT /proxies/GLOBAL {"name": "🇯🇵日本"}
```

**节点延迟检查**：
```python
GET /proxies → history[].delay
```

---

## 第四步：DNS 修复（墙内）

Telegram DoH 解析被 GFW 拦截。写死 hosts：

```
C:\Windows\System32\drivers\etc\hosts:
149.154.167.220 api.telegram.org
149.154.167.221 api.telegram.org
```

验证：`nslookup api.telegram.org`

---

## 第五步：启动与验证

```powershell
hermes gateway install   # 注册为 Windows 计划任务
hermes gateway start     # 启动
hermes gateway status    # 验证
```

日志路径：`%LOCALAPPDATA%\hermes\logs\gateway.log`

成功标志：
```
✓ telegram connected
[Telegram] Connected to Telegram (polling mode)
```

---

## 排障检查清单

| 症状 | 检查 |
|------|------|
| `httpx.ConnectError` | 代理端口是否正确？`netstat -an \| findstr 7890` |
| `Unauthorized user` | `allowed_users` YAML 格式是否正确？必须是无引号列表 `[ID]` |
| `DoH discovery yielded no usable IPs` | hosts 文件是否写入了 Telegram IP？ |
| 代理端口开着但不通 | `curl -x http://127.0.0.1:7890 http://httpbin.org/ip` 测试 |
| 代理 HTTP 通但 HTTPS 不通 | Clash 节点是否活跃？API 查 `GET /proxies` |
| Scheduled Task 启动但代理不通 | 用 `hermes gateway run` 前台运行 |
| GLOBAL 选了节点还是不通 | 查 Clash API 确认当前节点 latency |
| 全站 HTTPS 502 | Clash 出站节点挂了，换节点 |

---

## 代理连通性测试

```python
import socket, ssl

# 1. 测试代理 HTTP CONNECT
s = socket.socket()
s.connect(('127.0.0.1', 7890))
s.send(b"CONNECT api.telegram.org:443 HTTP/1.1\r\nHost: api.telegram.org:443\r\n\r\n")
# 期望: HTTP/1.1 200 Connection established

# 2. 测试 TLS 握手
ctx = ssl.create_default_context()
ss = ctx.wrap_socket(s, server_hostname='api.telegram.org')
# 如果 TLS 失败（SSLEOFError）→ GFW DPI 拦截，代理节点问题

# 3. 测试 HTTP 请求
ss.send(b"GET /bot<TOKEN>/getMe HTTP/1.1\r\nHost: api.telegram.org\r\n\r\n")
# 期望: HTTP/1.1 200 OK
```

---

## 参考

- Hermes Gateway 文档: https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram/
- Telegram Bot API: https://core.telegram.org/bots/api
- Clash Meta: https://github.com/MetaCubeX/mihomo
