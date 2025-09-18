"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { TrashIcon } from "@radix-ui/react-icons"

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  itemName?: string
  isLoading?: boolean
  destructiveAction?: boolean
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  destructiveAction = true
}: DeleteConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  const defaultTitle = itemName 
    ? `Delete ${itemName}?` 
    : "Are you sure?"
    
  const defaultDescription = itemName
    ? `This will permanently delete "${itemName}". This action cannot be undone.`
    : "This action cannot be undone. This will permanently delete the item and remove it from our servers."

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <TrashIcon className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left">
                {title || defaultTitle}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left mt-2">
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={destructiveAction ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </div>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook for easier usage
export function useDeleteConfirmation() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [pendingAction, setPendingAction] = React.useState<(() => void | Promise<void>) | null>(null)

  const confirm = React.useCallback((action: () => void | Promise<void>) => {
    setPendingAction(() => action)
    setIsOpen(true)
  }, [])

  const handleConfirm = React.useCallback(async () => {
    if (pendingAction) {
      setIsLoading(true)
      try {
        await pendingAction()
      } finally {
        setIsLoading(false)
        setPendingAction(null)
      }
    }
  }, [pendingAction])

  const handleCancel = React.useCallback(() => {
    setIsOpen(false)
    setPendingAction(null)
    setIsLoading(false)
  }, [])

  return {
    isOpen,
    isLoading,
    confirm,
    handleConfirm,
    handleCancel,
    setIsOpen
  }
}