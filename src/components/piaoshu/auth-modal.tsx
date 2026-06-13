'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, LogIn, UserPlus, Zap, Shield, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'login' | 'register'
}

export function AuthModal({ open, onOpenChange, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)
  const [isLoading, setIsLoading] = useState(false)

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  const handleLogin = async () => {
    if (!loginIdentifier || !loginPassword) {
      toast.error('请填写用户名/邮箱和密码')
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: loginIdentifier,
        password: loginPassword,
        redirect: false,
      })

      if (result?.error) {
        toast.error('登录失败：用户名/邮箱或密码错误')
        setIsLoading(false)
      } else {
        toast.success('登录成功，欢迎回来！')
        onOpenChange(false)
        setLoginIdentifier('')
        setLoginPassword('')
        // Force page refresh to pick up new session (critical for Vercel)
        setTimeout(() => window.location.reload(), 300)
      }
    } catch {
      toast.error('登录失败，请稍后重试')
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerName || !registerEmail || !registerPassword) {
      toast.error('请填写所有必填项')
      return
    }

    if (registerPassword.length < 6) {
      toast.error('密码至少需要6个字符')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || '注册失败')
        setIsLoading(false)
        return
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email: registerEmail,
        password: registerPassword,
        redirect: false,
      })

      if (result?.error) {
        toast.success('注册成功！请手动登录')
        setActiveTab('login')
        setIsLoading(false)
      } else {
        toast.success('注册成功，欢迎加入飘叔！')
        onOpenChange(false)
        setRegisterName('')
        setRegisterEmail('')
        setRegisterPassword('')
        setTimeout(() => window.location.reload(), 300)
      }
    } catch {
      toast.error('注册失败，请稍后重试')
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, mode: 'login' | 'register') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (mode === 'login') handleLogin()
      else handleRegister()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-background px-6 pt-6 pb-4">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 shadow-lg shadow-violet-500/20">
                <Zap className="h-4 w-4 text-white" />
              </div>
              飘叔 Avatar OS
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              登录以解锁完整的AI分身系统和协作能力
            </DialogDescription>
          </DialogHeader>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI分身系统
            </Badge>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
              <Shield className="h-2.5 w-2.5 mr-0.5" /> 可信证据链
            </Badge>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400">
              <Zap className="h-2.5 w-2.5 mr-0.5" /> 实时协作
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Tabs for Login / Register */}
        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login" className="gap-1.5 text-xs">
                <LogIn className="h-3 w-3" />
                登录
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-1.5 text-xs">
                <UserPlus className="h-3 w-3" />
                注册
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4 mt-0">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="login-identifier" className="text-xs">用户名 / 邮箱</Label>
                  <Input
                    id="login-identifier"
                    type="text"
                    placeholder="输入用户名或邮箱"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'login')}
                    className="h-9 text-sm"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-xs">密码</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="输入密码"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'login')}
                    className="h-9 text-sm"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white shadow-md shadow-violet-500/20"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {isLoading ? '登录中...' : '登录'}
              </Button>

              {/* Admin account hint */}
              <div className="rounded-lg border border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-500/5 p-3 space-y-1">
                <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">超级管理员</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Piaoshu001 / Gai169999$
                </p>
              </div>

              {/* Demo account hint */}
              <div className="rounded-lg border border-dashed border-violet-200 dark:border-violet-800 bg-violet-500/5 p-3 space-y-1">
                <p className="text-[10px] font-medium text-violet-600 dark:text-violet-400">演示账号</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  demo@piaoshu.ai / demo123
                </p>
              </div>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4 mt-0">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="register-name" className="text-xs">姓名</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="你的名字"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'register')}
                    className="h-9 text-sm"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="register-email" className="text-xs">邮箱</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'register')}
                    className="h-9 text-sm"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="register-password" className="text-xs">密码</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="至少6个字符"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'register')}
                    className="h-9 text-sm"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button
                className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white shadow-md shadow-violet-500/20"
                onClick={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {isLoading ? '注册中...' : '创建账号'}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                注册后将自动创建你的AI分身系统
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
