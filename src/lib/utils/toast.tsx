import { toast as sonnerToast } from "sonner"
import { CheckCircle, XCircle, AlertCircle, Info, Loader2, Wifi, WifiOff } from "lucide-react"

interface ToastOptions {
  duration?: number
  action?: {
    label: string
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  }
  cancel?: {
    label: string
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  }
  onDismiss?: () => void
  onAutoClose?: () => void
}

// Enhanced toast utility with consistent styling and icons
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      icon: <CheckCircle className="h-4 w-4" />,
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      icon: <XCircle className="h-4 w-4" />,
      duration: options?.duration || 6000, // Longer duration for errors
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      icon: <AlertCircle className="h-4 w-4" />,
      duration: options?.duration || 5000,
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      icon: <Info className="h-4 w-4" />,
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  },

  loading: (message: string, options?: Omit<ToastOptions, 'duration'>) => {
    return sonnerToast.loading(message, {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
    })
  },

  // Network-specific toasts
  offline: (message: string = "You're currently offline", options?: ToastOptions) => {
    return sonnerToast.error(message, {
      icon: <WifiOff className="h-4 w-4" />,
      duration: options?.duration || 0, // Persistent until dismissed
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
    })
  },

  online: (message: string = "Connection restored", options?: ToastOptions) => {
    return sonnerToast.success(message, {
      icon: <Wifi className="h-4 w-4" />,
      duration: options?.duration || 3000,
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  },

  // Promise-based toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: loading,
      success: (data) => typeof success === 'function' ? success(data) : success,
      error: (err) => typeof error === 'function' ? error(err) : error,
    })
  },

  // Undo functionality
  undo: (message: string, onUndo: () => void, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      icon: <CheckCircle className="h-4 w-4" />,
      duration: options?.duration || 5000,
      action: {
        label: "Undo",
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => onUndo(),
      },
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  },

  // Dismiss all toasts
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId)
  },

  // Custom toast with full control
  custom: (jsx: (id: string | number) => React.ReactElement, options?: ToastOptions) => {
    return sonnerToast.custom(jsx, {
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  },
}

// Specialized toast functions for common use cases
export const toastHelpers = {
  // Food logging specific
  foodAdded: (foodName: string, onUndo?: () => void) => {
    if (onUndo) {
      return toast.undo(`Added ${foodName} to diary`, onUndo)
    }
    return toast.success(`Added ${foodName} to diary`)
  },

  foodRemoved: (foodName: string, onUndo?: () => void) => {
    if (onUndo) {
      return toast.undo(`Removed ${foodName} from diary`, onUndo)
    }
    return toast.success(`Removed ${foodName} from diary`)
  },

  favoriteAdded: (foodName: string) => {
    return toast.success(`Added ${foodName} to favorites`, {
      action: {
        label: "View Favorites",
        onClick: () => window.location.href = "/dashboard/favorites"
      }
    })
  },

  favoriteRemoved: (foodName: string) => {
    return toast.success(`Removed ${foodName} from favorites`)
  },

  // API error handling
  apiError: (error: any, retry?: () => void) => {
    const message = error?.message || "Something went wrong"
    
    if (retry) {
      return toast.error(message, {
        action: {
          label: "Retry",
          onClick: retry
        }
      })
    }
    
    return toast.error(message)
  },

  // Network errors
  networkError: (retry?: () => void) => {
    return toast.error("Network error occurred", {
      action: retry ? {
        label: "Retry",
        onClick: retry
      } : undefined
    })
  },

  // Form validation
  validationError: (message: string) => {
    return toast.warning(message, {
      duration: 5000
    })
  },

  // Success with action
  successWithAction: (message: string, actionLabel: string, actionFn: () => void) => {
    return toast.success(message, {
      action: {
        label: actionLabel,
        onClick: actionFn
      }
    })
  },
}