"""扫描本地 Clash/mihomo 代理端口并验证 Telegram 连通性。纯 socket，无依赖。"""

import socket

CLASH_PORTS = {
    7890: "HTTP",
    7891: "SOCKS5",
    7892: "Mixed",
    7893: "Redir",
    9090: "Admin Dashboard",
}

TELEGRAM_IPS = [
    "149.154.167.220",
    "149.154.167.221",
    "91.108.56.100",
]


def scan_ports():
    print("=== 代理端口扫描 ===")
    for port, desc in CLASH_PORTS.items():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.8)
            if s.connect_ex(("127.0.0.1", port)) == 0:
                print(f"  ✅ 127.0.0.1:{port} — {desc} OPEN")
            else:
                print(f"  ❌ 127.0.0.1:{port} — {desc}")
            s.close()
        except Exception as e:
            print(f"  ❌ 127.0.0.1:{port} — {e}")


def test_proxy(proxy_port):
    print(f"\n=== 代理 {proxy_port} → Telegram ===")
    for ip in TELEGRAM_IPS:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(3)
            s.connect(("127.0.0.1", proxy_port))
            s.send(f"CONNECT {ip}:443 HTTP/1.1\r\nHost: {ip}:443\r\n\r\n".encode())
            resp = s.recv(1024).decode(errors="replace")
            if "200" in resp:
                print(f"  ✅ {ip}:443 ESTABLISHED")
            else:
                print(f"  ❌ {ip}:443 — {resp.split(chr(13))[0]}")
            s.close()
        except Exception as e:
            print(f"  ❌ {ip}:443 — {e}")


if __name__ == "__main__":
    scan_ports()
    # 找第一个开放的 HTTP 代理端口
    proxy = next((p for p in [7890, 7892] if _test_open(p)), None)
    if proxy:
        test_proxy(proxy)
    else:
        print("\n⚠️ 未发现可用代理端口。确认 Clash 已启动且为全局模式。")


def _test_open(port):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        r = s.connect_ex(("127.0.0.1", port)) == 0
        s.close()
        return r
    except Exception:
        return False
