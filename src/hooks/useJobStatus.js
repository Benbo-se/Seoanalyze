import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const LS_PREFIX = 'crawlJob:';
const MAX_BACKOFF_MS = 15000; // 15s
const MIN_BACKOFF_MS = 800;   // 0.8s
const JITTER = 0.25;          // ±25%

function withJitter(base) {
  const r = (Math.random() * 2 - 1) * JITTER; // -0.25..+0.25
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
      progress: status.progress ?? undefined,
      position: status.position ?? undefined,
      resultId: status.resultId ?? undefined,
      error: status.error ?? undefined,
      type: status.type ?? undefined,
      url: status.url ?? undefined
    }));
  } catch {}
}

export function useJobStatus(jobId) {
  // State that works with SSR/hydration
  const [hookState, setHookState] = useState({
    status: null,
    isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
    isRecovering: false,
    lastUpdatedAt: null,
    nextRetryInMs: null,
  });
  
  // Track if we're client-side
  const [isClient, setIsClient] = useState(false);
  
  const backoffRef = useRef(MIN_BACKOFF_MS);
  const abortRef = useRef(null);
  const timerRef = useRef(null);
  
  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initial hydrate from localStorage - only after client-side hydration
  useEffect(() => {
    if (!isClient) return;
    
    const cached = loadLocal(jobId);
    if (cached) {
      setHookState(s => ({
        ...s,
        status: cached,
        lastUpdatedAt: Date.now()
      }));
    }
  }, [isClient, jobId]);

  const pollOnce = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`/api/job/${encodeURIComponent(jobId)}/status`, {
        method: 'GET',
        signal: ctrl.signal,
        headers: { 'Accept': 'application/json' }
      });

      // 200 OK → normal
      // 202 Accepted → job håller på att initialiseras; behandla som transient
      if (res.status === 200 || res.status === 202) {
        const data = await res.json();
        const merged = {
          state: data.state ?? 'initializing',
          progress: typeof data.progress === 'number' ? data.progress : undefined,
          position: typeof data.position === 'number' ? data.position : null,
          resultId: data.resultId,
          error: data.error,
          type: data.type,
          url: data.url
        };
        saveLocal(jobId, merged);
        
        setHookState(s => ({
          ...s,
          status: merged,
          isRecovering: false,
          lastUpdatedAt: Date.now(),
          nextRetryInMs: null
        }));

        // Reset backoff när vi lyckas
        backoffRef.current = MIN_BACKOFF_MS;

        // Styr nästa poll baserat på state
        let nextMs = 0;
        switch (merged.state) {
          case 'waiting':   
            nextMs = withJitter(2000); 
            break;
          case 'initializing': 
            nextMs = withJitter(1500); 
            break;
          case 'active':    
            nextMs = withJitter(1200); 
            break;
          case 'completed':
          case 'failed':    
            nextMs = 0; // stoppa polling
            break;
        }
        if (nextMs > 0) {
          setHookState(s => ({ ...s, nextRetryInMs: nextMs }));
          if (typeof window !== 'undefined') {
            timerRef.current = window.setTimeout(() => void pollOnce(), nextMs);
          }
        }
        return;
      }

      // 4xx/5xx → backoff, men ge inte upp
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      // Network/abort/HTTP fel → backoff
      const next = Math.min(MAX_BACKOFF_MS, Math.floor(backoffRef.current * 2));
      backoffRef.current = next;
      const wait = withJitter(next);

      setHookState(s => ({
        ...s,
        isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
        isRecovering: true,
        nextRetryInMs: wait
      }));

      if (typeof window !== 'undefined') {
        timerRef.current = window.setTimeout(() => void pollOnce(), wait);
      }
    }
  }, [jobId]);

  // Start polling - only after client-side hydration
  useEffect(() => {
    if (!isClient) return;
    
    pollOnce();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (timerRef.current) { 
        clearTimeout(timerRef.current); 
      }
    };
  }, [isClient, pollOnce]);

  // Återuppta vid online/focus
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const onOnline = () => {
      setHookState(s => ({ ...s, isOffline: false }));
      backoffRef.current = MIN_BACKOFF_MS;
      pollOnce();
    };
    const onOffline = () => setHookState(s => ({ ...s, isOffline: true }));
    const onFocus = () => {
      backoffRef.current = MIN_BACKOFF_MS;
      pollOnce();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('focus', onFocus);
    };
  }, [pollOnce]);

  const done = useMemo(() => {
    const st = hookState.status?.state;
    return st === 'completed' || st === 'failed';
  }, [hookState.status]);

  return {
    ...hookState,
    done,
    retryNow: () => {
      backoffRef.current = MIN_BACKOFF_MS;
      if (timerRef.current) clearTimeout(timerRef.current);
      pollOnce();
    }
  };
}