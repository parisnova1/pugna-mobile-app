import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { DISCIPLINES, DISCIPLINE_LABEL_KEY, DISCIPLINE_ICON } from '@/lib/disciplines'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import Chip from '@/components/Chip'
import LocationInput from '@/components/LocationInput'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { TOTAL_STEPS } from '@/onboarding/steps'
import { TEXT, MUTED, BORDER, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

// The one persona whose onboarding fields mostly map onto real, already-built
// backend state: name prefills (auth)/signup's name field (which is also the
// auto-created clubs.name at signup), and disciplines/location get applied
// to the club's real profile via PATCH /api/clubs/me right after signup
// succeeds (see (auth)/signup.tsx) — clubs.location/clubs.disciplines aren't
// part of the signup endpoint itself. A deliberately short, 3-screen flow
// (welcome, role, this) since a club isn't a "fan browsing" persona and the
// existing club-admin/* surface handles everything else after signup.
export default function ClubInfoScreen() {
  const { t } = useLanguage()
  const { setDisciplines, setHomeLocation } = useOnboarding()
  const [name, setName] = useState('')
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const toggleDiscipline = (d: string) => {
    setSelectedDisciplines(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))
  }

  const submit = () => {
    setDisciplines(selectedDisciplines)
    setHomeLocation(location.trim(), coords)
    router.replace({ pathname: '/(auth)/signup', params: { role: 'club', name: name.trim() } })
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackLink />
        <SkipLink />
        <View style={styles.content}>
          <StepIndicator current={3} total={TOTAL_STEPS.club} />
          <Text style={styles.title}>{t('onboarding.clubInfoTitle')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('onboarding.clubNameLabel')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('onboarding.clubNamePlaceholder')}
              placeholderTextColor={MUTED}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('club.details.disciplines')}</Text>
            <View style={styles.chipWrap}>
              {DISCIPLINES.map(d => (
                <Chip
                  key={d}
                  icon={DISCIPLINE_ICON[d]}
                  label={t(DISCIPLINE_LABEL_KEY[d])}
                  selected={selectedDisciplines.includes(d)}
                  onPress={() => toggleDiscipline(d)}
                />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('onboarding.locationLabel')}</Text>
            <LocationInput
              value={location}
              onChangeText={text => {
                setLocation(text)
                setCoords(null)
              }}
              onSelect={r => {
                setLocation(r.label)
                setCoords({ lat: r.lat, lng: r.lng })
              }}
              placeholder={t('onboarding.locationSearchPlaceholder')}
            />
          </View>

          <Button label={t('onboarding.next')} onPress={submit} disabled={!name.trim()} style={styles.button} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, padding: 28, paddingTop: 100, justifyContent: 'center' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, marginBottom: 28, textAlign: 'center' },
  field: { marginBottom: 20 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 8 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { marginTop: 8 },
})
