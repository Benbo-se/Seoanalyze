// API Route: /api/health
// System health check endpoint

export async function GET(request) {
  try {
    // Proxy to existing Express backend
    const response = await fetch('http://127.0.0.1:5000/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Health check error:', error);
    return Response.json(
      { 
        status: 'error',
        error: 'Health check failed', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}