import { NextRequest, NextResponse } from 'next/server'
import { healthChecker } from '@/lib/health-check'

export async function GET(req: NextRequest) {
  try {
    const readiness = await healthChecker.checkReadiness()
    
    const statusCode = readiness.ready ? 200 : 503

    return NextResponse.json({
      ready: readiness.ready,
      timestamp: new Date().toISOString(),
      checks: readiness.checks,
    }, { status: statusCode })
  } catch (error) {
    console.error('Readiness check failed:', error)
    
    return NextResponse.json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 })
  }
}