"use client"

import { toast as sonnerToast } from "sonner"
import { useCallback } from "react"

export type ToastVariant = "default" | "destructive" | "success" | "warning" | "info"

export interface ToastMessage {
  title: string
  description?: string
  variant?: ToastVariant
}

export function useToast() {
  const toast = useCallback((msg: ToastMessage) => {
    const { title, description, variant = "default" } = msg

    switch (variant) {
      case "destructive":
        sonnerToast.error(title, {
          description,
        })
        break
      case "success":
        sonnerToast.success(title, {
          description,
        })
        break
      case "warning":
        sonnerToast.warning(title, {
          description,
        })
        break
      case "info":
        sonnerToast.info(title, {
          description,
        })
        break
      default:
        sonnerToast(title, {
          description,
        })
    }
  }, [])

  return { 
    toast,
    // Export individual methods for convenience
    success: useCallback((title: string, description?: string) => {
      toast({ title, description, variant: "success" })
    }, [toast]),
    error: useCallback((title: string, description?: string) => {
      toast({ title, description, variant: "destructive" })
    }, [toast]),
    warning: useCallback((title: string, description?: string) => {
      toast({ title, description, variant: "warning" })
    }, [toast]),
    info: useCallback((title: string, description?: string) => {
      toast({ title, description, variant: "info" })
    }, [toast]),
  }
}