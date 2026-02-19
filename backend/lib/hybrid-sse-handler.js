/**
 * HybridSSEHandler - SSE endpoint handler som använder HybridSSEManager
 * 
 * Hanterar SSE connections och skickar resultat via både QueueEvents och polling
 */
class HybridSSEHandler {
  constructor(hybridManager) {
    this.hybridManager = hybridManager;
    this.activeConnections = new Map(); // clientId -> response object
    
    // Lyssna på job completion events från hybrid manager
    this.hybridManager.on('jobCompleted', (data) => {
      this.sendJobResult(data.clientId, 'completed', data);
    });
    
    this.hybridManager.on('jobFailed', (data) => {
      this.sendJobResult(data.clientId, 'failed', data);
    });
    
    console.log('🔌 HybridSSEHandler initialized');
  }
  
  /**
   * Hantera SSE connection för ett specifikt job
   */
  handleSSEConnection(req, res, jobId, type, clientId, queue) {
    console.log(`📡 Setting up SSE connection for job ${jobId} (client: ${clientId})`);
    
    // Sätt SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Skicka initial ping
    res.write(':ok\n\n');
    
    // Spara connection
    this.activeConnections.set(clientId, {
      response: res,
      jobId,
      type,
      startTime: Date.now()
    });
    
    // Starta hybrid tracking
    this.hybridManager.trackJob(jobId, type, clientId, queue);
    
    // Hantera client disconnect
    req.on('close', () => {
      console.log(`🔌 SSE client ${clientId} disconnected`);
      this.removeConnection(clientId);
    });
    
    req.on('error', (error) => {
      console.error(`SSE error for client ${clientId}:`, error);
      this.removeConnection(clientId);
    });
    
    // Sätt timeout för hela SSE connection (10 minuter max)
    setTimeout(() => {
      if (this.activeConnections.has(clientId)) {
        console.log(`⏰ SSE timeout for client ${clientId}, closing connection`);
        this.sendJobResult(clientId, 'timeout', {
          jobId,
          error: 'Connection timeout after 10 minutes'
        });
      }
    }, 10 * 60 * 1000); // 10 minutes
  }
  
  /**
   * Skicka job resultat till klient via SSE
   */
  sendJobResult(clientId, eventType, data) {
    const connection = this.activeConnections.get(clientId);
    if (!connection) {
      console.log(`⚠️ No active connection for client ${clientId}`);
      return;
    }
    
    const { response, jobId, type, startTime } = connection;
    
    try {
      // Logga resultat
      const duration = Date.now() - startTime;
      console.log(`📤 Sending ${eventType} event for ${type} job ${jobId} to client ${clientId}`);
      console.log(`   Duration: ${duration}ms, Method: ${data.method || 'unknown'}`);
      
      // Bestäm event name baserat på typ och resultat
      let eventName;
      if (eventType === 'completed') {
        eventName = type === 'seo' ? 'analysisComplete' : 
                   type === 'crawl' ? 'crawlComplete' : 
                   'lighthouseComplete';
      } else if (eventType === 'failed') {
        eventName = type === 'seo' ? 'analysisError' : 
                   type === 'crawl' ? 'crawlError' : 
                   'lighthouseError';
      } else {
        eventName = eventType; // timeout, etc.
      }
      
      // Skicka event
      response.write(`event: ${eventName}\n`);
      response.write(`data: ${JSON.stringify({
        jobId: data.jobId,
        result: data.result,
        error: data.reason || data.error,
        method: data.method,
        duration: data.duration,
        totalDuration: duration
      })}\n\n`);
      
      // Stäng connection efter resultat
      setTimeout(() => {
        this.removeConnection(clientId);
      }, 100); // Kort delay för att säkerställa data skickas
      
    } catch (error) {
      console.error(`Error sending SSE to client ${clientId}:`, error);
      this.removeConnection(clientId);
    }
  }
  
  /**
   * Ta bort SSE connection
   */
  removeConnection(clientId) {
    const connection = this.activeConnections.get(clientId);
    if (connection) {
      try {
        connection.response.end();
      } catch (error) {
        // Connection redan stängd
      }
      this.activeConnections.delete(clientId);
      console.log(`🗑️ Removed SSE connection for client ${clientId}`);
    }
  }
  
  /**
   * Skicka status update till klient
   */
  sendStatusUpdate(clientId, status) {
    const connection = this.activeConnections.get(clientId);
    if (!connection) return;
    
    try {
      connection.response.write(`event: queueUpdate\n`);
      connection.response.write(`data: ${JSON.stringify(status)}\n\n`);
    } catch (error) {
      console.error(`Error sending status update to ${clientId}:`, error);
      this.removeConnection(clientId);
    }
  }
  
  /**
   * Få statistik om aktiva connections
   */
  getConnectionStats() {
    const stats = {
      activeConnections: this.activeConnections.size,
      connections: []
    };
    
    for (const [clientId, connection] of this.activeConnections) {
      stats.connections.push({
        clientId,
        jobId: connection.jobId,
        type: connection.type,
        duration: Date.now() - connection.startTime
      });
    }
    
    return stats;
  }
  
  /**
   * Stäng alla connections
   */
  close() {
    for (const [clientId, connection] of this.activeConnections) {
      try {
        connection.response.end();
      } catch (error) {
        // Ignore errors when closing
      }
    }
    this.activeConnections.clear();
    console.log('🔌 All SSE connections closed');
  }
}

module.exports = HybridSSEHandler;