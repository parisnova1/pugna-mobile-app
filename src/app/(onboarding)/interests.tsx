import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { DISCIPLINES, DISCIPLINE_LABEL_KEY, DISCIPLINE_ICON } from '@/lib/disciplines'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import Chip from '@/components/Chip'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { stepNumber, TOTAL_STEPS, type FlowPersona } from '@/onboarding/steps'
import { TEXT, MUTED, FONT_DISPLAY, FONT_BODY } from '@/theme'

export default function InterestsScreen() {
  const { t } = useLanguage()
  const { persona, disciplines, setDisciplines } = useOnboarding()
  const [selected, setSelected] = useState<string[]>(disciplines)
  const flowPersona: FlowPersona = persona === 'athlete' || persona === 'coach' ? persona : 'fan'

  const toggle = (d: string) => {
    setSelected(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))
  }

  const submit = () => {
    setDisciplines(selected)
    // Only athlete/coach need the extra experience/gym screens — fan skips
    // straight to location, same as before this persona split existed.
    if (persona === 'athlete') router.push('/(onboarding)/experience')
    else if (persona === 'coach') router.push('/(onboarding)/gym')
    else router.push('/(onboarding)/location')
  }

  return (
    <Screen>
      <BackLink />
      <SkipLink />
      <View style={styles.content}>
        <StepIndicator current={stepNumber(flowPersona, 'interests')} total={TOTAL_STEPS[flowPersona]} />
        <Text style={styles.title}>{t('onboarding.interestsTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.interestsSubtitle')}</Text>

        <View style={styles.chipWrap}>
          {DISCIPLINES.map(d => (
            <Chip
              key={d}
              icon={DISCIPLINE_ICON[d]}
              label={t(DISCIPLINE_LABEL_KEY[d])}
              selected={selected.includes(d)}
              onPress={() => toggle(d)}
            />
          ))}
        </View>

        <Button label={t('onboarding.next')} onPress={submit} style={styles.button} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 28, paddingTop: 100 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 30, textTransform: 'uppercase', color: TEXT, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 36 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 36 },
  button: { marginTop: 'auto' },
})
