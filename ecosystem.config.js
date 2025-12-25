module.exports = {
  apps: [
    {
      name: 'seo-nextjs-prod',
      script: 'npm',
      args: 'run start',
      cwd: '/opt/seo-analyzer-nextjs',
      instances: 1,  // Fork mode - 1 instans
      exec_mode: 'fork',
      max_memory_restart: '1500M',  // Ökad från 700M
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        HOSTNAME: '0.0.0.0',
        NODE_OPTIONS: '--max-old-space-size=1536',
        DATABASE_URL: 'postgresql://seouser:2WiUDRsAGq5Vuxdkj5yeA3cUM0uIvjEz@localhost:5432/seoanalyzer',
        REDIS_URL: 'redis://:XfLgByQsiJir5gatEMfSOR6yUZIT3jjd@localhost:6379'
      },
      log_file: '/opt/seo-analyzer-nextjs/logs/nextjs-prod.log',
      error_file: '/opt/seo-analyzer-nextjs/logs/nextjs-error.log',
      out_file: '/opt/seo-analyzer-nextjs/logs/nextjs-out.log',
      pid_file: '/opt/seo-analyzer-nextjs/logs/nextjs-prod.pid',
      restart_delay: 4000,
      max_restarts: 10
    },
    {
      name: 'seo-nextjs-workers',
      script: './lib/queue-workers.js',
      cwd: '/opt/seo-analyzer-nextjs',
      instances: 2,  // 2 worker-instanser för parallellitet
      exec_mode: 'fork',
      max_memory_restart: '2048M',  // Ökad från 1100M
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://seouser:2WiUDRsAGq5Vuxdkj5yeA3cUM0uIvjEz@localhost:5432/seoanalyzer',
        REDIS_URL: 'redis://:XfLgByQsiJir5gatEMfSOR6yUZIT3jjd@localhost:6379',
        ENABLE_DATABASE: 'true',
        NODE_APP_INSTANCE: '0',
        NODE_OPTIONS: '--max-old-space-size=2048',
        UV_THREADPOOL_SIZE: '16',
        CRAWL_CONCURRENCY: '15',
        LIGHTHOUSE_CONCURRENCY: '3',
        ENABLE_CRAWL_PUPPETEER_FALLBACK: 'true',
        CRAWL_PUPPETEER_MIN_LINKS: '2',
        ANALYZERS_SECURITY_ENABLED: 'true',
        ANALYZERS_DNS_ENABLED: 'true',
        ANALYZERS_SOCIAL_ENABLED: 'true',
        ANALYZERS_SCHEMA_ENABLED: 'true',
        ANALYZERS_ACTIONABLES_ENABLED: 'true',
        ANALYZERS_SCREENSHOT_ENABLED: 'true',
        DEEPSEEK_API_KEY: 'sk-90883bca88db4dd5add733805ca0d33c',
        GOOGLE_SEARCH_API_KEY: '',
        GOOGLE_SEARCH_ENGINE_ID: '',
        LIGHTHOUSE_ONLY_CATEGORIES: ''
      },
      log_file: '/opt/seo-analyzer-nextjs/logs/workers.log',
      error_file: '/opt/seo-analyzer-nextjs/logs/workers-error.log',
      out_file: '/opt/seo-analyzer-nextjs/logs/workers-out.log',
      pid_file: '/opt/seo-analyzer-nextjs/logs/workers.pid',
      restart_delay: 4000,
      max_restarts: 10,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'artifacts']
    },
    {
      name: 'lighthouse-worker',
      script: './lighthouse-worker.js',
      cwd: '/opt/seo-analyzer-nextjs',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        LIGHTHOUSE_WORKER_PORT: '5002',
        LIGHTHOUSE_TIMEOUT_MS: '90000',
        LIGHTHOUSE_CACHE_TTL_MS: '600000',
        LIGHTHOUSE_CONCURRENCY: '3',
        LIGHTHOUSE_ONLY_CATEGORIES: ''  // Tom sträng = använd default (alla 4 kategorier)
      },
      log_file: '/opt/seo-analyzer-nextjs/logs/lighthouse-worker.log',
      error_file: '/opt/seo-analyzer-nextjs/logs/lighthouse-worker-error.log',
      out_file: '/opt/seo-analyzer-nextjs/logs/lighthouse-worker-out.log',
      pid_file: '/opt/seo-analyzer-nextjs/logs/lighthouse-worker.pid',
      restart_delay: 4000,
      max_restarts: 10,
      watch: false
    }
  ]
};