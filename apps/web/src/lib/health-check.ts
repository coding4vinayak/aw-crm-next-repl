import { prisma } from '@awcrm/database'
import Redis from 'ioredis'

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  checks: {
    database: HealthCheck
    redis: HealthCheck
    memory: HealthCheck
    disk: HealthCheck
  }
}

export interface HealthCheck {
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  message?: string
  details?: any
}

class HealthChecker {
  private redis: Redis
  private startTime: number

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    this.startTime = Date.now()
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDisk(),
    ])

    const [database, redis, memory, disk] = checks.map(result => 
      result.status === 'fulfilled' ? result.value : { status: 'fail' as const, message: 'Check failed' }
    )

    // Determine overall status
    const hasFailures = [database, redis, memory, disk].some(check => check.status === 'fail')
    const hasWarnings = [database, redis, memory, disk].some(check => check.status === 'warn')
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded'
    if (hasFailures) {
      overallStatus = 'unhealthy'
    } else if (hasWarnings) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database,
        redis,
        memory,
        disk,
      },
    }
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      await prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - startTime
      
      return {
        status: responseTime > 1000 ? 'warn' : 'pass',
        responseTime,
        message: responseTime > 1000 ? 'Database response time is slow' : 'Database is healthy',
      }
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      await this.redis.ping()
      const responseTime = Date.now() - startTime
      
      return {
        status: responseTime > 500 ? 'warn' : 'pass',
        responseTime,
        message: responseTime > 500 ? 'Redis response time is slow' : 'Redis is healthy',
      }
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: 'Redis connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    try {
      const memoryUsage = process.memoryUsage()
      const totalMemory = memoryUsage.heapTotal
      const usedMemory = memoryUsage.heapUsed
      const memoryUsagePercent = (usedMemory / totalMemory) * 100

      let status: 'pass' | 'warn' | 'fail'
      let message: string

      if (memoryUsagePercent > 90) {
        status = 'fail'
        message = 'Memory usage is critically high'
      } else if (memoryUsagePercent > 80) {
        status = 'warn'
        message = 'Memory usage is high'
      } else {
        status = 'pass'
        message = 'Memory usage is normal'
      }

      return {
        status,
        message,
        details: {
          usedMemory: Math.round(usedMemory / 1024 / 1024), // MB
          totalMemory: Math.round(totalMemory / 1024 / 1024), // MB
          usagePercent: Math.round(memoryUsagePercent),
        },
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'Memory check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async checkDisk(): Promise<HealthCheck> {
    try {
      // This is a simplified disk check - in production you might want to use a library like 'node-disk-info'
      const stats = await import('fs').then(fs => fs.promises.stat('.'))
      
      return {
        status: 'pass',
        message: 'Disk access is working',
        details: {
          accessible: true,
        },
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'Disk access failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async checkReadiness(): Promise<{ ready: boolean; checks: any }> {
    const health = await this.checkHealth()
    
    // Service is ready if database and redis are working
    const ready = health.checks.database.status !== 'fail' && 
                  health.checks.redis.status !== 'fail'

    return {
      ready,
      checks: {
        database: health.checks.database,
        redis: health.checks.redis,
      },
    }
  }

  async checkLiveness(): Promise<{ alive: boolean }> {
    // Simple liveness check - if we can respond, we're alive
    return { alive: true }
  }
}

export const healthChecker = new HealthChecker()