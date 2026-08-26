import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useCameraPermissions } from 'expo-camera'
import * as Calendar from 'expo-calendar'
import { Ionicons } from '@expo/vector-icons'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import { ACCENT, BORDER, CARD, MUTED, TEXT, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

export default function PermissionsScreen() {
  const { t } = useLanguage()
  const { role, finishOnboarding } = useOnboarding()
  const [, requestCameraPermission] = useCameraPermissions()
  const [cameraAsked, setCameraAsked] = useState(false)
  const [calendarAsked, setCalendarAsked] = useState(false)

  const allowCamera = async () => {
    await requestCameraPermission()
    setCameraAsked(true)
  }

  const allowCalendar = async () => {
    await Calendar.requestCalendarPermissionsAsync()
    setCalendarAsked(true)
  }

  const finish = async () => {
    await finishOnboarding()
    if (role === 'club' || role === 'organizer') {
      router.replace({ pathname: '/(auth)/signup', params: { role } })
    } else {
      router.replace('/(tabs)')
    }
  }

  return (
    <Screen>
      <BackLink />
      <SkipLink />
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.permissionsTitle')}</Text>

        <PermissionCard
          icon="qr-code"
          title={t('onboarding.cameraPermissionTitle')}
          body={t('onboarding.cameraPermissionBody')}
          asked={cameraAsked}
          onAllow={allowCamera}
          allowLabel={t('onboarding.allow')}
          laterLabel={t('onboarding.later')}
        />

        <PermissionCard
          icon="calendar"
          title={t('onboarding.calendarPermissionTitle')}
          body={t('onboarding.calendarPermissionBody')}
          asked={calendarAsked}
          onAllow={allowCalendar}
          allowLabel={t('onboarding.allow')}
          laterLabel={t('onboarding.later')}
        />

        <Button label={t('onboarding.finish')} onPress={finish} style={styles.finishButton} />
      </View>
    </Screen>
  )
}

function PermissionCard({
  icon,
  title,
  body,
  asked,
  onAllow,
  allowLabel,
  laterLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  body: string
  asked: boolean
  onAllow: () => void
  allowLabel: string
  laterLabel: string
}) {
  const [declined, setDeclined] = useState(false)
  const resolved = asked || declined

  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={26} color={ACCENT} style={styles.cardIcon} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
      {resolved ? (
        <Text style={styles.resolvedLabel}>{asked ? '✓' : laterLabel}</Text>
      ) : (
        <View style={styles.cardButtonRow}>
          <Button label={laterLabel} onPress={() => setDeclined(true)} variant="outline" style={styles.cardButtonHalf} />
          <Button label={allowLabel} onPress={onAllow} style={styles.cardButtonHalf} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 28, paddingTop: 100 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', color: TEXT, marginBottom: 28, textAlign: 'center' },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 20, marginBottom: 16, alignItems: 'center' },
  cardIcon: { marginBottom: 10 },
  cardTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 15, color: TEXT, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' },
  cardBody: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  cardButtonRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  cardButtonHalf: { flex: 1 },
  resolvedLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6 },
  finishButton: { marginTop: 'auto' },
})
