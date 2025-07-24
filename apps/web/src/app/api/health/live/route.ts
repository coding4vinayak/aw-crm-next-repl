import { NextRequest, NextResponse } from 'next/server'
import { healthChecker } from '@/lib/health-check'

export async function GET(req: NextRequest) {
  try {
    const liveness = await healthChecker.checkLiveness()
    
    return NextResponse.json({
      alive: liveness.alive,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }, { status: 200 })
  } catch (error) {
    console.error('Liveness check failed:', error)
    
    return NextResponse.json({
      alive: false,
      timestamp: new Date().toISOString(),
      error: 'Liveness check failed',
    }, { status: 503 })
  }
}