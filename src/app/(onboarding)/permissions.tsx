import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useCameraPermissions } from 'expo-camera'
import * as Calendar from 'expo-calendar'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { Icon, type IconName } from '@/components/icons/Icon'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { stepNumber, TOTAL_STEPS, type FlowPersona } from '@/onboarding/steps'
import { ACCENT, BORDER, CARD, MUTED, TEXT, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

// Club and organizer never reach this screen — club diverts to its own
// short flow from role.tsx, and organizer skips onboarding entirely for the
// existing signup flow — so this always continues to the personalized-entry
// preview (ready.tsx), which is what actually finishes onboarding.
export default function PermissionsScreen() {
  const { t } = useLanguage()
  const { persona } = useOnboarding()
  const flowPersona: FlowPersona = persona === 'athlete' || persona === 'coach' ? persona : 'fan'
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

  const finish = () => router.push('/(onboarding)/ready')

  return (
    <Screen>
      <BackLink />
      <SkipLink />
      <View style={styles.content}>
        <StepIndicator current={stepNumber(flowPersona, 'permissions')} total={TOTAL_STEPS[flowPersona]} />
        <Text style={styles.title}>{t('onboarding.permissionsTitle')}</Text>

        <PermissionCard
          icon="scan"
          title={t('onboarding.cameraPermissionTitle')}
          body={t('onboarding.cameraPermissionBody')}
          asked={cameraAsked}
          onAllow={allowCamera}
          allowLabel={t('onboarding.allow')}
          laterLabel={t('onboarding.later')}
        />

        <PermissionCard
          icon="calendarCheck"
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
  icon: IconName
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
      <Icon name={icon} size={30} color={ACCENT} strokeWidth={2.2} />
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
  cardTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 15, color: TEXT, textTransform: 'uppercase', marginTop: 10, marginBottom: 6, textAlign: 'center' },
  cardBody: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  cardButtonRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  cardButtonHalf: { flex: 1 },
  resolvedLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6 },
  finishButton: { marginTop: 'auto' },
})
