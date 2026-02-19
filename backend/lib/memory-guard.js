// In-process memory guard för backup säkerhet
// Expertens förslag: Backup till PM2's max_memory_restart

const MB = 1024 * 1024;
const LIMIT_MB = Number(process.env.WORKER_MEM_LIMIT_MB ?? 2048);

function startMemoryGuard(label = "worker") {
  console.log(`🔒 Memory guard started for ${label} (limit: ${LIMIT_MB}MB)`);
  
  const interval = setInterval(() => {
    const usage = process.memoryUsage();
    const rss = usage.rss / MB;
    const heapUsed = usage.heapUsed / MB;
    
    // Log memory usage every 30 seconds för monitoring
    if (Date.now() % (30 * 1000) < 15000) {
      console.log(`📊 Memory [${label}]: RSS ${rss.toFixed(0)}MB, Heap ${heapUsed.toFixed(0)}MB`);
    }
    
    // Exit if RSS exceeds limit - PM2 will restart
    if (rss > LIMIT_MB) {
      console.error(`💥 [${label}] RSS ${rss.toFixed(0)}MB > ${LIMIT_MB}MB, exiting for restart`);
      clearInterval(interval);
      process.exit(1); // PM2/systemd återstartar automatiskt
    }
  }, 15000); // Kontrollera var 15:e sekund
  
  return interval;
}

module.exports = { startMemoryGuard };