'use client'

import React from 'react'
import { toast } from 'sonner'

interface ApiOptions extends RequestInit {
  retries?: number
  retryDelay?: number
  timeout?: number
  showErrorToast?: boolean
  showRetryToast?: boolean
}

interface ApiError extends Error {
  status?: number
  statusText?: string
  data?: any
}

class ApiClient {
  private baseUrl: string
  private defaultOptions: ApiOptions

  constructor(baseUrl = '', defaultOptions: ApiOptions = {}) {
    this.baseUrl = baseUrl
    this.defaultOptions = {
      retries: 3,
      retryDelay: 1000,
      timeout: 10000,
      showErrorToast: true,
      showRetryToast: true,
      ...defaultOptions
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt)
    const jitter = Math.random() * 1000
    return Math.min(exponentialDelay + jitter, 30000) // Max 30 seconds
  }

  private isRetryableError(error: ApiError): boolean {
    if (!error.status) return true // Network errors are retryable
    
    // Retry on server errors and rate limiting
    return error.status >= 500 || error.status === 429 || error.status === 408
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'))
      }, timeout)
    })
  }

  async request<T = any>(
    endpoint: string, 
    options: ApiOptions = {}
  ): Promise<T> {
    const mergedOptions = { ...this.defaultOptions, ...options }
    const { 
      retries = 3, 
      retryDelay = 1000, 
      timeout = 10000,
      showErrorToast = true,
      showRetryToast = true,
      ...fetchOptions 
    } = mergedOptions

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
    let lastError: ApiError = new Error('Unknown error') as ApiError

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const fetchPromise = fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        })

        const response = await Promise.race([
          fetchPromise,
          this.createTimeoutPromise(timeout)
        ])

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error: ApiError = new Error(`HTTP ${response.status}: ${response.statusText}`)
          error.status = response.status
          error.statusText = response.statusText
          
          try {
            error.data = await response.json()
          } catch {
            // Response might not be JSON
          }
          
          throw error
        }

        const data = await response.json()
        
        // Clear any retry toasts on success
        if (attempt > 0) {
          toast.dismiss('api-retry')
        }
        
        return data
      } catch (error) {
        lastError = error as ApiError
        
        // Don't retry if it's the last attempt or error is not retryable
        if (attempt === retries || !this.isRetryableError(lastError)) {
          break
        }

        // Show retry toast
        if (showRetryToast && attempt < retries) {
          toast.loading(`Retrying request... (${attempt + 1}/${retries})`, {
            id: 'api-retry'
          })
        }

        // Wait before retrying
        const delay = this.calculateRetryDelay(attempt, retryDelay)
        await this.delay(delay)
      }
    }

    // All retries failed
    toast.dismiss('api-retry')
    
    if (showErrorToast) {
      const errorMessage = this.getErrorMessage(lastError)
      toast.error(errorMessage, {
        action: {
          label: 'Retry',
          onClick: (event: React.MouseEvent<HTMLButtonElement>) => this.request(endpoint, options)
        }
      })
    }

    throw lastError
  }

  private getErrorMessage(error: ApiError): string {
    if (error.message === 'Request timeout') {
      return 'Request timed out. Please check your connection.'
    }
    
    if (!error.status) {
      return 'Network error. Please check your internet connection.'
    }

    switch (error.status) {
      case 400:
        return error.data?.message || 'Invalid request'
      case 401:
        return 'Authentication required. Please log in again.'
      case 403:
        return 'Access denied'
      case 404:
        return 'Resource not found'
      case 429:
        return 'Too many requests. Please wait a moment.'
      case 500:
        return 'Server error. Please try again later.'
      case 503:
        return 'Service temporarily unavailable'
      default:
        return error.data?.message || `Request failed (${error.status})`
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, options?: Omit<ApiOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any, options?: Omit<ApiOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Create default API client instance
export const apiClient = new ApiClient()

// Export class for custom instances
export { ApiClient }

// Utility function for one-off requests with retry
export async function fetchWithRetry<T = any>(
  url: string, 
  options: ApiOptions = {}
): Promise<T> {
  const client = new ApiClient()
  return client.request<T>(url, options)
}