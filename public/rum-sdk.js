// RUM SDK - Real User Metrics för Core Web Vitals
// Expertens förslag: Minimal client-side kod (15 rader JavaScript)
// Samlar LCP, CLS, INP och postar batchetat (snålt)

(() => {
  // RUM data buffer
  const buf = { 
    lcp: null, 
    cls: 0, 
    inp: null, 
    url: location.href,
    ua: navigator.userAgent, 
    t: Date.now(),
    vp: { w: innerWidth, h: innerHeight } 
  };

  // LCP - Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        buf.lcp = entry.renderTime || entry.loadTime || entry.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS - Cumulative Layout Shift
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      }
      buf.cls = +cls.toFixed(4);
    }).observe({ type: 'layout-shift', buffered: true });

    // INP - Interaction to Next Paint (Event Timing)
    if ('PerformanceEventTiming' in window) {
      new PerformanceObserver((list) => {
        let worst = 0;
        for (const entry of list.getEntries()) {
          worst = Math.max(worst, entry.duration);
        }
        buf.inp = Math.max(buf.inp || 0, worst);
      }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
    }
  }

  // Skicka RUM data när sidan blir inaktiv (eller efter 5s som backup)
  const send = () => {
    // Endast skicka om vi har någon användbar data
    if (buf.lcp || buf.cls > 0 || buf.inp) {
      const payload = JSON.stringify(buf);
      
      // Använd sendBeacon för pålitlig sending, fallback till fetch
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/rum', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/rum', { 
          method: 'POST', 
          headers: {'content-type': 'application/json'}, 
          body: payload, 
          keepalive: true 
        }).catch(() => {}); // Ignorera fel i client-side
      }
      
      console.log('📊 RUM data sent:', { 
        url: buf.url, 
        lcp: buf.lcp, 
        cls: buf.cls, 
        inp: buf.inp 
      });
    }
  };

  // Event listeners för att skicka data
  document.addEventListener('visibilitychange', () => { 
    if (document.visibilityState === 'hidden') send(); 
  });
  
  // Backup timeout för att säkerställa data skickas
  setTimeout(send, 5000);
  
  // Exponera global funktion för manuell triggering
  window.sendRumData = send;
})();