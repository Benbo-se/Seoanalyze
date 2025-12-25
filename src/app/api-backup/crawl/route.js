// API Route: /api/crawl
// Starts a crawl analysis

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Proxy to existing Express backend
    const response = await fetch('http://127.0.0.1:5000/api/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Crawl API error:', error);
    return Response.json(
      { error: 'Crawl analysis failed', details: error.message },
      { status: 500 }
    );
  }
}