import { NextResponse } from 'next/server';
const { prisma } = require('../../../../../src/core/prisma');

export async function POST(request) {
  try {
    const { subscription } = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' }, 
        { status: 400 }
      );
    }

    // Remove subscription from database
    console.log('Push unsubscription received:', {
      endpoint: subscription.endpoint,
      timestamp: new Date().toISOString()
    });

    // TODO: Remove from database table
    // await prisma.pushSubscription.deleteMany({
    //   where: {
    //     endpoint: subscription.endpoint
    //   }
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription removed successfully' 
    });

  } catch (error) {
    console.error('Push unsubscription error:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' }, 
      { status: 500 }
    );
  }
}