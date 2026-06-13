import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Look up payment session
    const session = await db.paymentSession.findUnique({
      where: { sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY

    if (stripeSecretKey) {
      // Real Stripe verification
      try {
        let StripeConstructor: any
        try {
          const stripeModule = await import('stripe')
          StripeConstructor = stripeModule.default
        } catch {
          // stripe package not installed, fall through to demo mode
        }
        if (!StripeConstructor) {
          // Fall through to demo mode
        } else {
        const stripeClient = new StripeConstructor(stripeSecretKey)

        const stripeSession = await stripeClient.checkout.sessions.retrieve(sessionId)
        const paymentStatus = stripeSession.payment_status // 'paid' | 'unpaid' | 'no_payment_required'

        if (paymentStatus === 'paid' && session.status === 'pending') {
          // Update session to paid
          await db.paymentSession.update({
            where: { sessionId },
            data: { status: 'paid' },
          })

          // If this has a userId and planId, create/upgrade subscription
          if (session.userId && session.planId) {
            const existingSub = await db.userSubscription.findFirst({
              where: { userId: session.userId },
            })

            if (existingSub) {
              await db.userSubscription.update({
                where: { id: existingSub.id },
                data: {
                  planId: session.planId,
                  status: 'active',
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  paymentMethod: session.paymentMethod === 'stripe_link' ? 'stripe_link' : session.paymentMethod === 'crypto' ? 'afc_base' : 'credit_card',
                },
              })
            } else {
              await db.userSubscription.create({
                data: {
                  userId: session.userId,
                  planId: session.planId,
                  status: 'active',
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  paymentMethod: session.paymentMethod === 'stripe_link' ? 'stripe_link' : session.paymentMethod === 'crypto' ? 'afc_base' : 'credit_card',
                },
              })
            }

            // Create AFC transaction record
            await db.aFCTransaction.create({
              data: {
                userId: session.userId,
                type: 'subscription_payment',
                amount: -Math.round(session.amount * 10),
                status: 'confirmed',
                description: `订阅付款 - Session ${sessionId.slice(0, 16)}...`,
                metadata: JSON.stringify({
                  sessionId,
                  paymentMethod: session.paymentMethod,
                  amountUSD: session.amount,
                }),
              },
            })
          }

          // Create audit log
          await db.auditLog.create({
            data: {
              action: 'verify',
              module: 'payments',
              entityType: 'PaymentSession',
              entityId: session.id,
              details: JSON.stringify({ sessionId, status: 'paid', amount: session.amount, verifiedBy: 'stripe_api' }),
              performedBy: session.userId || 'system',
            },
          })

          return NextResponse.json({
            ok: true,
            data: {
              sessionId,
              status: 'paid',
              amount: session.amount,
              currency: session.currency,
              paymentMethod: session.paymentMethod,
              paidAt: new Date().toISOString(),
            },
          })
        }

        // Return current Stripe session status
        return NextResponse.json({
          ok: true,
          data: {
            sessionId,
            status: paymentStatus === 'paid' ? 'paid' : paymentStatus === 'unpaid' ? 'pending' : session.status,
            amount: session.amount,
            currency: session.currency,
            paymentMethod: session.paymentMethod,
          },
        })
      } // end if StripeConstructor
      } catch (stripeError) {
        console.error('Stripe verify error:', stripeError)
        return NextResponse.json(
          { ok: false, error: 'Stripe verification failed' },
          { status: 500 }
        )
      }
    }

    // Demo/mock mode: simulate payment verification
    // 85% probability of payment success
    const isPaid = Math.random() > 0.15

    if (isPaid && session.status === 'pending') {
      // Update session to paid
      await db.paymentSession.update({
        where: { sessionId },
        data: { status: 'paid' },
      })

      // If this has a userId and planId, create/upgrade subscription
      if (session.userId && session.planId) {
        const existingSub = await db.userSubscription.findFirst({
          where: { userId: session.userId },
        })

        if (existingSub) {
          await db.userSubscription.update({
            where: { id: existingSub.id },
            data: {
              planId: session.planId,
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              paymentMethod: session.paymentMethod === 'stripe_link' ? 'stripe_link' : session.paymentMethod === 'crypto' ? 'afc_base' : 'credit_card',
            },
          })
        } else {
          await db.userSubscription.create({
            data: {
              userId: session.userId,
              planId: session.planId,
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              paymentMethod: session.paymentMethod === 'stripe_link' ? 'stripe_link' : session.paymentMethod === 'crypto' ? 'afc_base' : 'credit_card',
            },
          })
        }

        // Create AFC transaction record
        await db.aFCTransaction.create({
          data: {
            userId: session.userId,
            type: 'subscription_payment',
            amount: -Math.round(session.amount * 10),
            status: 'confirmed',
            description: `订阅付款 - Session ${sessionId.slice(0, 16)}...`,
            metadata: JSON.stringify({
              sessionId,
              paymentMethod: session.paymentMethod,
              amountUSD: session.amount,
            }),
          },
        })
      }

      // Create audit log
      await db.auditLog.create({
        data: {
          action: 'verify',
          module: 'payments',
          entityType: 'PaymentSession',
          entityId: session.id,
          details: JSON.stringify({ sessionId, status: 'paid', amount: session.amount, verifiedBy: 'demo' }),
          performedBy: session.userId || 'system',
        },
      })

      return NextResponse.json({
        ok: true,
        data: {
          sessionId,
          status: 'paid',
          amount: session.amount,
          currency: session.currency,
          paymentMethod: session.paymentMethod,
          paidAt: new Date().toISOString(),
        },
      })
    }

    if (!isPaid && session.status === 'pending') {
      // Random: 67% failed, 33% still pending
      const failChance = Math.random()
      const newStatus = failChance < 0.67 ? 'failed' : 'pending'

      if (newStatus === 'failed') {
        await db.paymentSession.update({
          where: { sessionId },
          data: { status: 'failed' },
        })

        await db.auditLog.create({
          data: {
            action: 'verify',
            module: 'payments',
            entityType: 'PaymentSession',
            entityId: session.id,
            details: JSON.stringify({ sessionId, status: 'failed' }),
            performedBy: session.userId || 'system',
          },
        })
      }

      return NextResponse.json({
        ok: true,
        data: {
          sessionId,
          status: newStatus,
          amount: session.amount,
          currency: session.currency,
          paymentMethod: session.paymentMethod,
        },
      })
    }

    // Session already has a final status
    return NextResponse.json({
      ok: true,
      data: {
        sessionId,
        status: session.status,
        amount: session.amount,
        currency: session.currency,
        paymentMethod: session.paymentMethod,
      },
    })
  } catch (error) {
    console.error('Verify session error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to verify payment session' },
      { status: 500 }
    )
  }
}

// Also support POST for backward compatibility
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Re-use GET logic by constructing a URL and calling the handler
    const url = new URL(request.url)
    url.searchParams.set('sessionId', sessionId)
    const getRequest = new NextRequest(url)
    return GET(getRequest)
  } catch (error) {
    console.error('Verify session error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to verify payment session' },
      { status: 500 }
    )
  }
}
