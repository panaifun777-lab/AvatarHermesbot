import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const isLiveStripe = !!stripeSecretKey

    const paymentMethods = [
      {
        id: 'stripe',
        name: 'Stripe Card',
        description: 'Visa / Mastercard / AMEX 安全支付',
        icon: 'credit-card',
        available: true,
        badge: isLiveStripe ? 'Live' : 'Test',
        badgeColor: isLiveStripe ? '#10b981' : '#f59e0b',
        oneClick: false,
        processingTime: '1-3s',
      },
      {
        id: 'stripe_link',
        name: 'Stripe Link 一键支付',
        description: '保存付款信息，下次一键完成 · Link by Stripe',
        icon: 'zap',
        available: true,
        badge: 'Link by Stripe',
        badgeColor: '#635BFF',
        oneClick: true,
        processingTime: '< 1s',
      },
      {
        id: 'crypto',
        name: 'Crypto (AFC Token)',
        description: 'AFC Token 链上结算 · Base Sepolia',
        icon: 'wallet',
        available: true,
        badge: 'Base Sepolia',
        badgeColor: '#10b981',
        oneClick: false,
        processingTime: '~15s',
      },
    ]

    return NextResponse.json({
      ok: true,
      data: {
        methods: paymentMethods,
        defaultMethod: 'stripe_link',
        stripeMode: isLiveStripe ? 'live' : 'test',
      },
    })
  } catch (error) {
    console.error('Payment methods error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to list payment methods' },
      { status: 500 }
    )
  }
}
