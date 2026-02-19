const EventEmitter = require('events');
const { QueueEvents } = require('bullmq');

/**
 * HybridSSEManager - Robust SSE manager med QueueEvents och polling fallback
 * 
 * Försöker först lyssna på QueueEvents, men faller tillbaka på polling
 * om inga events kommer inom timeout-perioden.
 */
class HybridSSEManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Konfigurerbar timeout per analystyp för när polling ska starta
    this.eventTimeouts = options.eventTimeouts || {
      seo: 60000,        // 1 minut för SEO-analys
      lighthouse: 240000, // 4 minuter för Lighthouse-analys  
      crawl: 1200000     // 20 minuter för Crawl-analys (500 sidor)
    };
    
    // Backward compatibility: om eventTimeout skickas, använd för alla typer
    if (options.eventTimeout && !options.eventTimeouts) {
      this.eventTimeouts = {
        seo: options.eventTimeout,
        lighthouse: options.eventTimeout,
        crawl: options.eventTimeout
      };
    }
    
    // Polling interval (default 1 sekund)
    this.pollingInterval = options.pollingInterval || 1000;
    
    // Redis connection config
    this.redisConfig = options.redisConfig || { 
      host: 'localhost', 
      port: 6379 
    };
    
    // Håll koll på aktiva job trackers
    this.activeTrackers = new Map();
    
    // QueueEvents instances
    this.queueEvents = {};
    
    // Setup queue events för varje kö-typ
    this.setupQueueEvents();
    
    console.log('🚀 HybridSSEManager initialized with:');
    console.log(`   - Event timeouts: SEO=${this.eventTimeouts.seo}ms, Lighthouse=${this.eventTimeouts.lighthouse}ms, Crawl=${this.eventTimeouts.crawl}ms`);
    console.log(`   - Polling interval: ${this.pollingInterval}ms`);
  }
  
  setupQueueEvents() {
    // Skapa QueueEvents för varje kö-typ
    const queueTypes = ['seo', 'lighthouse', 'crawl'];
    
    queueTypes.forEach(type => {
      this.queueEvents[type] = new QueueEvents(type, { 
        connection: this.redisConfig 
      });
      
      // Lyssna på completed events
      this.queueEvents[type].on('completed', ({ jobId, returnvalue }) => {
        console.log(`📡 QueueEvents: ${type} job ${jobId} completed via event`);
        this.handleJobCompletion(jobId, type, returnvalue);
      });
      
      // Lyssna på failed events
      this.queueEvents[type].on('failed', ({ jobId, failedReason }) => {
        console.log(`❌ QueueEvents: ${type} job ${jobId} failed via event`);
        this.handleJobFailure(jobId, type, failedReason);
      });
    });
  }
  
  /**
   * Börja spåra ett jobb med hybrid approach
   */
  trackJob(jobId, type, clientId, queue) {
    console.log(`🔍 Starting hybrid tracking for ${type} job ${jobId}`);
    
    const tracker = {
      jobId,
      type,
      clientId,
      queue,
      eventReceived: false,
      pollingActive: false,
      pollingTimer: null,
      timeoutTimer: null,
      startTime: Date.now()
    };
    
    this.activeTrackers.set(jobId, tracker);
    
    // Sätt timeout för att starta polling om inga events kommer (baserat på analystyp)
    const timeoutDuration = this.eventTimeouts[type] || 60000; // Fallback till 1 minut
    tracker.timeoutTimer = setTimeout(() => {
      if (!tracker.eventReceived) {
        console.log(`⏰ Timeout reached for ${type} job ${jobId} after ${timeoutDuration}ms, starting polling fallback`);
        this.startPolling(jobId);
      }
    }, timeoutDuration);
    
    return tracker;
  }
  
  /**
   * Starta polling för ett specifikt jobb
   */
  async startPolling(jobId) {
    const tracker = this.activeTrackers.get(jobId);
    if (!tracker || tracker.pollingActive || tracker.eventReceived) {
      return;
    }
    
    tracker.pollingActive = true;
    console.log(`🔄 Starting polling for job ${jobId}`);
    
    const pollJob = async () => {
      try {
        const job = await tracker.queue.getJob(jobId);
        
        if (!job) {
          console.error(`Job ${jobId} not found in queue`);
          this.cleanupTracker(jobId);
          return;
        }
        
        const state = await job.getState();
        console.log(`📊 Polling job ${jobId}: state = ${state}`);
        
        if (state === 'completed') {
          const result = job.returnvalue;
          console.log(`✅ Job ${jobId} completed via polling`);
          this.handleJobCompletion(jobId, tracker.type, result);
        } else if (state === 'failed') {
          const failedReason = job.failedReason;
          console.log(`❌ Job ${jobId} failed via polling`);
          this.handleJobFailure(jobId, tracker.type, failedReason);
        } else {
          // Fortsätt polling om jobbet inte är klart
          tracker.pollingTimer = setTimeout(pollJob, this.pollingInterval);
        }
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
        // Försök igen
        tracker.pollingTimer = setTimeout(pollJob, this.pollingInterval);
      }
    };
    
    // Starta första poll
    pollJob();
  }
  
  /**
   * Hantera job completion från antingen event eller polling
   */
  handleJobCompletion(jobId, type, result) {
    const tracker = this.activeTrackers.get(jobId);
    if (!tracker) return;
    
    // Markera att event har mottagits
    tracker.eventReceived = true;
    
    // Emit completion event
    this.emit('jobCompleted', {
      jobId,
      type,
      clientId: tracker.clientId,
      result,
      method: tracker.pollingActive ? 'polling' : 'event',
      duration: Date.now() - tracker.startTime
    });
    
    // Cleanup
    this.cleanupTracker(jobId);
  }
  
  /**
   * Hantera job failure
   */
  handleJobFailure(jobId, type, reason) {
    const tracker = this.activeTrackers.get(jobId);
    if (!tracker) return;
    
    // Markera att event har mottagits
    tracker.eventReceived = true;
    
    // Emit failure event
    this.emit('jobFailed', {
      jobId,
      type,
      clientId: tracker.clientId,
      reason,
      method: tracker.pollingActive ? 'polling' : 'event',
      duration: Date.now() - tracker.startTime
    });
    
    // Cleanup
    this.cleanupTracker(jobId);
  }
  
  /**
   * Cleanup tracker och timers
   */
  cleanupTracker(jobId) {
    const tracker = this.activeTrackers.get(jobId);
    if (!tracker) return;
    
    // Clear timers
    if (tracker.timeoutTimer) {
      clearTimeout(tracker.timeoutTimer);
    }
    if (tracker.pollingTimer) {
      clearTimeout(tracker.pollingTimer);
    }
    
    // Ta bort tracker
    this.activeTrackers.delete(jobId);
    
    console.log(`🧹 Cleaned up tracker for job ${jobId}`);
  }
  
  /**
   * Använd job.waitUntilFinished() som alternativ metod
   */
  async waitForJobCompletion(job, type, clientId) {
    console.log(`⏳ Using waitUntilFinished for ${type} job ${job.id}`);
    
    try {
      const queueEvents = this.queueEvents[type];
      const result = await job.waitUntilFinished(queueEvents);
      
      console.log(`✅ Job ${job.id} completed via waitUntilFinished`);
      
      this.emit('jobCompleted', {
        jobId: job.id,
        type,
        clientId,
        result,
        method: 'waitUntilFinished',
        duration: 0 // Not tracked for this method
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Job ${job.id} failed via waitUntilFinished:`, error);
      
      this.emit('jobFailed', {
        jobId: job.id,
        type,
        clientId,
        reason: error.message,
        method: 'waitUntilFinished',
        duration: 0
      });
      
      throw error;
    }
  }
  
  /**
   * Stäng alla connections
   */
  async close() {
    // Cleanup alla aktiva trackers
    for (const [jobId, tracker] of this.activeTrackers) {
      this.cleanupTracker(jobId);
    }
    
    // Stäng QueueEvents connections
    const closePromises = Object.values(this.queueEvents).map(qe => qe.close());
    await Promise.all(closePromises);
    
    console.log('🔌 HybridSSEManager closed');
  }
  
  /**
   * Få statistik om aktiva trackers
   */
  getStats() {
    const stats = {
      activeTrackers: this.activeTrackers.size,
      byMethod: {
        event: 0,
        polling: 0,
        waiting: 0
      }
    };
    
    for (const tracker of this.activeTrackers.values()) {
      if (tracker.eventReceived) {
        stats.byMethod.event++;
      } else if (tracker.pollingActive) {
        stats.byMethod.polling++;
      } else {
        stats.byMethod.waiting++;
      }
    }
    
    return stats;
  }
}

module.exports = HybridSSEManager;