## Telegram Bot 配置
- Bot: @AvatarHermesbot, TG User ID: 6842933117 (piaoshuweb4)
- 位于中国大陆，需代理访问 api.telegram.org
- Clash Meta 代理: 127.0.0.1:7890 (mixed HTTP+SOCKS), 管理面板 9090
- Clash GLOBAL 组默认 DIRECT，需手动切到 🇯🇵日本 等节点
- DNS 被墙：hosts 写死 api.telegram.org → 149.154.167.220
- 代理环境变量需同时设 HTTPS_PROXY/HTTP_PROXY/ALL_PROXY + 小写变体
- Windows Scheduled Task 不自动读 .env，需重装 gateway 或前台跑
- allowed_users 需 YAML 列表格式 `- 6842933117`，不能用引号字符串
- 网络: 路由器 RT-AC88U-B468 (192.168.50.1), 本机 192.168.50.230