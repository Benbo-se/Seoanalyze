// API Route: /api/sse/job/[jobId]/[type]/[clientId]
// Server-Sent Events for real-time job progress

export async function GET(request, { params }) {
  const { jobId, type, clientId } = params;
  
  console.log(`📡 SSE proxy for ${type} job ${jobId} (client: ${clientId})`);
  
  // Create a proxy to the Express SSE endpoint
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Connect to backend SSE
        const backendUrl = `http://127.0.0.1:5000/api/sse/job/${jobId}/${type}/${clientId}`;
        const response = await fetch(backendUrl, {
          headers: {
            'Accept': 'text/event-stream',
          },
        });

        if (!response.ok) {
          throw new Error(`Backend SSE returned ${response.status}`);
        }

        const reader = response.body.getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Forward the SSE data
          controller.enqueue(value);
        }
        
        controller.close();
      } catch (error) {
        console.error('SSE proxy error:', error);
        const errorMessage = `data: ${JSON.stringify({ error: error.message })}\n\n`;
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}