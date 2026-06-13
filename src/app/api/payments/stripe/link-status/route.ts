import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const isLiveStripe = !!stripeSecretKey

    if (isLiveStripe && userId) {
      // Real Stripe integration: check if user has Link-enabled payment methods
      try {
        let StripeConstructor: any
        try {
          const stripeModule = await import('stripe')
          StripeConstructor = stripeModule.default
        } catch {
          // stripe package not installed, fall through to demo mode
        }
        if (StripeConstructor) {
          const stripeClient = new StripeConstructor(stripeSecretKey)

          // List payment methods for the customer
          // In a real app, you'd look up the Stripe customer ID from your DB
          const paymentMethods = await stripeClient.paymentMethods.list({
            customer: userId, // This would be the Stripe customer ID in production
            type: 'link',
          })

          const hasLink = paymentMethods.data.length > 0

          return NextResponse.json({
            ok: true,
            data: {
              linkAvailable: true,
              linkEnabled: hasLink,
              stripeMode: 'live',
              savedPaymentMethods: paymentMethods.data.map((pm: any) => ({
                id: pm.id,
                type: pm.type,
                last4: pm.card?.last4 || undefined,
                brand: pm.card?.brand || undefined,
                email: pm.link?.email || undefined,
                isDefault: false,
              })),
            },
          })
        }
      } catch (stripeError) {
        console.error('Stripe Link status error:', stripeError)
        // Fall back to demo mode on error
      }
    }

    // Demo/mock mode
    const hasLink = !!userId && Math.random() > 0.4

    return NextResponse.json({
      ok: true,
      data: {
        linkAvailable: true,
        linkEnabled: hasLink,
        stripeMode: isLiveStripe ? 'live' : 'test',
        email: userId ? 'user@example.com' : null,
        savedPaymentMethods: hasLink
          ? [
              {
                id: 'pm_mock_card_1',
                type: 'card',
                last4: '4242',
                brand: 'visa',
                isDefault: true,
              },
              {
                id: 'pm_mock_link_1',
                type: 'link',
                last4: '4242',
                email: 'user@example.com',
                isDefault: false,
              },
            ]
          : [],
        phone: hasLink ? '+1 ***-***-1234' : null,
        country: 'US',
      },
    })
  } catch (error) {
    console.error('Link status error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to check Link status' },
      { status: 500 }
    )
  }
}
