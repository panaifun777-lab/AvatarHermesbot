# 完整技术选型表

> 语言/框架/数据库/部署。按场景匹配，不是按信仰。

## 语言选型

| 场景 | 首选 | 备选 | 绝对不用 | 理由 |
|:---|:---|:---|:---|:---|
| Web后端API | TypeScript (Node) | Go | PHP | Node生态成熟；Go适合高并发网关 |
| 系统编程/性能敏感 | Rust | Go | C++ | Rust安全性好 |
| 智能合约 | Solidity | Rust (Solana) | — | ETH生态最成熟 |
| 数据处理/脚本 | Python | TypeScript | R | Python生态无敌 |
| 前端 | TypeScript + React | Vue | jQuery | React社区最大 |
| CLI工具 | Go | Rust | Python | Go编译成单二进制 |
| 区块链核心层 | Rust | Go | Java | 性能和安全性缺一不可 |

## 框架选型

| 场景 | 首选 | 备选 | 不碰 | 理由 |
|:---|:---|:---|:---|:---|
| Web全栈 | Next.js | Remix | Nuxt | Next.js生态最成熟 |
| 纯API | Fastify | Express | Nest.js | Fastify性能好；Nest.js太重 |
| Go API | Gin | Chi | Beego | Gin Star数最高 |
| 移动端 | React Native | Flutter | 原生双写 | 跨平台优先 |
| CSS | Tailwind | — | Bootstrap | 原子化CSS |
| 状态管理 | Zustand | Jotai | Redux | Redux模板代码太多 |

## 数据库选型

| 场景 | 首选 | 备选 | 不碰 | 理由 |
|:---|:---|:---|:---|:---|
| 关系型（默认） | PostgreSQL | — | MySQL | PG功能全，JSON支持好 |
| 缓存 | Redis | — | Memcached | 数据结构丰富 |
| 搜索 | Elasticsearch | Meilisearch | Solr | ES生态成熟 |
| 向量/AI | pgvector | Pinecone | — | 能留在PG就别加新依赖 |
| 时序数据 | TimescaleDB | ClickHouse | InfluxDB | 基于PG，运维成本低 |

## 部署/基础设施

| 场景 | 首选 | 备选 | 不碰 |
|:---|:---|:---|:---|
| 容器编排 | Kubernetes | Docker Compose | Docker Swarm |
| CI/CD | GitHub Actions | GitLab CI | Jenkins |
| 云平台 | AWS | GCP | Azure |
| 监控 | Prometheus + Grafana | Datadog | 自建 |
| 日志 | Loki | ELK | 自建 |
| 密钥管理 | Vault | AWS Secrets Manager | 环境变量明文 |

## 选型铁律

1. 能用PG就用PG — 别无脑加新数据库。
2. 依赖少就是好架构 — 每加一个依赖，就多一个可能崩的点。
3. 生态成熟 > 性能极致 — 除非做数据库/游戏引擎。
4. 团队会什么用什么 — 最好的技术是团队能驾驭的技术。
5. 部署越简单越好 — 能一个Docker跑的别拆成微服务。
6. 开源优先 — 厂商锁定是慢性毒药。
