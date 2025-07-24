import winston from 'winston'
import { v4 as uuidv4 } from 'uuid'

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define colors for each level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(logColors)

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, userId, ...meta } = info
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...(correlationId && { correlationId }),
      ...(userId && { userId }),
      ...(Object.keys(meta).length > 0 && { meta }),
    }

    return JSON.stringify(logEntry)
  })
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, userId, ...meta } = info
    
    let logMessage = `${timestamp} [${level}]: ${message}`
    
    if (correlationId) {
      logMessage += ` [${correlationId}]`
    }
    
    if (userId) {
      logMessage += ` [user:${userId}]`
    }
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`
    }
    
    return logMessage
  })
)

// Create transports
const transports: winston.transport[] = []

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  )
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: structuredFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: structuredFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  )
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: structuredFormat,
  transports,
  exitOnError: false,
})

// Enhanced logger with correlation ID support
export class Logger {
  private correlationId?: string
  private userId?: string
  private context?: string

  constructor(correlationId?: string, userId?: string, context?: string) {
    this.correlationId = correlationId
    this.userId = userId
    this.context = context
  }

  private log(level: string, message: string, meta?: any) {
    const logData = {
      message: this.context ? `[${this.context}] ${message}` : message,
      ...(this.correlationId && { correlationId: this.correlationId }),
      ...(this.userId && { userId: this.userId }),
      ...(meta && { ...meta }),
    }

    logger.log(level, logData)
  }

  error(message: string, error?: Error | any, meta?: any) {
    this.log('error', message, {
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
      ...meta,
    })
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta)
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta)
  }

  http(message: string, meta?: any) {
    this.log('http', message, meta)
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta)
  }

  // Create a child logger with additional context
  child(context: string, additionalMeta?: any): Logger {
    const childLogger = new Logger(this.correlationId, this.userId, context)
    return childLogger
  }

  // Set correlation ID for request tracing
  setCorrelationId(correlationId: string): Logger {
    return new Logger(correlationId, this.userId, this.context)
  }

  // Set user ID for user-specific logging
  setUserId(userId: string): Logger {
    return new Logger(this.correlationId, userId, this.context)
  }
}

// Default logger instance
export const defaultLogger = new Logger()

// Utility functions
export function createLogger(correlationId?: string, userId?: string, context?: string): Logger {
  return new Logger(correlationId, userId, context)
}

export function generateCorrelationId(): string {
  return uuidv4()
}

// Middleware for Express/Next.js to add correlation ID
export function correlationMiddleware(req: any, res: any, next: any) {
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId()
  req.correlationId = correlationId
  res.setHeader('x-correlation-id', correlationId)
  
  // Add logger to request
  req.logger = new Logger(correlationId)
  
  next()
}

// Performance logging utility
export class PerformanceLogger {
  private startTime: number
  private logger: Logger
  private operation: string

  constructor(operation: string, logger: Logger = defaultLogger) {
    this.operation = operation
    this.logger = logger
    this.startTime = Date.now()
    
    this.logger.debug(`Starting operation: ${operation}`)
  }

  end(meta?: any) {
    const duration = Date.now() - this.startTime
    this.logger.info(`Operation completed: ${this.operation}`, {
      duration,
      ...meta,
    })
    return duration
  }

  endWithError(error: Error, meta?: any) {
    const duration = Date.now() - this.startTime
    this.logger.error(`Operation failed: ${this.operation}`, error, {
      duration,
      ...meta,
    })
    return duration
  }
}

// Audit logging for security events
export class AuditLogger {
  private logger: Logger

  constructor(logger: Logger = defaultLogger) {
    this.logger = logger
  }

  logSecurityEvent(event: string, userId?: string, details?: any) {
    this.logger.info(`Security event: ${event}`, {
      type: 'security',
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...details,
    })
  }

  logDataAccess(resource: string, action: string, userId?: string, details?: any) {
    this.logger.info(`Data access: ${action} on ${resource}`, {
      type: 'data_access',
      resource,
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...details,
    })
  }

  logBusinessEvent(event: string, userId?: string, details?: any) {
    this.logger.info(`Business event: ${event}`, {
      type: 'business',
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...details,
    })
  }
}

export const auditLogger = new AuditLogger()

// Error boundary logging
export function logUnhandledError(error: Error, context?: string) {
  defaultLogger.error('Unhandled error', error, {
    context,
    type: 'unhandled_error',
    timestamp: new Date().toISOString(),
  })
}

// Process error handlers
process.on('uncaughtException', (error) => {
  logUnhandledError(error, 'uncaughtException')
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  defaultLogger.error('Unhandled promise rejection', reason as Error, {
    type: 'unhandled_rejection',
    promise: promise.toString(),
    timestamp: new Date().toISOString(),
  })
})

export default logger