'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LS_PREFIX = 'jobStatus:';
const MAX_BACKOFF_MS = 15000;
const MIN_BACKOFF_MS = 800;
const JITTER = 0.25;
const SSE_TIMEOUT_MS = 30000; // 30s timeout for SSE connections
const POLLING_FALLBACK_DELAY = 5000; // 5s delay before fallback

function withJitter(base) {
  const r = (Math.random() * 2 - 1) * JITTER;
  return Math.max(300, Math.floor(base * (1 + r)));
}

function loadLocal(jobId) {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(LS_PREFIX + jobId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocal(jobId, status) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LS_PREFIX + jobId, JSON.stringify({
      state: status.state,
      progress: status.progress,
      position: status.position,
      resultId: status.resultId,
      error: status.error,
      type: status.type,
      url: status.url,
      analysisId: status.analysisId,
      lastUpdate: Date.now()
    }));
  } catch {}
}

async function resolveType(jobId, type) {
  if (type && type !== 'unknown') return type;
  
  // Always return 'unknown' to let the SSE route handle type resolution
  // The SSE route knows how to map 'analysis' -> 'seo' queue correctly
  return 'unknown';
}

function normalizeType(type) {
  const map = {
    analyze: 'analysis',
    seo: 'analysis',
    crawl: 'crawl',
    lighthouse: 'lighthouse'
  };
  console.log('🔧 normalizeType input:', type, '→ output:', map[type] || type);
  return map[type] || type;
}

export function useJobConnector(jobId, type = 'unknown') {
  const [status, setStatus] = useState(null);
  const [isOffline, setIsOffline] = useState(typeof window !== 'undefined' ? !navigator.onLine : false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [nextRetryInMs, setNextRetryInMs] = useState(null);
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

  // Load cached data
  useEffect(() => {
    if (!isClient) return;
    const cached = loadLocal(jobId);
    if (cached) {
      setStatus(cached);
    }
  }, [isClient, jobId]);

  const updateStatus = useCallback((newStatus) => {
    console.log('🔄 updateStatus received:', newStatus);
    const normalized = {
      state: newStatus.status || newStatus.state || 'initializing',
      progress: typeof newStatus.progress === 'number' ? newStatus.progress : 0,
      position: newStatus.position || null,
      resultId: newStatus.resultId || newStatus.analysisId || null,
      analysisId: newStatus.analysisId || newStatus.resultId || null,
      error: newStatus.error || null,
      type: newStatus.type || type,
      url: newStatus.url || null
    };
    console.log('✅ updateStatus normalized:', normalized);

    setStatus(normalized);
    saveLocal(jobId, normalized);
    setIsRecovering(false);
    backoffRef.current = MIN_BACKOFF_MS;
    
    return normalized;
  }, [jobId, type]);

  const pollOnce = useCallback(async () => {
    try {
      const normalizedType = normalizeType(type);
      const url = `/api/job-status/${normalizedType}/${encodeURIComponent(jobId)}`;
      console.log(`🔍 Polling: ${url} (type: ${type} -> ${normalizedType})`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Polling update:', data);
      
      // Check for completion and navigate
      if (data.status === 'completed') {
        const id = data.analysisId || data.resultId;
        if (id) {
          console.log('🧭 Polling: Navigating to results:', `/analys/${id}`);
          window.location.replace(`/analys/${id}`);
          return;
        }
      }
      
      const normalized = updateStatus(data);

      // Schedule next poll if not finished
      if (normalized.state !== 'completed' && normalized.state !== 'failed') {
        const delay = normalized.state === 'active' ? 1000 : 2000;
        pollTimeoutRef.current = setTimeout(pollOnce, withJitter(delay));
      }

    } catch (error) {
      console.error('❌ Polling error:', error);
      handleError(error);
    }
  }, [jobId, type, updateStatus]);

  const handleError = useCallback((error) => {
    const nextBackoff = Math.min(MAX_BACKOFF_MS, backoffRef.current * 2);
    backoffRef.current = nextBackoff;
    const delay = withJitter(nextBackoff);

    setIsOffline(!navigator.onLine);
    setIsRecovering(true);
    setNextRetryInMs(delay);

    // Retry after delay
    pollTimeoutRef.current = setTimeout(() => {
      if (connectionMode === 'sse') {
        connectSSE();
      } else {
        pollOnce();
      }
    }, delay);
  }, [connectionMode]);

  const connectSSE = useCallback(async () => {
    if (!isClient || !clientIdRef.current) return;

    // Cleanup existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (sseTimeoutRef.current) {
      clearTimeout(sseTimeoutRef.current);
    }

    // Resolve type using job-meta before connecting
    const resolvedType = await resolveType(jobId, type);
    // For SSE connection, we always pass 'unknown' if we're not certain
    // The SSE route will resolve to the correct queue using job-meta
    const sseType = resolvedType === 'unknown' ? 'unknown' : resolvedType;
    const sseUrl = `/api/sse/job/${encodeURIComponent(jobId)}/${sseType}/${clientIdRef.current}`;
    console.log(`📡 Connecting SSE to: ${sseUrl} (initial: ${type} -> resolved: ${resolvedType})`);

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;
      setConnectionMode('sse');

      // SSE timeout fallback
      sseTimeoutRef.current = setTimeout(() => {
        console.log('⏰ SSE timeout, falling back to polling');
        eventSource.close();
        setConnectionMode('polling');
        pollOnce();
      }, SSE_TIMEOUT_MS);

      eventSource.addEventListener('connected', (event) => {
        console.log('🔗 SSE Connected:', event.data);
        if (sseTimeoutRef.current) {
          clearTimeout(sseTimeoutRef.current);
        }
        setIsRecovering(false);
        backoffRef.current = MIN_BACKOFF_MS;
      });

      eventSource.addEventListener('progress', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📈 SSE Progress:', data);
          updateStatus(data);
        } catch (error) {
          console.error('❌ Failed to parse progress event:', error);
        }
      });

      const onCompleted = async (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('✅ SSE Completed event:', payload);
          
          // 1) Try to get ID directly from event
          let id = payload.analysisId || payload.resultId;

          // 2) Fallback: fetch from status endpoint
          if (!id) {
            try {
              const r = await fetch(`/api/job-status/crawl/${encodeURIComponent(jobId)}`, { cache: 'no-store' });
              const j = await r.json();
              id = j.analysisId || j.resultId || null;
              console.log('🔄 Fallback fetch got ID:', id);
            } catch (err) {
              console.error('❌ Fallback fetch failed:', err);
            }
          }

          // 3) Cleanup & navigate
          try { eventSource.close(); } catch {}
          try { if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current); } catch {}

          if (id) {
            console.log('🧭 Navigating to results:', `/analys/${id}`);
            window.location.replace(`/analys/${id}`);
            return;
          }

          // If all else fails, update state but stay
          console.log('⚠️ No analysisId found, staying on page');
          updateStatus({ ...payload, status: 'completed', state: 'completed', progress: 100 });
        } catch (err) {
          console.error('❌ Failed to handle completed event:', err);
          updateStatus({ status: 'completed', state: 'completed', progress: 100 });
        }
      };

      eventSource.addEventListener('completed', onCompleted);
      eventSource.addEventListener('done', onCompleted);

      eventSource.addEventListener('keepalive', () => {
        // Just keep the connection alive
      });

      eventSource.addEventListener('error', (event) => {
        console.error('❌ SSE Error event');
        eventSource.close();
        
        // Fall back to polling after a delay
        setTimeout(() => {
          console.log('🔄 Falling back to polling after SSE error');
          setConnectionMode('polling');
          pollOnce();
        }, POLLING_FALLBACK_DELAY);
      });

      eventSource.onerror = (error) => {
        console.error('❌ SSE onerror:', error);
        if (sseTimeoutRef.current) {
          clearTimeout(sseTimeoutRef.current);
        }
        
        // Don't immediately retry SSE, fall back to polling
        setTimeout(() => {
          setConnectionMode('polling');
          pollOnce();
        }, POLLING_FALLBACK_DELAY);
      };

    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      setConnectionMode('polling');
      pollOnce();
    }
  }, [isClient, jobId, type, updateStatus, pollOnce]);

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
      setIsOffline(false);
      setIsRecovering(false);
      backoffRef.current = MIN_BACKOFF_MS;
      
      // Reconnect with SSE
      if (status?.state !== 'completed' && status?.state !== 'failed') {
        connectSSE();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };

    const handleFocus = () => {
      if (!isOffline && status?.state !== 'completed' && status?.state !== 'failed') {
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
  }, [isOffline, status, connectSSE]);

  const retryNow = useCallback(() => {
    backoffRef.current = MIN_BACKOFF_MS;
    setIsRecovering(false);
    setNextRetryInMs(null);
    
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    if (sseTimeoutRef.current) {
      clearTimeout(sseTimeoutRef.current);
    }
    
    connectSSE();
  }, [connectSSE]);

  const done = status?.state === 'completed' || status?.state === 'failed';

  // Return early disabled state if no jobId provided
  if (!jobId) {
    return {
      status: null,
      isOffline: false,
      isRecovering: false,
      nextRetryInMs: null,
      connectionMode: 'disabled',
      done: true,
      retryNow: () => {}
    };
  }

  return {
    status,
    isOffline,
    isRecovering,
    nextRetryInMs,
    connectionMode,
    done,
    retryNow
  };
}