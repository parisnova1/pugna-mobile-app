import { Pressable, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from './OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { MUTED, FONT_DISPLAY_BOLD } from '@/theme'

// Shown on every onboarding screen. Skipping from anywhere finishes
// onboarding outright (not just the current step) and drops the user into
// the tabs as a guest, per the flow's "don't force completion" rule.
export default function SkipLink() {
  const { t } = useLanguage()
  const { finishOnboarding } = useOnboarding()

  return (
    <Pressable
      style={styles.skip}
      hitSlop={12}
      onPress={() => {
        finishOnboarding()
        router.replace('/(tabs)')
      }}
    >
      <Text style={styles.skipLabel}>{t('onboarding.skip')}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  skip: { position: 'absolute', top: 20, right: 20, padding: 6, zIndex: 1 },
  skipLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
})
