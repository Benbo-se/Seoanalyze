// API Route: /api/job/[id]/progress
// SSE endpoint for real-time progress updates

export async function GET(request, { params }) {
  const { id } = params;
  
  // Create SSE response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Poll backend for updates
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/job/${id}/status`, {
            method: 'GET',
          });

          if (response.ok) {
            const data = await response.json();
            sendEvent(data);
            
            // Stop polling if job is completed or failed
            if (data.state === 'completed' || data.state === 'failed') {
              clearInterval(interval);
              controller.close();
            }
          }
        } catch (error) {
          console.error('Progress poll error:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
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