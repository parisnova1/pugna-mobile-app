import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { DISCIPLINES, DISCIPLINE_LABEL_KEY, DISCIPLINE_ICON } from '@/lib/disciplines'
import Screen from '@/components/Screen'
import CenteredColumn from '@/components/CenteredColumn'
import Button from '@/components/Button'
import Chip from '@/components/Chip'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { organizerFlowStepNumber, ORGANIZER_FLOW_TOTAL } from '@/onboarding/steps'
import { TEXT, MUTED, FONT_DISPLAY, FONT_BODY } from '@/theme'

// Second of organizer's two dedicated steps, replacing Follow — what an
// organizer runs, not who they'd follow. Reuses the same discipline chip
// picker interests.tsx already has (same DISCIPLINES/context field); no
// backend field to apply it to for organizers yet, unlike club's
// disciplines PATCH in (auth)/signup.tsx, so this just stores intent for
// now.
export default function OrganizerFocusScreen() {
  const { t } = useLanguage()
  const { disciplines, setDisciplines } = useOnboarding()
  const [selected, setSelected] = useState<string[]>(disciplines)

  const toggle = (d: string) => {
    setSelected(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))
  }

  const submit = () => {
    setDisciplines(selected)
    router.push('/(onboarding)/permissions')
  }

  return (
    <Screen>
      <BackLink />
      <CenteredColumn>
        <View style={styles.content}>
          <StepIndicator current={organizerFlowStepNumber('organizer-focus')} total={ORGANIZER_FLOW_TOTAL} />
          <Text style={styles.title}>{t('onboarding.orgFocusTitle')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.orgFocusSubtitle')}</Text>

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

          <Button label={t('onboarding.next')} uppercase={false} onPress={submit} style={styles.button} />
        </View>
      </CenteredColumn>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 28, paddingTop: 60 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 26, color: TEXT, marginTop: 20, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 32 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 32 },
  button: { marginTop: 'auto' },
})
