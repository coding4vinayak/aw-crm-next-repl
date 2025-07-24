import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'

// Initialize OpenTelemetry SDK
const serviceName = process.env.SERVICE_NAME || 'awcrm-api'
const serviceVersion = process.env.SERVICE_VERSION || '1.0.0'
const environment = process.env.NODE_ENV || 'development'

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
})

// Configure exporters
const exporters = []

// Add Jaeger exporter for production
if (process.env.JAEGER_ENDPOINT) {
  exporters.push(
    new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT,
    })
  )
}

// Add console exporter for development
if (environment === 'development') {
  exporters.push(new ConsoleSpanExporter())
}

// Initialize SDK
const sdk = new NodeSDK({
  resource,
  traceExporter: exporters.length > 0 ? exporters[0] : new ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
})

// Start tracing
if (process.env.ENABLE_TRACING !== 'false') {
  sdk.start()
  console.log('OpenTelemetry tracing initialized')
}

// Get tracer instance
const tracer = trace.getTracer(serviceName, serviceVersion)

// Utility class for manual tracing
export class TracingService {
  static createSpan(name: string, kind: SpanKind = SpanKind.INTERNAL) {
    return tracer.startSpan(name, { kind })
  }

  static async withSpan<T>(
    name: string,
    operation: (span: any) => Promise<T>,
    kind: SpanKind = SpanKind.INTERNAL
  ): Promise<T> {
    const span = tracer.startSpan(name, { kind })
    
    try {
      const result = await context.with(trace.setSpan(context.active(), span), () =>
        operation(span)
      )
      
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  }

  static addSpanAttributes(attributes: Record<string, string | number | boolean>) {
    const span = trace.getActiveSpan()
    if (span) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value)
      })
    }
  }

  static addSpanEvent(name: string, attributes?: Record<string, any>) {
    const span = trace.getActiveSpan()
    if (span) {
      span.addEvent(name, attributes)
    }
  }

  static recordException(error: Error) {
    const span = trace.getActiveSpan()
    if (span) {
      span.recordException(error)
    }
  }

  static setSpanStatus(code: SpanStatusCode, message?: string) {
    const span = trace.getActiveSpan()
    if (span) {
      span.setStatus({ code, message })
    }
  }
}

// Decorator for automatic tracing
export function traced(operationName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const spanName = operationName || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      return TracingService.withSpan(
        spanName,
        async (span) => {
          // Add method information to span
          span.setAttributes({
            'method.class': target.constructor.name,
            'method.name': propertyKey,
            'method.args.count': args.length,
          })

          return originalMethod.apply(this, args)
        }
      )
    }

    return descriptor
  }
}

// Database operation tracing
export class DatabaseTracing {
  static async traceQuery<T>(
    operation: string,
    table: string,
    query: () => Promise<T>
  ): Promise<T> {
    return TracingService.withSpan(
      `db.${operation}`,
      async (span) => {
        span.setAttributes({
          'db.operation': operation,
          'db.table': table,
          'db.system': 'postgresql',
        })

        const startTime = Date.now()
        try {
          const result = await query()
          
          span.setAttributes({
            'db.duration': Date.now() - startTime,
            'db.success': true,
          })
          
          return result
        } catch (error) {
          span.setAttributes({
            'db.duration': Date.now() - startTime,
            'db.success': false,
            'db.error': error instanceof Error ? error.message : 'Unknown error',
          })
          
          throw error
        }
      },
      SpanKind.CLIENT
    )
  }
}

// HTTP request tracing
export class HttpTracing {
  static async traceRequest<T>(
    method: string,
    url: string,
    request: () => Promise<T>
  ): Promise<T> {
    return TracingService.withSpan(
      `http.${method.toLowerCase()}`,
      async (span) => {
        span.setAttributes({
          'http.method': method,
          'http.url': url,
          'http.scheme': new URL(url).protocol.slice(0, -1),
          'http.host': new URL(url).host,
        })

        const startTime = Date.now()
        try {
          const result = await request()
          
          span.setAttributes({
            'http.duration': Date.now() - startTime,
            'http.status_code': 200, // Assume success if no error
          })
          
          return result
        } catch (error) {
          span.setAttributes({
            'http.duration': Date.now() - startTime,
            'http.status_code': 500, // Assume server error
          })
          
          throw error
        }
      },
      SpanKind.CLIENT
    )
  }
}

// Business operation tracing
export class BusinessTracing {
  static async traceBusinessOperation<T>(
    operation: string,
    entityType: string,
    entityId: string,
    userId: string,
    businessLogic: () => Promise<T>
  ): Promise<T> {
    return TracingService.withSpan(
      `business.${operation}`,
      async (span) => {
        span.setAttributes({
          'business.operation': operation,
          'business.entity.type': entityType,
          'business.entity.id': entityId,
          'business.user.id': userId,
        })

        return businessLogic()
      }
    )
  }
}

// Middleware for Next.js API routes
export function tracingMiddleware(handler: any) {
  return async (req: any, res: any) => {
    const method = req.method || 'GET'
    const route = req.url || '/'
    
    return TracingService.withSpan(
      `http.${method.toLowerCase()} ${route}`,
      async (span) => {
        span.setAttributes({
          'http.method': method,
          'http.route': route,
          'http.user_agent': req.headers['user-agent'] || '',
          'http.remote_addr': req.ip || req.connection.remoteAddress || '',
        })

        // Add correlation ID if available
        if (req.correlationId) {
          span.setAttribute('correlation.id', req.correlationId)
        }

        // Add user ID if available
        if (req.user?.id) {
          span.setAttribute('user.id', req.user.id)
        }

        try {
          const result = await handler(req, res)
          
          span.setAttributes({
            'http.status_code': res.statusCode || 200,
          })
          
          return result
        } catch (error) {
          span.setAttributes({
            'http.status_code': 500,
          })
          
          throw error
        }
      },
      SpanKind.SERVER
    )
  }
}

// Export tracer for advanced usage
export { tracer }

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry terminated'))
    .catch((error) => console.log('Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0))
})