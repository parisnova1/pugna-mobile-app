import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import { ACCENT, ON_ACCENT, BORDER, MUTED, TEXT, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

const DISCIPLINES = ['Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']
const DISCIPLINE_KEY: Record<string, TranslationKey> = {
  Boxing: 'events.discipline.boxing',
  Kickboxing: 'events.discipline.kickboxing',
  'Muay Thai': 'events.discipline.muayThai',
  MMA: 'events.discipline.mma',
  BJJ: 'events.discipline.bjj',
  Wrestling: 'events.discipline.wrestling',
}

export default function InterestsScreen() {
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
      <SkipLink />
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.interestsTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.interestsSubtitle')}</Text>

        <View style={styles.chipWrap}>
          {DISCIPLINES.map(d => {
            const active = selected.includes(d)
            return (
              <Pressable key={d} onPress={() => toggle(d)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{t(DISCIPLINE_KEY[d])}</Text>
              </Pressable>
            )
          })}
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
  chip: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 10, paddingHorizontal: 18 },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase' },
  chipLabelActive: { color: ON_ACCENT },
  button: { marginTop: 'auto' },
})
