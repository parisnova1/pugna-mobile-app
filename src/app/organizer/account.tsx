import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/auth/AuthContext'
import { apiFetch } from '@/lib/api'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import ErrorBoundary from '@/components/ErrorBoundary'
import Button from '@/components/Button'
import { TEXT, MUTED, BORDER, ACCENT, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

const NOTIFICATION_TYPES = ['event.live', 'bout.result', 'event.stream', 'nomination.accepted', 'nomination.injured'] as const

export default function OrganizerAccountScreen() {
  return <ErrorBoundary><OrganizerAccountInner /></ErrorBoundary>
}

function OrganizerAccountInner() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [categories, setCategories] = useState<Record<string, boolean>>({})
  const [quietStart, setQuietStart] = useState('')
  const [quietEnd, setQuietEnd] = useState('')

  useEffect(() => {
    apiFetch<{ categories: Record<string, boolean>; quietHoursStart: string | null; quietHoursEnd: string | null }>('/api/notifications/settings')
      .then(r => { setCategories(r.categories); setQuietStart(r.quietHoursStart ?? ''); setQuietEnd(r.quietHoursEnd ?? '') })
      .catch(() => {})
  }, [])

  const toggle = (type: string) => {
    const next = { ...categories, [type]: categories[type] === false ? true : false }
    setCategories(next)
    apiFetch('/api/notifications/settings', { method: 'PATCH', body: JSON.stringify({ categories: next, quietHoursStart: quietStart || null, quietHoursEnd: quietEnd || null }) }).catch(() => {})
  }

  const saveQuietHours = () => {
    apiFetch('/api/notifications/settings', { method: 'PATCH', body: JSON.stringify({ categories, quietHoursStart: quietStart || null, quietHoursEnd: quietEnd || null }) }).catch(() => {})
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{t('role.organizer')}</Text>

        <Text style={styles.label}>{t('notifications.fightAlerts')}</Text>
        <View style={{ gap: 8, marginBottom: 20 }}>
          {NOTIFICATION_TYPES.map(type => (
            <Pressable key={type} onPress={() => toggle(type)} style={styles.alertRow}>
              <Text style={styles.alertLabel}>{t(`notifications.type.${type}` as const)}</Text>
              <View style={[styles.toggle, categories[type] !== false && styles.toggleOn]}>
                <View style={[styles.toggleKnob, categories[type] !== false && styles.toggleKnobOn]} />
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{t('notifications.quietHours')}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
          <TextInput style={styles.timeInput} value={quietStart} onChangeText={setQuietStart} onBlur={saveQuietHours} placeholder="22:00" placeholderTextColor={MUTED} />
          <Text style={{ color: MUTED, alignSelf: 'center' }}>–</Text>
          <TextInput style={styles.timeInput} value={quietEnd} onChangeText={setQuietEnd} onBlur={saveQuietHours} placeholder="08:00" placeholderTextColor={MUTED} />
        </View>

        <Button label={t('header.logOut')} variant="outline" onPress={() => { logout(); router.replace('/') }} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  name: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, marginBottom: 4 },
  email: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginBottom: 4 },
  role: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, textTransform: 'uppercase', marginBottom: 28 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 10 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14 },
  alertLabel: { fontFamily: FONT_BODY, fontSize: 13, color: TEXT },
  toggle: { width: 40, height: 22, borderRadius: 11, backgroundColor: BORDER, padding: 2, justifyContent: 'center' },
  toggleOn: { backgroundColor: ACCENT },
  toggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  toggleKnobOn: { alignSelf: 'flex-end' },
  timeInput: { flex: 1, backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14, textAlign: 'center' },
})
