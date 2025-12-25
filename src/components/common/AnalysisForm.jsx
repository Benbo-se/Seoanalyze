'use client';

import { useState, useEffect } from 'react';
import { subscribeToPushNotifications, getPushNotificationStatus, queueAnalysisForBackgroundSync } from '@/utils/pushNotifications';

export default function AnalysisForm({ activeTab, setActiveTab, url, setUrl, crawlPages, setCrawlPages, handleAnalyze, loading, error }) {
  const [notificationStatus, setNotificationStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false
  });

  // Check notification status on component mount
  useEffect(() => {
    const checkNotificationStatus = async () => {
      const status = await getPushNotificationStatus();
      setNotificationStatus(status);
    };
    checkNotificationStatus();
  }, []);

  const handleFormSubmit = async () => {
    if (!url) return;
    
    try {
      // Try to subscribe to push notifications if not already subscribed
      if (notificationStatus.supported && !notificationStatus.subscribed) {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await subscribeToPushNotifications(registration);
          // Update notification status
          const newStatus = await getPushNotificationStatus();
          setNotificationStatus(newStatus);
        }
      }

      const analysisData = {
        url,
        type: activeTab,
        maxPages: activeTab === 'crawl' ? crawlPages : undefined,
      };

      // Check if online - if offline, queue for background sync
      if (!navigator.onLine && 'serviceWorker' in navigator) {
        const analysisId = await queueAnalysisForBackgroundSync(analysisData);
        if (analysisId) {
          throw new Error('Du är offline. Analysen kommer att köras när du kommer online igen.');
        }
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      // Redirect to analysis page
      if (data.jobId) {
        window.location.href = `/analys/${data.jobId}`;
      }
    } catch (err) {
      throw err;
    }
  };

  return { handleFormSubmit, notificationStatus };
}