// API Route: /api/v1/analyses/[id]
// Gets analysis results from backend

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Proxy to existing Express backend
    const response = await fetch(`http://127.0.0.1:5000/api/v1/analyses/${id}`, {
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
    console.error('Get analysis API error:', error);
    return Response.json(
      { error: 'Failed to get analysis', details: error.message },
      { status: 500 }
    );
  }
}