import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import CenteredColumn from '@/components/CenteredColumn'
import Button from '@/components/Button'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { organizerFlowStepNumber, ORGANIZER_FLOW_TOTAL } from '@/onboarding/steps'
import { TEXT, MUTED, BORDER, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

// First of organizer's two dedicated steps, replacing Location — an
// organization name matters for someone hosting events, a home city
// doesn't the same way it does for a viewer or club. Not blocking, same as
// every other onboarding field: left blank, signup's own name field just
// falls back to asking directly.
export default function OrganizerInfoScreen() {
  const { t } = useLanguage()
  const { orgName, setOrgName } = useOnboarding()
  const [value, setValue] = useState(orgName)

  const submit = () => {
    setOrgName(value.trim())
    router.push('/(onboarding)/organizer-focus')
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackLink />
        <CenteredColumn>
          <View style={styles.content}>
            <StepIndicator current={organizerFlowStepNumber('organizer-info')} total={ORGANIZER_FLOW_TOTAL} />
            <Text style={styles.title}>{t('onboarding.orgNameTitle')}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>{t('onboarding.orgNameLabel')}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                placeholder={t('onboarding.orgNamePlaceholder')}
                placeholderTextColor={MUTED}
                autoComplete="organization"
              />
            </View>

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
  field: { marginBottom: 20 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 16 },
  button: {},
})
