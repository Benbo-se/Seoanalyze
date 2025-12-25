#!/bin/bash

# Performance monitoring script for stress testing

LOG_FILE="/tmp/stress-test-performance.log"
INTERVAL=5

echo "🔍 Starting performance monitoring..."
echo "Logging to: $LOG_FILE"
echo "Monitoring interval: ${INTERVAL}s"
echo ""

# Clear previous log
> $LOG_FILE

# Function to log system stats
log_stats() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # CPU and memory usage
    local cpu_usage=$(top -b -n1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local mem_available=$(free -h | grep Mem | awk '{print $7}')
    
    # Load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | sed 's/,//g' | sed 's/^ *//')
    
    # Process count for key services
    local node_processes=$(pgrep -f "next-server\|node.*seo" | wc -l)
    local redis_status=$(redis-cli ping 2>/dev/null || echo "FAILED")
    
    # Disk usage for logs and temp
    local disk_usage=$(df -h /tmp | tail -1 | awk '{print $5}')
    
    # Network connections
    local connections=$(ss -tn | grep :5001 | wc -l)
    
    echo "[$timestamp] CPU: ${cpu_usage}% | MEM: ${mem_usage}% (${mem_available} free) | Load: ${load_avg} | Node: ${node_processes} proc | Redis: ${redis_status} | Disk: ${disk_usage} | Conn: ${connections}" | tee -a $LOG_FILE
}

# Monitor Redis performance
check_redis() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Redis info
    local redis_info=$(redis-cli info memory 2>/dev/null | grep -E "used_memory_human|maxmemory_human" | tr '\n' ' ')
    local redis_connections=$(redis-cli info clients 2>/dev/null | grep connected_clients | cut -d: -f2 | tr -d '\r')
    local redis_ops=$(redis-cli info stats 2>/dev/null | grep total_commands_processed | cut -d: -f2 | tr -d '\r')
    
    if [ ! -z "$redis_info" ]; then
        echo "[$timestamp] Redis: ${redis_info} | Clients: ${redis_connections} | Ops: ${redis_ops}" | tee -a $LOG_FILE
    fi
}

# Monitor PostgreSQL if available
check_postgres() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check if PostgreSQL is accessible
    local pg_status=""
    if command -v psql >/dev/null 2>&1; then
        # Try to connect and get basic stats
        pg_status=$(psql "postgresql://seouser:SeoAnalyzer2025Strong@localhost:5432/seoanalyzer" -c "SELECT COUNT(*) FROM analyses;" 2>/dev/null | grep -E "^ *[0-9]+$" | tr -d ' ')
        if [ ! -z "$pg_status" ]; then
            echo "[$timestamp] PostgreSQL: ${pg_status} total analyses in DB" | tee -a $LOG_FILE
        fi
    fi
}

# Monitor job queues via API
check_queues() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Get queue stats from health endpoint
    local queue_stats=$(curl -s http://localhost:5001/api/cache/health 2>/dev/null)
    if [ $? -eq 0 ] && [ ! -z "$queue_stats" ]; then
        # Parse queue statistics if available
        echo "[$timestamp] Queue Status: ${queue_stats}" | tee -a $LOG_FILE
    fi
}

echo "🚀 Performance monitoring started..."
echo ""

# Main monitoring loop
while true; do
    log_stats
    
    # Every 3rd iteration, check additional stats
    if [ $(($(date +%s) % 15)) -eq 0 ]; then
        check_redis
        check_postgres
        check_queues
        echo "" | tee -a $LOG_FILE
    fi
    
    sleep $INTERVAL
done