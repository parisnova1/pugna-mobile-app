import { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { apiFetch } from '@/lib/api'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { stepNumber, TOTAL_STEPS, type FlowPersona } from '@/onboarding/steps'
import { TEXT, MUTED, BORDER, CARD, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type PublicClub = { id: number; name: string }

// Shared between athlete and coach. Free text with client-side suggestions
// against the existing club directory — there's no server-side name search
// param on GET /api/clubs (see server/src/routes/clubs.js), so this fetches
// the full list once and filters locally, same workaround the app's other
// screens already lean on until the list is large enough to need real
// server-side search/pagination as a backend follow-up.
//
// This value isn't sent anywhere or stored in OnboardingContext — nothing
// downstream currently consumes "which gym," so it's honestly just UI state
// that advances the flow, not a fake persisted field.
export default function GymScreen() {
  const { t } = useLanguage()
  const { persona } = useOnboarding()
  const flowPersona: FlowPersona = persona === 'athlete' ? 'athlete' : 'coach'
  const [value, setValue] = useState('')
  const [clubs, setClubs] = useState<PublicClub[]>([])

  useEffect(() => {
    apiFetch<{ clubs: PublicClub[] }>('/api/clubs').then(r => setClubs(r.clubs)).catch(() => {})
  }, [])

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (q.length < 2) return []
    return clubs.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5)
  }, [clubs, value])

  const submit = () => {
    router.push('/(onboarding)/location')
  }

  return (
    <Screen>
      <BackLink />
      <SkipLink />
      <View style={styles.content}>
        <StepIndicator current={stepNumber(flowPersona, 'gym')} total={TOTAL_STEPS[flowPersona]} />
        <Text style={styles.title}>{t('onboarding.gymTitle')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('onboarding.gymLabel')}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={t('onboarding.gymPlaceholder')}
            placeholderTextColor={MUTED}
          />
        </View>

        {suggestions.length > 0 && (
          <View style={styles.dropdown}>
            {suggestions.map((c, i) => (
              <Pressable key={c.id} style={[styles.option, i === suggestions.length - 1 && styles.optionLast]} onPress={() => setValue(c.name)}>
                <Text style={styles.optionText}>{c.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Button label={t('onboarding.next')} onPress={submit} style={styles.button} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 28, paddingTop: 100, justifyContent: 'center' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, marginBottom: 28, textAlign: 'center' },
  field: { marginBottom: 4 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 4 },
  dropdown: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, marginTop: 4, overflow: 'hidden' },
  option: { padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  optionLast: { borderBottomWidth: 0 },
  optionText: { fontFamily: FONT_BODY, fontSize: 13, color: TEXT },
  button: { marginTop: 24 },
})
