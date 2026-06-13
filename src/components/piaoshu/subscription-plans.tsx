'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Coins,
  ArrowUpRight,
  Check,
  Zap,
  Crown,
  Building2,
  Star,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight as ArrowUp,
  Copy,
  ExternalLink,
  History,
  ChevronDown,
  X,
  Flame,
  Gift,
  Sparkles,
  TrendingUp,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  useSubscriptionPlans,
  useCurrentSubscription,
  useSubscribePlan,
  useTopUpAFC,
  useAFCTransactions,
  type SubscriptionPlan,
} from '@/lib/api-hooks'
import { StripePayment } from '@/components/piaoshu/stripe-payment'

// Fallback plans for demo
const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    name: 'free',
    displayName: '免费版',
    priceAFC: 0,
    priceUSD: 0,
    maxClones: 1,
    maxCyclesPerDay: 5,
    features: ['1 智能分身', '5 AI周期/天', '基础技能', '社区支持', '基础邮件跟踪'],
    isActive: true,
    subscriberCount: 1200,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'plan-starter',
    name: 'starter',
    displayName: '入门版',
    priceAFC: 490,
    priceUSD: 49,
    maxClones: 3,
    maxCyclesPerDay: 20,
    features: ['3 智能分身', '20 AI周期/天', '邮件跟踪', '高级技能', '优先支持', '知识库访问'],
    isActive: true,
    subscriberCount: 580,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'plan-pro',
    name: 'pro',
    displayName: '专业版',
    priceAFC: 990,
    priceUSD: 99,
    maxClones: 10,
    maxCyclesPerDay: -1,
    features: ['10 智能分身', '无限AI周期', '全部技能', '优先支持', 'API访问', '自定义代理角色', '高级分析', '跨分身知识共享'],
    isActive: true,
    subscriberCount: 240,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'plan-enterprise',
    name: 'enterprise',
    displayName: '企业版',
    priceAFC: 0,
    priceUSD: 0,
    maxClones: -1,
    maxCyclesPerDay: -1,
    features: ['无限分身', '私有部署', '专属客服', 'SLA保障', '自定义集成', '白标方案', '安全审计', '培训支持'],
    isActive: true,
    subscriberCount: 15,
    createdAt: '',
    updatedAt: '',
  },
]

const PLAN_CONFIGS: Record<string, {
  icon: React.ElementType
  gradient: string
  borderColor: string
  bgAccent: string
  textColor: string
  badgeText: string
  badgeClass: string
  popular?: boolean
}> = {
  free: {
    icon: Zap,
    gradient: 'from-slate-500 to-slate-600',
    borderColor: 'border-slate-300 dark:border-slate-700',
    bgAccent: 'bg-slate-500/10',
    textColor: 'text-slate-600 dark:text-slate-400',
    badgeText: 'Free',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
  starter: {
    icon: Star,
    gradient: 'from-emerald-500 to-emerald-600',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    bgAccent: 'bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeText: 'Starter',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  pro: {
    icon: Crown,
    gradient: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-300 dark:border-violet-700',
    bgAccent: 'bg-violet-500/10',
    textColor: 'text-violet-600 dark:text-violet-400',
    badgeText: 'Pro',
    badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    popular: true,
  },
  enterprise: {
    icon: Building2,
    gradient: 'from-amber-500 to-amber-600',
    borderColor: 'border-amber-300 dark:border-amber-700',
    bgAccent: 'bg-amber-500/10',
    textColor: 'text-amber-600 dark:text-amber-400',
    badgeText: 'Enterprise',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
}

const PAYMENT_METHODS = [
  { id: 'stripe_link', label: 'Stripe Link 一键支付', icon: Zap, description: 'Link by Stripe · 一键完成' },
  { id: 'afc_base', label: 'AFC on Base', icon: Coins, description: 'AFC代币 (Base链)' },
  { id: 'usdt_base', label: 'USDT on Base', icon: Wallet, description: 'USDT稳定币 (Base链)' },
  { id: 'credit_card', label: 'Credit Card', icon: CreditCard, description: '信用卡支付' },
]

const TOP_UP_AMOUNTS = [100, 500, 1000, 5000]

// ─── Credit packages for one-time purchase ────────────────────────────────────
const CREDIT_PACKAGES = [
  { id: 'pkg-10', credits: 10, price: 25, pricePerCredit: 2.50, popular: false },
  { id: 'pkg-25', credits: 25, price: 50, pricePerCredit: 2.00, popular: false },
  { id: 'pkg-50', credits: 50, price: 90, pricePerCredit: 1.80, popular: true },
  { id: 'pkg-100', credits: 100, price: 150, pricePerCredit: 1.50, popular: false },
]

// ─── Monthly credit plans ──────────────────────────────────────────────────────
const MONTHLY_CREDIT_PLANS = [
  { id: 'monthly-50', creditsPerMonth: 50, price: 45, pricePerCredit: 0.90, savings: '50%', popular: false },
  { id: 'monthly-100', creditsPerMonth: 100, price: 79, pricePerCredit: 0.79, savings: '60%', popular: true },
  { id: 'monthly-200', creditsPerMonth: 200, price: 139, pricePerCredit: 0.70, savings: '65%', popular: false },
]

// ─── Feature comparison data ──────────────────────────────────────────────────
const FEATURE_COMPARISON = [
  { feature: '智能分身', free: '1', starter: '3', pro: '10', enterprise: '无限' },
  { feature: 'AI周期/天', free: '5', starter: '20', pro: '无限', enterprise: '无限' },
  { feature: '邮件跟踪', free: '基础', starter: '完整', pro: '完整', enterprise: '自定义' },
  { feature: '技能库', free: '基础', starter: '高级', pro: '全部', enterprise: '自定义' },
  { feature: 'API访问', free: '—', starter: '—', pro: '✓', enterprise: '✓' },
  { feature: '自定义代理角色', free: '—', starter: '—', pro: '✓', enterprise: '✓' },
  { feature: '高级分析', free: '—', starter: '—', pro: '✓', enterprise: '✓' },
  { feature: '跨分身知识共享', free: '—', starter: '—', pro: '✓', enterprise: '✓' },
  { feature: '私有部署', free: '—', starter: '—', pro: '—', enterprise: '✓' },
  { feature: 'SLA保障', free: '—', starter: '—', pro: '—', enterprise: '✓' },
  { feature: '白标方案', free: '—', starter: '—', pro: '—', enterprise: '✓' },
  { feature: '安全审计', free: '—', starter: '—', pro: '—', enterprise: '✓' },
]

export function SubscriptionPlans() {
  const { data: session } = useSession()
  const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined

  const { data: plansData, isLoading: plansLoading } = useSubscriptionPlans()
  const { data: subData, isLoading: subLoading } = useCurrentSubscription(userId)
  const { data: txData, isLoading: txLoading } = useAFCTransactions(userId)
  const subscribeMutation = useSubscribePlan()
  const topUpMutation = useTopUpAFC()

  const [selectedPayment, setSelectedPayment] = useState('stripe_link')
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState(500)
  const [txHistoryOpen, setTxHistoryOpen] = useState(false)
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null)

  // Credit modal state
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [creditTab, setCreditTab] = useState('onetime')
  const [selectedCreditPkg, setSelectedCreditPkg] = useState('pkg-50')
  const [selectedMonthlyPlan, setSelectedMonthlyPlan] = useState('monthly-100')

  // Stripe payment dialog state
  const [stripePayOpen, setStripePayOpen] = useState(false)
  const [stripePayPlan, setStripePayPlan] = useState<SubscriptionPlan | null>(null)

  const plans = plansData?.data?.plans?.length ? plansData.data.plans : FALLBACK_PLANS
  const currentPlanName = subData?.data?.plan?.name ?? 'free'
  const afcBalance = subData?.data?.afcBalance ?? 0
  const afcUsed = subData?.data?.afcUsed ?? 0
  const transactions = txData?.data?.transactions ?? []

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!userId) {
      toast.error('请先登录')
      return
    }
    if (plan.name === currentPlanName) {
      toast.info('您已在当前方案中')
      return
    }
    if (plan.name === 'enterprise') {
      toast.info('请发送邮件至 enterprise@piaoshu.ai 获取企业定制方案')
      return
    }

    setSubscribingPlan(plan.id)
    try {
      const result = await subscribeMutation.mutateAsync({
        userId,
        planId: plan.id,
        paymentMethod: selectedPayment,
      })
      if (result.success) {
        toast.success(`已成功订阅${plan.displayName}！`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '订阅失败')
    } finally {
      setSubscribingPlan(null)
    }
  }

  const handleTopUp = async () => {
    if (!userId) {
      toast.error('请先登录')
      return
    }
    try {
      const result = await topUpMutation.mutateAsync({
        userId,
        amount: topUpAmount,
        paymentMethod: selectedPayment,
      })
      if (result.success) {
        toast.success(`成功充值 ${topUpAmount} AFC！`)
        setTopUpOpen(false)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '充值失败')
    }
  }

  const handleCreditPurchase = () => {
    if (creditTab === 'onetime') {
      const pkg = CREDIT_PACKAGES.find(p => p.id === selectedCreditPkg)
      if (pkg) {
        toast.success(`成功购买 ${pkg.credits} 积分！共 $${pkg.price}`)
        setCreditModalOpen(false)
      }
    } else {
      const plan = MONTHLY_CREDIT_PLANS.find(p => p.id === selectedMonthlyPlan)
      if (plan) {
        toast.success(`已订阅月度套餐：每月 ${plan.creditsPerMonth} 积分！$${plan.price}/月`)
        setCreditModalOpen(false)
      }
    }
  }

  const formatCycles = (n: number) => (n === -1 ? '无限' : `${n}`)

  return (
    <div className="space-y-6">
      {/* Header with AFC Balance */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-amber-500" />
            AFC 订阅方案
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            选择适合您的方案 · 1 AFC = 0.1 USDT · Base链支付
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* AFC Balance Card */}
          <Card className="rounded-xl shadow-sm border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                  <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">AFC 余额</p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                    {subLoading ? <Skeleton className="h-6 w-16" /> : afcBalance.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ≈ ${(afcBalance * 0.1).toFixed(1)} USDT
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] gap-1 border-amber-300 dark:border-amber-700"
                  onClick={() => setTopUpOpen(true)}
                >
                  <ArrowDownLeft className="h-3 w-3" />
                  充值
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[10px] gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 border-0"
                  onClick={() => setCreditModalOpen(true)}
                >
                  <Sparkles className="h-3 w-3" />
                  积分
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] gap-1"
                  onClick={() => setTxHistoryOpen(true)}
                >
                  <History className="h-3 w-3" />
                  记录
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Method Selector */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">支付方式</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPayment(method.id)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all text-xs ${
                  selectedPayment === method.id
                    ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-400/30'
                    : 'border-border hover:border-amber-300 dark:hover:border-amber-700'
                }`}
              >
                <method.icon className={`h-4 w-4 shrink-0 ${selectedPayment === method.id ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
                <div className="min-w-0">
                  <p className="font-medium truncate">{method.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{method.description}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Badge variant="secondary" className="h-4 text-[8px] px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0">
              Base
            </Badge>
            <span>Chain ID: 84532 · Gas: ~0.001 ETH</span>
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plansLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-[420px] rounded-xl">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-4 w-24" />
                <Separator />
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          ))
        ) : (
          plans.map((plan, index) => {
            const config = PLAN_CONFIGS[plan.name] || PLAN_CONFIGS.free
            const isCurrent = plan.name === currentPlanName
            const isPopular = config.popular
            const Icon = config.icon
            const isEnterprise = plan.name === 'enterprise'
            const isSubscribing = subscribingPlan === plan.id

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Card
                  className={`relative h-full flex flex-col rounded-xl shadow-sm transition-all duration-200 hover:shadow-lg ${
                    isPopular ? 'ring-2 ring-violet-400 dark:ring-violet-600' : ''
                  } ${isCurrent ? config.borderColor : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-[10px] px-3">
                        最受欢迎
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <Badge className={config.badgeClass}>
                        {config.badgeText}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-lg font-bold">{plan.displayName}</h3>
                      {isEnterprise ? (
                        <p className="text-sm text-muted-foreground mt-0.5">自定义定价</p>
                      ) : (
                        <div className="mt-1">
                          <span className="text-3xl font-bold">
                            {plan.priceAFC === 0 ? '0' : plan.priceAFC.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">AFC/月</span>
                          {plan.priceUSD > 0 && (
                            <p className="text-xs text-muted-foreground">
                              ≈ ${plan.priceUSD}/月
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 pb-3">
                    <Separator className="mb-3" />
                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className={`rounded-lg ${config.bgAccent} p-2 text-center`}>
                        <p className="text-xs text-muted-foreground">智能分身</p>
                        <p className={`text-sm font-bold ${config.textColor}`}>
                          {formatCycles(plan.maxClones)}
                        </p>
                      </div>
                      <div className={`rounded-lg ${config.bgAccent} p-2 text-center`}>
                        <p className="text-xs text-muted-foreground">AI周期/天</p>
                        <p className={`text-sm font-bold ${config.textColor}`}>
                          {formatCycles(plan.maxCyclesPerDay)}
                        </p>
                      </div>
                    </div>
                    {/* Features */}
                    <ul className="space-y-1.5">
                      {plan.features.slice(0, 6).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${config.textColor}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 6 && (
                        <li className="text-[10px] text-muted-foreground pl-5">
                          +{plan.features.length - 6} 更多功能
                        </li>
                      )}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-0">
                    {isCurrent ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled
                      >
                        <Check className="mr-1.5 h-4 w-4" />
                        当前方案
                      </Button>
                    ) : isEnterprise ? (
                      <Button
                        className={`w-full bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`}
                        onClick={() => toast.info('请发送邮件至 enterprise@piaoshu.ai')}
                      >
                        联系销售
                        <ArrowUpRight className="ml-1 h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="w-full space-y-2">
                        <Button
                          className={`w-full ${
                            isPopular
                              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90'
                              : ''
                          }`}
                          variant={isPopular ? 'default' : 'outline'}
                          disabled={isSubscribing || subscribeMutation.isPending}
                          onClick={() => handleSubscribe(plan)}
                        >
                          {isSubscribing ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="mr-2"
                              >
                                <Zap className="h-4 w-4" />
                              </motion.div>
                              处理中...
                            </>
                          ) : (
                            <>
                              {currentPlanName === 'free' ? '选择方案' : '升级'}
                              <ArrowUpRight className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>
                        <Button
                          className="w-full gap-1.5 text-xs"
                          variant="outline"
                          onClick={() => {
                            setStripePayPlan(plan)
                            setStripePayOpen(true)
                          }}
                        >
                          <Shield className="h-3.5 w-3.5" />
                          选择支付方式
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Feature Comparison Table */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold">功能对比</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">功能</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-500">免费版</th>
                  <th className="text-center py-2 px-3 font-medium text-emerald-600">入门版</th>
                  <th className="text-center py-2 px-3 font-medium text-violet-600">专业版</th>
                  <th className="text-center py-2 px-3 font-medium text-amber-600">企业版</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                    <td className="py-2 pr-4 font-medium">{row.feature}</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">{row.free === '—' ? '—' : row.free === '✓' ? <Check className="h-3.5 w-3.5 mx-auto text-slate-500" /> : row.free}</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">{row.starter === '—' ? '—' : row.starter === '✓' ? <Check className="h-3.5 w-3.5 mx-auto text-emerald-500" /> : row.starter}</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">{row.pro === '—' ? '—' : row.pro === '✓' ? <Check className="h-3.5 w-3.5 mx-auto text-violet-500" /> : row.pro}</td>
                    <td className="text-center py-2 px-3 text-muted-foreground">{row.enterprise === '—' ? '—' : row.enterprise === '✓' ? <Check className="h-3.5 w-3.5 mx-auto text-amber-500" /> : row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AFC Token Info */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">AFC Token 说明</h3>
            <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0">
              Base Chain
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">兑换比例</p>
              <p className="text-lg font-bold">1 AFC = 0.1 USDT</p>
              <p className="text-[10px] text-muted-foreground">Base链上实时兑换</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">合约地址</p>
              <p className="text-sm font-mono font-bold truncate">0xAFC...0000</p>
              <button
                className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-1"
                onClick={() => {
                  navigator.clipboard.writeText('0xAFC_Token_Contract0000000000000000000')
                  toast.success('合约地址已复制')
                }}
              >
                <Copy className="h-2.5 w-2.5" /> 复制地址
              </button>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">网络信息</p>
              <p className="text-sm font-bold">Base Sepolia</p>
              <p className="text-[10px] text-muted-foreground">Chain ID: 84532 · L2 Testnet</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Credit Purchase Modal (Polsia-style) ─────────────────────────── */}
      <Dialog open={creditModalOpen} onOpenChange={setCreditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              购买积分
            </DialogTitle>
          </DialogHeader>

          <Tabs value={creditTab} onValueChange={setCreditTab} className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="onetime" className="flex-1 gap-1.5 text-xs">
                <Zap className="h-3.5 w-3.5" />
                一次性充值
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex-1 gap-1.5 text-xs">
                <Gift className="h-3.5 w-3.5" />
                月度套餐
              </TabsTrigger>
            </TabsList>

            {/* One-time top up */}
            <TabsContent value="onetime" className="mt-4 space-y-4">
              <RadioGroup value={selectedCreditPkg} onValueChange={setSelectedCreditPkg}>
                <div className="space-y-2">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        selectedCreditPkg === pkg.id
                          ? 'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/20 ring-1 ring-orange-400/30'
                          : 'border-border hover:border-orange-300 dark:hover:border-orange-700'
                      }`}
                    >
                      <RadioGroupItem value={pkg.id} id={pkg.id} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={pkg.id} className="text-sm font-semibold cursor-pointer">
                            {pkg.credits} 积分
                          </Label>
                          {pkg.popular && (
                            <Badge className="text-[9px] h-4 px-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                              热门
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          ${pkg.pricePerCredit.toFixed(2)}/积分
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold">${pkg.price}</p>
                        {pkg.credits === 100 && (
                          <Badge variant="secondary" className="text-[8px] h-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                            省两成
                          </Badge>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>

              {/* Selected package summary */}
              {(() => {
                const pkg = CREDIT_PACKAGES.find(p => p.id === selectedCreditPkg)
                if (!pkg) return null
                return (
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">积分数量</span>
                      <span className="font-medium">{pkg.credits} 积分</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">单价</span>
                      <span className="font-medium">${pkg.pricePerCredit.toFixed(2)}/积分</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-bold">
                      <span>应付</span>
                      <span className="text-orange-600 dark:text-orange-400">${pkg.price}</span>
                    </div>
                  </div>
                )
              })()}
            </TabsContent>

            {/* Monthly plans */}
            <TabsContent value="monthly" className="mt-4 space-y-4">
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Gift className="h-3.5 w-3.5" />
                  月度套餐更优惠 — 最低 $0.70/积分，节省高达65%
                </div>
              </div>

              <RadioGroup value={selectedMonthlyPlan} onValueChange={setSelectedMonthlyPlan}>
                <div className="space-y-2">
                  {MONTHLY_CREDIT_PLANS.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        selectedMonthlyPlan === plan.id
                          ? 'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/20 ring-1 ring-orange-400/30'
                          : 'border-border hover:border-orange-300 dark:hover:border-orange-700'
                      }`}
                    >
                      <RadioGroupItem value={plan.id} id={plan.id} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={plan.id} className="text-sm font-semibold cursor-pointer">
                            {plan.creditsPerMonth} 积分/月
                          </Label>
                          {plan.popular && (
                            <Badge className="text-[9px] h-4 px-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                              热门
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          ${plan.pricePerCredit.toFixed(2)}/积分 · 节省{plan.savings}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold">${plan.price}</p>
                        <p className="text-[10px] text-muted-foreground">/月</p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>

              {/* Selected monthly plan summary */}
              {(() => {
                const plan = MONTHLY_CREDIT_PLANS.find(p => p.id === selectedMonthlyPlan)
                if (!plan) return null
                return (
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">每月积分</span>
                      <span className="font-medium">{plan.creditsPerMonth} 积分</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">单价</span>
                      <span className="font-medium">${plan.pricePerCredit.toFixed(2)}/积分</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">节省</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{plan.savings}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-bold">
                      <span>月付</span>
                      <span className="text-orange-600 dark:text-orange-400">${plan.price}/月</span>
                    </div>
                  </div>
                )
              })()}
            </TabsContent>
          </Tabs>

          {/* Payment method selector */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">支付方式</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.slice(0, 2).map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-all ${
                    selectedPayment === method.id
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20'
                      : 'border-border'
                  }`}
                >
                  <method.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 gap-1.5 font-semibold"
            onClick={handleCreditPurchase}
          >
            <Flame className="h-4 w-4" />
            确认购买
          </Button>
        </DialogContent>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              充值 AFC
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Amount Selection */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">选择充值金额</p>
              <div className="grid grid-cols-4 gap-2">
                {TOP_UP_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTopUpAmount(amount)}
                    className={`rounded-lg border p-3 text-center transition-all ${
                      topUpAmount === amount
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-400/30'
                        : 'border-border hover:border-amber-300'
                    }`}
                  >
                    <p className="text-sm font-bold">{amount}</p>
                    <p className="text-[10px] text-muted-foreground">AFC</p>
                    <p className="text-[10px] text-muted-foreground">≈ ${(amount * 0.1).toFixed(0)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">支付方式</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-all ${
                      selectedPayment === method.id
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                        : 'border-border'
                    }`}
                  >
                    <method.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">充值数量</span>
                <span className="font-medium">{topUpAmount} AFC</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">等值金额</span>
                <span className="font-medium">${(topUpAmount * 0.1).toFixed(1)} USDT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">网络</span>
                <span className="font-medium">Base Chain</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span>应付</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {selectedPayment === 'afc_base' ? `${topUpAmount} AFC` : `$${(topUpAmount * 0.1).toFixed(1)}`}
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white"
              onClick={handleTopUp}
              disabled={topUpMutation.isPending}
            >
              {topUpMutation.isPending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Zap className="h-4 w-4" />
                  </motion.div>
                  处理中...
                </>
              ) : (
                <>
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  确认充值
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={txHistoryOpen} onOpenChange={setTxHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-amber-500" />
              AFC 交易记录
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {txLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无交易记录</p>
              </div>
            ) : (
              transactions.map((tx) => {
                const isCredit = tx.amount > 0
                const typeLabels: Record<string, string> = {
                  subscription_payment: '订阅支付',
                  skill_purchase: '技能购买',
                  cycle_payment: '周期支付',
                  top_up: '充值',
                  withdrawal: '提现',
                  reward: '奖励',
                }
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">
                          {typeLabels[tx.type] || tx.type}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[8px] h-4 border-0 ${
                            tx.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                            tx.status === 'pending' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                            'bg-red-500/10 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {tx.status === 'confirmed' ? '已确认' : tx.status === 'pending' ? '待确认' : '失败'}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {tx.description || new Date(tx.createdAt).toLocaleString('zh-CN')}
                      </p>
                      {tx.txHash && (
                        <button
                          className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-0.5"
                          onClick={() => {
                            navigator.clipboard.writeText(tx.txHash!)
                            toast.success('交易哈希已复制')
                          }}
                        >
                          <Copy className="h-2.5 w-2.5" />
                          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                        </button>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isCredit ? '+' : ''}{tx.amount} AFC
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        ≈ ${Math.abs(tx.amount * 0.1).toFixed(1)}
                      </p>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Transaction Summary */}
          {txData?.data?.summary && (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">总充值</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  +{txData.data.summary.topUpTotal} AFC
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">总消费</p>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  -{txData.data.summary.spentTotal} AFC
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">净额</p>
                <p className="text-sm font-bold">{txData.data.summary.netAmount} AFC</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stripe Payment Dialog */}
      <Dialog open={stripePayOpen} onOpenChange={(open) => {
        setStripePayOpen(open)
        if (!open) setStripePayPlan(null)
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
                <Shield className="h-4 w-4 text-white" />
              </div>
              {stripePayPlan ? `${stripePayPlan.displayName} — 选择支付方式` : '选择支付方式'}
              <Badge className="text-[9px] h-4 px-1.5 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-0">
                Stripe Link
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <StripePayment
            plan={stripePayPlan ?? undefined}
            planId={stripePayPlan?.id}
            amount={stripePayPlan?.priceUSD ?? 0}
            currency="usd"
            onSuccess={() => {
              setStripePayOpen(false)
              setStripePayPlan(null)
            }}
            onClose={() => {
              setStripePayOpen(false)
              setStripePayPlan(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
