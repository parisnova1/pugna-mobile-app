import { useState } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { apiFetch } from '@/lib/api'
import Screen from '@/components/Screen'
import CenteredColumn from '@/components/CenteredColumn'
import Button from '@/components/Button'
import LocationInput from '@/components/LocationInput'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { mainFlowStepNumber, MAIN_FLOW_TOTAL } from '@/onboarding/steps'
import { TEXT, MUTED, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

export default function LocationScreen() {
  const { t } = useLanguage()
  const { homeLocation, homeLat, homeLng, setHomeLocation } = useOnboarding()
  const [value, setValue] = useState(homeLocation)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(homeLat != null && homeLng != null ? { lat: homeLat, lng: homeLng } : null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Not blocking — the primary CTA advances regardless of whether a city
  // was ever set (see (auth)/signup.tsx, which shows its own city field
  // whenever homeLocation is still empty at account-creation time).
  const submit = () => {
    setHomeLocation(value.trim(), coords)
    router.push('/(onboarding)/permissions')
  }

  const useCurrentLocation = async () => {
    setGpsError(null)
    setGpsLoading(true)
    try {
      // Primer-before-prompt already happened conceptually via this button's
      // own label/intent — the OS permission dialog only appears once tapped,
      // matching permissions.tsx's "never cold-prompt" rule elsewhere in this flow.
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setGpsError(t('onboarding.locationPermissionDenied'))
        return
      }
      const position = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = position.coords
      const result = await apiFetch<{ label: string }>(`/api/geo/reverse?lat=${latitude}&lon=${longitude}`)
      setValue(result.label)
      setCoords({ lat: latitude, lng: longitude })
    } catch {
      setGpsError(t('onboarding.locationGpsError'))
    } finally {
      setGpsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackLink />
        <CenteredColumn>
          <View style={styles.content}>
            <StepIndicator current={mainFlowStepNumber('location')} total={MAIN_FLOW_TOTAL} />
            <Text style={styles.title}>{t('onboarding.locationTitle')}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>{t('onboarding.locationLabel')}</Text>
              <LocationInput
                value={value}
                onChangeText={text => {
                  setValue(text)
                  setCoords(null)
                }}
                onSelect={r => {
                  setValue(r.label)
                  setCoords({ lat: r.lat, lng: r.lng })
                }}
                placeholder={t('onboarding.locationSearchPlaceholder')}
              />
            </View>

            <Button
              label={gpsLoading ? t('onboarding.locationDetecting') : t('onboarding.locationUseCurrent')}
              variant="outline"
              uppercase={false}
              onPress={useCurrentLocation}
              disabled={gpsLoading}
              style={styles.gpsButton}
            />
            {gpsError && <Text style={styles.error}>{gpsError}</Text>}

            <Text style={styles.caption}>{t('onboarding.locationSubtitle')}</Text>

            <Button label={t('onboarding.next')} uppercase={false} onPress={submit} style={styles.button} />
          </View>
        </CenteredColumn>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, padding: 28, paddingTop: 100, justifyContent: 'center' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, color: TEXT, marginBottom: 24, textAlign: 'center' },
  field: { marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  gpsButton: { marginBottom: 8 },
  error: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 16, textAlign: 'center' },
  caption: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  button: {},
})
