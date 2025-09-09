import { toast } from './toast'

export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  onRetry?: (attempt: number, error: any) => void
  shouldRetry?: (error: any) => boolean
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: any
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry,
    shouldRetry = (error) => {
      // Default: retry on network errors, 5xx errors, and timeouts
      if (error?.name === 'NetworkError') return true
      if (error?.status >= 500) return true
      if (error?.code === 'TIMEOUT') return true
      if (error?.message?.includes('fetch')) return true
      return false
    }
  } = options

  let lastError: any
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry if we've reached max attempts
      if (attempt === maxAttempts) {
        break
      }
      
      // Don't retry if the error shouldn't be retried
      if (!shouldRetry(error)) {
        throw error
      }
      
      // Call retry callback
      onRetry?.(attempt, error)
      
      // Calculate delay
      const currentDelay = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * currentDelay
      const finalDelay = currentDelay + jitter
      
      await new Promise(resolve => setTimeout(resolve, finalDelay))
    }
  }
  
  throw new RetryError(
    `Failed after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`,
    maxAttempts,
    lastError
  )
}

/**
 * Create a retryable version of an async function
 */
export function createRetryable<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) {
  return async (...args: T): Promise<R> => {
    return withRetry(() => fn(...args), options)
  }
}

/**
 * Retry with user-friendly toast notifications
 */
export async function withRetryToast<T>(
  fn: () => Promise<T>,
  {
    loadingMessage = 'Processing...',
    successMessage = 'Success!',
    errorMessage = 'Operation failed',
    retryMessage = 'Retrying...',
    ...retryOptions
  }: RetryOptions & {
    loadingMessage?: string
    successMessage?: string | ((result: T) => string)
    errorMessage?: string | ((error: any) => string)
    retryMessage?: string
  } = {}
): Promise<T> {
  let toastId: string | number | undefined

  try {
    // Show loading toast
    toastId = toast.loading(loadingMessage)

    const result = await withRetry(fn, {
      ...retryOptions,
      onRetry: (attempt, error) => {
        // Update toast to show retry
        toast.dismiss(toastId)
        toastId = toast.loading(`${retryMessage} (${attempt}/${retryOptions.maxAttempts || 3})`)
        retryOptions.onRetry?.(attempt, error)
      }
    })

    // Show success toast
    toast.dismiss(toastId)
    const finalSuccessMessage = typeof successMessage === 'function' 
      ? successMessage(result) 
      : successMessage
    toast.success(finalSuccessMessage)

    return result
  } catch (error) {
    // Show error toast with retry option
    toast.dismiss(toastId)
    
    const finalErrorMessage = typeof errorMessage === 'function' 
      ? errorMessage(error) 
      : errorMessage

    if (error instanceof RetryError) {
      toast.error(`${finalErrorMessage} after ${error.attempts} attempts`, {
        action: {
          label: 'Try Again',
          onClick: () => withRetryToast(fn, { loadingMessage, successMessage, errorMessage, retryMessage, ...retryOptions })
        }
      })
    } else {
      toast.error(finalErrorMessage)
    }
    
    throw error
  }
}

/**
 * Network-aware retry - adjusts behavior based on connection
 */
export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  
  if (!isOnline) {
    toast.offline('You are offline. Please check your connection.')
    throw new Error('Network unavailable')
  }

  return withRetry(fn, {
    maxAttempts: 3,
    delay: 1000,
    shouldRetry: (error) => {
      // More aggressive retry for network issues
      if (!navigator.onLine) {
        toast.offline()
        return false // Don't retry if offline
      }
      
      // Default network error retry logic
      if (error?.name === 'NetworkError') return true
      if (error?.status >= 500) return true
      if (error?.code === 'TIMEOUT') return true
      if (error?.message?.includes('fetch')) return true
      if (error?.message?.includes('network')) return true
      
      return false
    },
    onRetry: (attempt, error) => {
      console.warn(`Network retry attempt ${attempt}:`, error)
    },
    ...options
  })
}

/**
 * Utility for API calls with automatic retry
 */
export const apiWithRetry = {
  get: <T>(url: string, options?: RequestInit & { retryOptions?: RetryOptions }) => {
    const { retryOptions, ...fetchOptions } = options || {}
    return withNetworkRetry(
      () => fetch(url, { ...fetchOptions, method: 'GET' }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        return res.json() as Promise<T>
      }),
      retryOptions
    )
  },

  post: <T>(url: string, data?: any, options?: RequestInit & { retryOptions?: RetryOptions }) => {
    const { retryOptions, ...fetchOptions } = options || {}
    return withNetworkRetry(
      () => fetch(url, {
        ...fetchOptions,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers
        },
        body: data ? JSON.stringify(data) : undefined
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        return res.json() as Promise<T>
      }),
      retryOptions
    )
  },

  put: <T>(url: string, data?: any, options?: RequestInit & { retryOptions?: RetryOptions }) => {
    const { retryOptions, ...fetchOptions } = options || {}
    return withNetworkRetry(
      () => fetch(url, {
        ...fetchOptions,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers
        },
        body: data ? JSON.stringify(data) : undefined
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        return res.json() as Promise<T>
      }),
      retryOptions
    )
  },

  delete: <T>(url: string, options?: RequestInit & { retryOptions?: RetryOptions }) => {
    const { retryOptions, ...fetchOptions } = options || {}
    return withNetworkRetry(
      () => fetch(url, { ...fetchOptions, method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        return res.json() as Promise<T>
      }),
      retryOptions
    )
  }
}