import { NextRequest, NextResponse } from 'next/server'
import { healthChecker } from '@/lib/health-check'

export async function GET(req: NextRequest) {
  try {
    const health = await healthChecker.checkHealth()
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 })
  }
}