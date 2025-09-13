import { toast as sonnerToast } from "sonner"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  const toast = ({ title, description, variant = "default", duration, action }: ToastProps) => {
    const message = title || description || ""
    const fullMessage = title && description ? `${title}: ${description}` : message

    if (variant === "destructive") {
      return sonnerToast.error(fullMessage, {
        duration: duration || 5000,
        action: action ? {
          label: action.label,
          onClick: action.onClick
        } : undefined
      })
    }

    return sonnerToast.success(fullMessage, {
      duration: duration || 4000,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined
    })
  }

  return { toast }
}