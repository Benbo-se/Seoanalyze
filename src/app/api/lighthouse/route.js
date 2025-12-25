// API Route: /api/lighthouse
// Proxies to Lighthouse worker service

export async function POST(request) {
  try {
    // Check if Lighthouse is enabled
    if (process.env.ENABLE_LIGHTHOUSE === 'false') {
      return Response.json(
        { success: false, error: 'Lighthouse is disabled' },
        { status: 503 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return Response.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Proxy to worker service
    const workerUrl = process.env.LIGHTHOUSE_WORKER_URL || 'http://127.0.0.1:5002';
    console.log(`Proxying Lighthouse request for ${url} to worker at ${workerUrl}`);

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    const response = await fetch(`${workerUrl}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
      // No caching - worker handles its own cache
      next: { revalidate: 0 }
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    // Pass through the worker response
    return Response.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    console.error('Lighthouse API error:', error);

    // Check if aborted due to timeout
    if (error.name === 'AbortError') {
      return Response.json(
        {
          success: false,
          error: 'Lighthouse analysis timed out',
          details: 'Request took longer than 2 minutes'
        },
        { status: 408 }
      );
    }

    // Check if worker is down
    if (error.cause?.code === 'ECONNREFUSED') {
      return Response.json(
        {
          success: false,
          error: 'Lighthouse worker service is not running',
          details: 'Please ensure the lighthouse-worker is started with PM2'
        },
        { status: 503 }
      );
    }

    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}