// API Route: /api/job/[id]/queue-position
// Gets queue position for waiting jobs

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Proxy to existing Express backend
    const response = await fetch(`http://127.0.0.1:5000/api/job/${id}/queue-position`, {
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
    console.error('Queue position API error:', error);
    return Response.json(
      { error: 'Failed to get queue position', details: error.message },
      { status: 500 }
    );
  }
}