import { Server } from 'http'
import { prisma } from '@awcrm/database'

export interface ShutdownHandler {
  name: string
  handler: () => Promise<void>
  timeout?: number
}

export class GracefulShutdown {
  private handlers: ShutdownHandler[] = []
  private isShuttingDown = false
  private shutdownTimeout = 30000 // 30 seconds default

  constructor(timeout?: number) {
    if (timeout) {
      this.shutdownTimeout = timeout
    }

    // Register default signal handlers
    this.setupSignalHandlers()
  }

  addHandler(handler: ShutdownHandler): void {
    this.handlers.push(handler)
  }

  private setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2']
    
    signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`Received ${signal}, starting graceful shutdown...`)
        this.shutdown()
      })
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error)
      this.shutdown(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason)
      this.shutdown(1)
    })
  }

  async shutdown(exitCode = 0): Promise<void> {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress...')
      return
    }

    this.isShuttingDown = true
    console.log('Starting graceful shutdown...')

    // Set a timeout for the entire shutdown process
    const shutdownTimer = setTimeout(() => {
      console.error('Shutdown timeout reached, forcing exit')
      process.exit(1)
    }, this.shutdownTimeout)

    try {
      // Execute all shutdown handlers
      await Promise.all(
        this.handlers.map(async ({ name, handler, timeout = 5000 }) => {
          console.log(`Executing shutdown handler: ${name}`)
          
          try {
            await Promise.race([
              handler(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Handler ${name} timeout`)), timeout)
              )
            ])
            console.log(`Shutdown handler ${name} completed`)
          } catch (error) {
            console.error(`Shutdown handler ${name} failed:`, error)
          }
        })
      )

      console.log('Graceful shutdown completed')
      clearTimeout(shutdownTimer)
      process.exit(exitCode)
    } catch (error) {
      console.error('Error during shutdown:', error)
      clearTimeout(shutdownTimer)
      process.exit(1)
    }
  }
}

// Factory function to create a configured graceful shutdown instance
export function createGracefulShutdown(server?: Server): GracefulShutdown {
  const gracefulShutdown = new GracefulShutdown()

  // Add HTTP server shutdown handler
  if (server) {
    gracefulShutdown.addHandler({
      name: 'HTTP Server',
      handler: async () => {
        return new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error)
            } else {
              resolve()
            }
          })
        })
      },
      timeout: 10000,
    })
  }

  // Add database connection shutdown handler
  gracefulShutdown.addHandler({
    name: 'Database Connection',
    handler: async () => {
      await prisma.$disconnect()
    },
    timeout: 5000,
  })

  // Add Redis connection shutdown handler
  gracefulShutdown.addHandler({
    name: 'Redis Connection',
    handler: async () => {
      // If you have a Redis client, disconnect it here
      // await redis.disconnect()
    },
    timeout: 3000,
  })

  // Add cleanup for any background jobs or timers
  gracefulShutdown.addHandler({
    name: 'Background Jobs',
    handler: async () => {
      // Stop any background jobs, clear timers, etc.
      console.log('Stopping background jobs...')
    },
    timeout: 5000,
  })

  return gracefulShutdown
}

// Utility function for Next.js API routes to handle shutdown
export function withGracefulShutdown<T extends (...args: any[]) => any>(
  handler: T
): T {
  return ((...args: any[]) => {
    const gracefulShutdown = new GracefulShutdown()
    
    // Add cleanup for the current request
    gracefulShutdown.addHandler({
      name: 'Current Request',
      handler: async () => {
        // Any cleanup needed for the current request
      },
    })

    return handler(...args)
  }) as T
}