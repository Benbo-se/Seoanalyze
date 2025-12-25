// API Route: /api/extract-issues
// Extracts fixable issues from analysis results

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Proxy to existing Express backend
    const response = await fetch('http://127.0.0.1:5000/api/extract-issues', {
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
    console.error('Extract issues error:', error);
    return Response.json(
      { error: 'Failed to extract issues', details: error.message },
      { status: 500 }
    );
  }
}