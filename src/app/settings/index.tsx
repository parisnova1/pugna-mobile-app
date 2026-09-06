import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import { Icon } from '@/components/icons/Icon'
import { TEXT, MUTED, ON_ACCENT, CARD, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY_MEDIUM } from '@/theme'

// Deliberately small — just what's asked for (language, legal, log out),
// not the full settings mockup (notifications toggle, delete account,
// role/club rows). Reachable from the gear icon on /you.
export default function SettingsScreen() {
  const { t, lang, setLang } = useLanguage()
  const { logout } = useAuth()

  return (
    <Screen style={{ paddingHorizontal: 20 }}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <View style={styles.langToggle}>
          <Pressable onPress={() => setLang('de')} style={[styles.langSeg, lang === 'de' && styles.langSegActive]}>
            <Text style={[styles.langLabel, lang === 'de' && styles.langLabelActive]}>DE</Text>
          </Pressable>
          <Pressable onPress={() => setLang('en')} style={[styles.langSeg, lang === 'en' && styles.langSegActive]}>
            <Text style={[styles.langLabel, lang === 'en' && styles.langLabelActive]}>EN</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.row} onPress={() => router.push('/settings/legal')}>
          <Text style={styles.rowLabel}>{t('settings.legal')}</Text>
          <Icon name="chevronForward" size={18} color={MUTED} />
        </Pressable>
      </View>

      <Button
        label={t('header.logOut')}
        variant="outline"
        onPress={() => { logout(); router.replace('/') }}
        style={styles.logout}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 22, color: TEXT },
  section: { marginTop: 24 },
  sectionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.2, color: MUTED, textTransform: 'uppercase', marginBottom: 10 },
  langToggle: { flexDirection: 'row', padding: 4, borderRadius: 13, backgroundColor: CARD },
  langSeg: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  langSegActive: { backgroundColor: TEXT },
  langLabel: { fontFamily: FONT_BODY_MEDIUM, fontSize: 14.5, color: MUTED },
  langLabelActive: { fontFamily: FONT_DISPLAY, color: ON_ACCENT },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: CARD, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16 },
  rowLabel: { fontFamily: FONT_BODY_MEDIUM, fontSize: 15, color: TEXT },
  logout: { marginTop: 40 },
})
