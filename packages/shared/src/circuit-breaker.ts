export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
  expectedErrors?: string[]
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState
  failureCount: number
  successCount: number
  totalRequests: number
  lastFailureTime?: Date
  nextAttemptTime?: Date
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failureCount = 0
  private successCount = 0
  private totalRequests = 0
  private lastFailureTime?: Date
  private nextAttemptTime?: Date
  private readonly options: CircuitBreakerOptions

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      expectedErrors: [],
      ...options,
    }
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error)
      throw error
    }
  }

  private onSuccess(): void {
    this.successCount++
    this.totalRequests++
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.reset()
    }
  }

  private onFailure(error: any): void {
    this.totalRequests++
    
    // Check if this is an expected error that shouldn't trigger circuit breaker
    if (this.isExpectedError(error)) {
      return
    }

    this.failureCount++
    this.lastFailureTime = new Date()

    if (this.failureCount >= this.options.failureThreshold) {
      this.trip()
    }
  }

  private isExpectedError(error: any): boolean {
    if (!this.options.expectedErrors || this.options.expectedErrors.length === 0) {
      return false
    }

    const errorMessage = error?.message || error?.toString() || ''
    return this.options.expectedErrors.some(expectedError => 
      errorMessage.includes(expectedError)
    )
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return false
    }
    return Date.now() >= this.nextAttemptTime.getTime()
  }

  private trip(): void {
    this.state = CircuitBreakerState.OPEN
    this.nextAttemptTime = new Date(Date.now() + this.options.recoveryTimeout)
  }

  private reset(): void {
    this.state = CircuitBreakerState.CLOSED
    this.failureCount = 0
    this.nextAttemptTime = undefined
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    }
  }

  // Manual controls for testing and emergency situations
  forceOpen(): void {
    this.state = CircuitBreakerState.OPEN
    this.nextAttemptTime = new Date(Date.now() + this.options.recoveryTimeout)
  }

  forceClose(): void {
    this.reset()
  }

  forceClosed(): void {
    this.state = CircuitBreakerState.CLOSED
  }
}

// Factory for creating circuit breakers with common configurations
export class CircuitBreakerFactory {
  private static breakers = new Map<string, CircuitBreaker>()

  static getOrCreate(name: string, options: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(options))
    }
    return this.breakers.get(name)!
  }

  static get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name)
  }

  static getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {}
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats()
    })
    return stats
  }

  static reset(name?: string): void {
    if (name) {
      const breaker = this.breakers.get(name)
      if (breaker) {
        breaker.forceClose()
      }
    } else {
      this.breakers.forEach(breaker => breaker.forceClose())
    }
  }
}

// Decorator for automatic circuit breaker integration
export function withCircuitBreaker(
  name: string,
  options: CircuitBreakerOptions
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const circuitBreaker = CircuitBreakerFactory.getOrCreate(name, options)

    descriptor.value = async function (...args: any[]) {
      return circuitBreaker.execute(() => originalMethod.apply(this, args))
    }

    return descriptor
  }
}