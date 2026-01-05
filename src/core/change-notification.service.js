// Change Detection Notification Service
let webpush = null;
try { 
  webpush = require('web-push'); 
} catch { 
  /* leave null */ 
}

const hasKeys = !!(webpush && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

// VAPID setup only if keys are available
if (webpush && hasKeys) {
  webpush.setVapidDetails(
    'mailto:reda@benbo.se',
    process.env.VAPID_PUBLIC_KEY || 'BEffMaVuuKK12Yl5mulPU99ZShnk-0l_gbOuNVtidI0zOQsxJNQFQsP4vTfYHkUqTswmvOMfAscLZf5NkrPTgmk',
    process.env.VAPID_PRIVATE_KEY || 'vpQLDy3_J9xKn6PHKXfgpZNPhP4Sv8oG7AcKm5V_TqE'
  );
}

// Notification templates for different change types
const NOTIFICATION_TEMPLATES = {
  canonical: {
    title: '[CRITICAL] SEO Alert: Canonical URL Changed',
    getBody: (url, oldValue, newValue) => 
      `${url}\nOld: ${oldValue || 'none'}\nNew: ${newValue || 'none'}`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    urgency: 'high'
  },
  robots: {
    title: '[ROBOTS] Robots.txt Changed',  
    getBody: (url) => `Robots.txt file changed for ${url}. Check crawler access rules.`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    urgency: 'high'
  },
  csp: {
    title: '[SECURITY] Security Policy Changed',
    getBody: (url) => `Content Security Policy updated for ${url}`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png', 
    urgency: 'normal'
  },
  title: {
    title: '[TITLE] Page Title Changed',
    getBody: (url, oldValue, newValue) => 
      `${url}\nOld: "${oldValue}"\nNew: "${newValue}"`,
    icon: '/icon-192x192.png',
    urgency: 'normal'
  },
  metaDesc: {
    title: '[META] Meta Description Changed', 
    getBody: (url) => `Meta description updated for ${url}`,
    icon: '/icon-192x192.png',
    urgency: 'low'
  },
  h1: {
    title: '[H1] H1 Tag Changed',
    getBody: (url) => `Main heading changed for ${url}`,  
    icon: '/icon-192x192.png',
    urgency: 'low'
  }
};

// Send notification for a detected change
async function sendChangeNotification(changeAlert, subscriptions = []) {
  // Tyst no-op om webpush inte är konfigurerat
  if (!webpush || !hasKeys) {
    console.log(`[NOTIFY] Change notification prepared (webpush not configured): ${changeAlert?.changeType} on ${changeAlert?.url}`);
    return { success: true, sent: 0, logged: true, reason: 'webpush_not_configured' };
  }

  try {
    if (!changeAlert || !NOTIFICATION_TEMPLATES[changeAlert.changeType]) {
      console.warn('Invalid change alert or unsupported change type');
      return { success: false, error: 'Invalid input' };
    }

    const template = NOTIFICATION_TEMPLATES[changeAlert.changeType];
    
    const payload = JSON.stringify({
      title: template.title,
      body: template.getBody(changeAlert.url, changeAlert.oldValue, changeAlert.newValue),
      icon: template.icon,
      badge: template.badge,
      tag: `change-${changeAlert.changeType}-${changeAlert.url}`,
      data: {
        changeType: changeAlert.changeType,
        url: changeAlert.url,
        severity: changeAlert.severity,
        changeId: changeAlert.id,
        timestamp: changeAlert.createdAt
      },
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'resolve', 
          title: 'Mark Resolved'
        }
      ]
    });

    const options = {
      urgency: template.urgency || 'normal',
      TTL: 24 * 60 * 60 // 24 hours
    };

    // If no specific subscriptions provided, we could fetch from DB
    // For now, just log the notification
    console.log(`[NOTIFY] Change notification prepared for ${changeAlert.changeType} on ${changeAlert.url}`);
    console.log(`   Severity: ${changeAlert.severity}, Payload size: ${payload.length} bytes`);

    // Mock sending to subscriptions (in real implementation, fetch from DB)
    const results = [];
    if (subscriptions.length === 0) {
      console.log('   No active subscriptions - notification logged only');
      return { success: true, sent: 0, logged: true };
    }

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload, options);
        results.push({ success: true, subscription: subscription.endpoint });
      } catch (error) {
        console.error('Failed to send to subscription:', error.message);
        results.push({ success: false, error: error.message, subscription: subscription.endpoint });
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`[SENT] Sent change notification to ${successful}/${subscriptions.length} subscribers`);

    return {
      success: true,
      sent: successful,
      failed: results.length - successful,
      results
    };

  } catch (error) {
    console.error('Change notification error:', error);
    return { success: false, error: error.message };
  }
}

// Batch send notifications for multiple changes
async function sendBatchChangeNotifications(changes, subscriptions = []) {
  const results = [];
  
  for (const change of changes) {
    const result = await sendChangeNotification(change, subscriptions);
    results.push({ changeId: change.id, ...result });
  }
  
  return results;
}

module.exports = {
  sendChangeNotification,
  sendBatchChangeNotifications,
  NOTIFICATION_TEMPLATES
};