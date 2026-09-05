import { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { apiFetch } from '@/lib/api'
import Screen from '@/components/Screen'
import CenteredColumn from '@/components/CenteredColumn'
import Button from '@/components/Button'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { fighterFlowStepNumber, FIGHTER_FLOW_TOTAL } from '@/onboarding/steps'
import { TEXT, MUTED, BORDER, CARD, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type PublicClub = { id: number; name: string }

// The real "join or create path toward a club" the product brief asks for
// v1 fighters — no invite/approval step, picking a club here is what makes
// this fighter show up in that club's roster for nomination (server resolves
// this the same way a club admin's own roster does — see
// server/src/routes/fighters.js's resolveClubId). Going independent
// (skipping this) isn't supported in v1, only "coming soon."
export default function ClubJoinScreen() {
  const { t } = useLanguage()
  const { fighterClubId, fighterClubName, fighterWeight, setFighterClub, setFighterWeight } = useOnboarding()
  const [query, setQuery] = useState(fighterClubName)
  const [selectedId, setSelectedId] = useState<number | null>(fighterClubId)
  const [weight, setWeight] = useState(fighterWeight)
  const [clubs, setClubs] = useState<PublicClub[]>([])

  useEffect(() => {
    apiFetch<{ clubs: PublicClub[] }>('/api/clubs').then(r => setClubs(r.clubs)).catch(() => {})
  }, [])

  const suggestions = useMemo(() => {
    if (selectedId != null) return []
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return clubs.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5)
  }, [clubs, query, selectedId])

  const pick = (club: PublicClub) => {
    setSelectedId(club.id)
    setQuery(club.name)
  }

  const canContinue = selectedId != null && weight.trim().length > 0

  const submit = () => {
    if (!canContinue) return
    setFighterClub(selectedId, query.trim())
    setFighterWeight(weight.trim())
    router.push('/(onboarding)/location')
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackLink />
        <CenteredColumn>
          <View style={styles.content}>
            <StepIndicator current={fighterFlowStepNumber('club-join')} total={FIGHTER_FLOW_TOTAL} />
            <Text style={styles.title}>{t('onboarding.clubJoinTitle')}</Text>
            <Text style={styles.body}>{t('onboarding.clubJoinBody')}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>{t('onboarding.clubJoinLabel')}</Text>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={text => { setQuery(text); setSelectedId(null) }}
                placeholder={t('onboarding.clubJoinPlaceholder')}
                placeholderTextColor={MUTED}
              />
            </View>

            {suggestions.length > 0 && (
              <View style={styles.dropdown}>
                {suggestions.map((c, i) => (
                  <Pressable key={c.id} style={[styles.option, i === suggestions.length - 1 && styles.optionLast]} onPress={() => pick(c)}>
                    <Text style={styles.optionText}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>{t('onboarding.clubJoinWeightLabel')}</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder={t('onboarding.clubJoinWeightPlaceholder')}
                placeholderTextColor={MUTED}
              />
            </View>

            <Button label={t('onboarding.next')} uppercase={false} disabled={!canContinue} onPress={submit} style={styles.button} />
          </View>
        </CenteredColumn>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, padding: 28, paddingTop: 60, justifyContent: 'center' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 26, color: TEXT, marginTop: 20, marginBottom: 6 },
  body: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, marginBottom: 24, lineHeight: 20 },
  field: { marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 16 },
  dropdown: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16, marginTop: -8, marginBottom: 16, overflow: 'hidden' },
  option: { padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  optionLast: { borderBottomWidth: 0 },
  optionText: { fontFamily: FONT_BODY, fontSize: 13, color: TEXT },
  button: { marginTop: 8 },
})
