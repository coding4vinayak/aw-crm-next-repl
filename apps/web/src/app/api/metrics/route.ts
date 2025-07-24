import { NextRequest, NextResponse } from 'next/server'
import { metricsRegistry } from '@awcrm/shared/monitoring/metrics'

export async function GET(req: NextRequest) {
  try {
    const metrics = await metricsRegistry.metrics()
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': metricsRegistry.contentType,
      },
    })
  } catch (error) {
    console.error('Failed to generate metrics:', error)
    
    return NextResponse.json({
      error: 'Failed to generate metrics',
    }, { status: 500 })
  }
}