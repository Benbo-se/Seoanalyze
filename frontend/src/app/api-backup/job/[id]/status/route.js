// API Route: /api/job/[id]/status
// Gets job status from backend

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Proxy to existing Express backend
    const response = await fetch(`http://127.0.0.1:5000/api/job/${id}/status`, {
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
    console.error('Job status API error:', error);
    return Response.json(
      { error: 'Failed to get job status', details: error.message },
      { status: 500 }
    );
  }
}