import { useCallback, useRef, useState, type ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { ToastContext, type ToastKind } from '@/lib/toastContext'
import { CARD, LIVE_RED, TEXT, FONT_BODY_MEDIUM } from '@/theme'

type ToastItem = { id: number; message: string; kind: ToastKind }

const AUTO_DISMISS_MS = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, kind: ToastKind = 'error') => {
    const id = nextId.current++
    setToasts(prev => [...prev, { id, message, kind }])
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View pointerEvents="box-none" style={styles.container}>
        {toasts.map(t => (
          <Pressable key={t.id} onPress={() => dismiss(t.id)} style={styles.toast}>
            <Text style={styles.text}>{t.message}</Text>
          </Pressable>
        ))}
      </View>
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', left: 16, right: 16, bottom: 32,
    gap: 10, alignItems: 'center',
  },
  toast: {
    maxWidth: 420, width: '100%', backgroundColor: CARD, borderLeftWidth: 4, borderLeftColor: LIVE_RED,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  text: { fontFamily: FONT_BODY_MEDIUM, fontSize: 13, color: TEXT },
})
