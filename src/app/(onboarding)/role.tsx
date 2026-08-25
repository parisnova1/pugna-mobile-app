import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import type { Role } from '@/auth/AuthContext'
import Screen from '@/components/Screen'
import SkipLink from '@/onboarding/SkipLink'
import { ACCENT, ON_ACCENT, BORDER, MUTED, TEXT, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

const ROLES: Role[] = ['viewer', 'club', 'organizer']

export default function RoleScreen() {
  const { t } = useLanguage()
  const { role, setRole } = useOnboarding()

  const choose = (r: Role) => {
    setRole(r)
    router.push('/(onboarding)/location')
  }

  return (
    <Screen>
      <SkipLink />
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.roleTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.roleSubtitle')}</Text>

        <View style={styles.options}>
          {ROLES.map(r => (
            <Pressable key={r} onPress={() => choose(r)} style={[styles.option, role === r && styles.optionActive]}>
              <Text style={[styles.optionLabel, role === r && styles.optionLabelActive]}>{t(`role.${r}`)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 28, paddingTop: 100, justifyContent: 'center' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 30, textTransform: 'uppercase', color: TEXT, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 36 },
  options: { gap: 12 },
  option: { borderWidth: 1, borderColor: BORDER, borderRadius: 4, paddingVertical: 18, alignItems: 'center' },
  optionActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  optionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 15, letterSpacing: 1, color: TEXT, textTransform: 'uppercase' },
  optionLabelActive: { color: ON_ACCENT },
})
