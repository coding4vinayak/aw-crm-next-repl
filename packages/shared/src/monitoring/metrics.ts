import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client'

// Enable default metrics collection
collectDefaultMetrics({ register })

// HTTP Request Metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
})

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
})

// Database Metrics
export const databaseConnectionsActive = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [register],
})

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
  registers: [register],
})

export const databaseQueriesTotal = new Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
  registers: [register],
})

// Business Metrics
export const usersTotal = new Gauge({
  name: 'users_total',
  help: 'Total number of users',
  labelNames: ['status'],
  registers: [register],
})

export const customersTotal = new Gauge({
  name: 'customers_total',
  help: 'Total number of customers',
  labelNames: ['status'],
  registers: [register],
})

export const dealsTotal = new Gauge({
  name: 'deals_total',
  help: 'Total number of deals',
  labelNames: ['stage', 'status'],
  registers: [register],
})

export const dealValue = new Gauge({
  name: 'deal_value_total',
  help: 'Total value of deals',
  labelNames: ['stage', 'status', 'currency'],
  registers: [register],
})

export const tasksTotal = new Gauge({
  name: 'tasks_total',
  help: 'Total number of tasks',
  labelNames: ['status', 'priority'],
  registers: [register],
})

// Authentication Metrics
export const authAttemptsTotal = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'status'],
  registers: [register],
})

export const activeSessionsTotal = new Gauge({
  name: 'active_sessions_total',
  help: 'Total number of active sessions',
  registers: [register],
})

// Cache Metrics
export const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
  registers: [register],
})

export const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
  registers: [register],
})

export const cacheSize = new Gauge({
  name: 'cache_size_bytes',
  help: 'Size of cache in bytes',
  labelNames: ['cache_name'],
  registers: [register],
})

// Error Metrics
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
  registers: [register],
})

// Circuit Breaker Metrics
export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['name'],
  registers: [register],
})

export const circuitBreakerFailures = new Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['name'],
  registers: [register],
})

// Email Metrics
export const emailsSentTotal = new Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type', 'status'],
  registers: [register],
})

export const emailDeliveryDuration = new Histogram({
  name: 'email_delivery_duration_seconds',
  help: 'Duration of email delivery in seconds',
  labelNames: ['type'],
  buckets: [1, 5, 10, 30, 60, 300],
  registers: [register],
})

// API Rate Limiting Metrics
export const rateLimitHitsTotal = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'user_id'],
  registers: [register],
})

// Background Job Metrics
export const jobsProcessedTotal = new Counter({
  name: 'jobs_processed_total',
  help: 'Total number of background jobs processed',
  labelNames: ['job_type', 'status'],
  registers: [register],
})

export const jobProcessingDuration = new Histogram({
  name: 'job_processing_duration_seconds',
  help: 'Duration of background job processing in seconds',
  labelNames: ['job_type'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300],
  registers: [register],
})

export const jobQueueSize = new Gauge({
  name: 'job_queue_size',
  help: 'Number of jobs in queue',
  labelNames: ['queue_name'],
  registers: [register],
})

// Utility functions for common metric operations
export class MetricsCollector {
  static recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() })
    httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration)
  }

  static recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean) {
    const status = success ? 'success' : 'error'
    databaseQueriesTotal.inc({ operation, table, status })
    databaseQueryDuration.observe({ operation, table }, duration)
  }

  static recordAuthAttempt(type: 'login' | 'register' | 'mfa', success: boolean) {
    const status = success ? 'success' : 'failure'
    authAttemptsTotal.inc({ type, status })
  }

  static recordCacheOperation(cacheName: string, hit: boolean) {
    if (hit) {
      cacheHitsTotal.inc({ cache_name: cacheName })
    } else {
      cacheMissesTotal.inc({ cache_name: cacheName })
    }
  }

  static recordError(type: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    errorsTotal.inc({ type, severity })
  }

  static updateBusinessMetrics(metrics: {
    users?: { active: number; inactive: number }
    customers?: { active: number; inactive: number; prospect: number }
    deals?: { [stage: string]: { open: number; won: number; lost: number; value: number } }
    tasks?: { [status: string]: { [priority: string]: number } }
  }) {
    if (metrics.users) {
      usersTotal.set({ status: 'active' }, metrics.users.active)
      usersTotal.set({ status: 'inactive' }, metrics.users.inactive)
    }

    if (metrics.customers) {
      Object.entries(metrics.customers).forEach(([status, count]) => {
        customersTotal.set({ status }, count)
      })
    }

    if (metrics.deals) {
      Object.entries(metrics.deals).forEach(([stage, data]) => {
        dealsTotal.set({ stage, status: 'open' }, data.open)
        dealsTotal.set({ stage, status: 'won' }, data.won)
        dealsTotal.set({ stage, status: 'lost' }, data.lost)
        dealValue.set({ stage, status: 'total', currency: 'USD' }, data.value)
      })
    }

    if (metrics.tasks) {
      Object.entries(metrics.tasks).forEach(([status, priorities]) => {
        Object.entries(priorities).forEach(([priority, count]) => {
          tasksTotal.set({ status, priority }, count)
        })
      })
    }
  }
}

// Export the registry for /metrics endpoint
export { register as metricsRegistry }