'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
  onRetry?: (attempt: number, error: Error) => void
  onMaxAttemptsReached?: (error: Error) => void
}

interface RetryState {
  isRetrying: boolean
  attempt: number
  lastError: Error | null
}

export function useRetry(options: RetryOptions = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
    onMaxAttemptsReached
  } = options

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null
  })

  const calculateDelay = useCallback((attempt: number) => {
    const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay)
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000
  }, [baseDelay, backoffFactor, maxDelay])

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> => {
    const opts = { ...options, ...customOptions }
    let lastError: Error

    for (let attempt = 0; attempt < (opts.maxAttempts || maxAttempts); attempt++) {
      try {
        setRetryState({
          isRetrying: attempt > 0,
          attempt,
          lastError: null
        })

        const result = await operation()
        
        // Reset state on success
        setRetryState({
          isRetrying: false,
          attempt: 0,
          lastError: null
        })
        
        return result
      } catch (error) {
        lastError = error as Error
        
        setRetryState({
          isRetrying: true,
          attempt: attempt + 1,
          lastError
        })

        // If this is the last attempt, don't wait
        if (attempt === (opts.maxAttempts || maxAttempts) - 1) {
          break
        }

        // Call retry callback
        if (opts.onRetry || onRetry) {
          (opts.onRetry || onRetry)?.(attempt + 1, lastError)
        }

        // Wait before retrying
        const delay = calculateDelay(attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // Max attempts reached
    setRetryState({
      isRetrying: false,
      attempt: maxAttempts,
      lastError: lastError!
    })

    if (opts.onMaxAttemptsReached || onMaxAttemptsReached) {
      (opts.onMaxAttemptsReached || onMaxAttemptsReached)?.(lastError!)
    }

    throw lastError!
  }, [maxAttempts, calculateDelay, onRetry, onMaxAttemptsReached, options])

  const reset = useCallback(() => {
    setRetryState({
      isRetrying: false,
      attempt: 0,
      lastError: null
    })
  }, [])

  return {
    executeWithRetry,
    reset,
    ...retryState
  }
}

// Specialized hooks for common use cases
export function useApiRetry() {
  return useRetry({
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt, error) => {
      toast.loading(`Retrying... (${attempt}/3)`, {
        id: 'api-retry'
      })
    },
    onMaxAttemptsReached: (error) => {
      toast.error('Request failed after multiple attempts', {
        id: 'api-retry'
      })
    }
  })
}

export function useNetworkRetry() {
  return useRetry({
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    onRetry: (attempt, error) => {
      if (error.message.includes('fetch')) {
        toast.loading(`Connection lost. Retrying... (${attempt}/5)`, {
          id: 'network-retry'
        })
      }
    },
    onMaxAttemptsReached: (error) => {
      toast.error('Unable to connect. Please check your internet connection.', {
        id: 'network-retry'
      })
    }
  })
}