import { createContext, useContext } from 'react'

export type ToastKind = 'error' | 'success'

export type ToastContextValue = {
  // Default kind is 'error' since that's by far the most common call —
  // surfacing the many previously-silent apiFetch failures across the app.
  showToast: (message: string, kind?: ToastKind) => void
}

// Split from Toast.tsx's ToastProvider component on purpose, same reasoning
// as the web app's identical split: a module mixing a component export with
// a hook export confuses Fast Refresh (no clean refresh boundary), causing
// spurious remounts on every edit to that file.
export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
