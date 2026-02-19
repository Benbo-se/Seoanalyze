// SSE endpoint for real-time AI analysis progress updates

const { prisma } = require('../../../../../../lib/prisma');

const SSE_KEEPALIVE_INTERVAL_MS = 25000; // Send keepalive every 25s

export async function GET(request, { params }) {
  const { jobId } = params;

  if (!jobId) {
    return new Response('Job ID required', { status: 400 });
  }

  console.log(`📡 [SSE] Client connecting for AI job: ${jobId}`);

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let keepaliveTimer = null;

      const cleanup = () => {
        closed = true;
        if (keepaliveTimer) {
          clearInterval(keepaliveTimer);
        }
        try {
          controller.close();
        } catch {}
      };

      const send = (event, data) => {
        if (closed) return;
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error(`❌ [SSE] Failed to send ${event}:`, error);
          cleanup();
        }
      };

      // Send initial connected event
      send('connected', { jobId, timestamp: Date.now() });

      // Send keepalive to prevent timeout
      keepaliveTimer = setInterval(() => {
        send('keepalive', { timestamp: Date.now() });
      }, SSE_KEEPALIVE_INTERVAL_MS);

      // Poll database for status updates
      const pollInterval = setInterval(async () => {
        if (closed) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const aiAnalysis = await prisma.aiAnalysis.findUnique({
            where: { id: jobId }
          });

          if (!aiAnalysis) {
            send('error', { error: 'Analysis not found' });
            cleanup();
            return;
          }

          const statusData = {
            status: aiAnalysis.status,
            state: aiAnalysis.status,
            progress: aiAnalysis.progress,
            targetUrl: aiAnalysis.targetUrl,
            error: aiAnalysis.error,
            resultId: aiAnalysis.id,
            analysisId: aiAnalysis.id
          };

          console.log(`📈 [SSE] AI Progress: ${aiAnalysis.status} - ${aiAnalysis.progress}%`);

          // Send progress update
          send('progress', statusData);

          // If completed or failed, send final event and close
          if (aiAnalysis.status === 'completed') {
            console.log(`✅ [SSE] AI Analysis completed: ${jobId}`);
            send('completed', {
              ...statusData,
              aiReport: aiAnalysis.aiReport,
              competitors: aiAnalysis.competitors,
              completedAt: aiAnalysis.completedAt
            });
            clearInterval(pollInterval);
            setTimeout(cleanup, 500); // Give time for message to send
          } else if (aiAnalysis.status === 'failed') {
            console.log(`❌ [SSE] AI Analysis failed: ${jobId}`);
            send('failed', statusData);
            clearInterval(pollInterval);
            setTimeout(cleanup, 500);
          }

        } catch (error) {
          console.error('❌ [SSE] Polling error:', error);
          send('error', { error: error.message });
          cleanup();
          clearInterval(pollInterval);
        }
      }, 2000); // Poll every 2 seconds

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log(`🔌 [SSE] Client disconnected: ${jobId}`);
        clearInterval(pollInterval);
        cleanup();
      });

    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    }
  });
}
