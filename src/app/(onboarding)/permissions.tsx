import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations'
import { Icon, type IconName } from '@/components/icons/Icon'
import Screen from '@/components/Screen'
import CenteredColumn from '@/components/CenteredColumn'
import Button from '@/components/Button'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { mainFlowStepNumber, MAIN_FLOW_TOTAL } from '@/onboarding/steps'
import { TEXT, MUTED, CARD, BORDER, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

const ROWS: { icon: IconName; titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { icon: 'bell', titleKey: 'onboarding.permissionsRow.notifications', bodyKey: 'onboarding.permissionsRow.notificationsBody' },
  { icon: 'scan', titleKey: 'onboarding.permissionsRow.camera', bodyKey: 'onboarding.permissionsRow.cameraBody' },
  { icon: 'pin', titleKey: 'onboarding.permissionsRow.location', bodyKey: 'onboarding.permissionsRow.locationBody' },
]

// No real OS notification-permission API exists in this app yet (device
// push is deferred — in-app notifications only, see the notifications
// slice). "Fight-Alerts aktivieren" here just records the user's intent
// (OnboardingContext.wantsNotifications), applied via a settings PATCH
// after signup — there's no session to PATCH against yet either. Camera
// and location are real OS prompts, requested only from this button press,
// never before it.
export default function PermissionsScreen() {
  const { t } = useLanguage()
  const [, requestCameraPermission] = useCameraPermissions()
  const { setWantsNotifications } = useOnboarding()
  const [loading, setLoading] = useState(false)

  const enable = async () => {
    setLoading(true)
    try {
      await requestCameraPermission()
      await Location.requestForegroundPermissionsAsync()
    } catch {
      // Best-effort — an unsupported platform or a denied prompt shouldn't
      // block account creation.
    }
    setWantsNotifications(true)
    setLoading(false)
    router.push('/(auth)/signup')
  }

  const notNow = () => {
    setWantsNotifications(false)
    router.push('/(auth)/signup')
  }

  return (
    <Screen>
      <BackLink />
      <CenteredColumn style={styles.content}>
        <View style={styles.body}>
          <StepIndicator current={mainFlowStepNumber('permissions')} total={MAIN_FLOW_TOTAL} />
          <Text style={styles.title}>{t('onboarding.permissionsTitle')}</Text>

          <View style={styles.rows}>
            {ROWS.map(row => (
              <View key={row.titleKey} style={styles.row}>
                <Icon name={row.icon} size={22} color={TEXT} />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{t(row.titleKey)}</Text>
                  <Text style={styles.rowBody}>{t(row.bodyKey)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Button label={t('onboarding.permissionsCta')} uppercase={false} disabled={loading} onPress={enable} />
          <Pressable onPress={notNow} style={styles.notNowLink} hitSlop={8}>
            <Text style={styles.notNowText}>{t('onboarding.permissionsNotNow')}</Text>
          </Pressable>
          <Text style={styles.caption}>{t('onboarding.permissionsCaption')}</Text>
        </View>
      </CenteredColumn>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 28, paddingTop: 80, justifyContent: 'space-between' },
  body: { flex: 1 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, color: TEXT, marginTop: 20, marginBottom: 28 },
  rows: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 16 },
  rowText: { flex: 1 },
  rowTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 15, color: TEXT },
  rowBody: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  footer: { gap: 12, paddingTop: 20 },
  notNowLink: { alignSelf: 'center', padding: 4 },
  notNowText: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED },
  caption: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, textAlign: 'center' },
})
