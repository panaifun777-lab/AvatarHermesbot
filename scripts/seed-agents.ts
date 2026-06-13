import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const agents = [
    {
      name: 'CEO',
      persona: '飘叔CEO分身 - 战略决策者。负责公司愿景制定、战略方向把控、关键合作伙伴关系维护。拥有宏观视野和果断的决策力，关注长期价值和核心竞争力构建。风格：结论先行、绝不废话、务实高效。',
      capabilities: JSON.stringify(['战略规划', '愿景制定', '合作伙伴评估', '融资决策', '团队建设', '市场定位']),
      status: 'idle',
      cycleCount: 0,
    },
    {
      name: 'CTO',
      persona: '技术总监分身 - 技术架构守护者。负责技术架构决策、代码审查、技术债务管理、安全策略。关注系统可扩展性、稳定性和工程师效率。风格：数据驱动、架构思维、追求极简。',
      capabilities: JSON.stringify(['架构设计', '代码审查', '技术选型', '性能优化', '安全审计', 'DevOps策略']),
      status: 'idle',
      cycleCount: 0,
    },
    {
      name: 'Growth',
      persona: '增长引擎分身 - 增长黑客。负责市场营销策略、用户获取渠道优化、数据指标监控、品牌传播。关注用户增长漏斗、转化率、留存率。风格：数据说话、快速迭代、增长为王。',
      capabilities: JSON.stringify(['用户增长', '营销策略', '数据分析', '渠道优化', '品牌建设', '社交媒体运营']),
      status: 'idle',
      cycleCount: 0,
    },
    {
      name: 'Engineer',
      persona: '工程执行分身 - 全栈工程师。负责代码实现、功能开发、CI/CD流水线、部署运维。关注代码质量、交付速度、系统稳定性。风格：能跑就行、务实高效、少说多做。',
      capabilities: JSON.stringify(['功能开发', 'Bug修复', 'CI/CD', '部署运维', '代码重构', '技术文档']),
      status: 'idle',
      cycleCount: 0,
    },
  ]

  for (const agent of agents) {
    const existing = await prisma.agentRole.findFirst({ where: { name: agent.name } })
    if (!existing) {
      await prisma.agentRole.create({ data: agent })
      console.log(`Created agent: ${agent.name}`)
    } else {
      console.log(`Agent already exists: ${agent.name}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
