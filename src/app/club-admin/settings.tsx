import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/auth/AuthContext'
import { apiFetch } from '@/lib/api'
import { useLanguage, type Lang } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ACCENT, ON_ACCENT, TEXT, BORDER, MUTED, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
]

const NOTIFICATION_TYPES = ['event.live', 'bout.result', 'event.stream', 'nomination.accepted', 'nomination.injured'] as const

export default function ClubSettingsScreen() {
  return <ErrorBoundary><ClubSettingsInner /></ErrorBoundary>
}

function ClubSettingsInner() {
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useLanguage()
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
        <Text style={styles.role}>{t('role.club')}</Text>

        <Text style={styles.label}>{t('club.settings.language')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {LANGS.map(l => (
            <Pressable key={l.code} onPress={() => setLang(l.code)} style={[styles.pill, lang === l.code && styles.pillActive]}>
              <Text style={[styles.pillLabel, lang === l.code && styles.pillLabelActive]}>{l.label}</Text>
            </Pressable>
          ))}
        </View>

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
  pill: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 16 },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  pillLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  pillLabelActive: { color: ON_ACCENT },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14 },
  alertLabel: { fontFamily: FONT_BODY, fontSize: 13, color: TEXT },
  toggle: { width: 40, height: 22, borderRadius: 11, backgroundColor: BORDER, padding: 2, justifyContent: 'center' },
  toggleOn: { backgroundColor: ACCENT },
  toggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: TEXT },
  // ACCENT (the "on" track fill) is white, so the knob needs to flip to a
  // dark fill in that state or it disappears against its own track.
  toggleKnobOn: { alignSelf: 'flex-end', backgroundColor: ON_ACCENT },
  timeInput: { flex: 1, backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14, textAlign: 'center' },
})
