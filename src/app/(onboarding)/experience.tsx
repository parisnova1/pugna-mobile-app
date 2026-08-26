import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import Chip from '@/components/Chip'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { stepNumber, TOTAL_STEPS } from '@/onboarding/steps'
import { TEXT, FONT_DISPLAY } from '@/theme'

// Athlete-only step. Client-only field — no backend column for experience
// level exists (same treatment as disciplines/persona/viewerGoals), so this
// only ever informs onboarding copy/personalization, never round-trips to
// the server. Single-select (unlike the multi-select discipline/goal chips)
// since an experience level is one value, not a set of preferences.
const LEVELS: { key: string; labelKey: TranslationKey }[] = [
  { key: 'beginner', labelKey: 'onboarding.experience.beginner' },
  { key: 'intermediate', labelKey: 'onboarding.experience.intermediate' },
  { key: 'advanced', labelKey: 'onboarding.experience.advanced' },
  { key: 'professional', labelKey: 'onboarding.experience.professional' },
]

export default function ExperienceScreen() {
  const { t } = useLanguage()
  const [level, setLevel] = useState<string | null>(null)

  const choose = (key: string) => {
    setLevel(key)
    router.push('/(onboarding)/gym')
  }

  return (
    <Screen>
      <BackLink />
      <SkipLink />
      <View style={styles.content}>
        <StepIndicator current={stepNumber('athlete', 'experience')} total={TOTAL_STEPS.athlete} />
        <Text style={styles.title}>{t('onboarding.experienceTitle')}</Text>

        <View style={styles.chipWrap}>
          {LEVELS.map(l => (
            <Chip key={l.key} label={t(l.labelKey)} selected={level === l.key} onPress={() => choose(l.key)} />
          ))}
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 28, paddingTop: 100, justifyContent: 'center' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', color: TEXT, marginBottom: 28, textAlign: 'center' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
})
