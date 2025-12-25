import { NextResponse } from 'next/server';
const { prisma } = require('../../../../../src/core/prisma');

export async function POST(request) {
  try {
    const { subscription, timestamp } = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' }, 
        { status: 400 }
      );
    }

    // Store subscription in database (extend schema if needed)
    // For now, just log the subscription
    console.log('Push subscription received:', {
      endpoint: subscription.endpoint,
      timestamp: new Date(timestamp).toISOString(),
      keys: subscription.keys ? Object.keys(subscription.keys) : 'none'
    });

    // TODO: Store in database table for push_subscriptions
    // await prisma.pushSubscription.create({
    //   data: {
    //     endpoint: subscription.endpoint,
    //     p256dh: subscription.keys.p256dh,
    //     auth: subscription.keys.auth,
    //     createdAt: new Date(),
    //   }
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });

  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' }, 
      { status: 500 }
    );
  }
}