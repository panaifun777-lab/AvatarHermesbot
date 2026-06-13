'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { MessageSquare, X, Send, Loader2, Brain, Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useChat } from '@/lib/api-hooks'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  provider?: string
}

// Generate a unique session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

// Get AI provider config from localStorage
function getAIProviderConfig(): { provider: string; deepseekKey: string; modelName: string } {
  if (typeof window === 'undefined') return { provider: 'auto', deepseekKey: '', modelName: 'deepseek-chat' }
  try {
    const saved = localStorage.getItem('piaoshu-ai-config')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        provider: parsed.provider || 'auto',
        deepseekKey: parsed.deepseekKey || '',
        modelName: parsed.modelName || 'deepseek-chat',
      }
    }
  } catch {
    // ignore
  }
  return { provider: 'auto', deepseekKey: '', modelName: 'deepseek-chat' }
}

// Determine the provider badge label
function getProviderBadge(provider: string | undefined): { label: string; color: string } {
  if (!provider) return { label: 'AI', color: 'bg-muted text-muted-foreground' }
  if (provider.includes('deepseek')) return { label: 'DeepSeek', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' }
  if (provider.includes('z-ai')) return { label: 'Z-AI', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' }
  return { label: provider, color: 'bg-muted text-muted-foreground' }
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string>(generateSessionId)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '我以飘叔视角和你聊。基于SOUL.md行为操作系统。直接说事。',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<string | undefined>(undefined)
  const chatMutation = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get provider config from localStorage
  const aiConfig = useMemo(() => getAIProviderConfig(), [isOpen])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleClearConversation = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '新对话已开始。直接说事。',
        timestamp: new Date(),
      },
    ])
    setSessionId(generateSessionId())
    setCurrentProvider(undefined)
    toast.success('对话已清空')
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    const messageContent = input.trim()
    setInput('')
    setIsTyping(true)

    try {
      // Determine provider to send to backend
      let providerToSend: string | undefined
      if (aiConfig.provider === 'deepseek') {
        providerToSend = 'deepseek'
      } else if (aiConfig.provider === 'z-ai-sdk') {
        providerToSend = 'z-ai-sdk'
      }
      // 'auto' sends undefined, let backend decide

      const result = await chatMutation.mutateAsync({
        message: messageContent,
        sessionId,
        provider: providerToSend,
        apiKey: aiConfig.deepseekKey || undefined,
        modelName: aiConfig.modelName || undefined,
      })
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        provider: result.provider,
      }
      setMessages(prev => [...prev, aiMessage])
      if (result.provider) {
        setCurrentProvider(result.provider)
      }
    } catch {
      toast.error('AI响应失败，请重试')
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '系统异常。看日志。',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const providerBadge = getProviderBadge(currentProvider)

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed bottom-6 right-6 z-50',
            'flex items-center justify-center',
            'h-14 w-14 rounded-full',
            'bg-gradient-to-br from-emerald-500 to-teal-600',
            'text-white shadow-lg shadow-emerald-500/30',
            'transition-all duration-300',
            'hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/40',
            'active:scale-95',
            'group'
          )}
          aria-label="打开AI对话"
        >
          {/* Pulsing ring animation */}
          <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
          <MessageSquare className="h-6 w-6 relative z-10 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50',
            'bottom-0 right-0 sm:bottom-6 sm:right-6',
            'w-full sm:w-[400px]',
            'h-[100dvh] sm:h-[540px]',
            'sm:rounded-2xl',
            'flex flex-col',
            'bg-card border border-border',
            'shadow-2xl shadow-emerald-500/10',
            'animate-in slide-in-from-bottom-5 fade-in duration-300'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">飘叔分身 · AI共生体</span>
                <span className="text-[10px] text-muted-foreground font-mono">AI AVATAR OS</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Model Provider Badge */}
              <Badge
                variant="secondary"
                className={cn('text-[9px] h-5 border-0 font-mono', providerBadge.color)}
              >
                <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                {providerBadge.label}
              </Badge>
              <Badge
                variant="secondary"
                className="text-[9px] h-5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0 font-mono"
              >
                SOUL.md
              </Badge>
              {/* Clear Conversation Button */}
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                      onClick={handleClearConversation}
                      aria-label="清空对话"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>清空对话</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
                aria-label="关闭对话"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Session ID Indicator */}
          <div className="px-4 py-1 border-b bg-muted/30">
            <span className="text-[9px] text-muted-foreground font-mono">
              Session: {sessionId.substring(sessionId.length - 8)} · {messages.length - 1} 轮对话
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-96 sm:max-h-[420px]"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(16, 185, 129, 0.3) transparent',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md border border-border'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Brain className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">飘叔</span>
                      {msg.provider && (
                        <span className="text-[9px] font-mono text-muted-foreground">
                          ({getProviderBadge(msg.provider).label})
                        </span>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <span
                    className={cn(
                      'block text-[10px] mt-1 font-mono',
                      msg.role === 'user'
                        ? 'text-emerald-200/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    {msg.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                    <span className="text-sm text-muted-foreground">思考中...</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-3 bg-card">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="直接说事... (Enter发送)"
                className="min-h-[40px] max-h-[120px] resize-none text-sm border-emerald-500/20 focus-visible:ring-emerald-500/30"
                rows={1}
                disabled={isTyping}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className={cn(
                  'h-10 w-10 shrink-0 rounded-xl',
                  'bg-gradient-to-br from-emerald-500 to-teal-600',
                  'hover:from-emerald-600 hover:to-teal-700',
                  'text-white shadow-sm',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200'
                )}
                aria-label="发送消息"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-[10px] text-muted-foreground font-mono">
                Shift+Enter换行
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {providerBadge.label} · SOUL.md驱动
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
