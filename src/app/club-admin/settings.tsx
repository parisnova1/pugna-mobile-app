import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage, type Lang } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ACCENT, ON_ACCENT, TEXT, BORDER, MUTED, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
]

export default function ClubSettingsScreen() {
  return <ErrorBoundary><ClubSettingsInner /></ErrorBoundary>
}

function ClubSettingsInner() {
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useLanguage()

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
})
