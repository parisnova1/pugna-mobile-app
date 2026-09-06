import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import { TEXT, MUTED, ACCENT, ON_ACCENT, SURFACE, SURFACE_BORDER, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY, FONT_BODY_MEDIUM } from '@/theme'

// One screen — signal tile, headline, primary guest path, secondary account
// creation, tertiary login. Explore-first: a guest goes straight to the real
// event catalog, no account and no onboarding steps required.
export default function WelcomeScreen() {
  const { t, lang, setLang } = useLanguage()

  return (
    <Screen>
      <View style={styles.langRow}>
        <View style={styles.langToggle}>
          <Pressable onPress={() => setLang('de')} style={[styles.langSeg, lang === 'de' && styles.langSegActive]}>
            <Text style={[styles.langLabel, lang === 'de' && styles.langLabelActive]}>DE</Text>
          </Pressable>
          <Pressable onPress={() => setLang('en')} style={[styles.langSeg, lang === 'en' && styles.langSegActive]}>
            <Text style={[styles.langLabel, lang === 'en' && styles.langLabelActive]}>EN</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.tile}>
          <Text style={styles.tileLetter}>P</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.headline}>{t('onboarding.welcomeHeadline')}</Text>
          <Text style={styles.sub}>{t('onboarding.welcomeSub')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button label={t('onboarding.exploreEvents')} uppercase={false} onPress={() => router.push('/events')} />
        <Pressable onPress={() => router.push('/(onboarding)/persona')} style={styles.secondaryButton} hitSlop={4}>
          <Text style={styles.secondaryLabel}>{t('login.createAccount')}</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/(auth)/account', params: { mode: 'login' } })} style={styles.loginLink} hitSlop={8}>
          <Text style={styles.loginLinkText}>{t('login.logIn')}</Text>
        </Pressable>

        <View style={styles.legalRow}>
          {/* Cast: these 3 routes are brand new and expo-router's typed-route
              union regenerates from a running dev server, not from tsc alone. */}
          <Pressable onPress={() => router.push('/impressum' as never)} hitSlop={6}><Text style={styles.legalLink}>Impressum</Text></Pressable>
          <Pressable onPress={() => router.push('/datenschutz' as never)} hitSlop={6}><Text style={styles.legalLink}>Datenschutz</Text></Pressable>
          <Pressable onPress={() => router.push('/nutzung' as never)} hitSlop={6}><Text style={styles.legalLink}>Nutzungsbedingungen</Text></Pressable>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 22, paddingTop: 10 },
  langToggle: { flexDirection: 'row', padding: 3, borderRadius: 9999, backgroundColor: SURFACE, borderWidth: 1, borderColor: SURFACE_BORDER },
  langSeg: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 9999 },
  langSegActive: { backgroundColor: TEXT },
  langLabel: { fontFamily: FONT_BODY_MEDIUM, fontSize: 11.5, color: MUTED },
  langLabelActive: { fontFamily: FONT_DISPLAY, color: ON_ACCENT },
  hero: { flex: 1, justifyContent: 'center', paddingHorizontal: 26, gap: 26 },
  tile: { width: 72, height: 72, borderRadius: 20, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  tileLetter: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 40, color: ON_ACCENT },
  copy: { gap: 12 },
  headline: { fontFamily: FONT_DISPLAY, fontSize: 44, lineHeight: 46, letterSpacing: -0.5, color: TEXT },
  sub: { fontFamily: FONT_BODY, fontSize: 17, color: MUTED },
  footer: { paddingHorizontal: 20, paddingBottom: 44, gap: 10 },
  secondaryButton: { height: 56, borderRadius: 14, backgroundColor: SURFACE, borderWidth: 1, borderColor: SURFACE_BORDER, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { fontFamily: FONT_BODY_MEDIUM, fontSize: 16.5, color: TEXT },
  loginLink: { height: 44, alignItems: 'center', justifyContent: 'center' },
  loginLinkText: { fontFamily: FONT_BODY_MEDIUM, fontSize: 15, color: MUTED },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, paddingBottom: 4 },
  legalLink: { fontFamily: FONT_BODY, fontSize: 11.5, color: MUTED },
})
