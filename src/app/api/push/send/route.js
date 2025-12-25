import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@seoanalyze.se';

// Only configure if all keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function POST(request) {
  try {
    // Check if VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Push notifications not configured', message: 'VAPID keys missing' }, 
        { status: 503 }
      );
    }

    const { subscription, payload } = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' }, 
        { status: 400 }
      );
    }

    // Default notification payload
    const notificationPayload = {
      title: 'SEO Analyzer',
      body: 'Din analys är klar!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...payload
    };

    // Send push notification
    await webpush.sendNotification(subscription, JSON.stringify(notificationPayload));
    
    console.log('Push notification sent successfully:', {
      endpoint: subscription.endpoint,
      payload: notificationPayload
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Push notification sent' 
    });

  } catch (error) {
    console.error('Failed to send push notification:', error);
    
    // Handle different error types
    if (error.statusCode === 410) {
      // Subscription has expired
      return NextResponse.json(
        { error: 'Subscription expired', code: 410 }, 
        { status: 410 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send push notification', details: error.message }, 
      { status: 500 }
    );
  }
}