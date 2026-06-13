'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional module name shown in the error UI */
  moduleName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ModuleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ModuleErrorBoundary${this.props.moduleName ? ` (${this.props.moduleName})` : ''}] Rendering error:`,
      error,
      errorInfo
    )
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            {/* Emerald/teal themed error illustration */}
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <AlertTriangle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                <span className="text-[8px] font-bold text-teal-600 dark:text-teal-400">!</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-foreground">
                模块加载异常
              </h3>
              {this.props.moduleName && (
                <p className="text-xs text-muted-foreground font-mono">
                  {this.props.moduleName}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                该模块在渲染时遇到了错误，请尝试重新加载
              </p>
            </div>

            {this.state.error && (
              <div className="w-full rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-mono break-all line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <Button
              onClick={this.handleRetry}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              重试
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
