'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_BACKOFF_MS = 800;
const MAX_BACKOFF_MS = 15000;
const JITTER = 0.25;
const SSE_TIMEOUT_MS = 30000; // 30s timeout for SSE connections
const POLLING_FALLBACK_DELAY = 5000; // 5s delay before fallback

function withJitter(base) {
  const r = (Math.random() * 2 - 1) * JITTER;
  return Math.max(300, Math.floor(base * (1 + r)));
}

export function useAiAnalysis(jobId) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [connectionMode, setConnectionMode] = useState('initializing'); // 'sse', 'polling', 'initializing'
  const [isClient, setIsClient] = useState(false);

  const eventSourceRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const sseTimeoutRef = useRef(null);
  const backoffRef = useRef(MIN_BACKOFF_MS);
  const clientIdRef = useRef(null);

  // Generate unique client ID
  useEffect(() => {
    if (!clientIdRef.current && typeof window !== 'undefined') {
      clientIdRef.current = Math.random().toString(36).substring(2, 15);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateAnalysis = useCallback((data) => {
    console.log('🤖 AI Analysis update:', data);

    const updated = {
      id: data.id || data.resultId || data.analysisId || jobId,
      targetUrl: data.targetUrl || data.url,
      status: data.status || data.state,
      progress: typeof data.progress === 'number' ? data.progress : 0,
      competitors: data.competitors || null,
      competitorData: data.competitorData || null,
      aiReport: data.aiReport || null,
      createdAt: data.createdAt || null,
      completedAt: data.completedAt || null,
      error: data.error || null
    };

    setAnalysis(updated);
    setLoading(false);
    setError(null);
    setIsRecovering(false);
    backoffRef.current = MIN_BACKOFF_MS;

    return updated;
  }, [jobId]);

  const pollOnce = useCallback(async () => {
    try {
      const url = `/api/ai-analyze/${encodeURIComponent(jobId)}`;
      console.log(`🔍 [AI] Polling: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 [AI] Polling response:', data);

      const updated = updateAnalysis(data);

      // Schedule next poll if not finished
      if (updated.status !== 'completed' && updated.status !== 'failed') {
        const delay = updated.status === 'analyzing' ? 1000 : 2000;
        pollTimeoutRef.current = setTimeout(pollOnce, withJitter(delay));
      }

    } catch (err) {
      console.error('❌ [AI] Polling error:', err);
      handleError(err);
    }
  }, [jobId, updateAnalysis]);

  const handleError = useCallback((err) => {
    const nextBackoff = Math.min(MAX_BACKOFF_MS, backoffRef.current * 2);
    backoffRef.current = nextBackoff;
    const delay = withJitter(nextBackoff);

    setError(err.message);
    setIsRecovering(true);

    // Retry after delay
    pollTimeoutRef.current = setTimeout(() => {
      if (connectionMode === 'sse') {
        connectSSE();
      } else {
        pollOnce();
      }
    }, delay);
  }, [connectionMode]);

  const connectSSE = useCallback(() => {
    if (!isClient || !clientIdRef.current || !jobId) return;

    // Cleanup existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (sseTimeoutRef.current) {
      clearTimeout(sseTimeoutRef.current);
    }

    const sseUrl = `/api/sse/ai-job/${encodeURIComponent(jobId)}`;
    console.log(`📡 [AI] Connecting SSE to: ${sseUrl}`);

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;
      setConnectionMode('sse');

      // SSE timeout fallback
      sseTimeoutRef.current = setTimeout(() => {
        console.log('⏰ [AI] SSE timeout, falling back to polling');
        eventSource.close();
        setConnectionMode('polling');
        pollOnce();
      }, SSE_TIMEOUT_MS);

      eventSource.addEventListener('connected', (event) => {
        console.log('🔗 [AI] SSE Connected:', event.data);
        if (sseTimeoutRef.current) {
          clearTimeout(sseTimeoutRef.current);
        }
        setIsRecovering(false);
        backoffRef.current = MIN_BACKOFF_MS;
      });

      eventSource.addEventListener('progress', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📈 [AI] SSE Progress:', data);
          updateAnalysis(data);
        } catch (err) {
          console.error('❌ [AI] Failed to parse progress event:', err);
        }
      });

      eventSource.addEventListener('completed', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('✅ [AI] SSE Completed:', data);
          updateAnalysis(data);

          // Cleanup
          try { eventSource.close(); } catch {}
          try { if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current); } catch {}
        } catch (err) {
          console.error('❌ [AI] Failed to handle completed event:', err);
        }
      });

      eventSource.addEventListener('failed', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('❌ [AI] SSE Failed:', data);
          setError(data.error || 'Analysis failed');
          setLoading(false);

          // Cleanup
          try { eventSource.close(); } catch {}
        } catch (err) {
          console.error('❌ [AI] Failed to handle failed event:', err);
        }
      });

      eventSource.addEventListener('keepalive', () => {
        // Just keep the connection alive
      });

      eventSource.addEventListener('error', (event) => {
        console.error('❌ [AI] SSE Error event');
        eventSource.close();

        // Fall back to polling after a delay
        setTimeout(() => {
          console.log('🔄 [AI] Falling back to polling after SSE error');
          setConnectionMode('polling');
          pollOnce();
        }, POLLING_FALLBACK_DELAY);
      });

      eventSource.onerror = (err) => {
        console.error('❌ [AI] SSE onerror:', err);
        if (sseTimeoutRef.current) {
          clearTimeout(sseTimeoutRef.current);
        }

        // Don't immediately retry SSE, fall back to polling
        setTimeout(() => {
          setConnectionMode('polling');
          pollOnce();
        }, POLLING_FALLBACK_DELAY);
      };

    } catch (err) {
      console.error('❌ [AI] Failed to create SSE connection:', err);
      setConnectionMode('polling');
      pollOnce();
    }
  }, [isClient, jobId, updateAnalysis, pollOnce]);

  // Start connection
  useEffect(() => {
    if (!isClient || !jobId) return;

    // Try SSE first, with polling fallback
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      if (sseTimeoutRef.current) {
        clearTimeout(sseTimeoutRef.current);
      }
    };
  }, [isClient, jobId, connectSSE]);

  // Handle online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsRecovering(false);
      backoffRef.current = MIN_BACKOFF_MS;

      // Reconnect with SSE
      if (analysis?.status !== 'completed' && analysis?.status !== 'failed') {
        connectSSE();
      }
    };

    const handleOffline = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };

    const handleFocus = () => {
      if (analysis?.status !== 'completed' && analysis?.status !== 'failed') {
        backoffRef.current = MIN_BACKOFF_MS;
        connectSSE();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [analysis, connectSSE]);

  return {
    analysis,
    loading,
    error,
    isRecovering,
    connectionMode
  };
}
