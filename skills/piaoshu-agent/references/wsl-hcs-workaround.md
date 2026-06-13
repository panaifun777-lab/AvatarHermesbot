# WSL HCS 文件系统故障 · 绕过方案

> 适用场景：Hermes Agent 在 Windows 主机上，WSL2 虚拟磁盘丢失或 HCS 挂载失败，
> 导致 write_file / terminal / search_files / patch 全部不可用。

## 症状

所有文件系统工具返回相同错误：

```
Bash/Service/CreateInstance/MountDisk/HCS/ERROR_FILE_NOT_FOUND
```

路径指向不存在的 VHDX 文件：
```
C:\Users\Administrator\AppData\Local\wsl\{guid}\ext4.vhdx
```

## 根因

WSL2 的 Host Compute Service (HCS) 无法挂载虚拟磁盘。通常是：
1. WSL 发行版被意外删除或损坏
2. VHDX 文件被移动/删除
3. Docker Desktop 或其他 Hyper-V 服务冲突

## 绕过方案

**首选**：使用 `execute_code` 工具读写文件。它运行在 Windows 原生 Python 上，完全绕过 WSL。

### 读文件

```python
from pathlib import Path
path = Path.home() / "AppData" / "Local" / "hermes" / "config.yaml"
content = path.read_text(encoding="utf-8")
print(content)
```

### 写文件

```python
from pathlib import Path
path = Path.home() / "Desktop" / "output.txt"
path.write_text("content here", encoding="utf-8")
# 父目录自动创建
path.parent.mkdir(parents=True, exist_ok=True)
```

### 搜索文件

```python
from pathlib import Path
base = Path.home() / "AppData" / "Local" / "hermes"
for f in base.rglob("*.py"):
    print(f.relative_to(base))
```

### 运行命令（如果 terminal 也挂了）

在 `execute_code` 中用 `subprocess`：

```python
import subprocess
result = subprocess.run(
    ["hermes", "gateway", "status"],
    capture_output=True, text=True, timeout=10,
    cwd=str(Path.home()),
)
print(result.stdout)
```

## 修复 WSL（如果必须）

```powershell
# 检查 WSL 状态
wsl --status

# 列出已安装的发行版
wsl --list --verbose

# 如果发行版损坏，注销后重新安装
wsl --unregister <distro-name>
wsl --install -d Ubuntu
```

**警告**：注销会删除该发行版的所有数据。如果 VHDX 文件还在但 WSL 找不到，先尝试 `wsl --shutdown` 然后重启。

## 判断标准

以下工具在 WSL HCS 故障时不可用：
- `write_file` — 不可用
- `read_file` — 不可用
- `terminal` — 不可用
- `search_files` — 不可用（依赖 ripgrep → WSL）
- `patch` — 不可用

以下工具仍可用：
- `execute_code` — ✅ 可用（Windows 原生 Python）
- `web_search` — ✅ 可用（HTTP API）
- `web_extract` — ✅ 可用（HTTP API）
- `browser_*` — ✅ 可用（远程 Browserbase）
- `cronjob` — ✅ 可用（Hermes API）
- `memory` — ✅ 可用（Hermes API）
- `skill_view` / `skill_manage` — ✅ 可用（Hermes API）
- `delegate_task` — ⚠️ 子代理也会遇到同样故障，避免传递文件操作任务

## 何时修复 vs 绕过

| 场景 | 建议 |
|:---|:---|
| 只需读写配置文件 | 用 execute_code 绕过 |
| 需要跑 shell 命令 | 用 execute_code + subprocess |
| 需要长期 WSL 环境 | 修复 WSL 发行版 |
| WSL 数据不重要 | wsl --unregister 重装最快 |
