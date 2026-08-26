import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations'
import { Icon, type IconName } from '@/components/icons/Icon'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import Chip from '@/components/Chip'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { stepNumber, TOTAL_STEPS, type FlowPersona } from '@/onboarding/steps'
import { TEXT, MUTED, FONT_DISPLAY, FONT_BODY } from '@/theme'

// Same screen, same storage key (viewerGoals) for all three non-club
// personas — only the option list changes, per the redesign brief's own
// "same treatment" framing for coach's goals vs. the fan-oriented list in
// the original spec. One file instead of three near-duplicates.
const GOAL_OPTIONS: Record<FlowPersona, { key: string; icon: IconName; labelKey: TranslationKey }[]> = {
  fan: [
    { key: 'liveFights', icon: 'broadcast', labelKey: 'onboarding.goal.liveFights' },
    { key: 'tournaments', icon: 'bracket', labelKey: 'onboarding.goal.tournaments' },
    { key: 'liveUpdates', icon: 'bell', labelKey: 'onboarding.goal.liveUpdates' },
    { key: 'discoverEvents', icon: 'calendarMark', labelKey: 'onboarding.goal.discoverEvents' },
    { key: 'followFighters', icon: 'followPerson', labelKey: 'onboarding.goal.followFighters' },
    { key: 'followClubs', icon: 'followClub', labelKey: 'onboarding.goal.followClubs' },
  ],
  athlete: [
    { key: 'findSparring', icon: 'clinch', labelKey: 'onboarding.goal.findSparring' },
    { key: 'tournaments', icon: 'bracket', labelKey: 'onboarding.goal.tournaments' },
    { key: 'enterFights', icon: 'octagon', labelKey: 'onboarding.goal.enterFights' },
    { key: 'discoverGyms', icon: 'ring', labelKey: 'onboarding.goal.discoverGyms' },
    { key: 'followEvents', icon: 'calendarMark', labelKey: 'onboarding.goal.followEvents' },
  ],
  coach: [
    { key: 'findAthletes', icon: 'followPerson', labelKey: 'onboarding.goal.findAthletes' },
    { key: 'findSparring', icon: 'clinch', labelKey: 'onboarding.goal.findSparring' },
    { key: 'discoverEvents', icon: 'calendarMark', labelKey: 'onboarding.goal.discoverEvents' },
    { key: 'organizeTraining', icon: 'clipboard', labelKey: 'onboarding.goal.organizeTraining' },
  ],
}

export default function ViewerGoalsScreen() {
  const { t } = useLanguage()
  const { persona, viewerGoals, setViewerGoals } = useOnboarding()
  const flowPersona: FlowPersona = persona === 'athlete' || persona === 'coach' ? persona : 'fan'
  const options = GOAL_OPTIONS[flowPersona]
  const [selected, setSelected] = useState<string[]>(viewerGoals)

  const toggle = (key: string) => {
    setSelected(prev => (prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]))
  }

  const submit = () => {
    setViewerGoals(selected)
    router.push('/(onboarding)/interests')
  }

  return (
    <Screen>
      <BackLink />
      <SkipLink />
      <View style={styles.content}>
        <StepIndicator current={stepNumber(flowPersona, 'viewer-goals')} total={TOTAL_STEPS[flowPersona]} />
        <Text style={styles.title}>{t('onboarding.viewerGoalsTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.viewerGoalsSubtitle')}</Text>

        <View style={styles.chipWrap}>
          {options.map(opt => (
            <Chip key={opt.key} icon={opt.icon} label={t(opt.labelKey)} selected={selected.includes(opt.key)} onPress={() => toggle(opt.key)} />
          ))}
        </View>

        <Button label={t('onboarding.next')} onPress={submit} style={styles.button} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 28, paddingTop: 100 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', color: TEXT, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 32 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  button: { marginTop: 'auto' },
})
