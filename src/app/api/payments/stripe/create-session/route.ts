import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate a mock Stripe session ID
function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'cs_live_'
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      planId,
      userId,
      amount,
      currency = 'usd',
      successUrl,
      cancelUrl,
      paymentMethod = 'stripe',
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    let isLiveStripe = !!stripeSecretKey

    let sessionId: string
    let checkoutUrl: string

    // Determine payment_method_types based on selected method
    const paymentMethodTypes = paymentMethod === 'stripe_link'
      ? ['card', 'link']
      : paymentMethod === 'crypto'
        ? ['crypto']
        : ['card']

    // Determine mode: subscription for recurring plans, payment for one-time
    const isSubscription = !planId?.startsWith('pkg-') && !planId?.startsWith('monthly-')

    if (isLiveStripe) {
      // Real Stripe integration
      try {
        let StripeConstructor: any
        try {
          const stripeModule = await import('stripe')
          StripeConstructor = stripeModule.default
        } catch {
          // stripe package not installed, fall back to demo mode
          isLiveStripe = false
          sessionId = generateSessionId()
          checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}#test`
          // skip to database save
          const session2 = await db.paymentSession.create({
            data: {
              sessionId,
              userId: userId || null,
              planId: planId || null,
              amount: Number(amount),
              currency,
              status: 'pending',
              paymentMethod: paymentMethod === 'stripe_link' ? 'stripe_link' : paymentMethod === 'crypto' ? 'crypto' : 'stripe',
              metadata: JSON.stringify({ planId: planId || null, userId: userId || null, createdAt: new Date().toISOString(), paymentMethodTypes, isSubscription, mode: isSubscription ? 'subscription' : 'payment', stripeMode: 'test' }),
            },
          })
          await db.auditLog.create({
            data: { action: 'create', module: 'payments', entityType: 'PaymentSession', entityId: session2.id, details: JSON.stringify({ sessionId, amount, currency, paymentMethod, paymentMethodTypes, isSubscription }), performedBy: userId || 'anonymous' },
          })
          return NextResponse.json({ ok: true, data: { sessionId, url: checkoutUrl, amount: Number(amount), currency, paymentMethod, paymentMethodTypes, mode: isSubscription ? 'subscription' : 'payment', expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), stripeMode: 'test' } })
        }
        const stripeClient = new StripeConstructor(stripeSecretKey)

        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: paymentMethodTypes as ('card' | 'link')[],
          mode: isSubscription ? 'subscription' : 'payment',
          line_items: [
            {
              price_data: {
                currency,
                product_data: {
                  name: `Piaoshu ${planId || 'Payment'}`,
                  description: isSubscription ? 'Monthly subscription' : 'One-time payment',
                },
                unit_amount: Math.round(amount * 100), // Convert to cents
                recurring: isSubscription ? { interval: 'month' } : undefined,
              },
              quantity: 1,
            },
          ],
          success_url: successUrl || `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}?payment=cancelled`,
          metadata: {
            planId: planId || '',
            userId: userId || '',
            paymentMethod,
          },
        })

        sessionId = session.id
        checkoutUrl = session.url || ''
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError)
        return NextResponse.json(
          { ok: false, error: 'Stripe API error: ' + (stripeError instanceof Error ? stripeError.message : 'Unknown error') },
          { status: 500 }
        )
      }
    } else {
      // Demo/mock mode
      sessionId = generateSessionId()
      checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}#test`
    }

    // Create payment session in database
    const session = await db.paymentSession.create({
      data: {
        sessionId,
        userId: userId || null,
        planId: planId || null,
        amount: Number(amount),
        currency,
        status: 'pending',
        paymentMethod: paymentMethod === 'stripe_link' ? 'stripe_link' : paymentMethod === 'crypto' ? 'crypto' : 'stripe',
        metadata: JSON.stringify({
          planId: planId || null,
          userId: userId || null,
          createdAt: new Date().toISOString(),
          paymentMethodTypes,
          isSubscription,
          mode: isSubscription ? 'subscription' : 'payment',
          stripeMode: isLiveStripe ? 'live' : 'test',
        }),
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'payments',
        entityType: 'PaymentSession',
        entityId: session.id,
        details: JSON.stringify({ sessionId, amount, currency, paymentMethod, paymentMethodTypes, isSubscription }),
        performedBy: userId || 'anonymous',
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        sessionId,
        url: checkoutUrl,
        amount: Number(amount),
        currency,
        paymentMethod,
        paymentMethodTypes,
        mode: isSubscription ? 'subscription' : 'payment',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        stripeMode: isLiveStripe ? 'live' : 'test',
      },
    })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
