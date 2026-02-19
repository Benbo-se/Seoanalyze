// Push Notifications utility for Next.js app

// VAPID public key must be set via NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Request notification permission from user
 * @returns {Promise<NotificationPermission>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission
  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  return permission;
}

/**
 * Subscribe user to push notifications
 * @param {ServiceWorkerRegistration} registration 
 * @returns {Promise<PushSubscription|null>}
 */
export async function subscribeToPushNotifications(registration) {
  try {
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Already subscribed to push notifications');
      return existingSubscription;
    }

    // Convert VAPID key to Uint8Array
    const vapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey
    });

    console.log('Successfully subscribed to push notifications:', subscription);
    
    // Send subscription to server
    await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 * @param {ServiceWorkerRegistration} registration 
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPushNotifications(registration) {
  try {
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('No subscription found');
      return true;
    }

    const successful = await subscription.unsubscribe();
    
    if (successful) {
      console.log('Successfully unsubscribed from push notifications');
      // Notify server about unsubscription
      await removeSubscriptionFromServer(subscription);
    }
    
    return successful;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Send subscription to server for storage
 * @param {PushSubscription} subscription 
 */
async function sendSubscriptionToServer(subscription) {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        timestamp: Date.now()
      })
    });
    
    if (!response.ok) {
      console.warn('Failed to save subscription to server');
    }
  } catch (error) {
    console.error('Error sending subscription to server:', error);
  }
}

/**
 * Remove subscription from server
 * @param {PushSubscription} subscription 
 */
async function removeSubscriptionFromServer(subscription) {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription
      })
    });
    
    if (!response.ok) {
      console.warn('Failed to remove subscription from server');
    }
  } catch (error) {
    console.error('Error removing subscription from server:', error);
  }
}

/**
 * Convert base64 VAPID key to Uint8Array
 * @param {string} base64String 
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Show notification when analysis is complete
 * @param {string} jobId 
 * @param {string} analysisType 
 * @param {string} url 
 * @param {number} score 
 */
export async function showAnalysisCompleteNotification(jobId, analysisType, url, score) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const notificationTitle = 'Analys komplett!';
  const notificationBody = `Din ${analysisType.toUpperCase()}-analys av ${url} är klar. Score: ${score}`;
  const notificationIcon = '/icons/icon-192x192.png';
  
  const notification = new Notification(notificationTitle, {
    body: notificationBody,
    icon: notificationIcon,
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      jobId,
      analysisType,
      url,
      score
    },
    actions: [
      {
        action: 'view',
        title: 'Visa resultat'
      }
    ],
    requireInteraction: true,
    tag: 'analysis-complete'
  });

  notification.addEventListener('click', () => {
    window.focus();
    window.location.href = `/analys/${jobId}`;
    notification.close();
  });

  // Auto-close after 10 seconds
  setTimeout(() => {
    notification.close();
  }, 10000);
}

/**
 * Queue analysis for background sync when offline
 * @param {object} analysisData 
 * @returns {Promise<string|null>}
 */
export async function queueAnalysisForBackgroundSync(analysisData) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.warn('Service Worker not available for background sync');
    return null;
  }

  try {
    const messageChannel = new MessageChannel();
    
    return new Promise((resolve, reject) => {
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.analysisId);
        } else {
          reject(new Error('Failed to queue analysis'));
        }
      };

      navigator.serviceWorker.controller.postMessage({
        type: 'QUEUE_ANALYSIS',
        analysisData,
        analysisId: Date.now().toString()
      }, [messageChannel.port2]);
    });
  } catch (error) {
    console.error('Error queuing analysis for background sync:', error);
    return null;
  }
}

/**
 * Check if push notifications are supported and enabled
 * @returns {Promise<{supported: boolean, permission: NotificationPermission, subscribed: boolean}>}
 */
export async function getPushNotificationStatus() {
  const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  
  if (!supported) {
    return { supported: false, permission: 'denied', subscribed: false };
  }

  const permission = Notification.permission;
  let subscribed = false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    subscribed = !!subscription;
  } catch (error) {
    console.error('Error checking subscription status:', error);
  }

  return { supported, permission, subscribed };
}